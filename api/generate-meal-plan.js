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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a nutrition coach. Generate a 7-day meal plan for a ${age} year old, ${weight}lbs, goal: ${goal}. Daily calories: ${calories}. Dietary restrictions: ${restrictions}. Foods they hate: ${dislikes}. For each day provide breakfast, lunch, dinner and a snack. For each meal include name, ingredients, instructions (3-4 steps), and macros. Return as JSON only.`,
      }],
    });

    res.status(200).json({ result: message.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
