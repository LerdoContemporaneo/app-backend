import Alumnos from "../models/AlumnosModel.js";
import Grados from "../models/GradosModel.js";

export const getAlumnos = async (req, res) => {
  try {
    const alumnos = await Alumnos.findAll({
      attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor", "gradoId"],
      include: [{ model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] }],
      order: [["id", "DESC"]],
    });
    res.status(200).json(alumnos);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAlumnosById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const alumno = await Alumnos.findByPk(id, {
      attributes: ["id", "uuid", "nombre", "apellido", "matricula", "tutor", "gradoId"],
      include: [{ model: Grados, as: "grado", attributes: ["id", "uuid", "nombre"] }],
    });
    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });
    res.status(200).json(alumno);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createAlumnos = async (req, res) => {
  const { nombre, apellido, matricula, tutor, gradoId } = req.body;
  try {
    await Alumnos.create({ nombre, apellido, matricula, tutor, gradoId });
    res.status(201).json({ msg: "Alumno registrado correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "La matrícula ya existe" });
    }
    res.status(500).json({ msg: error.message });
  }
};

export const updateAlumnos = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const alumno = await Alumnos.findByPk(id);
    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });

    const { nombre, apellido, matricula, tutor, gradoId } = req.body;
    await Alumnos.update(
      { nombre, apellido, matricula, tutor, gradoId },
      { where: { id } }
    );
    res.status(200).json({ msg: "Alumno actualizado correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "La matrícula ya existe" });
    }
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAlumnos = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ msg: "ID inválido" });

    const alumno = await Alumnos.findByPk(id);
    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });

    await Alumnos.destroy({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};
