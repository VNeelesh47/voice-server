// --- proxy.js ---  (returns audio over plain HTTP)
export const config = { runtime: "edge" };

export default async function handler(req) {
  const text = new URL(req.url).searchParams.get("text") || "Hello Boss";

  const tts = await fetch("https://api.deepgram.com/v1/speak", {
    method: "POST",
    headers: {
      "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, voice: "aura-asteria-en" })
  });

  const arrayBuf = await tts.arrayBuffer();
  return new Response(arrayBuf, { headers: { "Content-Type": "audio/mpeg" } });
}
