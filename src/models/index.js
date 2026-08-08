import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";
import NivelEducativo from "./NivelEducativoModel.js";
import UsuarioNivel from "./UsuarioNivelModel.js";

Users.belongsToMany(NivelEducativo, {
  through: UsuarioNivel,
  foreignKey: "userId",
  otherKey: "nivelId",
  as: "niveles",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

NivelEducativo.belongsToMany(Users, {
  through: UsuarioNivel,
  foreignKey: "nivelId",
  otherKey: "userId",
  as: "usuarios",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

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
  through: "alumnos_grados",
  foreignKey: "alumnoId",
  otherKey: "gradoId",
  as: "grados",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Grados.belongsToMany(Alumnos, {
  through: "alumnos_grados",
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

Grados.hasMany(AsistenciaMaestro, {
  foreignKey: "gradoId",
  as: "asistenciasMaestro",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

AsistenciaMaestro.belongsTo(Grados, {
  foreignKey: "gradoId",
  as: "grado",
  onDelete: "SET NULL",
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
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Grados.hasMany(Incidencia, {
  foreignKey: "gradoId",
  as: "incidencias",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Incidencia.belongsTo(Users, {
  foreignKey: "maestroId",
  as: "maestro",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Users.hasMany(Incidencia, {
  foreignKey: "maestroId",
  as: "incidenciasCreadas",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
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
  NivelEducativo,
  UsuarioNivel,
};

export default db;