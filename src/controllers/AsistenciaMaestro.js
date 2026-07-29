import { Op } from "sequelize";
import {
  AsistenciaMaestro,
  Users,
} from "../models/index.js";
import {
  ESTADOS_ASISTENCIA,
  ROLES,
  enteroPositivo,
  esErrorUnico,
  esFechaValida,
  hoy,
  whereIdentificador,
} from "../utils/controllerUtils.js";

const atributos = [
  "id",
  "uuid",
  "fecha",
  "estado",
  "maestroId",
];

const incluirMaestro = {
  model: Users,
  as: "maestro",
  attributes: ["id", "uuid", "name", "email", "role"],
};

const buscarRegistro = (identificador) =>
  AsistenciaMaestro.findOne({
    where: whereIdentificador(identificador),
    attributes: atributos,
    include: [incluirMaestro],
  });

const soloAdministrador = (req, res) => {
  if (req.role !== ROLES.ADMINISTRADOR) {
    res.status(403).json({
      msg: "Solo un administrador puede gestionar la asistencia de maestros",
    });
    return false;
  }

  return true;
};

const validarDatos = async ({ fecha, estado, maestroId }) => {
  if (!esFechaValida(fecha)) {
    return { status: 400, msg: "La fecha no es válida" };
  }

  if (!ESTADOS_ASISTENCIA.includes(estado)) {
    return {
      status: 400,
      msg: `Estado inválido. Usa: ${ESTADOS_ASISTENCIA.join(", ")}`,
    };
  }

  if (!maestroId) {
    return { status: 400, msg: "El maestro es obligatorio" };
  }

  const maestro = await Users.findOne({
    where: { id: maestroId, role: ROLES.MAESTRO },
    attributes: ["id"],
  });

  if (!maestro) {
    return {
      status: 400,
      msg: "El usuario seleccionado no existe o no tiene rol de maestro",
    };
  }

  return null;
};

export const getAsistenciaMaestro = async (req, res) => {
  try {
    if (!soloAdministrador(req, res)) return;

    const where = {};

    if (req.query.fecha !== undefined) {
      if (!esFechaValida(req.query.fecha)) {
        return res.status(400).json({ msg: "La fecha no es válida" });
      }
      where.fecha = req.query.fecha;
    }

    if (req.query.maestroId !== undefined) {
      const maestroId = enteroPositivo(req.query.maestroId);

      if (!maestroId) {
        return res.status(400).json({
          msg: "El maestroId no es válido",
        });
      }
      where.maestroId = maestroId;
    }

    const lista = await AsistenciaMaestro.findAll({
      where,
      attributes: atributos,
      include: [incluirMaestro],
      order: [
        ["fecha", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener asistencia de maestros:", error);
    return res.status(500).json({
      msg: "No fue posible obtener la asistencia de maestros",
    });
  }
};

export const getAsistenciaMaestroById = async (req, res) => {
  try {
    if (!soloAdministrador(req, res)) return;

    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    return res.status(200).json(registro);
  } catch (error) {
    console.error("Error al obtener asistencia de maestro:", error);
    return res.status(500).json({
      msg: "No fue posible obtener la asistencia del maestro",
    });
  }
};

export const createAsistenciaMaestro = async (req, res) => {
  try {
    if (!soloAdministrador(req, res)) return;

    const fecha = req.body.fecha || hoy();
    const estado = req.body.estado || "Presente";
    const maestroId = enteroPositivo(req.body.maestroId);
    const errorDatos = await validarDatos({
      fecha,
      estado,
      maestroId,
    });

    if (errorDatos) {
      return res
        .status(errorDatos.status)
        .json({ msg: errorDatos.msg });
    }

    const existente = await AsistenciaMaestro.findOne({
      where: { fecha, maestroId },
      attributes: ["id"],
    });

    if (existente) {
      return res.status(409).json({
        msg: "Ya existe asistencia de ese maestro en esa fecha",
      });
    }

    const creado = await AsistenciaMaestro.create({
      fecha,
      estado,
      maestroId,
    });
    const registro = await buscarRegistro(creado.uuid);

    return res.status(201).json({
      msg: "Asistencia de maestro creada correctamente",
      asistencia: registro,
    });
  } catch (error) {
    console.error("Error al crear asistencia de maestro:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe asistencia de ese maestro en esa fecha",
      });
    }

    return res.status(500).json({
      msg: "No fue posible crear la asistencia del maestro",
    });
  }
};

export const updateAsistenciaMaestro = async (req, res) => {
  try {
    if (!soloAdministrador(req, res)) return;

    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    const fecha = req.body.fecha ?? registro.fecha;
    const estado = req.body.estado ?? registro.estado;
    const maestroId =
      req.body.maestroId !== undefined
        ? enteroPositivo(req.body.maestroId)
        : Number(registro.maestroId);

    const errorDatos = await validarDatos({
      fecha,
      estado,
      maestroId,
    });

    if (errorDatos) {
      return res
        .status(errorDatos.status)
        .json({ msg: errorDatos.msg });
    }

    const duplicado = await AsistenciaMaestro.findOne({
      where: {
        fecha,
        maestroId,
        id: { [Op.ne]: registro.id },
      },
      attributes: ["id"],
    });

    if (duplicado) {
      return res.status(409).json({
        msg: "Ya existe asistencia de ese maestro en esa fecha",
      });
    }

    await registro.update({ fecha, estado, maestroId });
    const actualizado = await buscarRegistro(registro.uuid);

    return res.status(200).json({
      msg: "Asistencia de maestro actualizada correctamente",
      asistencia: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar asistencia de maestro:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe asistencia de ese maestro en esa fecha",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar la asistencia del maestro",
    });
  }
};

export const deleteAsistenciaMaestro = async (req, res) => {
  try {
    if (!soloAdministrador(req, res)) return;

    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    await registro.destroy();

    return res.status(200).json({
      msg: "Asistencia de maestro eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar asistencia de maestro:", error);
    return res.status(500).json({
      msg: "No fue posible eliminar la asistencia del maestro",
    });
  }
};
