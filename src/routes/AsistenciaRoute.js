import express from 'express';
import { getAsistencia, 
    getAsistenciaById,
    createAsistencia,
    updateAsistencia,
    deleteAsistencia
 } from "../controllers/Asistencia.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();

router.get('/asistencia', verifyUser, getAsistencia);
router.get('/asistencia/:id', verifyUser, getAsistenciaById);

// Solo maestros pasan lista
router.post('/asistencia', verifyUser, staffOnly, createAsistencia);
router.patch('/asistencia/:id', verifyUser, staffOnly, updateAsistencia); 
router.delete('/asistencia/:id', verifyUser, staffOnly, deleteAsistencia); 

export default router;