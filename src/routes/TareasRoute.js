import express from 'express';
import { getTareas, 
    getTareasById,
    createTareas,
    updateTareas,
    deleteTareas
 } from "../controllers/Tareas.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();


router.get('/tareas', verifyUser, getTareas);
router.get('/tareas/:id', verifyUser, getTareasById);


router.post('/tareas', verifyUser, staffOnly, createTareas);
router.patch('/tareas/:id', verifyUser, staffOnly, updateTareas); 
router.delete('/tareas/:id', verifyUser, staffOnly, deleteTareas); 

export default router;