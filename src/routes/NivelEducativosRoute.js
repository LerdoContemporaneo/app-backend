import express from "express";
import {
  createNivel,
  deleteNivel,
  getNivelById,
  getNiveles,
  getNivelesDeUsuario,
  replaceNivelesDeUsuario,
  updateNivel,
} from "../controllers/NivelesEducativos.js";
import {
  adminOnly,
  verifyUser,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/niveles", verifyUser, getNiveles);
router.get("/niveles/:id", verifyUser, getNivelById);
router.post("/niveles", verifyUser, adminOnly, createNivel);
router.patch("/niveles/:id", verifyUser, adminOnly, updateNivel);
router.delete("/niveles/:id", verifyUser, adminOnly, deleteNivel);

router.get(
  "/usuarios/:id/niveles",
  verifyUser,
  getNivelesDeUsuario,
);
router.put(
  "/usuarios/:id/niveles",
  verifyUser,
  adminOnly,
  replaceNivelesDeUsuario,
);

export default router;