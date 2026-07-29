import db, {
  Alumnos,
  Grados,
  Users,
} from "../models/index.js";
import { Op } from "sequelize";
import {
  ROLES,
  enteroPositivo,
  esErrorRelacion,
  esErrorUnico,
  maestroPuedeGestionarAlumno,
  normalizarIds,
} from "../utils/controllerUtils.js";

const atributosAlumno = [
  "id",
  "uuid",
  "nombre",
  "apellido",
  "matricula",
  "tutor",
  "telefonoTutor",
  "userId",
];

const gradoConMaestro = {
  model: Grados,
  as: "grados",
  attributes: ["id", "uuid", "nombre", "maestroId"],
  through: { attributes: [] },
  include: [
    {
      model: Users,
      as: "maestro",
      attributes: ["id", "uuid", "name", "email", "role"],
      required: false,
    },
  ],
};

const buscarAlumno = (uuid, transaction) =>
  Alumnos.findOne({
    where: { uuid },
    attributes: atributosAlumno,
    include: [gradoConMaestro],
    transaction,
  });

const validarGrados = async (
  gradoIds,
  role,
  userId,
  transaction,
) => {
  const grados = await Grados.findAll({
    where: { id: { [Op.in]: gradoIds } },
    attributes: ["id", "nombre", "maestroId"],
    transaction,
  });

  if (grados.length !== gradoIds.length) {
    return {
      status: 400,
      msg: "Uno o más grupos seleccionados no existen",
    };
  }

  const sinMaestro = grados.find((grado) => !grado.maestroId);

  if (sinMaestro) {
    return {
      status: 400,
      msg: `El grupo ${sinMaestro.nombre} no tiene un maestro responsable`,
    };
  }

  if (
    role === ROLES.MAESTRO &&
    grados.some(
      (grado) => Number(grado.maestroId) !== Number(userId),
    )
  ) {
    return {
      status: 403,
      msg: "No puedes asignar alumnos a grupos de otro maestro",
    };
  }

  return null;
};

export const getAlumnos = async (req, res) => {
  try {
    const { role, userId } = req;
    let where = {};
    let include = [gradoConMaestro];

    if (role === ROLES.ALUMNO) {
      where = { userId };
    } else if (role === ROLES.MAESTRO) {
      include = [
        {
          ...gradoConMaestro,
          where: { maestroId: userId },
          required: true,
        },
      ];
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar alumnos",
      });
    }

    const alumnos = await Alumnos.findAll({
      attributes: atributosAlumno,
      where,
      include,
      order: [
        ["apellido", "ASC"],
        ["nombre", "ASC"],
      ],
    });

    return res.status(200).json(alumnos);
  } catch (error) {
    console.error("Error al obtener alumnos:", error);
    return res.status(500).json({ msg: "No fue posible obtener los alumnos" });
  }
};

export const getAlumnoById = async (req, res) => {
  try {
    const alumno = await buscarAlumno(req.params.id);

    if (!alumno) {
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    if (
      req.role === ROLES.ALUMNO &&
      Number(alumno.userId) !== Number(req.userId)
    ) {
      return res.status(403).json({
        msg: "No puedes consultar perfiles de otros alumnos",
      });
    }

    if (req.role === ROLES.MAESTRO) {
      const permitido = alumno.grados?.some(
        (grado) =>
          Number(grado.maestroId) === Number(req.userId),
      );

      if (!permitido) {
        return res.status(403).json({
          msg: "El alumno no pertenece a uno de tus grupos",
        });
      }
    } else if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.ALUMNO
    ) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar este alumno",
      });
    }

    return res.status(200).json(alumno);
  } catch (error) {
    console.error("Error al obtener alumno:", error);
    return res.status(500).json({ msg: "No fue posible obtener el alumno" });
  }
};

export const createAlumnos = async (req, res) => {
  const transaction = await db.transaction();

  try {
    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      await transaction.rollback();
      return res.status(403).json({
        msg: "No tienes permiso para registrar alumnos",
      });
    }

    const {
      nombre,
      apellido,
      matricula,
      tutor,
      telefonoTutor,
      gradoId,
      gradoIds,
      userId,
    } = req.body;

    const usuarioId = enteroPositivo(userId);
    const grupos = normalizarIds(gradoId, gradoIds);

    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      typeof matricula !== "string" ||
      !matricula.trim() ||
      typeof tutor !== "string" ||
      !tutor.trim() ||
      !usuarioId ||
      !grupos
    ) {
      await transaction.rollback();
      return res.status(400).json({
        msg: "Nombre, matrícula, tutor, usuario y grupo son obligatorios",
      });
    }

    const [usuario, perfilExistente, matriculaExistente] =
      await Promise.all([
        Users.findOne({
          where: { id: usuarioId, role: ROLES.ALUMNO },
          attributes: ["id"],
          transaction,
        }),
        Alumnos.findOne({
          where: { userId: usuarioId },
          attributes: ["id"],
          transaction,
        }),
        Alumnos.findOne({
          where: { matricula: matricula.trim() },
          attributes: ["id"],
          transaction,
        }),
      ]);

    if (!usuario) {
      await transaction.rollback();
      return res.status(400).json({
        msg: "El usuario seleccionado no existe o no tiene rol de alumno",
      });
    }

    if (perfilExistente) {
      await transaction.rollback();
      return res.status(409).json({
        msg: "El usuario ya está vinculado con un perfil de alumno",
      });
    }

    if (matriculaExistente) {
      await transaction.rollback();
      return res.status(409).json({
        msg: "La matrícula ya está registrada",
      });
    }

    const errorGrados = await validarGrados(
      grupos,
      req.role,
      req.userId,
      transaction,
    );

    if (errorGrados) {
      await transaction.rollback();
      return res
        .status(errorGrados.status)
        .json({ msg: errorGrados.msg });
    }

    const nuevoAlumno = await Alumnos.create(
      {
        nombre: nombre.trim(),
        apellido:
          typeof apellido === "string" ? apellido.trim() : "",
        matricula: matricula.trim(),
        tutor: tutor.trim(),
        telefonoTutor:
          typeof telefonoTutor === "string" && telefonoTutor.trim()
            ? telefonoTutor.trim()
            : null,
        userId: usuarioId,
      },
      { transaction },
    );

    await nuevoAlumno.setGrados(grupos, { transaction });
    await transaction.commit();

    const alumnoCreado = await buscarAlumno(nuevoAlumno.uuid);

    return res.status(201).json({
      msg: "Alumno registrado y asignado correctamente",
      alumno: alumnoCreado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error al crear alumno:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "La matrícula o el usuario ya están registrados",
      });
    }

    return res.status(500).json({ msg: "No fue posible crear el alumno" });
  }
};

export const updateAlumnos = async (req, res) => {
  const transaction = await db.transaction();

  try {
    if (
      req.role !== ROLES.ADMINISTRADOR &&
      req.role !== ROLES.MAESTRO
    ) {
      await transaction.rollback();
      return res.status(403).json({
        msg: "No tienes permiso para actualizar alumnos",
      });
    }

    const alumno = await Alumnos.findOne({
      where: { uuid: req.params.id },
      include: [
        {
          model: Grados,
          as: "grados",
          attributes: ["id", "maestroId"],
          through: { attributes: [] },
        },
      ],
      transaction,
    });

    if (!alumno) {
      await transaction.rollback();
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    if (
      req.role === ROLES.MAESTRO &&
      !(await maestroPuedeGestionarAlumno(
        req.userId,
        alumno.id,
        { transaction },
      ))
    ) {
      await transaction.rollback();
      return res.status(403).json({
        msg: "El alumno no pertenece a uno de tus grupos",
      });
    }

    const {
      nombre,
      apellido,
      matricula,
      tutor,
      telefonoTutor,
      gradoId,
      gradoIds,
    } = req.body;

    const updateData = {};
    const seEnviaronGrados =
      gradoId !== undefined || gradoIds !== undefined;
    const grupos = seEnviaronGrados
      ? normalizarIds(gradoId, gradoIds)
      : null;

    if (nombre !== undefined) {
      if (typeof nombre !== "string" || !nombre.trim()) {
        await transaction.rollback();
        return res.status(400).json({ msg: "El nombre es obligatorio" });
      }
      updateData.nombre = nombre.trim();
    }

    if (apellido !== undefined) {
      if (typeof apellido !== "string") {
        await transaction.rollback();
        return res.status(400).json({ msg: "El apellido no es válido" });
      }
      updateData.apellido = apellido.trim();
    }

    if (matricula !== undefined) {
      if (typeof matricula !== "string" || !matricula.trim()) {
        await transaction.rollback();
        return res.status(400).json({ msg: "La matrícula es obligatoria" });
      }
      updateData.matricula = matricula.trim();
    }

    if (tutor !== undefined) {
      if (typeof tutor !== "string" || !tutor.trim()) {
        await transaction.rollback();
        return res.status(400).json({ msg: "El tutor es obligatorio" });
      }
      updateData.tutor = tutor.trim();
    }

    if (telefonoTutor !== undefined) {
      updateData.telefonoTutor =
        typeof telefonoTutor === "string" && telefonoTutor.trim()
          ? telefonoTutor.trim()
          : null;
    }

    if (
      Object.keys(updateData).length === 0 &&
      !seEnviaronGrados
    ) {
      await transaction.rollback();
      return res.status(400).json({
        msg: "No se proporcionaron datos para actualizar",
      });
    }

    if (seEnviaronGrados) {
      if (!grupos) {
        await transaction.rollback();
        return res.status(400).json({
          msg: "Debes seleccionar al menos un grupo válido",
        });
      }

      const errorGrados = await validarGrados(
        grupos,
        req.role,
        req.userId,
        transaction,
      );

      if (errorGrados) {
        await transaction.rollback();
        return res
          .status(errorGrados.status)
          .json({ msg: errorGrados.msg });
      }
    }

    if (Object.keys(updateData).length > 0) {
      await alumno.update(updateData, { transaction });
    }

    if (seEnviaronGrados) {
      if (req.role === ROLES.ADMINISTRADOR) {
        await alumno.setGrados(grupos, { transaction });
      } else {
        const gruposAjenos = alumno.grados
          .filter(
            (grado) =>
              Number(grado.maestroId) !== Number(req.userId),
          )
          .map((grado) => Number(grado.id));

        await alumno.setGrados(
          [...new Set([...gruposAjenos, ...grupos])],
          { transaction },
        );
      }
    }

    await transaction.commit();
    const alumnoActualizado = await buscarAlumno(alumno.uuid);

    return res.status(200).json({
      msg: "Alumno actualizado correctamente",
      alumno: alumnoActualizado,
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error al actualizar alumno:", error);

    if (esErrorUnico(error)) {
      return res.status(409).json({
        msg: "La matrícula ya está registrada",
      });
    }

    return res.status(500).json({
      msg: "No fue posible actualizar el alumno",
    });
  }
};

export const deleteAlumnos = async (req, res) => {
  try {
    if (req.role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "Solo un administrador puede eliminar alumnos",
      });
    }

    const alumno = await Alumnos.findOne({
      where: { uuid: req.params.id },
    });

    if (!alumno) {
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    const [asistencias, incidencias, reportes] = await Promise.all([
      alumno.countAsistencias(),
      alumno.countIncidencias(),
      alumno.countReportes(),
    ]);

    if (asistencias || incidencias || reportes) {
      return res.status(409).json({
        msg: "No se puede eliminar el alumno porque tiene historial relacionado",
        relaciones: { asistencias, incidencias, reportes },
      });
    }

    await alumno.destroy();

    return res.status(200).json({
      msg: "Perfil de alumno eliminado correctamente; el usuario permanece activo",
    });
  } catch (error) {
    console.error("Error al eliminar alumno:", error);

    if (esErrorRelacion(error)) {
      return res.status(409).json({
        msg: "No se puede eliminar el alumno porque tiene registros relacionados",
      });
    }

    return res.status(500).json({
      msg: "No fue posible eliminar el alumno",
    });
  }
};
