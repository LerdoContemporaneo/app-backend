import { Sequelize } from "sequelize";
import db from "../config/db.js";
import Alumnos from "./AlumnosModel.js";

const { DataTypes } = Sequelize;

const Reportes = db.define(
  "reportes",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // nueva columna para registrar el autor del reporte agregar resto del backend
    maestroId: {
      type: DataTypes.INTEGER,
      allowNull: false, // Todo reporte DEBE tener un autor
      references: {
        model: 'users', // Apunta a la tabla de usuarios
        key: 'id'
      }
    }
  },
  {
    freezeTableName: true,
  }
);

export default Reportes;
