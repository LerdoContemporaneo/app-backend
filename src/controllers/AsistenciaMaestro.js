import { AsistenciaMaestro, Users } from "../models/index.js";

export const getAsistenciaMaestro = async (req, res) => {
  try {
    const where = {};
    

    if (req.query.maestroId) where.maestroId = req.query.maestroId;
    if (req.query.fecha) where.fecha = req.query.fecha;

    const lista = await AsistenciaMaestro.findAll({
      where,
      attributes: ["id", "uuid", "fecha", "estado", "maestroId"],
      include: [
        { 
            model: Users, 
            as: "maestro", 
            attributes: ["id", "uuid", "name", "email", "role"] 
        }
      ],
      order: [["id", "DESC"]],
    });
    res.status(200).json(lista);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAsistenciaMaestroById = async (req, res) => {
  try {
  
    const registro = await AsistenciaMaestro.findOne({
      where: { uuid: req.params.id },
      attributes: ["id", "uuid", "fecha", "estado", "maestroId"],
      include: [
        { model: Users, as: "maestro", attributes: ["id", "uuid", "name", "email", "role"] }
      ],
    });

    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });
    res.status(200).json(registro);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createAsistenciaMaestro = async (req, res) => {
  try {
    let { fecha, estado, maestroId } = req.body;
    
    if (!fecha) fecha = new Date().toISOString().slice(0, 10);
    
    await AsistenciaMaestro.create({ fecha, estado, maestroId });
    res.status(201).json({ msg: "Asistencia creada correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "Ya existe asistencia de ese maestro en esa fecha" });
    }
    res.status(500).json({ msg: error.message });
  }
};

export const updateAsistenciaMaestro = async (req, res) => {
  try {

    const registro = await AsistenciaMaestro.findOne({ where: { uuid: req.params.id }});
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    const { fecha, estado, maestroId } = req.body;
    
    await AsistenciaMaestro.update(
        { fecha, estado, maestroId }, 
        { where: { id: registro.id } }
    );
    res.status(200).json({ msg: "Asistencia actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteAsistenciaMaestro = async (req, res) => {
  try {
    const registro = await AsistenciaMaestro.findOne({ where: { uuid: req.params.id }});
    if (!registro) return res.status(404).json({ msg: "Registro no encontrado" });

    await AsistenciaMaestro.destroy({ where: { id: registro.id } });
    res.status(200).json({ msg: "Asistencia eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};