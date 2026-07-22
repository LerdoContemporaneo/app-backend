import { DataTypes } from "sequelize";
import db from "../config/db.js";

const Users = db.define(
  "users",
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
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: { notEmpty: true, isEmail: true },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      // NUEVO: Agregamos "tutor" al ENUM
      type: DataTypes.ENUM("administrador", "maestro", "alumno", "tutor"),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true
    },
    correoPersonal: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  },
  {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { fields: ["role"] },
    ],
  }
);

export default Users;