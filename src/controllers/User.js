import argon2 from "argon2";
import {
  Alumnos,
  AsistenciaMaestro,
  Grados,
  Reportes,
  Users,
} from "../models/index.js";
import {
  ROLES,
  esErrorRelacion,
  esErrorUnico,
} from "../utils/controllerUtils.js";

const ROLES_VALIDOS = Object.values(ROLES);

const atributos = [
  "id",
  "uuid",
  "name",
  "email",
  "role",
  "telefono",
  "correoPersonal",
  "createdAt",
  "updatedAt",
];

const emailValido = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizarEmail = (email) => email.trim().toLowerCase();

export const getUsers = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede consultar usuarios",
      });
    }

    const usuarios = await Users.findAll({
      attributes: atributos,
      order: [["name", "ASC"]],
    });

    return res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return res.status(500).json({
      msg: "No fue posible obtener los usuarios",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede consultar usuarios",
      });
    }

    const usuario = await Users.findOne({
      where: { uuid: req.params.id },
      attributes: atributos,
    });

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return res.status(500).json({
      msg: "No fue posible obtener el usuario",
    });
  }
};

export const createUsers = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede crear usuarios",
      });
    }

    const {
      name,
      email,
      password,
      confPassword,
      role,
      telefono,
      correoPersonal,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        msg: "El nombre es obligatorio",
      });
    }

    if (
      typeof email !== "string" ||
      !emailValido(email.trim())
    ) {
      return res.status(400).json({
        msg: "El correo electrónico no es válido",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        msg: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    if (password !== confPassword) {
      return res.status(400).json({
        msg: "La contraseña y su confirmación no coinciden",
      });
    }

    if (!ROLES_VALIDOS.includes(role)) {
      return res.status(400).json({
        msg: "El rol seleccionado no es válido",
      });
    }

    if (
      correoPersonal &&
      (typeof correoPersonal !== "string" ||
        !emailValido(correoPersonal.trim()))
    ) {
      return res.status(400).json({
        msg: "El correo personal no es válido",
      });
    }

    const usuario = await Users.create({
      name: name.trim(),
      email: normalizarEmail(email),
      password: await argon2.hash(password),
      role,
      telefono:
        typeof telefono === "string" && telefono.trim()
          ? telefono.trim()
          : null,
      correoPersonal:
        typeof correoPersonal === "string" &&
        correoPersonal.trim()
          ? normalizarEmail(correoPersonal)
          : null,
    });

    const creado = await Users.findByPk(usuario.id, {
      attributes: atributos,
    });

    return res.status(201).json({
      msg: "Usuario creado correctamente",
      usuario: creado,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "El correo electrónico ya está registrado",
      });
    }

    return res.status(500).json({
      msg: "No fue posible crear el usuario",
    });
  }
};

export const updateUsers = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede actualizar usuarios",
      });
    }

    const usuario = await Users.findOne({
      where: { uuid: req.params.id },
    });

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          msg: "El nombre es obligatorio",
        });
      }
      updateData.name = req.body.name.trim();
    }

    if (req.body.email !== undefined) {
      if (
        typeof req.body.email !== "string" ||
        !emailValido(req.body.email.trim())
      ) {
        return res.status(400).json({
          msg: "El correo electrónico no es válido",
        });
      }
      updateData.email = normalizarEmail(req.body.email);
    }

    if (req.body.role !== undefined) {
      if (!ROLES_VALIDOS.includes(req.body.role)) {
        return res.status(400).json({
          msg: "El rol seleccionado no es válido",
        });
      }

      if (
        Number(usuario.id) === Number(req.userId) &&
        req.body.role !== usuario.role
      ) {
        return res.status(400).json({
          msg: "No puedes cambiar el rol de tu propia cuenta",
        });
      }

      if (req.body.role !== usuario.role) {
        if (usuario.role === ROLES.MAESTRO) {
          const [grados, reportes, asistencias] = await Promise.all([
            Grados.count({ where: { maestroId: usuario.id } }),
            Reportes.count({ where: { maestroId: usuario.id } }),
            AsistenciaMaestro.count({
              where: { maestroId: usuario.id },
            }),
          ]);

          if (grados || reportes || asistencias) {
            return res.status(409).json({
              msg: "No puedes cambiar el rol del maestro mientras tenga información relacionada",
              relaciones: { grados, reportes, asistencias },
            });
          }
        }

        if (usuario.role === ROLES.ALUMNO) {
          const perfil = await Alumnos.findOne({
            where: { userId: usuario.id },
            attributes: ["id"],
          });

          if (perfil) {
            return res.status(409).json({
              msg: "Elimina primero el perfil de alumno antes de cambiar su rol",
            });
          }
        }
      }

      updateData.role = req.body.role;
    }

    if (req.body.telefono !== undefined) {
      updateData.telefono =
        typeof req.body.telefono === "string" &&
        req.body.telefono.trim()
          ? req.body.telefono.trim()
          : null;
    }

    if (req.body.correoPersonal !== undefined) {
      if (
        req.body.correoPersonal &&
        (typeof req.body.correoPersonal !== "string" ||
          !emailValido(req.body.correoPersonal.trim()))
      ) {
        return res.status(400).json({
          msg: "El correo personal no es válido",
        });
      }

      updateData.correoPersonal =
        typeof req.body.correoPersonal === "string" &&
        req.body.correoPersonal.trim()
          ? normalizarEmail(req.body.correoPersonal)
          : null;
    }

    if (req.body.password) {
      if (
        typeof req.body.password !== "string" ||
        req.body.password.length < 8
      ) {
        return res.status(400).json({
          msg: "La contraseña debe tener al menos 8 caracteres",
        });
      }

      if (req.body.password !== req.body.confPassword) {
        return res.status(400).json({
          msg: "La contraseña y su confirmación no coinciden",
        });
      }

      updateData.password = await argon2.hash(req.body.password);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron campos válidos para actualizar",
      });
    }

    await usuario.update(updateData);
    const actualizado = await Users.findByPk(usuario.id, {
      attributes: atributos,
    });

    return res.status(200).json({
      msg: "Usuario actualizado correctamente",
      usuario: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "El correo electrónico ya está registrado",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar el usuario",
    });
  }
};

export const deleteUsers = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede eliminar usuarios",
      });
    }

    const usuario = await Users.findOne({
      where: { uuid: req.params.id },
    });

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (Number(usuario.id) === Number(req.userId)) {
      return res.status(400).json({
        msg: "No puedes eliminar tu propia cuenta",
      });
    }

    const [grados, reportes, asistenciasMaestro, perfil] =
      await Promise.all([
        Grados.count({ where: { maestroId: usuario.id } }),
        Reportes.count({ where: { maestroId: usuario.id } }),
        AsistenciaMaestro.count({
          where: { maestroId: usuario.id },
        }),
        Alumnos.findOne({
          where: { userId: usuario.id },
          attributes: ["id"],
        }),
      ]);

    let historialAlumno = null;

    if (perfil) {
      const [asistencias, incidencias, reportesAlumno] =
        await Promise.all([
          perfil.countAsistencias(),
          perfil.countIncidencias(),
          perfil.countReportes(),
        ]);
      historialAlumno = {
        asistencias,
        incidencias,
        reportes: reportesAlumno,
      };
    }

    const tieneHistorialAlumno =
      historialAlumno &&
      Object.values(historialAlumno).some((cantidad) => cantidad > 0);

    if (
      grados ||
      reportes ||
      asistenciasMaestro ||
      tieneHistorialAlumno
    ) {
      return res.status(409).json({
        msg: "No se puede eliminar el usuario porque tiene información relacionada",
        relaciones: {
          grados,
          reportes,
          asistenciasMaestro,
          historialAlumno,
        },
      });
    }

    await usuario.destroy();

    return res.status(200).json({
      msg: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);

    if (esErrorRelacion(error)) {
      return res.status(409).json({
        msg: "No se puede eliminar el usuario porque tiene registros relacionados",
      });
    }

    return res.status(500).json({
      msg: "No fue posible eliminar el usuario",
    });
  }
};
