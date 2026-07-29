import { Op } from "sequelize";
import {
  Alumnos,
  Grados,
  Reportes,
  Users,
} from "../models/index.js";
import {
  ROLES,
  alumnoPerteneceAlGrado,
  enteroPositivo,
  esFechaValida,
  obtenerPerfilAlumno,
} from "../utils/controllerUtils.js";

const atributos = [
  "id",
  "uuid",
  "titulo",
  "contenido",
  "alumnoId",
  "maestroId",
  "gradoId",
  "createdAt",
  "updatedAt",
];

const includes = [
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
  },
  {
    model: Users,
    as: "maestro",
    attributes: ["id", "uuid", "name", "email", "role"],
  },
  {
    model: Grados,
    as: "grado",
    attributes: ["id", "uuid", "nombre", "maestroId"],
  },
];

const buscarReporte = (uuid) =>
  Reportes.findOne({
    where: { uuid },
    attributes: atributos,
    include: includes,
  });

const validarDestino = async ({
  alumnoId,
  gradoId,
  role,
  userId,
}) => {
  if (!alumnoId || !gradoId) {
    return {
      status: 400,
      msg: "Alumno y grupo son obligatorios",
    };
  }

  const [alumno, grado] = await Promise.all([
    Alumnos.findByPk(alumnoId, { attributes: ["id"] }),
    Grados.findByPk(gradoId, {
      attributes: ["id", "maestroId"],
    }),
  ]);

  if (!alumno) {
    return { status: 404, msg: "Alumno no encontrado" };
  }

  if (!grado) {
    return { status: 404, msg: "Grupo no encontrado" };
  }

  if (!(await alumnoPerteneceAlGrado(alumnoId, gradoId))) {
    return {
      status: 400,
      msg: "El alumno no pertenece al grupo seleccionado",
    };
  }

  if (
    role === ROLES.MAESTRO &&
    Number(grado.maestroId) !== Number(userId)
  ) {
    return {
      status: 403,
      msg: "No puedes crear reportes para grupos de otro maestro",
    };
  }

  if (
    role !== ROLES.MAESTRO &&
    role !== ROLES.ADMINISTRADOR
  ) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar reportes",
    };
  }

  return null;
};

const validarAcceso = async (reporte, role, userId) => {
  if (role === ROLES.ADMINISTRADOR) return null;

  if (role === ROLES.MAESTRO) {
    return Number(reporte.maestroId) === Number(userId) &&
      Number(reporte.grado?.maestroId) === Number(userId)
      ? null
      : {
          status: 403,
          msg: "El reporte no fue creado por ti o ya no pertenece a uno de tus grupos",
        };
  }

  if (role === ROLES.ALUMNO) {
    const perfil = await obtenerPerfilAlumno(userId);

    return perfil &&
      Number(perfil.id) === Number(reporte.alumnoId)
      ? null
      : {
          status: 403,
          msg: "No puedes consultar reportes de otro alumno",
        };
  }

  return {
    status: 403,
    msg: "No tienes permiso para consultar reportes",
  };
};

export const getReportes = async (req, res) => {
  try {
    const { role, userId } = req;
    const where = {};

    if (role === ROLES.ALUMNO) {
      const perfil = await obtenerPerfilAlumno(userId);

      if (!perfil) {
        return res.status(404).json({
          msg: "Perfil de alumno no encontrado",
        });
      }
      where.alumnoId = perfil.id;
    } else if (role === ROLES.MAESTRO) {
      where.maestroId = userId;
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar reportes",
      });
    }

    if (req.query.alumnoId !== undefined) {
      const alumnoId = enteroPositivo(req.query.alumnoId);

      if (!alumnoId) {
        return res.status(400).json({
          msg: "El alumnoId no es válido",
        });
      }

      if (
        role === ROLES.ALUMNO &&
        Number(where.alumnoId) !== alumnoId
      ) {
        return res.status(403).json({
          msg: "No puedes consultar reportes de otro alumno",
        });
      }
      where.alumnoId = alumnoId;
    }

    if (req.query.gradoId !== undefined) {
      const gradoId = enteroPositivo(req.query.gradoId);

      if (!gradoId) {
        return res.status(400).json({
          msg: "El gradoId no es válido",
        });
      }
      where.gradoId = gradoId;
    }

    const { desde, hasta } = req.query;

    if (desde !== undefined && !esFechaValida(desde)) {
      return res.status(400).json({ msg: "La fecha desde no es válida" });
    }

    if (hasta !== undefined && !esFechaValida(hasta)) {
      return res.status(400).json({ msg: "La fecha hasta no es válida" });
    }

    if (desde && hasta && desde > hasta) {
      return res.status(400).json({
        msg: "La fecha desde no puede ser posterior a la fecha hasta",
      });
    }

    if (desde && hasta) {
      where.createdAt = {
        [Op.between]: [
          `${desde} 00:00:00`,
          `${hasta} 23:59:59`,
        ],
      };
    } else if (desde) {
      where.createdAt = { [Op.gte]: `${desde} 00:00:00` };
    } else if (hasta) {
      where.createdAt = { [Op.lte]: `${hasta} 23:59:59` };
    }

    const include =
      role === ROLES.MAESTRO
        ? includes.map((item) =>
            item.as === "grado"
              ? {
                  ...item,
                  where: { maestroId: userId },
                  required: true,
                }
              : item,
          )
        : includes;

    const lista = await Reportes.findAll({
      where,
      attributes: atributos,
      include,
      order: [["id", "DESC"]],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    return res.status(500).json({
      msg: "No fue posible obtener los reportes",
    });
  }
};

export const getReportesById = async (req, res) => {
  try {
    const reporte = await buscarReporte(req.params.id);

    if (!reporte) {
      return res.status(404).json({ msg: "Reporte no encontrado" });
    }

    const errorAcceso = await validarAcceso(
      reporte,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    return res.status(200).json(reporte);
  } catch (error) {
    console.error("Error al obtener reporte:", error);
    return res.status(500).json({
      msg: "No fue posible obtener el reporte",
    });
  }
};

export const createReportes = async (req, res) => {
  try {
    const { titulo, contenido } = req.body;
    const alumnoId = enteroPositivo(req.body.alumnoId);
    const gradoId = enteroPositivo(req.body.gradoId);

    if (typeof titulo !== "string" || !titulo.trim()) {
      return res.status(400).json({
        msg: "El título es obligatorio",
      });
    }

    if (
      typeof contenido !== "string" ||
      !contenido.trim()
    ) {
      return res.status(400).json({
        msg: "El contenido es obligatorio",
      });
    }

    const errorDestino = await validarDestino({
      alumnoId,
      gradoId,
      role: req.role,
      userId: req.userId,
    });

    if (errorDestino) {
      return res
        .status(errorDestino.status)
        .json({ msg: errorDestino.msg });
    }

    const creado = await Reportes.create({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      alumnoId,
      maestroId: req.userId,
      gradoId,
    });
    const reporte = await buscarReporte(creado.uuid);

    return res.status(201).json({
      msg: "Reporte creado correctamente",
      reporte,
    });
  } catch (error) {
    console.error("Error al crear reporte:", error);
    return res.status(500).json({
      msg: "No fue posible crear el reporte",
    });
  }
};

export const updateReportes = async (req, res) => {
  try {
    const reporte = await buscarReporte(req.params.id);

    if (!reporte) {
      return res.status(404).json({ msg: "Reporte no encontrado" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para actualizar reportes",
      });
    }

    const errorAcceso = await validarAcceso(
      reporte,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
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

    if (req.body.contenido !== undefined) {
      if (
        typeof req.body.contenido !== "string" ||
        !req.body.contenido.trim()
      ) {
        return res.status(400).json({
          msg: "El contenido es obligatorio",
        });
      }
      updateData.contenido = req.body.contenido.trim();
    }

    const alumnoId =
      req.body.alumnoId !== undefined
        ? enteroPositivo(req.body.alumnoId)
        : Number(reporte.alumnoId);
    const gradoId =
      req.body.gradoId !== undefined
        ? enteroPositivo(req.body.gradoId)
        : Number(reporte.gradoId);

    if (
      req.body.alumnoId !== undefined ||
      req.body.gradoId !== undefined
    ) {
      const errorDestino = await validarDestino({
        alumnoId,
        gradoId,
        role: req.role,
        userId: req.userId,
      });

      if (errorDestino) {
        return res
          .status(errorDestino.status)
          .json({ msg: errorDestino.msg });
      }

      updateData.alumnoId = alumnoId;
      updateData.gradoId = gradoId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron campos válidos para actualizar",
      });
    }

    await reporte.update(updateData);
    const actualizado = await buscarReporte(reporte.uuid);

    return res.status(200).json({
      msg: "Reporte actualizado correctamente",
      reporte: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar reporte:", error);
    return res.status(500).json({
      msg: "No fue posible actualizar el reporte",
    });
  }
};

export const deleteReportes = async (req, res) => {
  try {
    const reporte = await buscarReporte(req.params.id);

    if (!reporte) {
      return res.status(404).json({ msg: "Reporte no encontrado" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para eliminar reportes",
      });
    }

    const errorAcceso = await validarAcceso(
      reporte,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    await reporte.destroy();

    return res.status(200).json({
      msg: "Reporte eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar reporte:", error);
    return res.status(500).json({
      msg: "No fue posible eliminar el reporte",
    });
  }
};
