import Reportes from "../models/ReportesModel.js";
import Alumnos from "../models/AlumnosModel.js";
import Users from "../models/UsersModel.js";
import Grados from "../models/GradosModel.js";

export const getReportes = async (req, res) => {
  try {
    const where = {};
    if (req.query.alumnoId) where.alumnoId = Number(req.query.alumnoId);
    if (req.query.maestroId) where.maestroId = Number(req.query.maestroId);
    if (req.query.gradoId) where.gradoId = Number(req.query.gradoId);

    const lista = await Reportes.findAll({
      where,
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
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const reporte = await Reportes.findByPk(id, {
      attributes: ["id", "uuid", "titulo", "contenido", "alumnoId", "maestroId", "gradoId", "createdAt"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula"] },
        { model: Users, as: "maestro", attributes: ["id", "uuid", "name", "email"] },
        { model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] },
      ],
    });
    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });
    res.status(200).json(reporte);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createReportes = async (req, res) => {
  try {
    const { titulo, contenido, alumnoId, maestroId, gradoId } = req.body;
    await Reportes.create({ titulo, contenido, alumnoId, maestroId, gradoId });
    res.status(201).json({ msg: "Reporte creado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateReportes = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const reporte = await Reportes.findByPk(id);
    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });

    const { titulo, contenido, alumnoId, maestroId, gradoId } = req.body;
    await Reportes.update({ titulo, contenido, alumnoId, maestroId, gradoId }, { where: { id } });
    res.status(200).json({ msg: "Reporte actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteReportes = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const reporte = await Reportes.findByPk(id);
    if (!reporte) return res.status(404).json({ msg: "Reporte no encontrado" });

    await Reportes.destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
