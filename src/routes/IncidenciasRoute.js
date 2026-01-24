import express from 'express';
import { getGrados, 
    getGradosById,
    createGrados,
    updateGrados,
    deleteGrados
 } from "../controllers/Grados.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();


router.get('/grados', verifyUser, getGrados);
router.get('/grados/:id', verifyUser, getGradosById);


router.post('/grados', verifyUser, staffOnly, createGrados);
router.patch('/grados/:id', verifyUser, staffOnly, updateGrados); 
router.delete('/grados/:id', verifyUser, staffOnly, deleteGrados); 

export default router;