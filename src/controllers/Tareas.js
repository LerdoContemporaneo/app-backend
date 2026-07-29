import {
  Tareas,
  Alumnos,
  Grados,
} from "../models/index.js";
import { Op } from "sequelize";

const incluirGrado = {
  model: Grados,
  as: "grado",
  attributes: [
    "id",
    "uuid",
    "nombre",
    "maestroId",
  ],
};

const obtenerGradosDelMaestro = async (maestroId) => {
  const grados = await Grados.findAll({
    where: {
      maestroId,
    },
    attributes: ["id"],
  });

  return grados.map((grado) => grado.id);
};

const alumnoPerteneceAlGrado = async (userId, gradoId) => {
  const alumno = await Alumnos.findOne({
    where: {
      userId,
    },
    attributes: ["id"],
    include: [
      {
        model: Grados,
        as: "grados",
        attributes: ["id"],
        where: {
          id: gradoId,
        },
        through: {
          attributes: [],
        },
        required: true,
      },
    ],
  });

  return Boolean(alumno);
};

const obtenerGradoAutorizado = async (
  gradoId,
  role,
  userId,
) => {
  const grado = await Grados.findByPk(gradoId, {
    attributes: [
      "id",
      "uuid",
      "nombre",
      "maestroId",
    ],
  });

  if (!grado) {
    return {
      error: {
        status: 404,
        msg: "Grupo no encontrado",
      },
    };
  }

  if (
    role === "maestro" &&
    Number(grado.maestroId) !== Number(userId)
  ) {
    return {
      error: {
        status: 403,
        msg: "No puedes administrar tareas de otro maestro",
      },
    };
  }

  if (
    role !== "maestro" &&
    role !== "administrador"
  ) {
    return {
      error: {
        status: 403,
        msg: "No tienes permiso para administrar tareas",
      },
    };
  }

  return {
    grado,
  };
};

const buscarTarea = async (uuid) => {
  return Tareas.findOne({
    where: {
      uuid,
    },
    attributes: [
      "id",
      "uuid",
      "titulo",
      "descripcion",
      "fechaAsignacion",
      "fechaEntrega",
      "gradoId",
    ],
    include: [incluirGrado],
  });
};

export const getTareas = async (req, res) => {
  try {
    const { role, userId } = req;
    let whereCondition = {};

    if (role === "maestro") {
      const gradosIds =
        await obtenerGradosDelMaestro(userId);

      whereCondition = {
        gradoId: {
          [Op.in]: gradosIds,
        },
      };
    } else if (role === "alumno") {
      const alumno = await Alumnos.findOne({
        where: {
          userId,
        },
        attributes: ["id"],
        include: [
          {
            model: Grados,
            as: "grados",
            attributes: ["id"],
            through: {
              attributes: [],
            },
          },
        ],
      });

      if (!alumno) {
        return res.status(404).json({
          msg: "Perfil de alumno no asociado a este usuario",
        });
      }

      const gradosIds = alumno.grados.map(
        (grado) => grado.id,
      );

      whereCondition = {
        gradoId: {
          [Op.in]: gradosIds,
        },
      };
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para consultar tareas",
      });
    }

    const tareas = await Tareas.findAll({
      attributes: [
        "id",
        "uuid",
        "titulo",
        "descripcion",
        "fechaAsignacion",
        "fechaEntrega",
        "gradoId",
      ],
      where: whereCondition,
      include: [incluirGrado],
      order: [
        ["fechaEntrega", "ASC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(tareas);
  } catch (error) {
    console.error("Error al obtener tareas:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const getTareasById = async (req, res) => {
  try {
    const { role, userId } = req;
    const tarea = await buscarTarea(req.params.id);

    if (!tarea) {
      return res.status(404).json({
        msg: "Tarea no encontrada",
      });
    }

    if (role === "maestro") {
      if (
        Number(tarea.grado?.maestroId) !==
        Number(userId)
      ) {
        return res.status(403).json({
          msg: "No puedes consultar tareas de otro maestro",
        });
      }
    } else if (role === "alumno") {
      const autorizado = await alumnoPerteneceAlGrado(
        userId,
        tarea.gradoId,
      );

      if (!autorizado) {
        return res.status(403).json({
          msg: "Esta tarea no pertenece a uno de tus grupos",
        });
      }
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para consultar esta tarea",
      });
    }

    return res.status(200).json(tarea);
  } catch (error) {
    console.error("Error al obtener tarea:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const createTareas = async (req, res) => {
  try {
    const { role, userId } = req;

    const {
      titulo,
      descripcion,
      fechaAsignacion,
      fechaEntrega,
      gradoId,
    } = req.body;

    const gradoIdNumerico = Number(gradoId);

    if (
      !titulo?.trim() ||
      !fechaAsignacion ||
      !fechaEntrega ||
      !Number.isInteger(gradoIdNumerico) ||
      gradoIdNumerico <= 0
    ) {
      return res.status(400).json({
        msg: "Título, fechas y grupo son obligatorios",
      });
    }

    if (
      new Date(fechaEntrega) <
      new Date(fechaAsignacion)
    ) {
      return res.status(400).json({
        msg: "La fecha de entrega no puede ser anterior a la asignación",
      });
    }

    const resultado = await obtenerGradoAutorizado(
      gradoIdNumerico,
      role,
      userId,
    );

    if (resultado.error) {
      return res
        .status(resultado.error.status)
        .json({ msg: resultado.error.msg });
    }

    const tarea = await Tareas.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      fechaAsignacion,
      fechaEntrega,
      gradoId: gradoIdNumerico,
    });

    const tareaCreada = await buscarTarea(tarea.uuid);

    return res.status(201).json({
      msg: "Tarea asignada al grupo correctamente",
      tarea: tareaCreada,
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const updateTareas = async (req, res) => {
  try {
    const { role, userId } = req;

    const tarea = await Tareas.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    if (!tarea) {
      return res.status(404).json({
        msg: "Tarea no encontrada",
      });
    }

    const {
      titulo,
      descripcion,
      fechaAsignacion,
      fechaEntrega,
      gradoId,
    } = req.body;

    const gradoIdDestino =
      gradoId !== undefined
        ? Number(gradoId)
        : Number(tarea.gradoId);

    if (
      !Number.isInteger(gradoIdDestino) ||
      gradoIdDestino <= 0
    ) {
      return res.status(400).json({
        msg: "El grupo seleccionado no es válido",
      });
    }

    const gradoActual = await obtenerGradoAutorizado(
      tarea.gradoId,
      role,
      userId,
    );

    if (gradoActual.error) {
      return res
        .status(gradoActual.error.status)
        .json({ msg: gradoActual.error.msg });
    }

    const gradoDestino = await obtenerGradoAutorizado(
      gradoIdDestino,
      role,
      userId,
    );

    if (gradoDestino.error) {
      return res
        .status(gradoDestino.error.status)
        .json({ msg: gradoDestino.error.msg });
    }

    const asignacionFinal =
      fechaAsignacion ?? tarea.fechaAsignacion;

    const entregaFinal =
      fechaEntrega ?? tarea.fechaEntrega;

    if (
      new Date(entregaFinal) <
      new Date(asignacionFinal)
    ) {
      return res.status(400).json({
        msg: "La fecha de entrega no puede ser anterior a la asignación",
      });
    }

    await tarea.update({
      titulo:
        typeof titulo === "string"
          ? titulo.trim()
          : tarea.titulo,
      descripcion:
        descripcion !== undefined
          ? descripcion?.trim() || null
          : tarea.descripcion,
      fechaAsignacion: asignacionFinal,
      fechaEntrega: entregaFinal,
      gradoId: gradoIdDestino,
    });

    const tareaActualizada =
      await buscarTarea(tarea.uuid);

    return res.status(200).json({
      msg: "Tarea actualizada correctamente",
      tarea: tareaActualizada,
    });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};

export const deleteTareas = async (req, res) => {
  try {
    const { role, userId } = req;

    const tarea = await Tareas.findOne({
      where: {
        uuid: req.params.id,
      },
    });

    if (!tarea) {
      return res.status(404).json({
        msg: "Tarea no encontrada",
      });
    }

    const resultado = await obtenerGradoAutorizado(
      tarea.gradoId,
      role,
      userId,
    );

    if (resultado.error) {
      return res
        .status(resultado.error.status)
        .json({ msg: resultado.error.msg });
    }

    await tarea.destroy();

    return res.status(200).json({
      msg: "Tarea eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);

    return res.status(500).json({
      msg: error.message,
    });
  }
};