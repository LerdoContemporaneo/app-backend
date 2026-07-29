import { Op } from "sequelize";
import {
  Alumnos,
  Asistencia,
  Grados,
} from "../models/index.js";
import {
  ESTADOS_ASISTENCIA,
  ROLES,
  alumnoPerteneceAlGrado,
  enteroPositivo,
  esErrorUnico,
  esFechaValida,
  hoy,
  obtenerGradosIdsDelMaestro,
  obtenerPerfilAlumno,
  whereIdentificador,
} from "../utils/controllerUtils.js";

const atributos = [
  "id",
  "uuid",
  "fecha",
  "estado",
  "alumnoId",
  "gradoId",
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
      "tutor",
      "telefonoTutor",
    ],
  },
  {
    model: Grados,
    as: "grado",
    attributes: ["id", "uuid", "nombre", "maestroId"],
  },
];

const buscarRegistro = (identificador) =>
  Asistencia.findOne({
    where: whereIdentificador(identificador),
    attributes: atributos,
    include: includes,
  });

const validarAccesoRegistro = async (registro, role, userId) => {
  if (role === ROLES.ADMINISTRADOR) {
    return null;
  }

  if (role === ROLES.MAESTRO) {
    if (
      Number(registro.grado?.maestroId) !== Number(userId)
    ) {
      return {
        status: 403,
        msg: "La asistencia pertenece a un grupo de otro maestro",
      };
    }
    return null;
  }

  if (role === ROLES.ALUMNO) {
    const perfil = await obtenerPerfilAlumno(userId);

    if (!perfil || Number(perfil.id) !== Number(registro.alumnoId)) {
      return {
        status: 403,
        msg: "No puedes consultar la asistencia de otro alumno",
      };
    }
    return null;
  }

  return {
    status: 403,
    msg: "No tienes permiso para consultar asistencias",
  };
};

const validarDatos = async ({
  fecha,
  estado,
  alumnoId,
  gradoId,
  role,
  userId,
}) => {
  if (!esFechaValida(fecha)) {
    return { status: 400, msg: "La fecha no es válida" };
  }

  if (!ESTADOS_ASISTENCIA.includes(estado)) {
    return {
      status: 400,
      msg: `Estado inválido. Usa: ${ESTADOS_ASISTENCIA.join(", ")}`,
    };
  }

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

  if (
    role === ROLES.MAESTRO &&
    Number(grado.maestroId) !== Number(userId)
  ) {
    return {
      status: 403,
      msg: "No puedes registrar asistencia en grupos de otro maestro",
    };
  }

  if (
    role !== ROLES.MAESTRO &&
    role !== ROLES.ADMINISTRADOR
  ) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar asistencias",
    };
  }

  if (!(await alumnoPerteneceAlGrado(alumnoId, gradoId))) {
    return {
      status: 400,
      msg: "El alumno no está inscrito en el grupo seleccionado",
    };
  }

  return null;
};

export const getAsistencia = async (req, res) => {
  try {
    const { role, userId } = req;
    const where = {};

    if (req.query.fecha !== undefined) {
      if (!esFechaValida(req.query.fecha)) {
        return res.status(400).json({ msg: "La fecha no es válida" });
      }
      where.fecha = req.query.fecha;
    }

    const alumnoIdFiltro =
      req.query.alumnoId !== undefined
        ? enteroPositivo(req.query.alumnoId)
        : null;
    const gradoIdFiltro =
      req.query.gradoId !== undefined
        ? enteroPositivo(req.query.gradoId)
        : null;

    if (
      req.query.alumnoId !== undefined &&
      !alumnoIdFiltro
    ) {
      return res.status(400).json({ msg: "El alumnoId no es válido" });
    }

    if (req.query.gradoId !== undefined && !gradoIdFiltro) {
      return res.status(400).json({ msg: "El gradoId no es válido" });
    }

    if (role === ROLES.ALUMNO) {
      const perfil = await obtenerPerfilAlumno(userId);

      if (!perfil) {
        return res.status(404).json({
          msg: "Perfil de alumno no encontrado",
        });
      }

      where.alumnoId = perfil.id;
      if (gradoIdFiltro) where.gradoId = gradoIdFiltro;
    } else if (role === ROLES.MAESTRO) {
      const gradosIds = await obtenerGradosIdsDelMaestro(userId);

      if (
        gradoIdFiltro &&
        !gradosIds.includes(gradoIdFiltro)
      ) {
        return res.status(403).json({
          msg: "No puedes consultar la asistencia de ese grupo",
        });
      }

      where.gradoId = gradoIdFiltro ?? { [Op.in]: gradosIds };
      if (alumnoIdFiltro) where.alumnoId = alumnoIdFiltro;
    } else if (role === ROLES.ADMINISTRADOR) {
      if (alumnoIdFiltro) where.alumnoId = alumnoIdFiltro;
      if (gradoIdFiltro) where.gradoId = gradoIdFiltro;
    } else {
      return res.status(403).json({
        msg: "No tienes permiso para consultar asistencias",
      });
    }

    const lista = await Asistencia.findAll({
      where,
      attributes: atributos,
      include: includes,
      order: [
        ["fecha", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener asistencias:", error);
    return res.status(500).json({
      msg: "No fue posible obtener las asistencias",
    });
  }
};

export const getAsistenciaById = async (req, res) => {
  try {
    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    const errorAcceso = await validarAccesoRegistro(
      registro,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    return res.status(200).json(registro);
  } catch (error) {
    console.error("Error al obtener asistencia:", error);
    return res.status(500).json({
      msg: "No fue posible obtener la asistencia",
    });
  }
};

export const createAsistencia = async (req, res) => {
  try {
    const fecha = req.body.fecha || hoy();
    const estado = req.body.estado || "Presente";
    const alumnoId = enteroPositivo(req.body.alumnoId);
    const gradoId = enteroPositivo(req.body.gradoId);

    const errorDatos = await validarDatos({
      fecha,
      estado,
      alumnoId,
      gradoId,
      role: req.role,
      userId: req.userId,
    });

    if (errorDatos) {
      return res
        .status(errorDatos.status)
        .json({ msg: errorDatos.msg });
    }

    const existente = await Asistencia.findOne({
      where: { alumnoId, gradoId, fecha },
      attributes: ["id"],
    });

    if (existente) {
      return res.status(409).json({
        msg: "Ya existe asistencia para ese alumno, grupo y fecha",
      });
    }

    const creado = await Asistencia.create({
      fecha,
      estado,
      alumnoId,
      gradoId,
    });

    const registro = await buscarRegistro(creado.uuid);

    return res.status(201).json({
      msg: "Asistencia creada correctamente",
      asistencia: registro,
    });
  } catch (error) {
    console.error("Error al crear asistencia:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe asistencia para ese alumno, grupo y fecha",
      });
    }

    return res.status(500).json({
      msg: "No fue posible crear la asistencia",
    });
  }
};

export const updateAsistencia = async (req, res) => {
  try {
    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para actualizar asistencias",
      });
    }

    const errorAcceso = await validarAccesoRegistro(
      registro,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    const fecha = req.body.fecha ?? registro.fecha;
    const estado = req.body.estado ?? registro.estado;
    const alumnoId =
      req.body.alumnoId !== undefined
        ? enteroPositivo(req.body.alumnoId)
        : Number(registro.alumnoId);
    const gradoId =
      req.body.gradoId !== undefined
        ? enteroPositivo(req.body.gradoId)
        : Number(registro.gradoId);

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    const errorDatos = await validarDatos({
      fecha,
      estado,
      alumnoId,
      gradoId,
      role: req.role,
      userId: req.userId,
    });

    if (errorDatos) {
      return res
        .status(errorDatos.status)
        .json({ msg: errorDatos.msg });
    }

    const duplicado = await Asistencia.findOne({
      where: {
        alumnoId,
        gradoId,
        fecha,
        id: { [Op.ne]: registro.id },
      },
      attributes: ["id"],
    });

    if (duplicado) {
      return res.status(409).json({
        msg: "Ya existe asistencia para ese alumno, grupo y fecha",
      });
    }

    await registro.update({ fecha, estado, alumnoId, gradoId });
    const actualizado = await buscarRegistro(registro.uuid);

    return res.status(200).json({
      msg: "Asistencia actualizada correctamente",
      asistencia: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar asistencia:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe asistencia para ese alumno, grupo y fecha",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar la asistencia",
    });
  }
};

export const deleteAsistencia = async (req, res) => {
  try {
    const registro = await buscarRegistro(req.params.id);

    if (!registro) {
      return res.status(404).json({ msg: "Registro no encontrado" });
    }

    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para eliminar asistencias",
      });
    }

    const errorAcceso = await validarAccesoRegistro(
      registro,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({ msg: errorAcceso.msg });
    }

    await registro.destroy();

    return res.status(200).json({
      msg: "Asistencia eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar asistencia:", error);
    return res.status(500).json({
      msg: "No fue posible eliminar la asistencia",
    });
  }
};
