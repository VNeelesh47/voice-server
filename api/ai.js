import fetch from "node-fetch";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    // Parse JSON safely for both browser and ESP32
    let text = "";
    if (req.method === "POST") {
      if (req.headers["content-type"]?.includes("application/json")) {
        const data = await req.json?.() ?? req.body;
        text = data?.text || "";
      }
    }

    if (!text) {
      res.status(400).json({ error: "Missing text" });
      return;
    }

    // === GEMINI AI ===
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(text);
    const aiReply = result.response.text();

    // === DEEPGRAM TTS ===
    const ttsResponse = await fetch("https://api.deepgram.com/v1/speak", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: aiReply,
        voice: "aura-asteria-en"
      })
    });

    if (!ttsResponse.ok) {
      const errTxt = await ttsResponse.text();
      throw new Error("Deepgram TTS failed: " + errTxt);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("AI route failed:", err);
    res.status(500).json({
      error: "Server function crashed",
      details: err.message
    });
  }
}

