import User from "../models/UsersModel.js";
import argon2 from "argon2";

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "El correo y la contraseña son obligatorios",
      });
    }

    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      });
    }

    const match = await argon2.verify(user.password, password);

    if (!match) {
      return res.status(400).json({
        msg: "Contraseña incorrecta",
      });
    }

    // Se conserva el UUID dentro de la sesión.
    req.session.userId = user.uuid;

    // Datos enviados al frontend.
    const userData = {
      id: user.id,
      uuid: user.uuid,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    req.session.save((error) => {
      if (error) {
        console.error("Error al guardar la sesión:", error);

        return res.status(500).json({
          msg: "Error al guardar la sesión",
        });
      }

      return res.status(200).json(userData);
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      msg: "No fue posible iniciar sesión",
      error: error.message,
    });
  }
};

export const Me = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        msg: "Inicie sesión en su cuenta",
      });
    }

    const user = await User.findOne({
      attributes: [
        "id",
        "uuid",
        "name",
        "email",
        "role",
      ],
      where: {
        uuid: req.session.userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        msg: "Usuario no encontrado",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error al consultar la sesión:", error);

    return res.status(500).json({
      msg: "No fue posible consultar la sesión",
      error: error.message,
    });
  }
};

export const logOut = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error al cerrar sesión:", error);

      return res.status(400).json({
        msg: "No se pudo cerrar sesión",
      });
    }

    return res.status(200).json({
      msg: "Sesión cerrada correctamente",
    });
  });
};