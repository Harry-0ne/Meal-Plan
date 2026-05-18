const GOAL_CONFIG = {
  lose_fat:       { label: 'lose fat',       multiplier: 12 },
  build_muscle:   { label: 'build muscle',   multiplier: 16 },
  maintain_weight:{ label: 'maintain weight', multiplier: 14 },
};

function calculateCalories(weight, goal) {
  const w = parseFloat(weight);
  const multiplier = GOAL_CONFIG[goal]?.multiplier ?? 14;
  return Math.round(w * multiplier);
}

function formatRestrictions(dietaryRestrictions) {
  if (!dietaryRestrictions?.length || dietaryRestrictions.includes('none')) return 'none';
  return dietaryRestrictions.map(r => r.replace('_', '-')).join(', ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { age, weight, goal, dietaryRestrictions, foodsIHate } = req.body;

  const calories   = calculateCalories(weight, goal);
  const goalLabel  = GOAL_CONFIG[goal]?.label ?? goal;
  const restrictions = formatRestrictions(dietaryRestrictions);
  const dislikes   = (foodsIHate || '').trim() || 'none';

  const prompt = `You are a nutrition coach. Generate a 7-day meal plan for a ${age} year old, ${weight}lbs, goal: ${goalLabel}. Daily calories: ${calories}. Dietary restrictions: ${restrictions}. Foods they hate: ${dislikes}. For each day provide breakfast, lunch, dinner and a snack. For each meal include: name, ingredients list, brief instructions (3-4 steps), and macros (calories, protein, carbs, fat). Also generate a consolidated shopping list grouped by category (proteins, carbs, vegetables, dairy, other). Return as a JSON object only, no other text.`;

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}));
      return res.status(apiRes.status).json({
        error: errBody?.error?.message ?? `Anthropic API error ${apiRes.status}`,
      });
    }

    const data = await apiRes.json();
    let text = data.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const mealPlan = JSON.parse(text);
    return res.status(200).json(mealPlan);
  } catch (err) {
    console.error('[generate-meal-plan]', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
};
