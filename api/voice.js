// api/voice.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = await req.json();
    return res.status(200).json({ reply: `Got your message: ${message}` });
  } else {
    return res.status(405).send('Method Not Allowed');
  }
}
