import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const Reportes = db.define("reportes", {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      validate: { notEmpty: true },
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    alumnoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    maestroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false, 
    }
  }, {
    freezeTableName: true,
  }
);

export default Reportes;