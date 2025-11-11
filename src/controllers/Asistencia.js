import Asistencia from "../models/AsistenciaModel.js";
import Alumnos from "../models/AlumnosModel.js";
import Grados from "../models/GradosModel.js";

export const getAsistencia = async (req, res) => {
  try {
    const where = {};
    if (req.query.alumnoId) where.alumnoId = Number(req.query.alumnoId);
    if (req.query.gradoId) where.gradoId = Number(req.query.gradoId);
    if (req.query.fecha) where.fecha = req.query.fecha;

    const lista = await Asistencia.findAll({
      where,
      attributes: ["id", "uuid", "fecha", "estado", "alumnoId", "gradoId"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor"] },
        { model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] },
      ],
      order: [["id", "DESC"]],
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAsistenciaById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const asistencia = await Asistencia.findByPk(id, {
      attributes: ["id", "uuid", "fecha", "estado", "alumnoId", "gradoId"],
      include: [
        { model: Alumnos, as: "alumno", attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor"] },
        { model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] },
      ],
    });
    if (!asistencia) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json(asistencia);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createAsistencia = async (req, res) => {
  try {
    let { fecha, estado, alumnoId, gradoId } = req.body;
    if (!fecha) fecha = new Date().toISOString().slice(0, 10);
    await Asistencia.create({ fecha, estado, alumnoId, gradoId });
    res.status(201).json({ msg: "Asistencia creada correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "Ya existe asistencia para ese alumno en esa fecha" });
    }
    res.status(500).json({ msg: error.message });
  }
};

export const updateAsistencia = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const registro = await Asistencia.findByPk(id);
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    const { fecha, estado, alumnoId, gradoId } = req.body;
    await Asistencia.update({ fecha, estado, alumnoId, gradoId }, { where: { id } });
    res.status(200).json({ msg: "Asistencia actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAsistencia = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const registro = await Asistencia.findByPk(id);
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    await Asistencia.destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
