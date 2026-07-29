import { Sequelize } from "sequelize";
import db from "../config/db.js";

const { DataTypes } = Sequelize;

const Asistencia = db.define(
  "asistencia",
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
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_DATE"),
    },
    estado: {
      type: DataTypes.ENUM(
        "Presente",
        "Ausente",
        "Tarde",
        "Justificado",
      ),
      allowNull: false,
      defaultValue: "Presente",
    },
    alumnoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },
    gradoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },
  },
  {
    freezeTableName: true,
    indexes: [
      {
        name: "uq_asistencia_alumno_grado_fecha",
        unique: true,
        fields: ["alumnoId", "gradoId", "fecha"],
      },
    ],
  },
);

export default Asistencia;
