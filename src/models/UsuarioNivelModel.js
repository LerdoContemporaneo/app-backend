import { DataTypes } from "sequelize";
import db from "../config/db.js";

const UsuarioNivel = db.define(
  "usuarios_niveles",
  {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
    nivelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["nivelId"] },
    ],
  },
);

export default UsuarioNivel;