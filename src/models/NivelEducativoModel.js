import { DataTypes } from "sequelize";
import db from "../config/db.js";

const NivelEducativo = db.define(
  "niveles_educativos",
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
    nombre: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 80],
      },
    },
    clave: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^[a-z0-9-]+$/,
      },
    },
    orden: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        isInt: true,
        min: 1,
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ["uuid"] },
      { unique: true, fields: ["nombre"] },
      { unique: true, fields: ["clave"] },
      { fields: ["orden"] },
      { fields: ["activo"] },
    ],
  },
);

export default NivelEducativo;