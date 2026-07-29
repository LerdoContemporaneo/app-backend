import { Op } from "sequelize";
import {
  Alumnos,
  Grados,
  Incidencia,
} from "../models/index.js";
import {
  ROLES,
  enteroPositivo,
  esFechaValida,
  hoy,
  maestroPuedeGestionarAlumno,
  obtenerAlumnoIdsDelMaestro,
  obtenerPerfilAlumno,
} from "../utils/controllerUtils.js";

const atributos = [
  "id",
  "uuid",
  "tipo",
  "descripcion",
  "fecha",
  "alumnoId",
];

const incluirAlumno = {
  model: Alumnos,
  as: "alumno",
  attributes: [
    "id",
    "uuid",
    "nombre",
    "apellido",
    "matricula",
    "tutor",
    "telefonoTutor",
  ],
  include: [
    {
      model: Grados,
      as: "grados",
      attributes: ["id", "uuid", "nombre", "maestroId"],
      through: { attributes: [] },
    },
  ],
};

const buscarIncidencia = (uuid) =>
  Incidencia.findOne({
    where: { uuid },
    attributes: atributos,
    include: [incluirAlumno],
  });

const validarAcceso = async (incidencia, role, userId) => {
  if (role === ROLES.ADMINISTRADOR) return null;

  if (role === ROLES.MAESTRO) {
    const permitido = await maestroPuedeGestionarAlumno(
      userId,
      incidencia.alumnoId,
    );

    return permitido
      ? null
      : {
          status: 403,
          msg: "El alumno no pertenece a uno de tus grupos",
        };
  }

  if (role === ROLES.ALUMNO) {
    const perfil = await obtenerPerfilAlumno(userId);

    return perfil &&
      Number(perfil.id) === Number(incidencia.alumnoId)
      ? null
      : {
          status: 403,
          msg: "No puedes consultar incidencias de otro alumno",
        };
  }

  return {
    status: 403,
    msg: "No tienes permiso para consultar incidencias",
  };
};

const validarAlumnoParaStaff = async (alumnoId, role, userId) => {
  if (!alumnoId) {
    return { status: 400, msg: "El alumno es obligatorio" };
  }

  const alumno = await Alumnos.findByPk(alumnoId, {
    attributes: ["id"],
  });

  if (!alumno) {
    return { status: 404, msg: "Alumno no encontrado" };
  }

  if (
    role === ROLES.MAESTRO &&
    !(await maestroPuedeGestionarAlumno(userId, alumnoId))
  ) {
    return {
      status: 403,
      msg: "No puedes gestionar incidencias de alumnos ajenos a tus grupos",
    };
  }

  if (
    role !== ROLES.MAESTRO &&
    role !== ROLES.ADMINISTRADOR
  ) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar incidencias",
    };
  }

  return null;
};

export const getIncidencias = async (req, res) => {
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
      const alumnosIds = await obtenerAlumnoIdsDelMaestro(userId);
      where.alumnoId = { [Op.in]: alumnosIds };
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar incidencias",
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
          msg: "No puedes consultar incidencias de otro alumno",
        });
      }

      if (
        role === ROLES.MAESTRO &&
        !(await maestroPuedeGestionarAlumno(userId, alumnoId))
      ) {
        return res.status(403).json({
          msg: "El alumno no pertenece a uno de tus grupos",
        });
      }

      where.alumnoId = alumnoId;
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
      where.fecha = { [Op.between]: [desde, hasta] };
    } else if (desde) {
      where.fecha = { [Op.gte]: desde };
    } else if (hasta) {
      where.fecha = { [Op.lte]: hasta };
    }

    if (
      typeof req.query.tipo === "string" &&
      req.query.tipo.trim()
    ) {
      where.tipo = req.query.tipo.trim();
    }

    const lista = await Incidencia.findAll({
      where,
      attributes: atributos,
      include: [incluirAlumno],
      order: [
        ["fecha", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener incidencias:", error);
    return res.status(500).json({
      msg: "No fue posible obtener las incidencias",
    });
  }
};

export const getIncidenciasById = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(req.params.id);

    if (!incidencia) {
      return res.status(404).json({ msg: "Incidencia no encontrada" });
    }

    const errorAcceso = await validarAcceso(
      incidencia,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    return res.status(200).json(incidencia);
  } catch (error) {
    console.error("Error al obtener incidencia:", error);
    return res.status(500).json({
      msg: "No fue posible obtener la incidencia",
    });
  }
};

export const createIncidencias = async (req, res) => {
  try {
    const { tipo, descripcion } = req.body;
    const fecha = req.body.fecha || hoy();
    const alumnoId = enteroPositivo(req.body.alumnoId);

    if (typeof tipo !== "string" || !tipo.trim()) {
      return res.status(400).json({
        msg: "El tipo de incidencia es obligatorio",
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

    if (!esFechaValida(fecha)) {
      return res.status(400).json({ msg: "La fecha no es válida" });
    }

    const errorAlumno = await validarAlumnoParaStaff(
      alumnoId,
      req.role,
      req.userId,
    );

    if (errorAlumno) {
      return res
        .status(errorAlumno.status)
        .json({ msg: errorAlumno.msg });
    }

    const creada = await Incidencia.create({
      tipo: tipo.trim(),
      descripcion: descripcion.trim(),
      fecha,
      alumnoId,
    });
    const incidencia = await buscarIncidencia(creada.uuid);

    return res.status(201).json({
      msg: "Incidencia creada correctamente",
      incidencia,
    });
  } catch (error) {
    console.error("Error al crear incidencia:", error);
    return res.status(500).json({
      msg: "No fue posible crear la incidencia",
    });
  }
};

export const updateIncidencias = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(req.params.id);

    if (!incidencia) {
      return res.status(404).json({ msg: "Incidencia no encontrada" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para actualizar incidencias",
      });
    }

    const errorAcceso = await validarAcceso(
      incidencia,
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

    if (req.body.tipo !== undefined) {
      if (
        typeof req.body.tipo !== "string" ||
        !req.body.tipo.trim()
      ) {
        return res.status(400).json({
          msg: "El tipo de incidencia es obligatorio",
        });
      }
      updateData.tipo = req.body.tipo.trim();
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

    if (req.body.fecha !== undefined) {
      if (!esFechaValida(req.body.fecha)) {
        return res.status(400).json({ msg: "La fecha no es válida" });
      }
      updateData.fecha = req.body.fecha;
    }

    if (req.body.alumnoId !== undefined) {
      const alumnoId = enteroPositivo(req.body.alumnoId);
      const errorAlumno = await validarAlumnoParaStaff(
        alumnoId,
        req.role,
        req.userId,
      );

      if (errorAlumno) {
        return res
          .status(errorAlumno.status)
          .json({ msg: errorAlumno.msg });
      }
      updateData.alumnoId = alumnoId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron campos válidos para actualizar",
      });
    }

    await incidencia.update(updateData);
    const actualizada = await buscarIncidencia(incidencia.uuid);

    return res.status(200).json({
      msg: "Incidencia actualizada correctamente",
      incidencia: actualizada,
    });
  } catch (error) {
    console.error("Error al actualizar incidencia:", error);
    return res.status(500).json({
      msg: "No fue posible actualizar la incidencia",
    });
  }
};

export const deleteIncidencias = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(req.params.id);

    if (!incidencia) {
      return res.status(404).json({ msg: "Incidencia no encontrada" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para eliminar incidencias",
      });
    }

    const errorAcceso = await validarAcceso(
      incidencia,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    await incidencia.destroy();

    return res.status(200).json({
      msg: "Incidencia eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar incidencia:", error);
    return res.status(500).json({
      msg: "No fue posible eliminar la incidencia",
    });
  }
};
