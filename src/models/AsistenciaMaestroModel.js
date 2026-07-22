import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const AsistenciaMaestro = db.define("asistenciamaestro", {
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
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: () => new Date().toISOString().slice(0, 10),
    },
    estado: {
      type: DataTypes.ENUM("Presente", "Ausente", "Tarde", "Justificado"),
      allowNull: false,
      defaultValue: "Presente",
    },
    maestroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false, 
    }
  }, {
    freezeTableName: true,
  }
);

export default AsistenciaMaestro;