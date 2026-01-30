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

// --- SINCRONIZACIÓN SECUENCIAL MANUAL ---// Esto garantiza que el Padre exista antes que el Hijo
(async () => {
    try {
        console.log("🔄 Iniciando sincronización secuencial...");

        // Nivel 1: Usuarios (No depende de nadie)
        await Users.sync({});
        console.log("✅ Tabla Users creada");

        // Nivel 2: Dependen de Users
        await Grados.sync({ alter: true }); 
        console.log("✅ Tabla Grados creada");

        await AsistenciaMaestro.sync({ alter: true });
        console.log("✅ Tabla AsistenciaMaestro creada");

        // Nivel 3: Dependen de Grados y Users
        await Alumnos.sync({ alter: true }); 
        console.log("✅ Tabla Alumnos creada");

        // Nivel 4: Dependen de Alumnos
        await Promise.all([
            Tareas.sync({ alter: true }),
            Reportes.sync({ alter: true }),
            Incidencia.sync({ alter: true }),
            Asistencia.sync({ alter: true })
        ]);
        console.log("✅ Tablas de Datos (Tareas, Reportes, etc) creadas");

        // Nivel 5: Sesiones
        await store.sync();
        console.log("✅ Tabla Sessions creada");

        console.log("🚀 BASE DE DATOS LISTA Y SINCRONIZADA CORRECTAMENTE");
    } catch (error) {
        console.error("❌ Error Fatal al sincronizar:", error);
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
    origin: ["https://lerdo-front.vercel.app", "http://localhost:3000", "http://localhost:3001"],
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