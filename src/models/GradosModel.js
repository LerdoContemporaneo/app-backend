import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const Grados = db.define('grados', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    // Nombre descriptivo completo para mostrar en selectores o listas
    // Ej: "Lic. en Derecho - 1º Semestre (Nocturno)" o "Secundaria - 2º A"
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Nivel educativo principal
    nivel: {
        type: DataTypes.ENUM("Secundaria", "Preparatoria", "Universidad"),
        allowNull: false,
        defaultValue: "Secundaria"
    },
    // Especialidad o Carrera (Null para Secundaria)
    // Ej: "Derecho", "Puericultura", "Informática"
    carrera: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Grado / Semestre / Año
    // Ej: "1º", "3º", "5º"
    gradoSemestre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Grupo / Sección
    // Ej: "A", "B", "C"
    grupo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Turno
    turno: {
        type: DataTypes.ENUM("Matutino", "Nocturno", "Sabatino"),
        allowNull: false,
        defaultValue: "Matutino"
    }
}, {
    freezeTableName: true,
    timestamps: true,
});

export default Grados;