import express from 'express';
import { 
    getAlumnos,
    getAlumnosById,
    createAlumnos,
    updateAlumnos,
    deleteAlumnos
} from "../controllers/Alumnos.js"

const router = express.Router();

router.get('/alumnos', getAlumnos);
router.get('/alumnos/:id', getAlumnosById);
router.post('/alumnos', createAlumnos);
router.patch('/alumnos', updateAlumnos);
router.delete('/alumnos', deleteAlumnos);

export default router;