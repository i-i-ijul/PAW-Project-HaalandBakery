require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const { sequelize } = require("./models");

const viewRouter = require("./routes/web");
const apiRouter = require("./routes/api");
const chatRoutes = require("./chat/chatRoutes");
const authRoutes = require("./routes/authRoutes");
const usahaRoutes = require("./routes/usahaRoutes");
const pesananRoutes = require("./routes/pesananRoutes");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-default",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    },
  })
);

// Routes
app.use("/", viewRouter);
app.use("/api/auth", authRoutes);
app.use("/api/usaha", usahaRoutes);
app.use("/api/pesanan", pesananRoutes);
app.use("/api", apiRouter);
app.use("/chat", chatRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    await sequelize.sync();
    console.log("Sync model selesai");

    app.listen(PORT, () => {
      console.log(`Server jalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Gagal konek ke database:", err.message);
  }
}

start();