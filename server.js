const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // ⬅️ Necesario para Socket.io en Render
const socketio = require('socket.io');

dotenv.config();

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.error('❌ Error de MongoDB:', err));

const app = express();
const server = http.createServer(app); // ⬅️ Server para Socket.io

// Configura Socket.io
const io = socketio(server, {
  cors: {
    origin: "*", // Permite cualquier origen (ajusta en producción)
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔌 Nuevo cliente conectado');
  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado');
  });
});

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('🪨 📄 ✂️ Backend + Socket.io funcionando en Render!');
});

const PORT = process.env.PORT || 5000;

// Usa `server.listen` en lugar de `app.listen` para Socket.io
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
});