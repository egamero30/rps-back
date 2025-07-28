const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

dotenv.config();

// Configuración de seguridad para MongoDB Atlas
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongoConfig)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Error de MongoDB:', err);
    process.exit(1); // Termina el proceso si no hay conexión a DB
  });

const app = express();
const server = http.createServer(app);

// Configuración avanzada de Socket.io para producción
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Mejor seguridad con variable de entorno
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Soporte para múltiples transportes
});

// Eventos de Socket.io con manejo de errores
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);
  
  socket.on('error', (err) => {
    console.error(`Socket error: ${err.message}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Cliente desconectado: ${reason}`);
  });
});

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// Limitador de tasa para prevenir ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de peticiones por IP
});
app.use(limiter);

app.use(express.json({ limit: '10kb' })); // Limita el tamaño del JSON

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    sockets: io.engine.clientsCount
  });
});

// Manejo de errores centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor en http://0.0.0.0:${PORT}`);
  console.log(`🔌 Socket.io disponible en ws://0.0.0.0:${PORT}`);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Apagando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Servidor y DB desconectados');
      process.exit(0);
    });
  });
});