require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '256kb' }));

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SYSTEM_PROMPT = `You are the AI Assistant for Babu ji Memorial International School.
School Information:
- Name: Babu ji Memorial International School
- Founded: 2015
- Affiliation: CBSE, New Delhi
- Classes: Nursery to Senior Secondary
- Mission: Holistic excellence, Indian values, affordable world-class education
- Founder: Babu ji (inspired by his selfless thoughts)
Be polite, helpful, and professional. Keep answers concise and clear.`;

app.post('/ai/chat', async (req, res) => {
  try {
    const userMessage = (req.body && req.body.message) ? String(req.body.message) : '';
    if (!userMessage) return res.status(400).json({ error: 'Missing message' });

    // Build request payload for Google Generative API (chat-bison)
    const url = `https://generativelanguage.googleapis.com/v1/models/chat-bison-001:generate?key=${GOOGLE_API_KEY}`;
    const payload = {
      temperature: 0.2,
      candidateCount: 1,
      messages: [
        { author: 'system', content: [{ type: 'text', text: SYSTEM_PROMPT }] },
        { author: 'user', content: [{ type: 'text', text: userMessage }] }
      ]
    };

    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('Google API error', r.status, text);
      return res.status(502).json({ error: 'Upstream API error', details: text });
    }

    const data = await r.json();
    const candidate = data.candidates && data.candidates[0];
    let reply = '';
    if (candidate && Array.isArray(candidate.content)) reply = candidate.content.map(c => c.text || '').join('');
    if (!reply) reply = 'Sorry, I could not generate a reply. Please try again.';

    res.json({ reply });
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'Proxy server error' });
  }
});

app.listen(port, () => console.log(`AI proxy listening on http://localhost:${port}`));
