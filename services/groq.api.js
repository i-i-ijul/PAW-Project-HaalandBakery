const { groq } = require("../config/groq");
const { Roti, StoreProfile } = require("../models");
const { Op } = require("sequelize");

const CONFIG = {
    model: "openai/gpt-oss-120b",
    max_tokens: 300
};

const generateSystemPrompt = async () => {

    const rotis = await Roti.findAll({
        where: {
            stok: {
                [Op.gt]: 0
            }
        },
        attributes: [
            "nama",
            "deskripsi",
            "harga",
            "stok",
            "storeId"
        ],
        include: [
            {
                model: StoreProfile,
                as: "store",
                attributes: ["nama_toko"],
                required: false
            }
        ],
        order: [["nama", "ASC"]]
    });

    let daftarProduk = "";

    if (rotis.length > 0) {
        daftarProduk = rotis.map((roti, index) => {
            const namaToko = roti.store?.nama_toko || "Toko tidak diketahui";

            const harga = new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }).format(roti.harga);

            return `${index + 1}. ${roti.nama}
   - Toko: ${namaToko}
   - Harga: ${harga}
   - Deskripsi: ${roti.deskripsi || "Belum ada deskripsi"}
   - Stok: ${roti.stok}`;
        }).join("\n\n");
    } else {
        daftarProduk = "Saat ini belum ada produk yang tersedia.";
    }

    return `
Anda adalah asisten virtual resmi marketplace Toko Roti.

Tugas utama Anda:
- Memberikan rekomendasi produk roti.
- Menjelaskan rasa dan karakteristik produk berdasarkan deskripsi.
- Memberikan informasi harga dan toko yang menjual produk.
- Membantu pelanggan menemukan produk yang sesuai.

DAFTAR PRODUK YANG TERSEDIA DI MARKETPLACE:

${daftarProduk}

ATURAN KHUSUS:

1. Hanya rekomendasikan produk yang tercantum dalam daftar di atas.
2. Jangan pernah mengarang nama produk, harga, deskripsi, stok, atau nama toko.
3. Jika pelanggan menanyakan produk yang tidak terdapat dalam daftar, jelaskan bahwa produk tersebut saat ini belum tersedia di katalog marketplace.
4. Jika stok produk habis atau tidak tersedia dalam daftar, jangan merekomendasikannya.
5. Jika memungkinkan, tawarkan alternatif produk lain yang masih tersedia.
6. Gunakan informasi harga dan stok sesuai data yang diberikan.
7. Jawablah dengan ramah, natural, dan singkat (maksimal 2-3 kalimat).
8. Jangan pernah keluar dari peran sebagai asisten marketplace Toko Roti.
9. Jika pengguna bertanya di luar topik marketplace atau produk roti, tolak dengan sopan:
"Maaf, saya hanya dapat membantu seputar produk dan rekomendasi roti di marketplace kami."
`;
};

exports.generateChatResponse = async (message, history = []) => {

    // Generate system prompt berdasarkan database terbaru
    const systemPrompt = await generateSystemPrompt();

    let messages = [
        {
            role: "system",
            content: systemPrompt
        }
    ];

    // Masukkan riwayat percakapan
    if (Array.isArray(history)) {
        messages = messages.concat(history);
    }

    // Masukkan pesan terbaru pengguna
    messages.push({
        role: "user",
        content: message
    });

    // Request ke Groq API
    const completion = await groq.chat.completions.create({
        model: CONFIG.model,
        messages: messages,
        max_tokens: CONFIG.max_tokens
    });

    return completion.choices[0]?.message?.content
        ?? "Maaf, belum bisa memproses permintaan kamu.";
};
