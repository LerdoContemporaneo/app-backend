import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mysql2 from 'mysql2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 


const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PASS,  
  DB_NAME,
  DB_PORT,
} = process.env;

const db = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD || DB_PASS, {
  host: DB_HOST, 
  port: DB_PORT ? Number(DB_PORT) : 3306,
  dialect: "mysql",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: true,
  },
  timezone: "+00:00",
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    
  },
});

export default db;