import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import db from "./config/db.js";
import connectSessionSequelize from "connect-session-sequelize";
import AuthRoute from "./routes/AuthRoute.js";
import UserRoute from "./routes/UserRoute.js";
import GradosRoute from "./routes/GradosRoute.js";
import AlumnoRoute from "./routes/AlumnoRoute.js";
import AsistenciaRoute from "./routes/AsistenciaRoute.js";
import AsistenciaMaestroRoute from "./routes/AsistenciaMaestroRoute.js";
import IncidenciasRoute from "./routes/IncidenciasRoute.js";
import ReportesRoute from "./routes/ReportesRoute.js";
dotenv.config();


const app = express();

const SequelizeStore = connectSessionSequelize(session.Store);

const store = new SequelizeStore({
    db: db
});

(async () => {
  await db.sync();
 })();

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { secure: 'auto' }
}));

app.use(cors({
  origin: ["https://lerdo-front.vercel.app"], // sin slash final
  credentials: true,
  methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  optionsSuccessStatus: 204
}));


app.use(express.json());

app.use(AuthRoute);
app.use(UserRoute);
app.use(GradosRoute);
app.use(AlumnoRoute);
app.use(AsistenciaRoute); 
app.use(AsistenciaMaestroRoute);
app.use(IncidenciasRoute);
app.use(ReportesRoute);

// store.sync();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});