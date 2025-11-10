import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { text } = req.body;
  if (!text) return res.status(400).send("Missing text");

  try {
    // Step 1: Gemini AI response
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(text);
    const aiReply = result.response.text();

    // Step 2: Deepgram TTS
    const response = await fetch("https://api.deepgram.com/v1/speak", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: aiReply,
        voice: "aura-asteria-en"  // Choose your voice here
      })
    });

    const audioBuffer = await response.arrayBuffer();

    // Step 3: Send audio back to ESP32
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing AI or TTS");
  }
}
