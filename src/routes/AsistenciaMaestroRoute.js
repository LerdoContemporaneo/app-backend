import express from 'express';
import { getAsistenciaMaestro, 
    getAsistenciaMaestroById,
    createAsistenciaMaestro,
    updateAsistenciaMaestro,
    deleteAsistenciaMaestro
 } from "../controllers/AsistenciaMaestro.js"
import { verifyUser, adminOnly } from '../middleware/AuthUser.js';

 const router = express.Router();

router.get('/asistencia-maestro', verifyUser, adminOnly, getAsistenciaMaestro);
router.get('/asistencia-maestro/:id', verifyUser, adminOnly, getAsistenciaMaestroById);
router.post('/asistencia-maestro', verifyUser, adminOnly, createAsistenciaMaestro);
router.patch('/asistencia-maestro/:id', verifyUser, adminOnly, updateAsistenciaMaestro);
router.delete('/asistencia-maestro/:id', verifyUser, adminOnly, deleteAsistenciaMaestro);

export default router;