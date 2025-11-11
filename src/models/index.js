// src/models/index.js
import db from "../config/db.js";


import Users from "./UsersModel.js";
import Grados from "./GradosModel.js";
import Alumnos from "./AlumnosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";


function applyAssociations() {
  // GRADOS ⇄ USERS (un maestro por grado)
  Users.hasMany(Grados, { as: "gradosQueImparte", foreignKey: "maestroId" });
  Grados.belongsTo(Users, { as: "maestro", foreignKey: "maestroId" });

  // GRADOS ⇄ ALUMNOS (un grado tiene muchos alumnos / un alumno pertenece a un grado)
  Grados.hasMany(Alumnos, { as: "alumnos", foreignKey: "gradoId" });
  Alumnos.belongsTo(Grados, { as: "grado", foreignKey: "gradoId" });

  // ASISTENCIA (ALUMNOS) ⇄ ALUMNOS / GRADOS
  Alumnos.hasMany(Asistencia, { as: "asistencias", foreignKey: "alumnoId" });
  Asistencia.belongsTo(Alumnos, { as: "alumno", foreignKey: "alumnoId" });

  Grados.hasMany(Asistencia, { as: "asistenciasAlumnos", foreignKey: "gradoId" });
  Asistencia.belongsTo(Grados, { as: "grado", foreignKey: "gradoId" });

  // ASISTENCIA (MAESTRO) ⇄ USERS
  Users.hasMany(AsistenciaMaestro, { as: "asistenciasMaestro", foreignKey: "maestroId" });
  AsistenciaMaestro.belongsTo(Users, { as: "maestro", foreignKey: "maestroId" });

  // INCIDENCIAS ⇄ ALUMNOS / USERS (opcional: quién la creó)
  Alumnos.hasMany(Incidencia, { as: "incidencias", foreignKey: "alumnoId" });
  Incidencia.belongsTo(Alumnos, { as: "alumno", foreignKey: "alumnoId" });

  Users.hasMany(Incidencia, { as: "incidenciasCreadas", foreignKey: "creadoPorId" });
  Incidencia.belongsTo(Users, { as: "creadoPor", foreignKey: "creadoPorId" });

  // REPORTES ⇄ ALUMNOS / USERS / GRADOS
  Alumnos.hasMany(Reportes, { as: "reportes", foreignKey: "alumnoId" });
  Reportes.belongsTo(Alumnos, { as: "alumno", foreignKey: "alumnoId" });

  Users.hasMany(Reportes, { as: "reportesComoMaestro", foreignKey: "maestroId" });
  Reportes.belongsTo(Users, { as: "maestro", foreignKey: "maestroId" });

  Grados.hasMany(Reportes, { as: "reportesDelGrado", foreignKey: "gradoId" });
  Reportes.belongsTo(Grados, { as: "grado", foreignKey: "gradoId" });
}

/**
 * Sincroniza la base (en desarrollo). En producción usa migraciones.
 * @param {{force?: boolean, alter?: boolean}} options
 */
export async function syncDB(options = { force: false, alter: false }) {
  applyAssociations();
  await db.sync(options);
  // console.log("✅ DB sincronizada");
}

// Exporta la conexión y todos los modelos para usarlos en controladores/servicios
export {
  db,
  Users,
  Grados,
  Alumnos,
  Asistencia,
  AsistenciaMaestro,
  Incidencia,
  Reportes,
};
