
const groqAPI = require("../services/groq.api");

// =====================================================
// CONTROLLER CHAT
// =====================================================

exports.handleChat = async (req, res) => {

    const { message, history } = req.body;

    if (!message || !String(message).trim()) {
        return res.status(400).json({
            error: "Pesan wajib diisi"
        });
    }

    try {

        const response = await groqAPI.generateChatResponse(
            String(message).trim(),
            history
        );

        return res.json({ response });

    } catch (err) {

        console.error("Groq error:", err.message);

        return res.status(500).json({
            error: "Gagal hubungkan ke Groq"
        });
    }
};
