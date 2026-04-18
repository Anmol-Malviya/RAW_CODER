import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'default-key',
});

export const chatWithBot = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemPrompt = `You are an AI assistant for the AI Interviewer platform. You are helpful, friendly, and knowledgeable. Keep your responses concise and precise. Format responses in Markdown.`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      role: 'assistant',
      content: aiResponse
    });
  } catch (error) {
    console.error('Chat Bot Error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};
