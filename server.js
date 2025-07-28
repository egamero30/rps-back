require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketio = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');

// Configuración avanzada de MongoDB
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10, // Ajuste para planes gratuitos
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongoOptions)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Error de MongoDB:', err.message);
    process.exit(1); // Falla rápida si no hay DB
  });

// Inicialización de Express
const app = express();
const server = http.createServer(app);

// Configuración de Socket.io para producción
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling']
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    skipMiddlewares: true
  }
});

// Manejo de conexiones Socket.io
io.on('connection', (socket) => {
  console.log(`🔌 Nuevo cliente conectado: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Cliente desconectado (${socket.id}): ${reason}`);
  });

  socket.on('error', (err) => {
    console.error(`Socket error (${socket.id}):`, err.message);
  });
});

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Limitador de tasa para APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas solicitudes, intenta más tarde"
  }
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Aplicar limitador solo a rutas API
app.use('/api', apiLimiter);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Endpoints de estado y raíz
app.get('/', (req, res) => {
  res.send(`
    <h1>🪨 📄 ✂️ Backend Operativo</h1>
    <p>Endpoints disponibles:</p>
    <ul>
      <li><strong>Servidor Funcional</strong></li>     
    </ul>
  `);
});

app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    sockets: io.engine.clientsCount,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error(`‼️ Error: ${err.stack}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Error interno del servidor',
      code: err.code || 'UNKNOWN_ERROR'
    }
  });
});

// Inicio del servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 Servidor iniciado en puerto ${PORT}
  ➡️ URL local: http://localhost:${PORT}
  ➡️ WebSockets: ws://localhost:${PORT}
  `);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM. Cerrando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Servidor y DB desconectados');
      process.exit(0);
    });
  });
});