import express from 'express';
import { getReportes, 
    getReportesById,
    createReportes,
    updateReportes,
    deleteReportes
 } from "../controllers/Reportes.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();

router.get('/reportes', verifyUser, getReportes);
router.get('/reportes/:id', verifyUser, getReportesById);


router.post('/reportes', verifyUser, staffOnly, createReportes);
router.patch('/reportes/:id', verifyUser, staffOnly, updateReportes); 
router.delete('/reportes/:id', verifyUser, staffOnly, deleteReportes); 

export default router;