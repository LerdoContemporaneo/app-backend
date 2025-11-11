import { Sequelize } from "sequelize";
import db from "../config/db.js"
import Alumnos from "./AlumnosModel.js";


const { DataTypes } = Sequelize;

const Asistencia = db.define('asistencia', {
  id:{
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
  },
    uuid: {
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    fecha: {
         type: DataTypes.DATEONLY, 
         allowNull: false,
         defaultValue: Sequelize.literal("CURRENT_DATE"),
        },
    estado: {
         type: DataTypes.ENUM('Presente', 'Ausente', 'Tarde', 'Justificado'),   
            allowNull: false,
            defaultValue: 'Presente'
        },
      alumnoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    freezeTableName: true,
  }
);



export default Asistencia;
