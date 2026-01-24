import Tareas from "../models/TareasModel.js";
import Alumnos from "../models/AlumnosModel.js";
import Grados from "../models/GradosModel.js";
import { Op } from "sequelize";

export const getTareas = async (req, res) => {
  try {
    const { role, userId } = req;

    let whereCondition = {};

    // CASO ALUMNO
    if (role === "alumno") {
      const alumno = await Alumnos.findOne({ where: { userId: userId } });
      if (!alumno)
        return res
          .status(404)
          .json({ msg: "Perfil de alumno no asociado a este usuario" });
      whereCondition = { alumnoId: alumno.id };
    }

    // CASO MAESTRO
    else if (role === "maestro") {
      const grados = await Grados.findAll({
        where: { maestroId: userId },
        include: [{ model: Alumnos, attributes: ["id"] }],
      });

      let alumnosIds = [];
      grados.forEach((grado) => {
        grado.alumnos.forEach((alum) => alumnosIds.push(alum.id));
      });

      whereCondition = { alumnoId: { [Op.in]: alumnosIds } };
    }

    const response = await Tareas.findAll({
      attributes: [
        "id",
        "uuid",
        "titulo",
        "descripcion",
        "fechaAsignacion",
        "fechaEntrega",
        "alumnoId",
      ],
      where: whereCondition,
      include: [
        {
          model: Alumnos,
          attributes: ["uuid", "nombre", "apellido", "matricula"],
        },
      ],
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createTareas = async (req, res) => {
  const { titulo, descripcion, fechaAsignacion, fechaEntrega, alumnoId } =
    req.body;
  try {
    await Tareas.create({
      titulo,
      descripcion,
      fechaAsignacion,
      fechaEntrega,
      alumnoId,
    });
    res.status(201).json({ msg: "Tarea creada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const updateTareas = async (req, res) => {
  try {
    const tareas = await Tareas.findOne({ where: { uuid: req.params.id } });
    if (!tareas) return res.status(404).json({ msg: "Tarea no encontrada" });

    const { titulo, descripcion, fechaAsignacion, fechaEntrega, alumnoId } =
      req.body;

    await Tareas.update(
      { titulo, descripcion, fechaAsignacion, fechaEntrega, alumnoId },
      { where: { id: tareas.id } },
    );

    res.status(200).json({ msg: "Tarea actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteTareas = async (req, res) => {
  try {
    const result = await Tareas.destroy({ where: { uuid: req.params.id } });
    if (!result) return res.status(404).json({ msg: "Tarea no encontrada" });
    res.status(200).json({ msg: "Tarea eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};