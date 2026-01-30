import { Incidencia, Alumnos } from "../models/index.js";
import { Op } from "sequelize";

export const getIncidencias = async (req, res) => {
  try {
    const { role, userId } = req;
    let whereCondition = {};

  
    if (role === "alumno") {
  
      const alumno = await Alumnos.findOne({ where: { userId } });
      if (!alumno) return res.status(404).json({ msg: "Perfil de alumno no encontrado" });
      whereCondition.alumnoId = alumno.id;
    }

    if (req.query.desde && req.query.hasta) {
        whereCondition.fecha = { [Op.between]: [req.query.desde, req.query.hasta] };
    }

    const lista = await Incidencia.findAll({
      where: whereCondition,
      attributes: ["id", "uuid", "tipo", "descripcion", "fecha", "alumnoId"],
      include: [
        { 
            model: Alumnos, 
            as: "alumno", 
            attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor"] 
        }
      ],
      order: [["id", "DESC"]],
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getIncidenciasById = async (req, res) => {
  try {
    
    const incidencia = await Incidencia.findOne({
      where: { uuid: req.params.id },
      attributes: ["id", "uuid", "tipo", "descripcion", "fecha", "alumnoId"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido"] }
      ],
    });

    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });
  
    if (req.role === "alumno") {
         const alumnoPerfil = await Alumnos.findOne({ where: { userId: req.userId }});
         if (!alumnoPerfil || incidencia.alumnoId !== alumnoPerfil.id) {
             return res.status(403).json({ msg: "Acceso denegado" });
         }
    }

    res.status(200).json(incidencia);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createIncidencias = async (req, res) => {
  try {
    const { tipo, descripcion, fecha, alumnoId } = req.body;
    await Incidencia.create({ tipo, descripcion, fecha, alumnoId });
    res.status(201).json({ msg: "Incidencia creada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateIncidencias = async (req, res) => {
  try {
    
    const incidencia = await Incidencia.findOne({ where: { uuid: req.params.id }});
    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });

    const { tipo, descripcion, fecha, alumnoId } = req.body;
  
    await Incidencia.update(
        { tipo, descripcion, fecha, alumnoId }, 
        { where: { id: incidencia.id } }
    );
    res.status(200).json({ msg: "Incidencia actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteIncidencias = async (req, res) => {
  try {
    const incidencia = await Incidencia.findOne({ where: { uuid: req.params.id }});
    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });

    await Incidencia.destroy({ where: { id: incidencia.id } });
    res.status(200).json({ msg: "Incidencia eliminada correctamente" }); 
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};