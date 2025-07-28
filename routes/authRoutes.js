const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

// 🔐 Ruta protegida de ejemplo
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: `Acceso permitido. ID del usuario: ${req.userId}` });
});

module.exports = router;
