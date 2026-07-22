import db from "../config/db.js";

import Users from "./UsersModel.js";
import Alumnos from "./AlumnosModel.js";
import Grados from "./GradosModel.js";
import Asistencia from "./AsistenciaModel.js";
import AsistenciaMaestro from "./AsistenciaMaestroModel.js";
import Incidencia from "./IncidenciaModel.js";
import Reportes from "./ReportesModel.js";
import Tareas from "./TareasModel.js";
import Materias from "./MateriasModel.js";

// ==========================================
// 1. IDENTIDAD Y PERFILES
// ==========================================

// Usuario (Login Alumno) ↔ Perfil Alumno
Users.hasOne(Alumnos, { foreignKey: "userId" });
Alumnos.belongsTo(Users, { foreignKey: "userId", onDelete: 'CASCADE' });

// Usuario (Tutor/Papá) ↔ Alumnos (Hijos) 🆕
Users.hasMany(Alumnos, { foreignKey: "tutorId", as: "hijos" });
Alumnos.belongsTo(Users, { foreignKey: "tutorId", as: "tutor", onDelete: 'SET NULL' });


// ==========================================
// 2. ESTRUCTURA ACADÉMICA (Desvinculamos Grados de Maestros)
// ==========================================

// Grados ↔ Alumnos (Los alumnos pertenecen a un grado)
Grados.hasMany(Alumnos, { foreignKey: "gradoId" });
Alumnos.belongsTo(Grados, { foreignKey: "gradoId", onDelete: 'CASCADE' });

// Grados ↔ Materias 🆕 (Un grado tiene varias materias, ej: 1ro tiene Mate, Español)
Grados.hasMany(Materias, { foreignKey: "gradoId" });
Materias.belongsTo(Grados, { foreignKey: "gradoId", onDelete: 'CASCADE' });

// Maestro ↔ Materias 🆕 (Un maestro imparte varias materias)
Users.hasMany(Materias, { foreignKey: "maestroId", as: "clasesAsignadas" });
Materias.belongsTo(Users, { foreignKey: "maestroId", as: "maestro", onDelete: 'SET NULL' });


// ==========================================
// 3. OPERACIONES Y REGISTROS
// ==========================================

// Maestros ↔ AsistenciaMaestro
Users.hasMany(AsistenciaMaestro, { foreignKey: "maestroId" });
AsistenciaMaestro.belongsTo(Users, { foreignKey: "maestroId", as: "maestro", onDelete: 'CASCADE' });

// Alumnos ↔ Asistencia (Registro del alumno)
Alumnos.hasMany(Asistencia, { foreignKey: "alumnoId" });
Asistencia.belongsTo(Alumnos, { foreignKey: "alumnoId", as: "alumno", onDelete: 'CASCADE' });

// Materias ↔ Asistencia 🆕 (Para saber exactamente de qué clase faltó)
Materias.hasMany(Asistencia, { foreignKey: "materiaId" });
Asistencia.belongsTo(Materias, { foreignKey: "materiaId", as: "materia", onDelete: 'SET NULL' });

// Alumnos ↔ Incidencia
Alumnos.hasMany(Incidencia, { foreignKey: "alumnoId" });
Incidencia.belongsTo(Alumnos, { foreignKey: "alumnoId", as: "alumno", onDelete: 'CASCADE' });

// Alumnos ↔ Reportes
Alumnos.hasMany(Reportes, { foreignKey: "alumnoId" });
Reportes.belongsTo(Alumnos, { foreignKey: "alumnoId", as: "alumno", onDelete: 'CASCADE' });

// Maestro Creador ↔ Reportes (Quién emitió el reporte)
Users.hasMany(Reportes, { foreignKey: "maestroId" });
Reportes.belongsTo(Users, { foreignKey: "maestroId", as: "creador", onDelete: 'SET NULL' });

// Alumnos ↔ Tareas (Entregas de los alumnos)
Alumnos.hasMany(Tareas, { foreignKey: "alumnoId" });
Tareas.belongsTo(Alumnos, { foreignKey: "alumnoId", onDelete: 'CASCADE' });

// Materias ↔ Tareas 🆕 (Las tareas se asignan a una materia específica)
Materias.hasMany(Tareas, { foreignKey: "materiaId" });
Tareas.belongsTo(Materias, { foreignKey: "materiaId", onDelete: 'CASCADE' });


export {
  Users,
  Alumnos,
  Grados,
  Asistencia,
  AsistenciaMaestro,
  Incidencia,
  Reportes,
  Tareas,
  Materias
};

export default db;