const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const { age, weight, height, goal, calories, restrictions, dislikes } = req.body;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `You are a nutrition coach. Generate a 7-day meal plan as JSON only, no other text. For a ${age} year old, ${weight}lbs, goal: ${goal}, ${calories} calories/day. Restrictions: ${restrictions}. Hates: ${dislikes}.

Return this exact JSON structure:
{
  "days": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": {"name": "", "ingredients": [], "instructions": "", "calories": 0, "protein": 0},
        "lunch": {"name": "", "ingredients": [], "instructions": "", "calories": 0, "protein": 0},
        "dinner": {"name": "", "ingredients": [], "instructions": "", "calories": 0, "protein": 0},
        "snack": {"name": "", "ingredients": [], "instructions": "", "calories": 0, "protein": 0}
      }
    }
  ]
}
Return JSON only, no markdown, no backticks, no explanation.`,
      }],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
