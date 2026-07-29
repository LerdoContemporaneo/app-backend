import express from "express";
import {
  createGrados,
  deleteGrados,
  getGrados,
  getGradosById,
  updateGrados,
} from "../controllers/Grados.js";
import {
  adminOnly,
  verifyUser,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/grados", verifyUser, getGrados);
router.get("/grados/:id", verifyUser, getGradosById);
router.post("/grados", verifyUser, adminOnly, createGrados);
router.patch("/grados/:id", verifyUser, adminOnly, updateGrados);
router.delete("/grados/:id", verifyUser, adminOnly, deleteGrados);

export default router;
