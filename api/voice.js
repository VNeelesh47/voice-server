// api/voice.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    // Parse JSON input
    const { audioBase64 } = await req.json();
    if (!audioBase64) {
      return res.status(400).json({ error: "No audioBase64 provided" });
    }

    // === 1️⃣ Send audio to Deepgram (Speech-to-Text) ===
    const deepgramResp = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2-general&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_KEY}`,
          "Content-Type": "audio/wav",
        },
        body: Buffer.from(audioBase64, "base64"),
      }
    );

    const dgData = await deepgramResp.json();
    const transcript =
      dgData.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    console.log("🎙 Deepgram Transcript:", transcript);

    // === 2️⃣ Send transcript to Gemini ===
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: transcript }]}],
          generationConfig: { maxOutputTokens: 200 },
        }),
      }
    );

    const geminiData = await geminiResp.json();
    const reply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a reply.";

    console.log("🤖 Gemini Reply:", reply);

    // === 3️⃣ Return both ===
    return res.status(200).json({ transcript, reply });

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

