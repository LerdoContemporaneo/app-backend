import { Reportes, Alumnos, Users, Grados } from "../models/index.js";
import { Op } from "sequelize";

export const getReportes = async (req, res) => {
  try {
  
    const { role, userId } = req; 
    
    let whereCondition = {};


    if (role === "alumno") {
      const alumno = await Alumnos.findOne({ where: { userId } });
      if (!alumno) return res.status(404).json({ msg: "Perfil de alumno no encontrado" });
      
      whereCondition.alumnoId = alumno.id;
    } 
    else if (role === "maestro") {
     
      whereCondition.maestroId = userId; 
    }

    const lista = await Reportes.findAll({
      where: whereCondition, 
      attributes: ["id", "uuid", "titulo", "contenido", "alumnoId", "maestroId", "gradoId", "createdAt"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula"] },
        { model: Users, as: "maestro", attributes: ["id", "uuid", "name", "email"] },
        { model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] },
      ],
      order: [["id", "DESC"]],
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getReportesById = async (req, res) => {
  try {
   
    const reporte = await Reportes.findOne({
      where: { uuid: req.params.id },
      attributes: ["id", "uuid", "titulo", "contenido", "alumnoId", "maestroId", "gradoId", "createdAt"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula"] },
        { model: Users, as: "maestro", attributes: ["id", "uuid", "name", "email"] },
        { model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] },
      ],
    });

    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });

   
    if (req.role === "alumno") {
    
         const alumnoPerfil = await Alumnos.findOne({ where: { userId: req.userId }});
         if (!alumnoPerfil || reporte.alumnoId !== alumnoPerfil.id) {
             return res.status(403).json({ msg: "Acceso denegado" });
         }
    }

    res.status(200).json(reporte);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createReportes = async (req, res) => {
  try {
    const { titulo, contenido, alumnoId, gradoId } = req.body;
    
    const maestroId = req.userId; 

    await Reportes.create({ 
        titulo, 
        contenido, 
        alumnoId, 
        maestroId, 
        gradoId 
    });
    res.status(201).json({ msg: "Reporte creado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateReportes = async (req, res) => {
  try {

    const reporte = await Reportes.findOne({ where: { uuid: req.params.id }});
    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });

    if (req.role === "maestro" && req.userId !== reporte.maestroId) {
        return res.status(403).json({ msg: "No puedes editar reportes creados por otro maestro" });
    }

    const { titulo, contenido, alumnoId, gradoId } = req.body;
    
    await Reportes.update(
        { titulo, contenido, alumnoId, gradoId }, 
        { where: { id: reporte.id } }
    );
    res.status(200).json({ msg: "Reporte actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteReportes = async (req, res) => {
  try {
 
    const reporte = await Reportes.findOne({ where: { uuid: req.params.id }});
    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });


    if (req.role === "maestro" && req.userId !== reporte.maestroId) {
        return res.status(403).json({ msg: "No puedes eliminar reportes de otros" });
    }

    await Reportes.destroy({ where: { id: reporte.id } });
    res.status(200).json({ msg: "Reporte eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};