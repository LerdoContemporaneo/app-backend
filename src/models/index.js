import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";
// import Materias from "./MateriasModel.js";

// --- 1. Relación Usuario (Login) ↔ Perfil Alumno ---
Users.hasOne(Alumnos, { foreignKey: "userId" });
// CORRECCIÓN: onDelete: 'CASCADE' para que coincida con allowNull: false
Alumnos.belongsTo(Users, { foreignKey: "userId", onDelete: 'CASCADE' });

// --- 2. Relación Usuario (Maestro) ↔ Grados ---
Users.hasMany(Grados, { foreignKey: "maestroId" });
// Aquí 'SET NULL' está bien porque un grado puede quedarse sin maestro temporalmente
Grados.belongsTo(Users, { foreignKey: "maestroId", as: "maestro", onDelete: 'SET NULL' });

// --- 3. Grados ↔ Alumnos ---
Grados.hasMany(Alumnos, { foreignKey: "gradoId" });
// CORRECCIÓN: onDelete: 'CASCADE' o 'RESTRICT'. Usaremos CASCADE para evitar el error 150.
Alumnos.belongsTo(Grados, { foreignKey: "gradoId", onDelete: 'CASCADE' });

// --- 4. Maestros ↔ AsistenciaMaestro ---
Users.hasMany(AsistenciaMaestro, { foreignKey: "maestroId" });
AsistenciaMaestro.belongsTo(Users, { foreignKey: "maestroId", as:"maestro", onDelete: 'CASCADE' });

// --- 5. Alumnos ↔ Tablas de Datos ---
// Si borras un alumno, se borran sus datos (CASCADE es lo normal aquí)
Alumnos.hasMany(Asistencia, { foreignKey: "alumnoId" });
Asistencia.belongsTo(Alumnos, { foreignKey: "alumnoId", as:"alumno", onDelete: 'CASCADE' });

Grados.hasMany(Asistencia, { foreignKey: "gradoId" });
Asistencia.belongsTo(Grados, { 
    foreignKey: "gradoId", 
    as: "grado",
    onDelete: 'SET NULL' 
});

Alumnos.hasMany(Incidencia, { foreignKey: "alumnoId" });
Incidencia.belongsTo(Alumnos, { foreignKey: "alumnoId", as:"alumno", onDelete: 'CASCADE' });

Alumnos.hasMany(Reportes, { foreignKey: "alumnoId" });
Reportes.belongsTo(Alumnos, { foreignKey: "alumnoId", as: "alumno", onDelete: 'CASCADE' });

Users.hasMany(Reportes, { foreignKey: "maestroId" });
Reportes.belongsTo(Users, { foreignKey: "maestroId", as:"maestro", onDelete: 'SET NULL' });

Grados.hasMany(Reportes, { foreignKey: "gradoId" });
Reportes.belongsTo(Grados, { foreignKey: "gradoId", as:"grado", onDelete: 'SET NULL' });

Alumnos.hasMany(Tareas, { foreignKey: "alumnoId" });
Tareas.belongsTo(Alumnos, { foreignKey: "alumnoId", onDelete: 'CASCADE' });

// Alumnos.hasMany(Materias, { foreignKey: "alumnoId" });
// Materias.belongsTo(Alumnos, { foreignKey: "alumnoId", onDelete: 'CASCADE' });

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