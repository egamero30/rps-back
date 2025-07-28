const Game = require("../models/Game");
const User = require("../models/User");

// Crear partida
const createGame = async (req, res) => {
  const { stake } = req.body;
  const userId = req.userId;

  try {
    const user = await User.findById(userId);
    if (user.usdtBalance < stake) {
      return res.status(400).json({ message: "Saldo insuficiente" });
    }

    user.usdtBalance -= stake;
    await user.save();

    const game = new Game({ player1: userId, stake });
    await game.save();

    res.status(201).json({ message: "Partida creada", game });
  } catch (err) {
    res.status(500).json({ message: "Error al crear partida", error: err.message });
  }
};

// Unirse a partida
const joinGame = async (req, res) => {
  const gameId = req.params.id;
  const userId = req.userId;

  try {
    const game = await Game.findById(gameId);
    if (!game || game.status !== "waiting") {
      return res.status(404).json({ message: "Partida no disponible" });
    }

    if (game.player1.toString() === userId) {
      return res.status(400).json({ message: "No puedes unirte a tu propia partida" });
    }

    const user = await User.findById(userId);
    if (user.usdtBalance < game.stake) {
      return res.status(400).json({ message: "Saldo insuficiente para unirte" });
    }

    user.usdtBalance -= game.stake;
    await user.save();

    game.player2 = userId;
    game.status = "in_progress";
    await game.save();

    res.json({ message: "Te uniste a la partida", game });
  } catch (err) {
    res.status(500).json({ message: "Error al unirse", error: err.message });
  }
};

// Realizar movimiento
const makeMove = async (req, res) => {
  const { move } = req.body;
  const userId = req.userId;
  const gameId = req.params.id;

  if (!["rock", "paper", "scissors"].includes(move)) {
    return res.status(400).json({ message: "Movimiento inválido" });
  }

  try {
    const game = await Game.findById(gameId);
    if (!game || game.status !== "in_progress") {
      return res.status(404).json({ message: "Partida no válida o ya finalizada" });
    }

    if (game.player1.toString() === userId) {
      if (game.move1) return res.status(400).json({ message: "Ya hiciste tu movimiento" });
      game.move1 = move;
    } else if (game.player2.toString() === userId) {
      if (game.move2) return res.status(400).json({ message: "Ya hiciste tu movimiento" });
      game.move2 = move;
    } else {
      return res.status(403).json({ message: "No participas en esta partida" });
    }

    if (game.move1 && game.move2) {
      const result = resolveGame(game.move1, game.move2);
      const player1 = await User.findById(game.player1);
      const player2 = await User.findById(game.player2);

      if (result === 1) {
        game.winner = player1._id;
        player1.usdtBalance += game.stake * 2;
      } else if (result === 2) {
        game.winner = player2._id;
        player2.usdtBalance += game.stake * 2;
      } else {
        player1.usdtBalance += game.stake;
        player2.usdtBalance += game.stake;
      }

      game.status = "finished";
      await player1.save();
      await player2.save();
    }

    await game.save();
    res.json({ message: "Movimiento registrado", game });
  } catch (err) {
    res.status(500).json({ message: "Error al hacer movimiento", error: err.message });
  }
};

// Resolver el resultado del juego
function resolveGame(move1, move2) {
  if (move1 === move2) return 0;
  if (
    (move1 === "rock" && move2 === "scissors") ||
    (move1 === "paper" && move2 === "rock") ||
    (move1 === "scissors" && move2 === "paper")
  ) {
    return 1;
  }
  return 2;
}

// Obtener historial de partidas del usuario
const getUserGames = async (req, res) => {
  const userId = req.userId;

  try {
    const games = await Game.find({
      $or: [{ player1: userId }, { player2: userId }]
    }).sort({ createdAt: -1 });

    res.json({ games });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener partidas", error: err.message });
  }
};


module.exports = {
  createGame,
  joinGame,
  makeMove,
  getUserGames, // 👈 nuevo
};
