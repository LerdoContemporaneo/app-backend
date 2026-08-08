import db, {
  NivelEducativo,
  UsuarioNivel,
  Users,
} from "../models/index.js";
import {
  ROLES,
  enteroPositivo,
  esErrorRelacion,
  esErrorUnico,
} from "../utils/controllerUtils.js";

const ROLES_ASIGNABLES = [ROLES.COORDINADOR, ROLES.MAESTRO];

const atributosNivel = [
  "id",
  "uuid",
  "nombre",
  "clave",
  "orden",
  "activo",
  "createdAt",
  "updatedAt",
];

const normalizarClave = (valor) =>
  valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buscarNivel = (uuid, transaction) =>
  NivelEducativo.findOne({
    where: { uuid },
    attributes: atributosNivel,
    transaction,
  });

const validarNombre = (valor) => {
  if (typeof valor !== "string" || valor.trim().length < 2) {
    return "El nombre del nivel debe tener al menos 2 caracteres";
  }

  if (valor.trim().length > 80) {
    return "El nombre del nivel no puede exceder 80 caracteres";
  }

  return null;
};

const validarClave = (valor) => {
  if (typeof valor !== "string" || !valor.trim()) {
    return "La clave del nivel es obligatoria";
  }

  const clave = normalizarClave(valor);

  if (!clave || clave.length > 40) {
    return "La clave debe contener letras o números y no exceder 40 caracteres";
  }

  return null;
};

const obtenerUsuario = (uuid, transaction) =>
  Users.findOne({
    where: { uuid },
    attributes: ["id", "uuid", "name", "email", "role"],
    transaction,
  });

export const getNiveles = async (req, res) => {
  try {
    if (req.role === ROLES.ADMINISTRADOR) {
      const niveles = await NivelEducativo.findAll({
        attributes: atributosNivel,
        order: [
          ["orden", "ASC"],
          ["nombre", "ASC"],
        ],
      });

      return res.status(200).json(niveles);
    }

    if (!ROLES_ASIGNABLES.includes(req.role)) {
      return res.status(403).json({
        msg: "No tienes niveles educativos asignados",
      });
    }

    const niveles = await NivelEducativo.findAll({
      attributes: atributosNivel,
      where: { activo: true },
      include: [
        {
          model: Users,
          as: "usuarios",
          attributes: [],
          where: { id: req.userId },
          through: { attributes: [] },
          required: true,
        },
      ],
      order: [
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.status(200).json(niveles);
  } catch (error) {
    console.error("Error al obtener niveles educativos:", error);
    return res.status(500).json({
      msg: "No fue posible obtener los niveles educativos",
    });
  }
};

export const getNivelById = async (req, res) => {
  try {
    const nivel = await buscarNivel(req.params.id);

    if (!nivel) {
      return res.status(404).json({
        msg: "Nivel educativo no encontrado",
      });
    }

    if (req.role !== ROLES.ADMINISTRADOR) {
      if (!ROLES_ASIGNABLES.includes(req.role)) {
        return res.status(403).json({ msg: "Acceso denegado" });
      }

      const asignacion = await UsuarioNivel.findOne({
        where: {
          userId: req.userId,
          nivelId: nivel.id,
        },
        attributes: ["userId"],
      });

      if (!asignacion || !nivel.activo) {
        return res.status(403).json({
          msg: "No tienes acceso a este nivel educativo",
        });
      }
    }

    return res.status(200).json(nivel);
  } catch (error) {
    console.error("Error al obtener el nivel educativo:", error);
    return res.status(500).json({
      msg: "No fue posible obtener el nivel educativo",
    });
  }
};

export const createNivel = async (req, res) => {
  try {
    const { nombre, clave } = req.body;
    const orden = enteroPositivo(req.body.orden);
    const errorNombre = validarNombre(nombre);
    const errorClave = validarClave(clave);

    if (errorNombre || errorClave || !orden) {
      return res.status(400).json({
        msg:
          errorNombre ||
          errorClave ||
          "El orden debe ser un entero positivo",
      });
    }

    const nivel = await NivelEducativo.create({
      nombre: nombre.trim(),
      clave: normalizarClave(clave),
      orden,
      activo:
        req.body.activo === undefined ? true : Boolean(req.body.activo),
    });

    return res.status(201).json({
      msg: "Nivel educativo creado correctamente",
      nivel: await buscarNivel(nivel.uuid),
    });
  } catch (error) {
    console.error("Error al crear el nivel educativo:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe un nivel con ese nombre o clave",
      });
    }

    return res.status(500).json({
      msg: "No fue posible crear el nivel educativo",
    });
  }
};

export const updateNivel = async (req, res) => {
  try {
    const nivel = await buscarNivel(req.params.id);

    if (!nivel) {
      return res.status(404).json({
        msg: "Nivel educativo no encontrado",
      });
    }

    const cambios = {};

    if (req.body.nombre !== undefined) {
      const errorNombre = validarNombre(req.body.nombre);

      if (errorNombre) {
        return res.status(400).json({ msg: errorNombre });
      }

      cambios.nombre = req.body.nombre.trim();
    }

    if (req.body.clave !== undefined) {
      const errorClave = validarClave(req.body.clave);

      if (errorClave) {
        return res.status(400).json({ msg: errorClave });
      }

      cambios.clave = normalizarClave(req.body.clave);
    }

    if (req.body.orden !== undefined) {
      const orden = enteroPositivo(req.body.orden);

      if (!orden) {
        return res.status(400).json({
          msg: "El orden debe ser un entero positivo",
        });
      }

      cambios.orden = orden;
    }

    if (req.body.activo !== undefined) {
      if (typeof req.body.activo !== "boolean") {
        return res.status(400).json({
          msg: "El campo activo debe ser verdadero o falso",
        });
      }

      cambios.activo = req.body.activo;
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    await nivel.update(cambios);

    return res.status(200).json({
      msg: "Nivel educativo actualizado correctamente",
      nivel: await buscarNivel(nivel.uuid),
    });
  } catch (error) {
    console.error("Error al actualizar el nivel educativo:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe un nivel con ese nombre o clave",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar el nivel educativo",
    });
  }
};

export const deleteNivel = async (req, res) => {
  try {
    const nivel = await buscarNivel(req.params.id);

    if (!nivel) {
      return res.status(404).json({
        msg: "Nivel educativo no encontrado",
      });
    }

    const asignaciones = await UsuarioNivel.count({
      where: { nivelId: nivel.id },
    });

    if (asignaciones > 0) {
      return res.status(409).json({
        msg: "No se puede eliminar el nivel mientras tenga personal asignado; puedes desactivarlo",
      });
    }

    await nivel.destroy();

    return res.status(200).json({
      msg: "Nivel educativo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar el nivel educativo:", error);

    if (esErrorRelacion(error)) {
      return res.status(409).json({
        msg: "No se puede eliminar el nivel porque tiene información relacionada",
      });
    }

    return res.status(500).json({
      msg: "No fue posible eliminar el nivel educativo",
    });
  }
};

export const getNivelesDeUsuario = async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req.params.id);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const esPropioUsuario = Number(usuario.id) === Number(req.userId);

    if (req.role !== ROLES.ADMINISTRADOR && !esPropioUsuario) {
      return res.status(403).json({
        msg: "No puedes consultar los niveles de otro usuario",
      });
    }

    const niveles = await usuario.getNiveles({
      attributes: atributosNivel,
      joinTableAttributes: [],
      order: [
        ["orden", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.status(200).json({ usuario, niveles });
  } catch (error) {
    console.error("Error al obtener niveles del usuario:", error);
    return res.status(500).json({
      msg: "No fue posible obtener los niveles del usuario",
    });
  }
};

export const replaceNivelesDeUsuario = async (req, res) => {
  let transaction;

  try {
    const nivelIdsEntrada = req.body.nivelIds;

    if (!Array.isArray(nivelIdsEntrada)) {
      return res.status(400).json({
        msg: "nivelIds debe ser un arreglo",
      });
    }

    const nivelIds = [
      ...new Set(nivelIdsEntrada.map((value) => enteroPositivo(value))),
    ];

    if (nivelIds.some((id) => id === null)) {
      return res.status(400).json({
        msg: "Todos los nivelIds deben ser enteros positivos",
      });
    }

    transaction = await db.transaction();
    const usuario = await obtenerUsuario(req.params.id, transaction);

    if (!usuario) {
      await transaction.rollback();
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    if (!ROLES_ASIGNABLES.includes(usuario.role)) {
      await transaction.rollback();
      return res.status(400).json({
        msg: "Los niveles sólo pueden asignarse a coordinadores o maestros",
      });
    }

    const niveles = await NivelEducativo.findAll({
      where: { id: nivelIds, activo: true },
      attributes: ["id"],
      transaction,
    });

    if (niveles.length !== nivelIds.length) {
      await transaction.rollback();
      return res.status(400).json({
        msg: "Uno o más niveles educativos no existen o están inactivos",
      });
    }

    await usuario.setNiveles(niveles, { transaction });
    await transaction.commit();
    transaction = null;

    const actualizado = await obtenerUsuario(req.params.id);
    const nivelesActualizados = await actualizado.getNiveles({
      attributes: atributosNivel,
      joinTableAttributes: [],
      order: [["orden", "ASC"]],
    });

    return res.status(200).json({
      msg: "Niveles del usuario actualizados correctamente",
      usuario: actualizado,
      niveles: nivelesActualizados,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }

    console.error("Error al asignar niveles al usuario:", error);
    return res.status(500).json({
      msg: "No fue posible actualizar los niveles del usuario",
    });
  }
};