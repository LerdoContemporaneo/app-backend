import {
  Alumnos,
  Grados,
  Users,
} from "../models/index.js";
import { Op } from "sequelize";

const gradoConMaestro = {
  model: Grados,
  attributes: [
    "id",
    "uuid",
    "nombre",
    "maestroId",
  ],
  include: [
    {
      model: Users,
      as: "maestro",
      attributes: [
        "id",
        "uuid",
        "name",
        "email",
        "role",
      ],
      required: false,
    },
  ],
};

export const getAlumnos = async (req, res) => {
  try {
    const { role, userId } = req;

    let whereCondition = {};

    if (role === "alumno") {
      // El alumno solamente puede consultar su perfil.
      whereCondition = {
        userId,
      };
    }

    if (role === "maestro") {
      // El maestro solamente puede consultar alumnos
      // pertenecientes a sus grupos.
      const grados = await Grados.findAll({
        where: {
          maestroId: userId,
        },
        attributes: ["id"],
      });

      const gradosIds = grados.map((grado) => grado.id);

      whereCondition = {
        gradoId: {
          [Op.in]: gradosIds,
        },
      };
    }

    const alumnos = await Alumnos.findAll({
      attributes: [
        "id",
        "uuid",
        "nombre",
        "apellido",
        "matricula",
        "tutor",
        "telefonoTutor",
        "userId",
        "gradoId",
      ],
      where: whereCondition,
      include: [gradoConMaestro],
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.status(200).json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const getAlumnoById = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({
      attributes: [
        "id",
        "uuid",
        "nombre",
        "apellido",
        "matricula",
        "tutor",
        "telefonoTutor",
        "userId",
        "gradoId",
      ],
      where: {
        uuid: req.params.id,
      },
      include: [gradoConMaestro],
    });

    if (!alumno) {
      return res.status(404).json({
        msg: "Alumno no encontrado",
      });
    }

    // Un alumno solamente puede ver su propio perfil.
    if (
      req.role === "alumno" &&
      Number(alumno.userId) !== Number(req.userId)
    ) {
      return res.status(403).json({
        msg: "Acceso denegado: no puedes ver perfiles de otros alumnos",
      });
    }

    // Un maestro solamente puede consultar alumnos
    // pertenecientes a uno de sus grupos.
    if (
      req.role === "maestro" &&
      Number(alumno.grado?.maestroId) !== Number(req.userId)
    ) {
      return res.status(403).json({
        msg: "Acceso denegado: el alumno no pertenece a uno de tus grupos",
      });
    }

    return res.status(200).json(alumno);
  } catch (error) {
    console.error("Error al obtener alumno:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const createAlumnos = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      matricula,
      tutor,
      telefonoTutor,
      gradoId,
      userId,
    } = req.body;

    if (
      !nombre?.trim() ||
      !matricula?.trim() ||
      !tutor?.trim() ||
      !userId ||
      !gradoId
    ) {
      return res.status(400).json({
        msg: "Nombre, matrícula, tutor, usuario y grupo son obligatorios",
      });
    }

    /*
     * El usuario ya debe existir y tener rol alumno.
     * No se crea otro usuario en este controlador.
     */
    const usuario = await Users.findOne({
      where: {
        id: userId,
        role: "alumno",
      },
    });

    if (!usuario) {
      return res.status(400).json({
        msg: "El usuario seleccionado no existe o no tiene rol de alumno",
      });
    }

    const perfilExistente = await Alumnos.findOne({
      where: {
        userId,
      },
    });

    if (perfilExistente) {
      return res.status(409).json({
        msg: "El usuario seleccionado ya está vinculado con un alumno",
      });
    }

    const matriculaExistente = await Alumnos.findOne({
      where: {
        matricula: matricula.trim(),
      },
    });

    if (matriculaExistente) {
      return res.status(409).json({
        msg: "La matrícula ya está registrada",
      });
    }

    const grado = await Grados.findByPk(gradoId, {
      attributes: [
        "id",
        "nombre",
        "maestroId",
      ],
    });

    if (!grado) {
      return res.status(400).json({
        msg: "El grupo seleccionado no existe",
      });
    }

    if (!grado.maestroId) {
      return res.status(400).json({
        msg: "El grupo seleccionado no tiene un maestro responsable",
      });
    }

    const nuevoAlumno = await Alumnos.create({
      nombre: nombre.trim(),
      apellido: apellido?.trim() || "",
      matricula: matricula.trim(),
      tutor: tutor.trim(),
      telefonoTutor: telefonoTutor?.trim() || null,
      gradoId: grado.id,
      userId: usuario.id,
    });

    return res.status(201).json({
      msg: "Usuario vinculado como alumno correctamente",
      alumno: {
        id: nuevoAlumno.id,
        uuid: nuevoAlumno.uuid,
      },
    });
  } catch (error) {
    console.error("Error al crear alumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        msg: "La matrícula o el usuario ya están registrados",
      });
    }

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const updateAlumnos = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    if (!alumno) {
      return res.status(404).json({
        msg: "Alumno no encontrado",
      });
    }

    const {
      nombre,
      apellido,
      matricula,
      tutor,
      telefonoTutor,
      gradoId,
    } = req.body;

    const updateData = {};

    if (typeof nombre === "string") {
      updateData.nombre = nombre.trim();
    }

    if (typeof apellido === "string") {
      updateData.apellido = apellido.trim();
    }

    if (typeof matricula === "string") {
      if (!matricula.trim()) {
        return res.status(400).json({
          msg: "La matrícula es obligatoria",
        });
      }

      updateData.matricula = matricula.trim();
    }

    if (typeof tutor === "string") {
      if (!tutor.trim()) {
        return res.status(400).json({
          msg: "El tutor es obligatorio",
        });
      }

      updateData.tutor = tutor.trim();
    }

    if (telefonoTutor !== undefined) {
      updateData.telefonoTutor =
        typeof telefonoTutor === "string" && telefonoTutor.trim()
          ? telefonoTutor.trim()
          : null;
    }

    if (gradoId !== undefined) {
      const grado = await Grados.findByPk(gradoId, {
        attributes: [
          "id",
          "nombre",
          "maestroId",
        ],
      });

      if (!grado) {
        return res.status(400).json({
          msg: "El grupo seleccionado no existe",
        });
      }

      if (!grado.maestroId) {
        return res.status(400).json({
          msg: "El grupo seleccionado no tiene un maestro responsable",
        });
      }

      updateData.gradoId = grado.id;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    await alumno.update(updateData);

    return res.status(200).json({
      msg: "Alumno actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar alumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        msg: "La matrícula ya está registrada",
      });
    }

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const deleteAlumnos = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    if (!alumno) {
      return res.status(404).json({
        msg: "Alumno no encontrado",
      });
    }

    /*
     * Solo elimina el perfil de alumno.
     * El usuario permanece disponible para volver a vincularse.
     */
    await alumno.destroy();

    return res.status(200).json({
      msg: "Alumno eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar alumno:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};