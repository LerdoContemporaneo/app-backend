import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";

// --- 1. Relación Usuario (Login) ↔ Perfil Alumno ---
// Un User puede tener un perfil de Alumno (si su rol es alumno)
Users.hasOne(Alumnos, { foreignKey: "userId" });
Alumnos.belongsTo(Users, { foreignKey: "userId" });

// --- 2. Relación Usuario (Maestro) ↔ Grados ---
// Un Maestro (User) tiene muchos grados a cargo
Users.hasMany(Grados, { foreignKey: "maestroId" });
Grados.belongsTo(Users, { foreignKey: "maestroId", as: "maestro" });

// --- 3. Grados ↔ Alumnos ---
Grados.hasMany(Alumnos, { foreignKey: "gradoId" });
Alumnos.belongsTo(Grados, { foreignKey: "gradoId" });

// --- 4. Maestros ↔ AsistenciaMaestro ---
Users.hasMany(AsistenciaMaestro, { foreignKey: "maestroId" });
AsistenciaMaestro.belongsTo(Users, { foreignKey: "maestroId" });

// --- 5. Alumnos ↔ Tablas relacionadas (Data) ---
// Asistencia
Alumnos.hasMany(Asistencia, { foreignKey: "alumnoId" });
Asistencia.belongsTo(Alumnos, { foreignKey: "alumnoId" });

// Incidencias
Alumnos.hasMany(Incidencia, { foreignKey: "alumnoId" });
Incidencia.belongsTo(Alumnos, { foreignKey: "alumnoId" });

// Reportes
Alumnos.hasMany(Reportes, { foreignKey: "alumnoId" });
Reportes.belongsTo(Alumnos, { foreignKey: "alumnoId" });

// Tareas
Alumnos.hasMany(Tareas, { foreignKey: "alumnoId" });
Tareas.belongsTo(Alumnos, { foreignKey: "alumnoId" });

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