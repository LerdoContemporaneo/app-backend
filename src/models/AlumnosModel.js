import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const Alumnos = db.define('alumnos', {
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: { notEmpty: true }
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    matricula: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    tutor: {
        type: DataTypes.STRING,
        allowNull: false // Nombre en texto por si acaso
    },
    telefonoTutor: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    // NUEVAS LLAVES (Se recomiendan declarar aunque index.js las cree)
    userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true // Puede ser null si el alumno aún no tiene cuenta de login
    },
    tutorId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true // ID de la cuenta del padre en la tabla Users
    },
    gradoId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true,
});

export default Alumnos;