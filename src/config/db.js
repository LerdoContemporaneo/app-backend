import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_PASS,   // por si en algún lado la llamas así
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
