import express from 'express';
import { getUsers, 
    getUserById,
    createUsers,
    updateUsers,
    deleteUsers
 } from "../controllers/User.js"
import { verifyUser, adminOnly } from '../middleware/AuthUser.js';

const router = express.Router();

// solo para primera creacion de admin
// router.post('/users', createUsers);

router.get('/users', verifyUser, adminOnly, getUsers);
router.get('/users/:id', verifyUser, adminOnly, getUserById);
router.post('/users', verifyUser, adminOnly, createUsers);
router.patch('/users/:id', verifyUser, adminOnly, updateUsers);
router.delete('/users/:id', verifyUser, adminOnly, deleteUsers);

export default router;