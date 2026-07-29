import { Sequelize } from "sequelize";
import db from "../config/db.js";
 
const { DataTypes } = Sequelize;

const Tareas = db.define("tareas",
  {
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
      validate: {
        notEmpty: true,
      },
    },
    descripcion: {
      type: DataTypes.TEXT,
     descripcion: descripcion?.trim() || null,
      validate: {
        notEmpty: true,
      },
    },
    fechaAsignacion: { 
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    fechaEntrega: { 
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    
    gradoId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  validate: {
    isInt: true,
    min: 1,
  },
}

  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

export default Tareas;