const express = require("express");
const router = express.Router();

const {
  createGame,
  joinGame,
  makeMove,
  getUserGames,
} = require("../controllers/gameController");

const authMiddleware = require("../middleware/authMiddleware");

// Crear partida
router.post("/create", authMiddleware, createGame);

// Unirse a partida
router.post("/join/:id", authMiddleware, joinGame);

// Realizar movimiento
router.post("/move/:id", authMiddleware, makeMove);

// Historial de partidas del usuario
router.get("/my-games", authMiddleware, getUserGames);

module.exports = router;
