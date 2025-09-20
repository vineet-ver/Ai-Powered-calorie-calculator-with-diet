# Smart Ai Calorie Calculator by Vineet🧮

An AI-powered Flask web application that provides personalized calorie calculations, macronutrient breakdowns, meal plans, and recipe recommendations using machine learning and NLP.

## 🚀 Features

- **AI-Powered Calculations**: Uses trained ML models to refine calorie calculations
- **BMR & TDEE Calculations**: Implements Mifflin-St Jeor equation for accurate metabolic rate calculations
- **Personalized Macronutrient Breakdown**: Custom protein, carbs, and fat distribution based on goals
- **NLP Recipe Recommendations**: Semantic recipe matching using spaCy embeddings
- **Beautiful Modern UI**: Responsive design with smooth animations and glassmorphism effects
- **Real-time Form Validation**: Interactive form with live previews and validation
- **Goal-Oriented Planning**: Supports weight loss, gain, and maintenance goals

## 📁 Project Structure

```
calorie-calculator/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── recipes.json          # Sample recipe database
├── setup.sh              # Automated setup script
├── calorie_model.pkl     # Trained ML model (copy your trained model here)
├── recipe_embeddings.pkl # NLP embeddings (copy your trained embeddings here)
├── templates/
│   ├── index.html        # Input form page
│   └── results.html      # Results display page
├── static/
│   ├── css/
│   │   └── style.css     # Comprehensive styling
│   └── js/
│       └── script.js     # Interactive JavaScript
└── models/               # Directory for model files
```

## 🛠️ Quick Setup

1. **Clone/Download the project files**

2. **Make setup script executable and run it:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Copy your trained models** to the project root:
   - `calorie_model.pkl` - Your trained calorie prediction model
   - `recipe_embeddings.pkl` - Your NLP recipe embeddings

4. **Start the application:**
   ```bash
   source venv/bin/activate  # If not already activated
   python app.py
   ```

5. **Open your browser** to `http://localhost:5000`

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_md

# Create directory structure
mkdir -p templates static/css static/js models

# Move template files
mv templates-index.html templates/index.html
mv templates-results.html templates/results.html

# Move static files
mv static-css-style.css static/css/style.css
mv static-js-script.js static/js/script.js

# Copy your trained models
cp /path/to/your/calorie_model.pkl .
cp /path/to/your/recipe_embeddings.pkl .

# Run the application
python app.py
```

## 🧠 ML Model Requirements

The application expects two trained models:

### 1. Calorie Model (`calorie_model.pkl`)
- **Type**: Scikit-learn regression model (e.g., RandomForestRegressor)
- **Input Features**: `[age, current_weight, height, calculated_calories]`
- **Output**: Refined calorie prediction
- **Purpose**: Enhances formula-based calculations with ML insights

### 2. Recipe Embeddings (`recipe_embeddings.pkl`)
- **Type**: Dictionary of recipe title → spaCy embedding vectors
- **Format**: `{'Recipe Title': numpy.array(300,)}`
- **Purpose**: Semantic similarity matching for recipe recommendations

## 📊 How It Works

1. **User Input**: Collects personal metrics, goals, and preferences
2. **BMR Calculation**: Uses Mifflin-St Jeor equation for base metabolic rate
3. **TDEE Calculation**: Applies activity multipliers to BMR
4. **Goal Adjustment**: Calculates calorie deficit/surplus based on weight goals
5. **ML Refinement**: Uses trained model to refine calorie predictions
6. **Macro Distribution**: Calculates personalized protein/carbs/fat breakdown
7. **Recipe Matching**: Uses NLP to find relevant recipes based on goals
8. **Results Display**: Presents comprehensive nutrition plan

## 🎨 UI Features

- **Modern Design**: Glassmorphism effects with gradient backgrounds
- **Responsive Layout**: Works perfectly on all device sizes
- **Interactive Forms**: Real-time validation and preview calculations
- **Smooth Animations**: Engaging transitions and loading states
- **Accessibility**: WCAG compliant with proper contrast and navigation

## 🌐 Deployment

### Render Deployment

1. **Push to GitHub** repository
2. **Connect to Render** web service
3. **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_md`
4. **Start Command**: `gunicorn app:app`
5. **Environment Variables**: Set any required environment variables

### Local Development

```bash
# Development mode with auto-reload
export FLASK_ENV=development
python app.py
```

## 🔄 Model Integration

To use your actual trained models from the Jupyter notebook:

```python
# In your notebook, after training:
import joblib

# Save your calorie model
joblib.dump(your_trained_model, 'calorie_model.pkl')

# Save your recipe embeddings
joblib.dump(your_recipe_embeddings, 'recipe_embeddings.pkl')
```

Then copy these files to your Flask app directory.

## 📝 Customization

### Adding New Recipes

Edit `recipes.json` with new recipe entries:

```json
{
  "title": "Your Recipe Name",
  "description": "Recipe description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "prep_time": "X minutes",
  "cook_time": "X minutes",
  "servings": "X",
  "calories_per_serving": X
}
```

### Modifying Calculations

The main calculation functions are in `app.py`:
- `calculate_bmr()` - BMR calculation
- `calculate_tdee()` - TDEE calculation
- `calculate_goal_calories()` - Goal-based adjustments
- `get_macronutrient_breakdown()` - Macro distribution

### Styling Changes

Modify `static/css/style.css` to customize:
- Color schemes
- Layout and spacing
- Animations and transitions
- Responsive breakpoints

## 🐛 Troubleshooting

### Common Issues

1. **spaCy Model Not Found**:
   ```bash
   python -m spacy download en_core_web_md
   ```

2. **Model Files Missing**: 
   - Ensure `calorie_model.pkl` and `recipe_embeddings.pkl` are in the root directory
   - The setup script creates dummy models if originals are missing

3. **Port Issues**:
   - Change port in `app.py`: `app.run(port=5001)`

4. **Module Import Errors**:
   - Ensure virtual environment is activated
   - Reinstall requirements: `pip install -r requirements.txt`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎯 Future Enhancements

- User authentication and profile saving
- Meal plan export (PDF/Calendar)
- Integration with fitness trackers
- Advanced recipe filtering
- Nutritionist consultation booking
- Progress tracking dashboard
- Social sharing features

---

**Happy Calculating!** 🧮✨

For questions or support, please create an issue in the repository.