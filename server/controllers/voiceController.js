import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'default-key',
});

export const voiceChat = async (req, res) => {
  try {
    const { transcript, jobRole, resumeSnippet, history = [] } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'No transcript provided' });
    }

    const systemPrompt = `You are an AI technical recruiter conducting a brief voice screening. The candidate has applied for ${jobRole || 'a technical role'}. Keep responses under 2 sentences to ensure fast text-to-speech rendering. ${resumeSnippet ? `Ask one technical question based on this resume snippet: ${resumeSnippet}.` : 'Ask one relevant technical question.'} Wait for the candidate's response.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: transcript },
    ];

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.7,
      max_tokens: 150,
      stream: false
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      response: aiResponse,
      role: 'assistant',
    });
  } catch (error) {
    console.error('Voice Chat Error:', error);
    res.status(500).json({ error: 'Failed to process voice chat' });
  }
};
