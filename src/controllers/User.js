import Users from "../models/UsersModel.js";
import argon2 from "argon2";

const ROLES = ["administrador", "maestro", "alumno"];


export const getUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "50", 10), 1);
    const offset = (page - 1) * limit;

    const { rows, count } = await Users.findAndCountAll({
      attributes: ["uuid", "id", "name", "email", "role"],
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.status(200).json({
      data: rows,
      meta: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


export const getUsersById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ msg: "ID inválido" });
    }

    const user = await Users.findByPk(id, {
      attributes: ["uuid","id", "name", "email", "role"],
    });
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};


export const createUsers = async (req, res) => {
  try {
    const { name, email, password, confPassword, role } = req.body;

    if (!name || !email || !password || !confPassword || !role) {
      return res.status(400).json({ msg: "Faltan campos obligatorios" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ msg: "Rol inválido" });
    }
    if (password !== confPassword) {
      return res.status(400).json({ msg: "Contraseña y confirmación no coinciden" });
    }

    const hashPassword = await argon2.hash(password);
    const created = await Users.create({
      name,
      email,
      password: hashPassword,
      role,
    });

    return res.status(201).json({
      msg: "Usuario registrado",
      id: created.id,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "El email ya está registrado" });
    }
    res.status(500).json({ msg: error.message });
  }
};


export const updateUsers = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ msg: "ID inválido" });
    }

    const user = await Users.findByPk(id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    const { name, email, password, confPassword, role } = req.body;

    if (role && !ROLES.includes(role)) {
      return res.status(400).json({ msg: "Rol inválido" });
    }

    let hashPassword = user.password;
    if (typeof password === "string" && password.length > 0) {
      if (password !== confPassword) {
        return res.status(400).json({ msg: "Contraseña y confirmación no coinciden" });
      }
      hashPassword = await argon2.hash(password);
    }

    await Users.update(
      {
        name: name ?? user.name,
        email: email ?? user.email,
        password: hashPassword,
        role: role ?? user.role,
      },
      { where: { id } }
    );

    return res.status(200).json({ msg: "Usuario actualizado" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "El email ya está registrado" });
    }
    res.status(500).json({ msg: error.message });
  }
};


export const deleteUsers = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ msg: "ID inválido" });
    }

    const user = await Users.findByPk(id);
    if (!user) return res.status(404).json({ msg: "Usuario no encontrado" });

    await Users.destroy({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
