// src/middlewares/auth.js
import Users from "../models/UsersModel.js";


export const verifyUser = async (req, res, next) => {
  try {
    const userUuid = req.session.userUuid || req.session.userId; 
    if (!userUuid) {
      return res.status(401).json({ msg: "Inicie sesión en su cuenta" });
    }

    const user = await Users.findOne({
      where: { uuid: userUuid },
      attributes: ["id", "uuid", "name", "email", "role"],
    });

    if (!user) {

      req.session.destroy(() => {});
      return res.status(401).json({ msg: "Inicie sesión en su cuenta" });
    }

  
    req.user = user;
    req.userId = user.id;     
    req.role = user.role;
    res.locals.user = user;

    return next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};


export const allowRoles =
  (...rolesPermitidos) =>
  (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(500).json({ msg: "Middleware mal usado: falta verifyUser" });
      }
      if (!rolesPermitidos.includes(req.role)) {
        return res.status(403).json({ msg: "Acceso denegado" });
      }
      return next();
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  };


export const adminOnly = allowRoles("administrador");         
export const adminOrMaestro = allowRoles("administrador", "maestro"); 
