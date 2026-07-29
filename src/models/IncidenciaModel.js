import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Incidencia = db.define(
  "incidencia",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },

    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },

    tipo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El tipo de incidencia es obligatorio",
        },
      },
    },

    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "La descripción es obligatoria",
        },
      },
    },

    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    alumnoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },

    gradoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },

    maestroId: {
      type: DataTypes.INTEGER.UNSIGNED,
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
        unique: true,
        fields: ["uuid"],
      },
      {
        fields: ["alumnoId"],
      },
      {
        fields: ["gradoId"],
      },
      {
        fields: ["maestroId"],
      },
      {
        fields: ["fecha"],
      },
    ],
  },
);

export default Incidencia;