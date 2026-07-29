import {
  Alumnos,
  Grados,
  Users,
} from "../models/index.js";
import {
  ROLES,
  enteroPositivo,
  esErrorRelacion,
  esErrorUnico,
  usuarioAlumnoPerteneceAlGrado,
} from "../utils/controllerUtils.js";

const atributosGrado = ["id", "uuid", "nombre", "maestroId"];

const incluirMaestro = {
  model: Users,
  as: "maestro",
  attributes: ["id", "uuid", "name", "email", "role"],
  required: false,
};

const incluirAlumnos = {
  model: Alumnos,
  as: "alumnos",
  attributes: [
    "id",
    "uuid",
    "nombre",
    "apellido",
    "matricula",
    "tutor",
    "telefonoTutor",
    "userId",
  ],
  through: { attributes: [] },
  required: false,
};

const buscarGrado = (
  uuid,
  role = ROLES.ADMINISTRADOR,
  userId = null,
) =>
  Grados.findOne({
    where: { uuid },
    attributes: atributosGrado,
    include: [
      incluirMaestro,
      role === ROLES.ALUMNO
        ? {
            model: Alumnos,
            as: "alumnos",
            attributes: [],
            where: { userId },
            through: { attributes: [] },
            required: true,
          }
        : incluirAlumnos,
    ],
  });

const validarMaestro = async (maestroId) => {
  if (maestroId === null) return null;

  const maestro = await Users.findOne({
    where: {
      id: maestroId,
      role: ROLES.MAESTRO,
    },
    attributes: ["id"],
  });

  return maestro
    ? null
    : {
        status: 400,
        msg: "El usuario seleccionado no existe o no tiene rol de maestro",
      };
};

export const getGrados = async (req, res) => {
  try {
    const { role, userId } = req;
    let where = {};
    let include = [incluirMaestro, incluirAlumnos];

    if (role === ROLES.MAESTRO) {
      where = { maestroId: userId };
    } else if (role === ROLES.ALUMNO) {
      include = [
        incluirMaestro,
        {
          model: Alumnos,
          as: "alumnos",
          attributes: [],
          where: { userId },
          through: { attributes: [] },
          required: true,
        },
      ];
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar grupos",
      });
    }

    const lista = await Grados.findAll({
      where,
      attributes: atributosGrado,
      include,
      order: [["nombre", "ASC"]],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error("Error al obtener grupos:", error);
    return res.status(500).json({
      msg: "No fue posible obtener los grupos",
    });
  }
};

export const getGradosById = async (req, res) => {
  try {
    const grado = await buscarGrado(
      req.params.id,
      req.role,
      req.userId,
    );

    if (!grado) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    if (
      req.role === ROLES.MAESTRO &&
      Number(grado.maestroId) !== Number(req.userId)
    ) {
      return res.status(403).json({
        msg: "No puedes consultar grupos de otro maestro",
      });
    }

    if (
      req.role === ROLES.ALUMNO &&
      !(await usuarioAlumnoPerteneceAlGrado(
        req.userId,
        grado.id,
      ))
    ) {
      return res.status(403).json({
        msg: "No perteneces al grupo solicitado",
      });
    }

    if (
      ![
        ROLES.ADMINISTRADOR,
        ROLES.MAESTRO,
        ROLES.ALUMNO,
      ].includes(req.role)
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar este grupo",
      });
    }

    return res.status(200).json(grado);
  } catch (error) {
    console.error("Error al obtener grupo:", error);
    return res.status(500).json({
      msg: "No fue posible obtener el grupo",
    });
  }
};

export const createGrados = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede crear grupos",
      });
    }

    const { nombre } = req.body;
    const maestroId =
      req.body.maestroId === null ||
      req.body.maestroId === "" ||
      req.body.maestroId === undefined
        ? null
        : enteroPositivo(req.body.maestroId);

    if (typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({
        msg: "El nombre del grupo es obligatorio",
      });
    }

    if (
      req.body.maestroId !== null &&
      req.body.maestroId !== "" &&
      req.body.maestroId !== undefined &&
      !maestroId
    ) {
      return res.status(400).json({
        msg: "El maestroId no es válido",
      });
    }

    const errorMaestro = await validarMaestro(maestroId);

    if (errorMaestro) {
      return res
        .status(errorMaestro.status)
        .json({ msg: errorMaestro.msg });
    }

    const grado = await Grados.create({
      nombre: nombre.trim(),
      maestroId,
    });
    const creado = await buscarGrado(grado.uuid);

    return res.status(201).json({
      msg: "Grupo registrado correctamente",
      grado: creado,
    });
  } catch (error) {
    console.error("Error al crear grupo:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe un grupo con ese nombre",
      });
    }

    return res.status(500).json({
      msg: "No fue posible crear el grupo",
    });
  }
};

export const updateGrados = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede actualizar grupos",
      });
    }

   const grado = await Grados.findOne({
  where: {
    id: incidencia.gradoId,
    maestroId: userId,
  },
});

if (!grado) {
  return {
    status: 403,
    msg: "Esta incidencia no pertenece a uno de tus grupos",
  };
}

    const updateData = {};

    if (req.body.nombre !== undefined) {
      if (
        typeof req.body.nombre !== "string" ||
        !req.body.nombre.trim()
      ) {
        return res.status(400).json({
          msg: "El nombre del grupo es obligatorio",
        });
      }
      updateData.nombre = req.body.nombre.trim();
    }

    if (req.body.maestroId !== undefined) {
      const maestroId =
        req.body.maestroId === null || req.body.maestroId === ""
          ? null
          : enteroPositivo(req.body.maestroId);

      if (
        req.body.maestroId !== null &&
        req.body.maestroId !== "" &&
        !maestroId
      ) {
        return res.status(400).json({
          msg: "El maestroId no es válido",
        });
      }

      const errorMaestro = await validarMaestro(maestroId);

      if (errorMaestro) {
        return res
          .status(errorMaestro.status)
          .json({ msg: errorMaestro.msg });
      }

      updateData.maestroId = maestroId;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    await grado.update(updateData);
    const actualizado = await buscarGrado(grado.uuid);

    return res.status(200).json({
      msg: "Grupo actualizado correctamente",
      grado: actualizado,
    });
  } catch (error) {
    console.error("Error al actualizar grupo:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "Ya existe un grupo con ese nombre",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar el grupo",
    });
  }
};

export const deleteGrados = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede eliminar grupos",
      });
    }

    const grado = await Grados.findOne({
      where: { uuid: req.params.id },
    });

    if (!grado) {
      return res.status(404).json({ msg: "Grupo no encontrado" });
    }

    const [alumnos, asistencias, reportes, tareas] =
      await Promise.all([
        grado.countAlumnos(),
        grado.countAsistencias(),
        grado.countReportes(),
        grado.countTareas(),
      ]);

    if (alumnos || asistencias || reportes || tareas) {
      return res.status(409).json({
        msg: "No se puede eliminar el grupo porque tiene información relacionada",
        relaciones: { alumnos, asistencias, reportes, tareas },
      });
    }

    await grado.destroy();

    return res.status(200).json({
      msg: "Grupo eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar grupo:", error);

    if (esErrorRelacion(error)) {
      return res.status(409).json({
        msg: "No se puede eliminar el grupo porque tiene registros relacionados",
      });
    }

    return res.status(500).json({
      msg: "No fue posible eliminar el grupo",
    });
  }
};
