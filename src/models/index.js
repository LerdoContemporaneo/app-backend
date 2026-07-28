import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";

// ======================================================
// 1. USUARIO ↔ PERFIL DE ALUMNO
// ======================================================

Users.hasOne(Alumnos, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

Alumnos.belongsTo(Users, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});

// ======================================================
// 2. MAESTRO ↔ GRADOS
// ======================================================

Users.hasMany(Grados, {
  foreignKey: "maestroId",
  as: "grados",
  onDelete: "SET NULL",
});

Grados.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "SET NULL",
});

// ======================================================
// 3. ALUMNOS ↔ GRADOS
// Relación muchos-a-muchos
// ======================================================

Alumnos.belongsToMany(Grados, {
  through: {
    model: "alumnos_grados",
    timestamps: false,
  },
  foreignKey: "alumnoId",
  otherKey: "gradoId",
  as: "grados",
  onDelete: "CASCADE",
});

Grados.belongsToMany(Alumnos, {
  through: {
    model: "alumnos_grados",
    timestamps: false,
  },
  foreignKey: "gradoId",
  otherKey: "alumnoId",
  as: "alumnos",
  onDelete: "CASCADE",
});

// ======================================================
// 4. MAESTROS ↔ ASISTENCIA DE MAESTROS
// ======================================================

Users.hasMany(AsistenciaMaestro, {
  foreignKey: "maestroId",
  as: "asistenciasMaestro",
  onDelete: "CASCADE",
});

AsistenciaMaestro.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "CASCADE",
});

// ======================================================
// 5. ALUMNOS ↔ ASISTENCIAS
// ======================================================

Alumnos.hasMany(Asistencia, {
  foreignKey: "alumnoId",
  as: "asistencias",
  onDelete: "CASCADE",
});

Asistencia.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
});

// ======================================================
// 6. GRADOS ↔ ASISTENCIAS
// ======================================================

Grados.hasMany(Asistencia, {
  foreignKey: "gradoId",
  as: "asistencias",
  onDelete: "SET NULL",
});

Asistencia.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "SET NULL",
});

// ======================================================
// 7. ALUMNOS ↔ INCIDENCIAS
// ======================================================

Alumnos.hasMany(Incidencia, {
  foreignKey: "alumnoId",
  as: "incidencias",
  onDelete: "CASCADE",
});

Incidencia.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
});

// ======================================================
// 8. REPORTES
// ======================================================

Alumnos.hasMany(Reportes, {
  foreignKey: "alumnoId",
  as: "reportes",
  onDelete: "CASCADE",
});

Reportes.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
});

Users.hasMany(Reportes, {
  foreignKey: "maestroId",
  as: "reportes",
  onDelete: "SET NULL",
});

Reportes.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "SET NULL",
});

Grados.hasMany(Reportes, {
  foreignKey: "gradoId",
  as: "reportes",
  onDelete: "SET NULL",
});

Reportes.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "SET NULL",
});

// ======================================================
// 9. ALUMNOS ↔ TAREAS INDIVIDUALES
// ======================================================

Alumnos.hasMany(Tareas, {
  foreignKey: "alumnoId",
  as: "tareas",
  onDelete: "CASCADE",
});

Tareas.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
});

export {
  Users,
  Alumnos,
  Grados,
  Asistencia,
  AsistenciaMaestro,
  Incidencia,
  Reportes,
  Tareas,
};

export default db;