from flask import Flask, render_template, request, redirect, url_for
import joblib
import numpy as np
import json
import os
import re
import spacy
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

app = Flask(__name__)

# Load pre-trained models and data
try:
    calorie_model = joblib.load('calorie_model.pkl')
    recipe_embeddings = joblib.load('recipe_embeddings.pkl')
    print("Models loaded successfully")
except FileNotFoundError as e:
    print(f"Model not found: {e}")
    calorie_model = None
    recipe_embeddings = None

# Load spaCy model for NLP
try:
    nlp = spacy.load("en_core_web_md")
except OSError:
    print("spaCy model not found. Please install: python -m spacy download en_core_web_md")
    nlp = None

# Load recipe data
try:
    with open('recipes.json', 'r') as f:
        recipes_data = json.load(f)
except FileNotFoundError:
    print("recipes.json not found")
    recipes_data = []

def calculate_bmr(age, weight, height, gender):
    """Calculate BMR using Mifflin-St Jeor equation"""
    if gender.lower() == 'male':
        bmr = 10 * weight + 6.25 * height - 5 * age + 5
    else:  # female
        bmr = 10 * weight + 6.25 * height - 5 * age - 161
    return bmr

def calculate_tdee(bmr, activity_level):
    """Calculate TDEE based on activity level"""
    activity_multipliers = {
        'sitting': 1.2,
        'walking': 1.375,
        'riding': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    return bmr * activity_multipliers.get(activity_level, 1.2)

def calculate_goal_calories(tdee, current_weight, target_weight, duration_days, goal):
    """Calculate daily calorie target based on goal"""
    weight_change = target_weight - current_weight
    
    if goal == 'maintain':
        return int(tdee)
    
    # 1 kg of fat ≈ 7700 calories
    total_calorie_change = weight_change * 7700
    daily_calorie_change = total_calorie_change / duration_days
    
    if goal == 'lose':
        return int(tdee - abs(daily_calorie_change))
    elif goal == 'gain':
        return int(tdee + abs(daily_calorie_change))
    
    return int(tdee)

def get_macronutrient_breakdown(calories, goal, workout_type):
    """Calculate macronutrient breakdown"""
    if workout_type == 'gym_diet':
        # High protein for gym diet
        protein_ratio = 0.30
        fat_ratio = 0.25
        carb_ratio = 0.45
    elif goal == 'lose':
        # Higher protein, lower carbs for weight loss
        protein_ratio = 0.35
        fat_ratio = 0.30
        carb_ratio = 0.35
    elif goal == 'gain':
        # Higher carbs for weight gain
        protein_ratio = 0.25
        fat_ratio = 0.25
        carb_ratio = 0.50
    else:  # maintain
        protein_ratio = 0.25
        fat_ratio = 0.30
        carb_ratio = 0.45
    
    protein_calories = calories * protein_ratio
    fat_calories = calories * fat_ratio
    carb_calories = calories * carb_ratio
    
    # Convert to grams (protein: 4 cal/g, fat: 9 cal/g, carbs: 4 cal/g)
    protein_grams = protein_calories / 4
    fat_grams = fat_calories / 9
    carb_grams = carb_calories / 4
    
    return {
        'protein': int(protein_grams),
        'fat': int(fat_grams),
        'carbs': int(carb_grams)
    }

def recommend_recipes(user_goal, workout_type, cooking_recipes, num_recommendations=6):
    """Recommend recipes based on user goal and workout type"""
    if not cooking_recipes or not nlp or not recipe_embeddings:
        return []
    
    # Define search terms based on user goal and workout type
    search_terms = []
    
    if user_goal == 'lose':
        search_terms.extend(['low calorie', 'light', 'lean', 'healthy', 'vegetables', 'salad'])
    elif user_goal == 'gain':
        search_terms.extend(['high calorie', 'protein rich', 'energy', 'nuts', 'pasta'])
    elif user_goal == 'maintain':
        search_terms.extend(['balanced', 'nutritious', 'wholesome'])
    
    if workout_type == 'gym_diet':
        search_terms.extend(['high protein', 'muscle building', 'chicken', 'fish', 'eggs'])
    
    if not search_terms:
        search_terms = ['healthy', 'nutritious']
    
    # Create an embedding for the search terms
    search_doc = nlp(' '.join(search_terms))
    search_vector = search_doc.vector
    
    # Calculate similarity scores
    similarity_scores = []
    for title, embedding in recipe_embeddings.items():
        if np.linalg.norm(embedding) > 0 and np.linalg.norm(search_vector) > 0:
            similarity = np.dot(search_vector, embedding) / (np.linalg.norm(search_vector) * np.linalg.norm(embedding))
            similarity_scores.append((title, similarity))
    
    # Sort by similarity and get top N
    similarity_scores.sort(key=lambda item: item[1], reverse=True)
    top_recipe_titles = [item[0] for item in similarity_scores[:num_recommendations]]
    
    # Get the full recipe details
    recommended_recipes = []
    for recipe in recipes_data:
        if recipe.get('title') in top_recipe_titles:
            recommended_recipes.append({
                'title': recipe.get('title', 'Unknown Recipe'),
                'description': recipe.get('description', 'No description available'),
                'ingredients': recipe.get('ingredients', []),
                'prep_time': recipe.get('prep_time', 'N/A'),
                'cook_time': recipe.get('cook_time', 'N/A'),
                'servings': recipe.get('servings', 'N/A')
            })
    
    return recommended_recipes[:num_recommendations]

def create_meal_plan(calories, macros):
    """Create a simple meal plan"""
    breakfast_calories = int(calories * 0.25)
    lunch_calories = int(calories * 0.35)
    dinner_calories = int(calories * 0.30)
    snacks_calories = calories - breakfast_calories - lunch_calories - dinner_calories
    
    meal_plan = {
        'breakfast': {
            'calories': breakfast_calories,
            'suggestion': 'Oats with fruits and nuts, or eggs with toast'
        },
        'lunch': {
            'calories': lunch_calories,
            'suggestion': 'Grilled chicken/fish with vegetables and rice/quinoa'
        },
        'dinner': {
            'calories': dinner_calories,
            'suggestion': 'Lean protein with steamed vegetables and complex carbs'
        },
        'snacks': {
            'calories': snacks_calories,
            'suggestion': 'Greek yogurt, nuts, or fresh fruits'
        }
    }
    
    return meal_plan

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        try:
            # Get form data
            age = int(request.form['age'])
            current_weight = float(request.form['current_weight'])
            height = float(request.form['height'])
            target_weight = float(request.form['target_weight'])
            duration = int(request.form['duration'])
            gender = request.form['gender']
            activity_level = request.form['activity_level']
            goal = request.form['goal']
            workout_type = request.form['workout_type']
            cooking_recipes = request.form.get('cooking_recipes') == 'yes'
            
            # Calculate BMR and TDEE
            bmr = calculate_bmr(age, current_weight, height, gender)
            tdee = calculate_tdee(bmr, activity_level)
            
            # Use ML model to refine calorie calculation if available
            daily_calories = calculate_goal_calories(tdee, current_weight, target_weight, duration, goal)
            
            if calorie_model:
                # Prepare features for ML model (adjust based on your model's features)
                features = np.array([[age, current_weight, height, daily_calories]])
                try:
                    ml_prediction = calorie_model.predict(features)[0]
                    # Use ML prediction as refinement (blend with formula-based calculation)
                    daily_calories = int(daily_calories * 0.7 + ml_prediction * 0.3)
                except Exception as e:
                    print(f"ML prediction error: {e}")
            
            # Calculate macronutrient breakdown
            macros = get_macronutrient_breakdown(daily_calories, goal, workout_type)
            
            # Create meal plan
            meal_plan = create_meal_plan(daily_calories, macros)
            
            # Get recipe recommendations
            recommended_recipes = recommend_recipes(goal, workout_type, cooking_recipes)
            
            # Prepare results data
            results = {
                'daily_calories': daily_calories,
                'bmr': int(bmr),
                'tdee': int(tdee),
                'macros': macros,
                'meal_plan': meal_plan,
                'recipes': recommended_recipes,
                'user_data': {
                    'goal': goal,
                    'duration': duration,
                    'weight_change': target_weight - current_weight
                }
            }
            
            return render_template('results.html', results=results)
            
        except Exception as e:
            error_message = f"Error processing your request: {str(e)}"
            return render_template('index.html', error=error_message)
    
    return render_template('index.html')

@app.route('/recipe/<int:recipe_id>')
def recipe_detail(recipe_id):
    """Show detailed recipe information"""
    if recipe_id < len(recipes_data):
        recipe = recipes_data[recipe_id]
        return render_template('recipe_detail.html', recipe=recipe)
    return "Recipe not found", 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)