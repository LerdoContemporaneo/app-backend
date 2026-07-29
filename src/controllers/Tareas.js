import { Op } from "sequelize";
import {
  Alumnos,
  Grados,
  Tareas,
} from "../models/index.js";
import {
  ROLES,
  enteroPositivo,
  esFechaValida,
  obtenerGradosIdsDelMaestro,
  usuarioAlumnoPerteneceAlGrado,
} from "../utils/controllerUtils.js";

const incluirGrado = {
  model: Grados,
  as: "grado",
  attributes: ["id", "uuid", "nombre", "maestroId"],
};

const atributos = [
  "id",
  "uuid",
  "titulo",
  "descripcion",
  "fechaAsignacion",
  "fechaEntrega",
  "gradoId",
  "createdAt",
  "updatedAt",
];

const buscarTarea = (uuid) =>
  Tareas.findOne({
    where: { uuid },
    attributes: atributos,
    include: [incluirGrado],
  });

const validarGradoParaGestion = async (
  gradoId,
  role,
  userId,
) => {
  if (!gradoId) {
    return { status: 400, msg: "El grupo no es válido" };
  }

  const grado = await Grados.findByPk(gradoId, {
    attributes: ["id", "maestroId"],
  });

  if (!grado) {
    return { status: 404, msg: "Grupo no encontrado" };
  }

  if (
    role === ROLES.MAESTRO &&
    Number(grado.maestroId) !== Number(userId)
  ) {
    return {
      status: 403,
      msg: "No puedes administrar tareas de otro maestro",
    };
  }

  if (
    role !== ROLES.MAESTRO &&
    role !== ROLES.ADMINISTRADOR
  ) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar tareas",
    };
  }

  return null;
};

const validarFechas = (asignacion, entrega) => {
  if (
    !esFechaValida(asignacion) ||
    !esFechaValida(entrega)
  ) {
    return {
      status: 400,
      msg: "Las fechas deben tener el formato YYYY-MM-DD",
    };
  }

  if (entrega < asignacion) {
    return {
      status: 400,
      msg: "La fecha de entrega no puede ser anterior a la asignación",
    };
  }

  return null;
};

export const getTareas = async (req, res) => {
  try {
    const { role, userId } = req;
    const where = {};

    if (role === ROLES.MAESTRO) {
      const gradosIds = await obtenerGradosIdsDelMaestro(userId);
      where.gradoId = { [Op.in]: gradosIds };
    } else if (role === ROLES.ALUMNO) {
      const alumno = await Alumnos.findOne({
        where: { userId },
        attributes: ["id"],
        include: [
          {
            model: Grados,
            as: "grados",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      if (!alumno) {
        return res.status(404).json({
          msg: "Perfil de alumno no asociado a este usuario",
        });
      }

      where.gradoId = {
        [Op.in]: alumno.grados.map((grado) => Number(grado.id)),
      };
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar tareas",
      });
    }

    if (req.query.gradoId !== undefined) {
      const gradoId = enteroPositivo(req.query.gradoId);

      if (!gradoId) {
        return res.status(400).json({
          msg: "El gradoId no es válido",
        });
      }

      if (
        role === ROLES.MAESTRO &&
        !(await obtenerGradosIdsDelMaestro(userId)).includes(gradoId)
      ) {
        return res.status(403).json({
          msg: "No puedes consultar tareas de ese grupo",
        });
      }

      if (
        role === ROLES.ALUMNO &&
        !(await usuarioAlumnoPerteneceAlGrado(userId, gradoId))
      ) {
        return res.status(403).json({
          msg: "No perteneces al grupo seleccionado",
        });
      }

      where.gradoId = gradoId;
    }

    const tareas = await Tareas.findAll({
      where,
      attributes: atributos,
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
      msg: "No fue posible obtener las tareas",
    });
  }
};

export const getTareasById = async (req, res) => {
  try {
    const tarea = await buscarTarea(req.params.id);

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    if (
      req.role === ROLES.MAESTRO &&
      Number(tarea.grado?.maestroId) !== Number(req.userId)
    ) {
      return res.status(403).json({
        msg: "No puedes consultar tareas de otro maestro",
      });
    }

    if (
      req.role === ROLES.ALUMNO &&
      !(await usuarioAlumnoPerteneceAlGrado(
        req.userId,
        tarea.gradoId,
      ))
    ) {
      return res.status(403).json({
        msg: "Esta tarea no pertenece a uno de tus grupos",
      });
    }

    if (
      ![
        ROLES.ADMINISTRADOR,
        ROLES.MAESTRO,
        ROLES.ALUMNO,
      ].includes(req.role)
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar esta tarea",
      });
    }

    return res.status(200).json(tarea);
  } catch (error) {
    console.error("Error al obtener tarea:", error);
    return res.status(500).json({
      msg: "No fue posible obtener la tarea",
    });
  }
};

export const createTareas = async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fechaAsignacion,
      fechaEntrega,
    } = req.body;
    const gradoId = enteroPositivo(req.body.gradoId);

    if (typeof titulo !== "string" || !titulo.trim()) {
      return res.status(400).json({
        msg: "El título es obligatorio",
      });
    }

    if (
      typeof descripcion !== "string" ||
      !descripcion.trim()
    ) {
      return res.status(400).json({
        msg: "La descripción es obligatoria",
      });
    }

    const errorFechas = validarFechas(
      fechaAsignacion,
      fechaEntrega,
    );

    if (errorFechas) {
      return res
        .status(errorFechas.status)
        .json({ msg: errorFechas.msg });
    }

    const errorGrado = await validarGradoParaGestion(
      gradoId,
      req.role,
      req.userId,
    );

    if (errorGrado) {
      return res
        .status(errorGrado.status)
        .json({ msg: errorGrado.msg });
    }

    const creada = await Tareas.create({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fechaAsignacion,
      fechaEntrega,
      gradoId,
    });
    const tarea = await buscarTarea(creada.uuid);

    return res.status(201).json({
      msg: "Tarea asignada al grupo correctamente",
      tarea,
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    return res.status(500).json({
      msg: "No fue posible crear la tarea",
    });
  }
};

export const updateTareas = async (req, res) => {
  try {
    const tarea = await buscarTarea(req.params.id);

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    const errorGradoActual = await validarGradoParaGestion(
      Number(tarea.gradoId),
      req.role,
      req.userId,
    );

    if (errorGradoActual) {
      return res
        .status(errorGradoActual.status)
        .json({ msg: errorGradoActual.msg });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    const updateData = {};

    if (req.body.titulo !== undefined) {
      if (
        typeof req.body.titulo !== "string" ||
        !req.body.titulo.trim()
      ) {
        return res.status(400).json({
          msg: "El título es obligatorio",
        });
      }
      updateData.titulo = req.body.titulo.trim();
    }

    if (req.body.descripcion !== undefined) {
      if (
        typeof req.body.descripcion !== "string" ||
        !req.body.descripcion.trim()
      ) {
        return res.status(400).json({
          msg: "La descripción es obligatoria",
        });
      }
      updateData.descripcion = req.body.descripcion.trim();
    }

    const asignacion =
      req.body.fechaAsignacion ?? tarea.fechaAsignacion;
    const entrega = req.body.fechaEntrega ?? tarea.fechaEntrega;

    if (
      req.body.fechaAsignacion !== undefined ||
      req.body.fechaEntrega !== undefined
    ) {
      const errorFechas = validarFechas(asignacion, entrega);

      if (errorFechas) {
        return res
          .status(errorFechas.status)
          .json({ msg: errorFechas.msg });
      }

      updateData.fechaAsignacion = asignacion;
      updateData.fechaEntrega = entrega;
    }

    if (req.body.gradoId !== undefined) {
      const gradoId = enteroPositivo(req.body.gradoId);
      const errorGradoDestino = await validarGradoParaGestion(
        gradoId,
        req.role,
        req.userId,
      );

      if (errorGradoDestino) {
        return res
          .status(errorGradoDestino.status)
          .json({ msg: errorGradoDestino.msg });
      }
      updateData.gradoId = gradoId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron campos válidos para actualizar",
      });
    }

    await tarea.update(updateData);
    const actualizada = await buscarTarea(tarea.uuid);

    return res.status(200).json({
      msg: "Tarea actualizada correctamente",
      tarea: actualizada,
    });
  } catch (error) {
    console.error("Error al actualizar tarea:", error);
    return res.status(500).json({
      msg: "No fue posible actualizar la tarea",
    });
  }
};

export const deleteTareas = async (req, res) => {
  try {
    const tarea = await buscarTarea(req.params.id);

    if (!tarea) {
      return res.status(404).json({ msg: "Tarea no encontrada" });
    }

    const errorGrado = await validarGradoParaGestion(
      Number(tarea.gradoId),
      req.role,
      req.userId,
    );

    if (errorGrado) {
      return res
        .status(errorGrado.status)
        .json({ msg: errorGrado.msg });
    }

    await tarea.destroy();

    return res.status(200).json({
      msg: "Tarea eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar tarea:", error);
    return res.status(500).json({
      msg: "No fue posible eliminar la tarea",
    });
  }
};
