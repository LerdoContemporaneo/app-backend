import Alumnos from "../models/AlumnosModel.js";
import Grados from "../models/GradosModel.js";
import { Op } from "sequelize";

export const getAlumnos = async (req, res) => {
  try {
    const { role, userId } = req;
    let whereCondition = {};

    // 1. Filtro por roles
    if (role === "alumno") {
      whereCondition = { userId: userId };
    } else if (role === "maestro") {
      const grados = await Grados.findAll({
        where: { maestroId: userId },
        attributes: ["id"],
      });
      const gradosIds = grados.map((g) => g.id);
      whereCondition = { gradoId: { [Op.in]: gradosIds } };
    }

    const response = await Alumnos.findAll({
      attributes: [
        "id",
        "uuid",
        "nombre",
        "apellido",
        "matricula",
        "tutor",
        "userId",
      ],
      where: whereCondition,
      include: [{ model: Grados, attributes: ["nombre"] }],
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAlumnoById = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({
      attributes: [
        "id",
        "uuid",
        "nombre",
        "apellido",
        "matricula",
        "tutor",
        "userId",
      ],
      where: { uuid: req.params.id },
      include: [{ model: Grados, attributes: ["id", "uuid", "nombre"] }],
    });

    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });

    // --- SEGURIDAD AGREGADA ---
    // Si es alumno, verificamos que el perfil que intenta ver sea el suyo
    if (req.role === "alumno" && alumno.userId !== req.userId) {
      return res
        .status(403)
        .json({
          msg: "Acceso denegado: No puedes ver perfiles de otros alumnos",
        });
    }

    res.status(200).json(alumno);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createAlumnos = async (req, res) => {
  const { nombre, apellido, matricula, tutor, gradoId, userId } = req.body;
  try {
    await Alumnos.create({
      nombre,
      apellido,
      matricula,
      tutor,
      gradoId,
      userId: userId,
    });
    res.status(201).json({ msg: "Alumno registrado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateAlumnos = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({ where: { uuid: req.params.id } });
    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });

    const { nombre, apellido, matricula, tutor, gradoId } = req.body;

    await Alumnos.update(
      { nombre, apellido, matricula, tutor, gradoId },
      { where: { id: alumno.id } },
    );
    res.status(201).json({ msg: "Alumno actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAlumnos = async (req, res) => {
  try {
    const alumno = await Alumnos.findOne({ where: { uuid: req.params.id } });
    if (!alumno) return res.status(404).json({ msg: "Alumno no encontrado" });

    await Alumnos.destroy({ where: { id: alumno.id } });
    res.status(201).json({ msg: "Alumno eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};