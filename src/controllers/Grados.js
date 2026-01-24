import { Grados, Users } from "../models/index.js"; 

export const getGrados = async (req, res) => {
  try {
    const lista = await Grados.findAll({
      attributes: ["id", "uuid", "nombre", "maestroId"],
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

export const getGradosById = async (req, res) => {
  try {
    // 2. CORRECCIÓN DE UUID: No uses Number(), usa el string directo
    const grado = await Grados.findOne({
      where: { uuid: req.params.id }, // Buscamos por UUID
      attributes: ["id", "uuid", "nombre", "maestroId"],
      include: [{ model: Users, as: "maestro", attributes: ["id", "uuid", "name", "email", "role"] }],
    });
    
    if (!grado) return res.status(404).json({ msg: "Grado no encontrado" });
    res.status(200).json(grado);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createGrados = async (req, res) => {
  try {
    const { nombre, maestroId } = req.body;
    await Grados.create({ nombre, maestroId });
    res.status(201).json({ msg: "Grado registrado correctamente" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ msg: "El nombre de grado ya existe" });
    }
    res.status(500).json({ msg: error.message });
  }
};

export const updateGrados = async (req, res) => {
  try {
    // 1. Buscar por UUID para obtener el ID interno
    const grado = await Grados.findOne({ where: { uuid: req.params.id }});
    if (!grado) return res.status(404).json({ msg: "Grado no encontrado" });

    const { nombre, maestroId } = req.body;
    
    // 2. Actualizar usando el ID numérico interno
    await Grados.update({ nombre, maestroId }, { where: { id: grado.id } });
    res.status(200).json({ msg: "Grado actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const deleteGrados = async (req, res) => {
  try {
    const grado = await Grados.findOne({ where: { uuid: req.params.id }});
    if (!grado) return res.status(404).json({ msg: "Grado no encontrado" });

    await Grados.destroy({ where: { id: grado.id } });
    res.status(200).json({ msg: "Grado eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};