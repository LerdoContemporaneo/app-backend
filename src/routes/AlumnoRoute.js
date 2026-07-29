import express from "express";
import {
  createAlumnos,
  deleteAlumnos,
  getAlumnoById,
  getAlumnos,
  updateAlumnos,
} from "../controllers/Alumnos.js";
import {
  adminOnly,
  staffOnly,
  verifyUser,
} from "../middleware/AuthUser.js";

const router = express.Router();

router.get("/alumnos", verifyUser, getAlumnos);
router.get("/alumnos/:id", verifyUser, getAlumnoById);
router.post("/alumnos", verifyUser, staffOnly, createAlumnos);
router.patch("/alumnos/:id", verifyUser, staffOnly, updateAlumnos);
router.delete("/alumnos/:id", verifyUser, adminOnly, deleteAlumnos);

export default router;
