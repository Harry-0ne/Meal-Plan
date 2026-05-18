const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { age, weight, height, goal, calories, restrictions, dislikes } = req.body;

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `Generate a 7-day meal plan as pure JSON only. No markdown, no backticks, no explanation. Just the JSON object.

Person: ${age} years old, ${weight}lbs, goal: ${goal}, ${calories} calories/day, restrictions: ${restrictions}, hates: ${dislikes}.

Use exactly this structure:
{"days":[{"day":"Monday","breakfast":{"name":"","ingredients":[""],"instructions":"","calories":0,"protein":0},"lunch":{"name":"","ingredients":[""],"instructions":"","calories":0,"protein":0},"dinner":{"name":"","ingredients":[""],"instructions":"","calories":0,"protein":0},"snack":{"name":"","ingredients":[""],"instructions":"","calories":0,"protein":0}}]}`
    }]});

    const text = message.content[0].text.trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const jsonStr = text.slice(start, end + 1);
    const parsed = JSON.parse(jsonStr);

    res.status(200).json(parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
