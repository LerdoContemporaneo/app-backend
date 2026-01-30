import express from 'express';
import { getIncidencias, 
    getIncidenciasById, 
    createIncidencias, 
    updateIncidencias, 
    deleteIncidencias } from "../controllers/Incidencias.js"
import { verifyUser, staffOnly } from '../middleware/AuthUser.js';

 const router = express.Router();


router.get('/incidencias', verifyUser, getIncidencias);
router.get('/incidencias/:id', verifyUser, getIncidenciasById);


router.post('/incidencias', verifyUser, staffOnly, createIncidencias);
router.patch('/incidencias/:id', verifyUser, staffOnly, updateIncidencias); 
router.delete('/incidencias/:id', verifyUser, staffOnly, deleteIncidencias); 

export default router;