const { groq } = require("../config/groq");

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Pesan wajib diisi" });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Anda adalah asisten yang ramah dan membantu." },
        { role: "user", content: message },
      ],
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content ?? "Maaf, belum bisa memproses";
    res.json({ response });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Gagal hubungkan ke Groq" });
  }
};