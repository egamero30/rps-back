const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  player1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  player2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  move1: { type: String, enum: ["rock", "paper", "scissors"] },
  move2: { type: String, enum: ["rock", "paper", "scissors"] },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  stake: { type: Number, required: true },
  status: {
    type: String,
    enum: ["waiting", "in_progress", "finished"],
    default: "waiting",
  },
}, { timestamps: true });

module.exports = mongoose.model("Game", gameSchema);
