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
        allowNull: false
    },
    // Nueva columna para el teléfono del tutor agregar resto del backend
    telefonoTutor: {
    type: DataTypes.STRING,
    allowNull: true // No obligatorio todavía para no romper registros viejos
    }
  
   
}, {
    freezeTableName: true,
    timestamps: true,
});

export default Alumnos;