import React, { useState } from 'react';
import './App.css';

const STEPS = ['Basic Info', 'Goal', 'Dietary Restrictions', 'Foods I Hate', 'Summary'];

const GOALS = [
  { id: 'lose_fat', label: 'Lose Fat', icon: '🔥' },
  { id: 'build_muscle', label: 'Build Muscle', icon: '💪' },
  { id: 'maintain_weight', label: 'Maintain Weight', icon: '⚖️' },
];

const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'];

const INITIAL_DATA = {
  age: '',
  weight: '',
  height: '',
  goal: '',
  dietaryRestrictions: [],
  foodsIHate: '',
};

function calculateCalories(weight, goal) {
  const w = parseFloat(weight);
  if (goal === 'lose_fat') return Math.round(w * 12);
  if (goal === 'build_muscle') return Math.round(w * 16);
  return Math.round(w * 14);
}

async function callMealPlanAPI(formData) {
  const userData = {
    age:          formData.age,
    weight:       formData.weight,
    height:       formData.height,
    goal:         GOALS.find(g => g.id === formData.goal)?.label?.toLowerCase() || formData.goal,
    calories:     calculateCalories(formData.weight, formData.goal),
    restrictions:
      formData.dietaryRestrictions.length === 0 || formData.dietaryRestrictions.includes('none')
        ? 'none'
        : formData.dietaryRestrictions.map(r => r.replace('_', '-')).join(', '),
    dislikes: formData.foodsIHate.trim() || 'none',
  };

  const response = await fetch('/api/generate-meal-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed ${response.status}`);
  const mealPlan = data;
  return mealPlan;
}

// ── Components ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>
      <div className="progress-steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`progress-step ${i <= step ? 'active' : ''}`}>
            <div className="progress-dot">{i < step ? '✓' : i + 1}</div>
            <span className="progress-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepBasicInfo({ data, onChange }) {
  return (
    <div className="step-content">
      <h2>Tell us about yourself</h2>
      <p className="step-subtitle">We'll use this to personalise your meal plan.</p>
      <div className="field-group">
        <label>Age</label>
        <div className="input-wrapper">
          <input
            type="number"
            min="10"
            max="120"
            placeholder="e.g. 28"
            value={data.age}
            onChange={e => onChange('age', e.target.value)}
          />
          <span className="unit">years</span>
        </div>
      </div>
      <div className="field-group">
        <label>Weight</label>
        <div className="input-wrapper">
          <input
            type="number"
            min="50"
            max="700"
            placeholder="e.g. 165"
            value={data.weight}
            onChange={e => onChange('weight', e.target.value)}
          />
          <span className="unit">lbs</span>
        </div>
      </div>
      <div className="field-group">
        <label>Height</label>
        <div className="input-wrapper">
          <input
            type="number"
            min="36"
            max="120"
            placeholder="e.g. 70"
            value={data.height}
            onChange={e => onChange('height', e.target.value)}
          />
          <span className="unit">inches</span>
        </div>
      </div>
    </div>
  );
}

function StepGoal({ data, onChange }) {
  return (
    <div className="step-content">
      <h2>What's your goal?</h2>
      <p className="step-subtitle">Choose the one that matters most right now.</p>
      <div className="goal-grid">
        {GOALS.map(g => (
          <button
            key={g.id}
            className={`goal-card ${data.goal === g.id ? 'selected' : ''}`}
            onClick={() => onChange('goal', g.id)}
            type="button"
          >
            <span className="goal-icon">{g.icon}</span>
            <span className="goal-label">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDietary({ data, onChange }) {
  function toggle(option) {
    const key = option === 'None' ? 'none' : option.toLowerCase().replace('-', '_');

    if (option === 'None') {
      onChange('dietaryRestrictions', data.dietaryRestrictions.includes('none') ? [] : ['none']);
      return;
    }

    let next = data.dietaryRestrictions.filter(x => x !== 'none');
    if (next.includes(key)) {
      next = next.filter(x => x !== key);
    } else {
      next = [...next, key];
    }
    onChange('dietaryRestrictions', next);
  }

  function isSelected(option) {
    const key = option === 'None' ? 'none' : option.toLowerCase().replace('-', '_');
    return data.dietaryRestrictions.includes(key);
  }

  return (
    <div className="step-content">
      <h2>Dietary restrictions</h2>
      <p className="step-subtitle">Select all that apply.</p>
      <div className="chip-grid">
        {DIETARY_OPTIONS.map(opt => (
          <button
            key={opt}
            type="button"
            className={`chip ${isSelected(opt) ? 'selected' : ''}`}
            onClick={() => toggle(opt)}
          >
            {isSelected(opt) && <span className="chip-check">✓ </span>}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFoodsHate({ data, onChange }) {
  return (
    <div className="step-content">
      <h2>Foods you hate</h2>
      <p className="step-subtitle">We'll make sure they never show up in your plan.</p>
      <div className="field-group">
        <label>List any foods you dislike</label>
        <textarea
          placeholder="e.g. cilantro, mushrooms, blue cheese…"
          value={data.foodsIHate}
          onChange={e => onChange('foodsIHate', e.target.value)}
          rows={5}
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value || <em>Not specified</em>}</span>
    </div>
  );
}

function StepSummary({ data, error }) {
  const goalLabel = GOALS.find(g => g.id === data.goal)?.label || '—';
  const restrictions =
    data.dietaryRestrictions.length === 0
      ? 'None'
      : data.dietaryRestrictions
          .map(r => r.charAt(0).toUpperCase() + r.slice(1).replace('_', '-'))
          .join(', ');
  const calories = data.weight ? calculateCalories(data.weight, data.goal) : '—';

  return (
    <div className="step-content">
      <h2>Your profile</h2>
      <p className="step-subtitle">Everything look right? Hit the button to generate your plan.</p>
      <div className="summary-card">
        <SummaryRow label="Age" value={data.age ? `${data.age} years` : ''} />
        <SummaryRow label="Weight" value={data.weight ? `${data.weight} lbs` : ''} />
        <SummaryRow label="Height" value={data.height ? `${data.height} in` : ''} />
        <SummaryRow label="Goal" value={goalLabel} />
        <SummaryRow label="Daily calories" value={calories !== '—' ? `${calories} kcal` : '—'} />
        <SummaryRow label="Dietary restrictions" value={restrictions} />
        <SummaryRow label="Foods I hate" value={data.foodsIHate.trim() || 'None listed'} />
      </div>
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="app">
      <div className="card loading-card">
        <div className="loading-icon">🥗</div>
        <h2>Building your personalised meal plan…</h2>
        <p className="loading-subtitle">Crafting 7 days of meals just for you.</p>
        <div className="loading-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function SuccessScreen({ data, mealPlan, onReset }) {
  const calories = calculateCalories(data.weight, data.goal);
  const goalLabel = GOALS.find(g => g.id === data.goal)?.label || '';

  return (
    <div className="app">
      <div className="card success-card">
        <div className="card-header">
          <div className="logo">
            <span className="logo-icon">🥗</span>
            <span className="logo-text">MealAI</span>
          </div>
        </div>
        <div className="card-body">
          <div className="success-icon-wrap">
            <div className="success-icon">✓</div>
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Your meal plan is ready!</h2>
          <p className="step-subtitle" style={{ textAlign: 'center', marginBottom: 24 }}>
            Check DevTools → Console to see the full JSON.
          </p>
          <div className="summary-card">
            <div className="summary-row">
              <span className="summary-label">Days planned</span>
              <span className="summary-value">7</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Daily calories</span>
              <span className="summary-value">{calories} kcal</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Goal</span>
              <span className="summary-value">{goalLabel}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Days in plan</span>
              <span className="summary-value">
                {mealPlan?.days?.length ?? Object.keys(mealPlan).filter(k => k !== 'shopping_list').length}
              </span>
            </div>
          </div>
        </div>
        <div className="card-footer" style={{ justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onReset} type="button">
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function isStepValid(step, data) {
  if (step === 0) return data.age && data.weight && data.height;
  if (step === 1) return !!data.goal;
  if (step === 2) return data.dietaryRestrictions.length > 0;
  return true;
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1);
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const plan = await callMealPlanAPI(data);
      setMealPlan(plan);
      console.log('User data:', data);
      console.log('Generated meal plan:', plan);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMealPlan(null);
    setStep(0);
    setData(INITIAL_DATA);
    setError(null);
  }

  if (loading) return <LoadingScreen />;
  if (mealPlan) return <SuccessScreen data={data} mealPlan={mealPlan} onReset={handleReset} />;

  const valid = isStepValid(step, data);

  return (
    <div className="app">
      <div className="card">
        <div className="card-header">
          <div className="logo">
            <span className="logo-icon">🥗</span>
            <span className="logo-text">MealAI</span>
          </div>
          <ProgressBar step={step} total={STEPS.length} />
        </div>

        <div className="card-body">
          {step === 0 && <StepBasicInfo data={data} onChange={handleChange} />}
          {step === 1 && <StepGoal data={data} onChange={handleChange} />}
          {step === 2 && <StepDietary data={data} onChange={handleChange} />}
          {step === 3 && <StepFoodsHate data={data} onChange={handleChange} />}
          {step === 4 && <StepSummary data={data} error={error} />}
        </div>

        <div className="card-footer">
          {step > 0 && (
            <button className="btn-secondary" onClick={handleBack} type="button">
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!valid}
              type="button"
            >
              Continue
            </button>
          ) : (
            <button className="btn-primary btn-generate" onClick={handleGenerate} type="button">
              Generate my meal plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
