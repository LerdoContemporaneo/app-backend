import User from "../models/UsersModel.js";

export const verifyUser = async (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ msg: "Por favor, inicie sesión en su cuenta" });
    }

    const user = await User.findOne({
        where: {
            uuid: req.session.userId
        }
    });

    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

   
    req.userId = user.id; 
    req.userUuid = user.uuid; 
    req.role = user.role;
    
    next();
};


export const staffOnly = (req, res, next) => {
   
    if (req.role !== "administrador" && req.role !== "maestro") {
        return res.status(403).json({ msg: "Acceso denegado: Permisos insuficientes" });
    }
    next();
};


export const adminOnly = (req, res, next) => {
    if (req.role !== "administrador") {
        return res.status(403).json({ msg: "Acceso denegado: Solo administradores" });
    }
    next();
};