import Incidencia from "../models/IncidenciaModel.js";
import Alumnos from "../models/AlumnosModel.js";

export const getIncidencias = async (req, res) => {
  try {
    const where = {};
    if (req.query.alumnoId) where.alumnoId = Number(req.query.alumnoId);
    if (req.query.desde && req.query.hasta) where.fecha = { gte: req.query.desde, lte: req.query.hasta };

    const lista = await Incidencia.findAll({
      where,
      attributes: ["id", "uuid", "tipo", "descripcion", "fecha", "alumnoId"],
      include: [{ model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor"] }],
      order: [["id", "DESC"]],
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getIncidenciasById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const incidencia = await Incidencia.findByPk(id, {
      attributes: ["id", "uuid", "tipo", "descripcion", "fecha", "alumnoId"],
      include: [{ model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor"] }],
    });
    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const incidencia = await Incidencia.findByPk(id);
    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });

    const { tipo, descripcion, fecha, alumnoId } = req.body;
    await Incidencia.update({ tipo, descripcion, fecha, alumnoId }, { where: { id } });
    res.status(200).json({ msg: "Incidencia actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteIncidencias = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const incidencia = await Incidencia.findByPk(id);
    if (!incidencia) return res.status(404).json({ msg: "Incidencia no encontrada" });

    await Incidencia.destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
