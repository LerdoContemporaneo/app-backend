import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
// 1. Importamos la DB y los MODELOS individualmente
import db, { Users, Grados, Alumnos, Asistencia, AsistenciaMaestro, Incidencia, Reportes, Tareas } from "./models/index.js";
import connectSessionSequelize from "connect-session-sequelize";

// ... Importación de Rutas ...
import AuthRoute from "./routes/AuthRoute.js";
import UserRoute from "./routes/UserRoute.js";
import GradosRoute from "./routes/GradosRoute.js";
import AlumnoRoute from "./routes/AlumnoRoute.js";
import AsistenciaRoute from "./routes/AsistenciaRoute.js";
import AsistenciaMaestroRoute from "./routes/AsistenciaMaestroRoute.js";
import IncidenciasRoute from "./routes/IncidenciasRoute.js";
import ReportesRoute from "./routes/ReportesRoute.js";
import TareasRoute from "./routes/TareasRoute.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const SequelizeStore = connectSessionSequelize(session.Store);
const store = new SequelizeStore({ db: db });

(async () => {
    try {
        
        console.log("🔄 Sincronizando Base de Datos...");
        
        await db.sync({ alter: false }); 

        await store.sync();
        
        console.log("🚀 BASE DE DATOS LISTA");
    } catch (error) {
        console.error("❌ Error al sincronizar:", error);
    }
})();

const isProduction = process.env.NODE_ENV === "production";

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: { 
        secure: isProduction ? true : false, 
        sameSite: isProduction ? 'none' : 'lax',
        httpOnly: true, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(cors({
    origin: ["https://lerdo-front.vercel.app", "https://portal.lerdocontemporaneo.com", "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
    optionsSuccessStatus: 204
}));

app.use(express.json());

// Rutas
app.use(AuthRoute);
app.use(UserRoute);
app.use(GradosRoute);
app.use(AlumnoRoute);
app.use(AsistenciaRoute); 
app.use(AsistenciaMaestroRoute);
app.use(IncidenciasRoute);
app.use(ReportesRoute);
app.use(TareasRoute);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});