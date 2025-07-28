const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require("./routes/gameRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // ⬅️ Importante: habilita req.body

app.use('/api/auth', authRoutes);
app.use("/api/game", gameRoutes);

app.get('/', (req, res) => {
  res.send('🪨 📄 ✂️ Backend funcionando con auth');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://0.0.0.0:${PORT}`);
});
