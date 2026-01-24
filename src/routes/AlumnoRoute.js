import express from 'express';
import { getAlumnos, 
    getAlumnoById,
    createAlumnos,
    updateAlumnos,
    deleteAlumnos
 } from "../controllers/Alumnos.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();

router.get('/alumnos', verifyUser, getAlumnos);
router.get('/alumnos/:id', verifyUser, getAlumnoById);

// Crear alumnos: Solo Staff (Admin/Maestros)
router.post('/alumnos', verifyUser, staffOnly, createAlumnos);
router.patch('/alumnos/:id', verifyUser, staffOnly, updateAlumnos); 
router.delete('/alumnos/:id', verifyUser, staffOnly, deleteAlumnos); 

export default router;