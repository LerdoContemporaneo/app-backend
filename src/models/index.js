import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";

Users.hasOne(Alumnos, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Alumnos.belongsTo(Users, {
  foreignKey: "userId",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Users.hasMany(Grados, {
  foreignKey: "maestroId",
  as: "grados",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Grados.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Alumnos.belongsToMany(Grados, {
  through: {
    model: "alumnos_grados",
    timestamps: false,
  },
  foreignKey: "alumnoId",
  otherKey: "gradoId",
  as: "grados",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
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
  onUpdate: "CASCADE",
});

Users.hasMany(AsistenciaMaestro, {
  foreignKey: "maestroId",
  as: "asistenciasMaestro",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

AsistenciaMaestro.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Alumnos.hasMany(Asistencia, {
  foreignKey: "alumnoId",
  as: "asistencias",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Asistencia.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Grados.hasMany(Asistencia, {
  foreignKey: "gradoId",
  as: "asistencias",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Asistencia.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Alumnos.hasMany(Incidencia, {
  foreignKey: "alumnoId",
  as: "incidencias",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Incidencia.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Alumnos.hasMany(Reportes, {
  foreignKey: "alumnoId",
  as: "reportes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Incidencia.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
});

Grados.hasMany(Incidencia, {
  foreignKey: "gradoId",
  as: "incidencias",
});

Incidencia.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
});

Users.hasMany(Incidencia, {
  foreignKey: "maestroId",
  as: "incidenciasCreadas",
});

Reportes.belongsTo(Alumnos, {
  foreignKey: "alumnoId",
  as: "alumno",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// maestroId es obligatorio en ReportesModel, por eso se usa RESTRICT
// en lugar de SET NULL.
Users.hasMany(Reportes, {
  foreignKey: "maestroId",
  as: "reportes",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Reportes.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Grados.hasMany(Reportes, {
  foreignKey: "gradoId",
  as: "reportes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Reportes.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Grados.hasMany(Tareas, {
  foreignKey: "gradoId",
  as: "tareas",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Tareas.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
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
