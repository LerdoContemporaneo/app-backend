import Tareas from "../models/TareasModel.js";
import Alumnos from "../models/AlumnosModel.js";
import Grados from "../models/GradosModel.js";
import { Op } from "sequelize";

/**
 * Comprueba que el alumno pertenezca a por lo menos
 * un grupo asignado al maestro autenticado.
 */
const maestroPuedeGestionarAlumno = async (maestroId, alumnoId) => {
  const alumno = await Alumnos.findOne({
    where: { id: alumnoId },
    attributes: ["id"],
    include: [
      {
        model: Grados,
        as: "grados",
        attributes: ["id", "maestroId"],
        where: { maestroId },
        through: { attributes: [] },
        required: true,
      },
    ],
  });

  return Boolean(alumno);
};

const buscarTarea = async (uuid) => {
  return Tareas.findOne({
    where: { uuid },
    attributes: [
      "id",
      "uuid",
      "titulo",
      "descripcion",
      "fechaAsignacion",
      "fechaEntrega",
      "alumnoId",
    ],
    include: [
      {
        model: Alumnos,
        as: "alumno",
        attributes: [
          "id",
          "uuid",
          "nombre",
          "apellido",
          "matricula",
          "userId",
        ],
        include: [
          {
            model: Grados,
            as: "grados",
            attributes: ["id", "uuid", "nombre", "maestroId"],
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
};

export const getTareas = async (req, res) => {
  try {
    const { role, userId } = req;
    let whereCondition = {};

    if (role === "alumno") {
      const alumno = await Alumnos.findOne({
        where: { userId },
        attributes: ["id"],
      });

      if (!alumno) {
        return res.status(404).json({
          msg: "Perfil de alumno no asociado a este usuario",
        });
      }

      whereCondition = {
        alumnoId: alumno.id,
      };
    } else if (role === "maestro") {
      const alumnos = await Alumnos.findAll({
        attributes: ["id"],
        include: [
          {
            model: Grados,
            as: "grados",
            attributes: [],
            where: { maestroId: userId },
            through: { attributes: [] },
            required: true,
          },
        ],
      });

      const alumnosIds = [
        ...new Set(alumnos.map((alumno) => alumno.id)),
      ];

      // Evita devolver tareas si el maestro no tiene alumnos.
      whereCondition =
        alumnosIds.length > 0
          ? { alumnoId: { [Op.in]: alumnosIds } }
          : { alumnoId: null };
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para consultar tareas",
      });
    }

    const response = await Tareas.findAll({
      attributes: [
        "id",
        "uuid",
        "titulo",
        "descripcion",
        "fechaAsignacion",
        "fechaEntrega",
        "alumnoId",
      ],
      where: whereCondition,
      include: [
        {
          model: Alumnos,
          as: "alumno",
          attributes: [
            "id",
            "uuid",
            "nombre",
            "apellido",
            "matricula",
          ],
          include: [
            {
              model: Grados,
              as: "grados",
              attributes: ["id", "uuid", "nombre", "maestroId"],
              through: { attributes: [] },
            },
          ],
        },
      ],
      order: [
        ["fechaEntrega", "ASC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(response);
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

    if (role === "alumno") {
      if (Number(tarea.alumno?.userId) !== Number(userId)) {
        return res.status(403).json({
          msg: "No puedes consultar tareas de otros alumnos",
        });
      }
    } else if (role === "maestro") {
      const autorizado = await maestroPuedeGestionarAlumno(
        userId,
        tarea.alumnoId
      );

      if (!autorizado) {
        return res.status(403).json({
          msg: "El alumno no pertenece a ninguno de tus grupos",
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
      alumnoId,
    } = req.body;

    const alumnoIdNumerico = Number(alumnoId);

    if (
      !titulo?.trim() ||
      !fechaAsignacion ||
      !fechaEntrega ||
      !Number.isInteger(alumnoIdNumerico) ||
      alumnoIdNumerico <= 0
    ) {
      return res.status(400).json({
        msg: "Título, fechas y alumno son obligatorios",
      });
    }

    if (new Date(fechaEntrega) < new Date(fechaAsignacion)) {
      return res.status(400).json({
        msg: "La fecha de entrega no puede ser anterior a la asignación",
      });
    }

    const alumno = await Alumnos.findByPk(alumnoIdNumerico, {
      attributes: ["id"],
    });

    if (!alumno) {
      return res.status(404).json({
        msg: "Alumno no encontrado",
      });
    }

    if (role === "maestro") {
      const autorizado = await maestroPuedeGestionarAlumno(
        userId,
        alumnoIdNumerico
      );

      if (!autorizado) {
        return res.status(403).json({
          msg: "No puedes asignar tareas a un alumno fuera de tus grupos",
        });
      }
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para crear tareas",
      });
    }

    const tarea = await Tareas.create({
      titulo: titulo.trim(),
      descripcion: descripcion?.trim() || null,
      fechaAsignacion,
      fechaEntrega,
      alumnoId: alumnoIdNumerico,
    });

    return res.status(201).json({
      msg: "Tarea creada correctamente",
      tarea,
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
      where: { uuid: req.params.id },
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
      alumnoId,
    } = req.body;

    const alumnoIdDestino =
      alumnoId !== undefined ? Number(alumnoId) : Number(tarea.alumnoId);

    if (!Number.isInteger(alumnoIdDestino) || alumnoIdDestino <= 0) {
      return res.status(400).json({
        msg: "El alumno seleccionado no es válido",
      });
    }

    if (role === "maestro") {
      const puedeGestionarActual = await maestroPuedeGestionarAlumno(
        userId,
        tarea.alumnoId
      );

      const puedeGestionarDestino = await maestroPuedeGestionarAlumno(
        userId,
        alumnoIdDestino
      );

      if (!puedeGestionarActual || !puedeGestionarDestino) {
        return res.status(403).json({
          msg: "No puedes modificar tareas de alumnos fuera de tus grupos",
        });
      }
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para actualizar tareas",
      });
    }

    const asignacionFinal =
      fechaAsignacion ?? tarea.fechaAsignacion;

    const entregaFinal =
      fechaEntrega ?? tarea.fechaEntrega;

    if (new Date(entregaFinal) < new Date(asignacionFinal)) {
      return res.status(400).json({
        msg: "La fecha de entrega no puede ser anterior a la asignación",
      });
    }

    await tarea.update({
      titulo: titulo?.trim() ?? tarea.titulo,
      descripcion:
        descripcion !== undefined
          ? descripcion.trim() || null
          : tarea.descripcion,
      fechaAsignacion: asignacionFinal,
      fechaEntrega: entregaFinal,
      alumnoId: alumnoIdDestino,
    });

    return res.status(200).json({
      msg: "Tarea actualizada correctamente",
      tarea,
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
      where: { uuid: req.params.id },
    });

    if (!tarea) {
      return res.status(404).json({
        msg: "Tarea no encontrada",
      });
    }

    if (role === "maestro") {
      const autorizado = await maestroPuedeGestionarAlumno(
        userId,
        tarea.alumnoId
      );

      if (!autorizado) {
        return res.status(403).json({
          msg: "No puedes eliminar tareas de alumnos fuera de tus grupos",
        });
      }
    } else if (role !== "administrador") {
      return res.status(403).json({
        msg: "No tienes permiso para eliminar tareas",
      });
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