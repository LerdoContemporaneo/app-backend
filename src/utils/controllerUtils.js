import { Op } from "sequelize";
import {
  Alumnos,
  Grados,
} from "../models/index.js";

export const ROLES = Object.freeze({
  ADMINISTRADOR: "administrador",
  MAESTRO: "maestro",
  ALUMNO: "alumno",
});

export const ESTADOS_ASISTENCIA = Object.freeze([
  "Presente",
  "Ausente",
  "Tarde",
  "Justificado",
]);

export const hoy = () => new Date().toISOString().slice(0, 10);

export const esFechaValida = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const fecha = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === value
  );
};

export const enteroPositivo = (value) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const normalizarIds = (singleValue, multipleValues) => {
  const source =
    multipleValues !== undefined
      ? Array.isArray(multipleValues)
        ? multipleValues
        : [multipleValues]
      : singleValue !== undefined
        ? [singleValue]
        : [];

  const ids = source.map(enteroPositivo);

  if (ids.length === 0 || ids.some((id) => id === null)) {
    return null;
  }

  return [...new Set(ids)];
};

export const whereIdentificador = (value) => {
  const id = enteroPositivo(value);

  return id
    ? {
        [Op.or]: [{ id }, { uuid: String(value) }],
      }
    : {
        uuid: String(value),
      };
};

export const obtenerPerfilAlumno = async (
  userId,
  { transaction } = {},
) =>
  Alumnos.findOne({
    where: { userId },
    attributes: ["id", "uuid", "userId"],
    transaction,
  });

export const obtenerGradosIdsDelMaestro = async (
  maestroId,
  { transaction } = {},
) => {
  const grados = await Grados.findAll({
    where: { maestroId },
    attributes: ["id"],
    transaction,
  });

  return grados.map((grado) => Number(grado.id));
};

export const obtenerAlumnoIdsDelMaestro = async (
  maestroId,
  { transaction } = {},
) => {
  const alumnos = await Alumnos.findAll({
    attributes: ["id"],
    include: [
      {
        model: Grados,
        as: "grados",
        attributes: [],
        where: { maestroId },
        through: { attributes: [] },
        required: true,
      },
    ],
    transaction,
  });

  return [...new Set(alumnos.map((alumno) => Number(alumno.id)))];
};

export const maestroPuedeGestionarAlumno = async (
  maestroId,
  alumnoId,
  { transaction } = {},
) => {
  const alumno = await Alumnos.findOne({
    where: { id: alumnoId },
    attributes: ["id"],
    include: [
      {
        model: Grados,
        as: "grados",
        attributes: [],
        where: { maestroId },
        through: { attributes: [] },
        required: true,
      },
    ],
    transaction,
  });

  return Boolean(alumno);
};

export const alumnoPerteneceAlGrado = async (
  alumnoId,
  gradoId,
  { transaction } = {},
) => {
  const alumno = await Alumnos.findOne({
    where: { id: alumnoId },
    attributes: ["id"],
    include: [
      {
        model: Grados,
        as: "grados",
        attributes: [],
        where: { id: gradoId },
        through: { attributes: [] },
        required: true,
      },
    ],
    transaction,
  });

  return Boolean(alumno);
};

export const usuarioAlumnoPerteneceAlGrado = async (
  userId,
  gradoId,
  { transaction } = {},
) => {
  const alumno = await obtenerPerfilAlumno(userId, { transaction });

  if (!alumno) {
    return false;
  }

  return alumnoPerteneceAlGrado(alumno.id, gradoId, { transaction });
};

export const esErrorUnico = (error) =>
  error?.name === "SequelizeUniqueConstraintError";

export const esErrorRelacion = (error) =>
  [
    "SequelizeForeignKeyConstraintError",
    "SequelizeDatabaseError",
  ].includes(error?.name);
