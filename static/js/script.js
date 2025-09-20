// Form validation and interactivity (fixed)
document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.calorie-form');
  const submitBtn = document.querySelector('.submit-btn');

  if (!form) return;

  // Elements used across helpers
  const currentWeight = document.getElementById('current_weight');
  const targetWeight = document.getElementById('target_weight');
  const duration = document.getElementById('duration');
  const age = document.getElementById('age');
  const height = document.getElementById('height');
  const gender = document.getElementById('gender');

  // 1) Submit handler: rely on native validation first, then lightweight custom checks
  form.addEventListener('submit', function (e) {
    // Let native constraint validation run (required, min, max, etc.)
    if (!form.checkValidity()) {
      // Do not show spinner; let the browser show messages
      return;
    }

    // Run lightweight custom checks; if they fail, block submit
    if (!customValidateForm()) {
      e.preventDefault();
      return;
    }

    // Show loading state and allow the POST to proceed
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
      submitBtn.disabled = true;
    }

    // Safety timeout to restore UI if server doesn’t respond
    setTimeout(() => {
      if (submitBtn && submitBtn.disabled) {
        submitBtn.innerHTML = 'Calculate My Personalized Plan';
        submitBtn.disabled = false;
        console.warn('Request taking longer than expected.');
      }
    }, 20000);
  });

  // 2) Remove spinner-on-click race (keep only if needed, but guarded)
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      if (!form.checkValidity()) return;
      // Button text will be changed in submit handler
    });
  }

  // 3) Real-time weight change preview
  function updateWeightChangePreview() {
    if (!currentWeight || !targetWeight || !duration) return;
    if (!currentWeight.value || !targetWeight.value || !duration.value) return;

    const change = parseFloat(targetWeight.value) - parseFloat(currentWeight.value);
    const days = parseInt(duration.value, 10);
    if (!isFinite(change) || !isFinite(days) || days <= 0) return;

    const weeklyChange = (change / days) * 7;

    let preview = document.getElementById('weight-change-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'weight-change-preview';
      preview.className = 'weight-preview';
      duration.parentNode.appendChild(preview);
    }

    const changeText = change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
    const weeklyText = weeklyChange >= 0 ? `+${weeklyChange.toFixed(2)}` : weeklyChange.toFixed(2);

    preview.innerHTML = `
      <div class="preview-item">
        <i class="fas fa-weight"></i>
        <span>Total Change: ${changeText} kg</span>
      </div>
      <div class="preview-item">
        <i class="fas fa-calendar-week"></i>
        <span>Weekly Rate: ${weeklyText} kg/week</span>
      </div>
      ${Math.abs(weeklyChange) > 1
        ? '<div class="preview-warning"><i class="fas fa-exclamation-triangle"></i> Rapid weight change detected. Consider adjusting your timeline.</div>'
        : ''
      }
    `;
  }

  [currentWeight, targetWeight, duration].forEach((el) => {
    if (el) el.addEventListener('input', updateWeightChangePreview);
  });

  // 4) BMR preview calculation
  function updateBMRPreview() {
    if (!age || !currentWeight || !height || !gender) return;
    if (!age.value || !currentWeight.value || !height.value || !gender.value) return;

    const ageVal = parseInt(age.value, 10);
    const weightVal = parseFloat(currentWeight.value);
    const heightVal = parseFloat(height.value);
    const genderVal = gender.value;

    if (![ageVal, weightVal, heightVal].every(isFinite)) return;

    let bmr;
    if (genderVal === 'male') {
      bmr = 10 * weightVal + 6.25 * heightVal - 5 * ageVal + 5;
    } else if (genderVal === 'female') {
      bmr = 10 * weightVal + 6.25 * heightVal - 5 * ageVal - 161;
    } else {
      return;
    }

    let bmrPreview = document.getElementById('bmr-preview');
    if (!bmrPreview) {
      bmrPreview = document.createElement('div');
      bmrPreview.id = 'bmr-preview';
      bmrPreview.className = 'bmr-preview';
      gender.parentNode.appendChild(bmrPreview);
    }

    bmrPreview.innerHTML = `
      <div class="preview-bmr">
        <i class="fas fa-fire"></i>
        <span>Estimated BMR: ${Math.round(bmr)} calories/day</span>
      </div>
    `;
  }

  [age, currentWeight, height, gender].forEach((el) => {
    if (el) {
      el.addEventListener('input', updateBMRPreview);
      el.addEventListener('change', updateBMRPreview);
    }
  });

  // 5) Lightweight custom validation (non-blocking except for clear contradictions)
  function customValidateForm() {
    clearAllFieldErrors();

    // Only add gentle, logical checks; keep native validation authoritative
    const cw = safeNumber(currentWeight && currentWeight.value);
    const tw = safeNumber(targetWeight && targetWeight.value);
    const goal = document.getElementById('goal') ? document.getElementById('goal').value : '';

    let ok = true;

    if (cw != null && tw != null && goal) {
      const diff = tw - cw;

      if (goal === 'lose' && diff > 0) {
        showFieldError(targetWeight, 'Target weight should be less than current weight for weight loss');
        ok = false;
      } else if (goal === 'gain' && diff < 0) {
        showFieldError(targetWeight, 'Target weight should be more than current weight for weight gain');
        ok = false;
      } else if (goal === 'maintain' && Math.abs(diff) > 2) {
        showFieldError(targetWeight, 'Target weight should be within 2kg of current weight for maintenance');
        ok = false;
      }
    }

    // Min/Max helper checks for number inputs (do not override native UI)
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach((field) => {
      if (field.type === 'number') {
        const val = field.value === '' ? null : parseFloat(field.value);
        const hasMin = field.min !== '' && !isNaN(parseFloat(field.min));
        const hasMax = field.max !== '' && !isNaN(parseFloat(field.max));
        if (val != null) {
          if (hasMin && val < parseFloat(field.min)) {
            showFieldError(field, `Value must be at least ${field.min}`);
            ok = false;
          }
          if (hasMax && val > parseFloat(field.max)) {
            showFieldError(field, `Value must be no more than ${field.max}`);
            ok = false;
          }
        }
      }
    });

    return ok;
  }

  function safeNumber(v) {
    if (v === '' || v == null) return null;
    const n = parseFloat(v);
    return isFinite(n) ? n : null;
  }

  // 6) Field error helpers
  function showFieldError(field, message) {
    if (!field) return;
    clearFieldError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
  }

  function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  }

  function clearAllFieldErrors() {
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
    form.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
  }

  // 7) Smooth section navigation (unchanged)
  const formSections = document.querySelectorAll('.form-section');
  let currentSection = 0;

  if (formSections.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'form-navigation';
    nav.innerHTML = Array.from(formSections)
      .map((_, i) => `<div class="nav-dot ${i === 0 ? 'active' : ''}" data-section="${i}"></div>`)
      .join('');
    form.appendChild(nav);

    nav.addEventListener('click', function (e) {
      if (e.target.classList.contains('nav-dot')) {
        const targetSection = parseInt(e.target.dataset.section, 10);
        scrollToSection(targetSection);
      }
    });
  }

  function scrollToSection(sectionIndex) {
    if (formSections[sectionIndex]) {
      formSections[sectionIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelectorAll('.nav-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === sectionIndex);
      });
      currentSection = sectionIndex;
    }
  }

  form.addEventListener('change', function () {
    const currentSectionEl = formSections[currentSection];
    if (!currentSectionEl) return;
    const requiredFields = currentSectionEl.querySelectorAll('[required]');
    const allFilled = Array.from(requiredFields).every((field) => field.value && field.value.trim());
    if (allFilled && currentSection < formSections.length - 1) {
      setTimeout(() => scrollToSection(currentSection + 1), 500);
    }
  });

  // 8) Inject additional styles (unchanged)
  const additionalStyles = `
.weight-preview {
  margin-top: 15px;
  padding: 15px;
  background: #f0f8ff;
  border-radius: 10px;
  border-left: 4px solid #667eea;
}
.preview-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #333;
}
.preview-item i { color: #667eea; width: 16px; }
.preview-warning {
  display: flex; align-items: center; gap: 10px; margin-top: 10px;
  padding: 10px; background: #fff3cd; border-radius: 8px;
  font-size: 0.85rem; color: #856404;
}
.preview-warning i { color: #f0ad4e; }
.bmr-preview {
  margin-top: 15px; padding: 12px; background: #e8f5e8; border-radius: 10px;
  border-left: 4px solid #28a745;
}
.preview-bmr {
  display: flex; align-items: center; gap: 10px; font-size: 0.9rem;
  color: #155724; font-weight: 500;
}
.preview-bmr i { color: #28a745; }
.field-error {
  margin-top: 8px; padding: 8px 12px; background: #fee; color: #c33;
  border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;
}
.form-group input.error, .form-group select.error {
  border-color: #c33; box-shadow: 0 0 0 3px rgba(204, 51, 51, 0.1);
}
.form-navigation {
  display: flex; justify-content: center; gap: 15px; margin: 30px 0; padding: 20px 0;
}
.nav-dot {
  width: 12px; height: 12px; border-radius: 50%; background: #ddd; cursor: pointer;
  transition: all 0.3s ease;
}
.nav-dot.active { background: #667eea; transform: scale(1.3); }
.nav-dot:hover { background: #888; }
@media (max-width: 768px) {
  .form-navigation { gap: 10px; }
  .nav-dot { width: 10px; height: 10px; }
}
`;
  const styleSheet = document.createElement('style');
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
});
