import { Op } from "sequelize";
import {
  Alumnos,
  Grados,
  Incidencia,
  Users,
} from "../models/index.js";

import {
  ROLES,
  alumnoPerteneceAlGrado,
  enteroPositivo,
  esFechaValida,
  obtenerGradosIdsDelMaestro,
  obtenerPerfilAlumno,
} from "../utils/controllerUtils.js";

const atributos = [
  "id",
  "uuid",
  "tipo",
  "descripcion",
  "fecha",
  "alumnoId",
  "gradoId",
  "maestroId",
];

const relaciones = [
  {
    model: Alumnos,
    as: "alumno",
    attributes: [
      "id",
      "uuid",
      "nombre",
      "apellido",
      "matricula",
      "tutor",
      "telefonoTutor",
    ],
  },
  {
    model: Grados,
    as: "grado",
    attributes: [
      "id",
      "uuid",
      "nombre",
      "maestroId",
    ],
  },
  {
    model: Users,
    as: "maestro",
    attributes: [
      "id",
      "uuid",
      "name",
      "email",
    ],
  },
];

/**
 * Obtiene la fecha actual de acuerdo con la zona horaria
 * de Lerdo y Gómez Palacio.
 */
const fechaHoyMonterrey = () => {
  const partes = new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const obtener = (tipo) =>
    partes.find((parte) => parte.type === tipo)?.value;

  return `${obtener("year")}-${obtener("month")}-${obtener("day")}`;
};

/**
 * Busca una incidencia por UUID e incluye sus relaciones.
 */
const buscarIncidencia = (uuid) =>
  Incidencia.findOne({
    where: {
      uuid,
    },
    attributes: atributos,
    include: relaciones,
  });

/**
 * Comprueba que un grupo pertenezca al maestro indicado.
 */
const maestroGestionaGrado = async (maestroId, gradoId) => {
  const grado = await Grados.findOne({
    where: {
      id: gradoId,
      maestroId,
    },
    attributes: ["id"],
  });

  return Boolean(grado);
};

/**
 * Obtiene los grupos en los que está inscrito un alumno.
 */
const obtenerGradosIdsDelAlumno = async (alumnoId) => {
  const grados = await Grados.findAll({
    attributes: ["id"],
    include: [
      {
        model: Alumnos,
        as: "alumnos",
        attributes: [],
        where: { id: alumnoId },
        through: { attributes: [] },
        required: true,
      },
    ],
  });

  return grados.map((grado) => Number(grado.id));
};

/**
 * Valida los permisos para consultar una incidencia.
 */
const validarAccesoLectura = async (
  incidencia,
  role,
  userId,
) => {
  if (role === ROLES.ADMINISTRADOR) {
    return null;
  }

  if (role === ROLES.MAESTRO) {
    const permitido = await maestroGestionaGrado(
      userId,
      incidencia.gradoId,
    );

    if (permitido) {
      return null;
    }

    return {
      status: 403,
      msg: "Esta incidencia no pertenece a uno de tus grupos",
    };
  }

  if (role === ROLES.ALUMNO) {
    const perfil = await obtenerPerfilAlumno(userId);

    if (!perfil) {
      return {
        status: 404,
        msg: "Perfil de alumno no encontrado",
      };
    }

    const esIndividual =
      incidencia.alumnoId !== null &&
      Number(perfil.id) === Number(incidencia.alumnoId);

    const esGrupal =
      incidencia.alumnoId === null &&
      (await alumnoPerteneceAlGrado(
        perfil.id,
        incidencia.gradoId,
      ));

    if (esIndividual || esGrupal) {
      return null;
    }

    return {
      status: 403,
      msg: "No puedes consultar incidencias de otro alumno",
    };
  }

  return {
    status: 403,
    msg: "No tienes permiso para consultar incidencias",
  };
};

/**
 * Valida los permisos para editar o eliminar una incidencia.
 */
const validarAccesoEscritura = async (
  incidencia,
  role,
  userId,
) => {
  if (role === ROLES.ADMINISTRADOR) {
    return null;
  }

  if (role !== ROLES.MAESTRO) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar incidencias",
    };
  }

  if (Number(incidencia.maestroId) !== Number(userId)) {
    return {
      status: 403,
      msg: "Sólo el maestro que registró la incidencia puede modificarla",
    };
  }

  const permitido = await maestroGestionaGrado(
    userId,
    incidencia.gradoId,
  );

  if (permitido) {
    return null;
  }

  return {
    status: 403,
    msg: "Esta incidencia ya no pertenece a uno de tus grupos",
  };
};

/**
 * Valida el grupo, el acceso del maestro y, cuando la
 * incidencia es individual, la pertenencia del alumno.
 */
const validarAlumnoYGradoParaStaff = async ({
  alumnoId,
  gradoId,
  role,
  userId,
}) => {
  if (
    role !== ROLES.MAESTRO &&
    role !== ROLES.ADMINISTRADOR
  ) {
    return {
      status: 403,
      msg: "No tienes permiso para administrar incidencias",
    };
  }

  if (!gradoId) {
    return {
      status: 400,
      msg: "El grupo es obligatorio",
    };
  }

  const [alumno, grado] = await Promise.all([
    alumnoId === null
      ? Promise.resolve(null)
      : Alumnos.findByPk(alumnoId, {
          attributes: ["id"],
        }),
    Grados.findByPk(gradoId, {
      attributes: [
        "id",
        "maestroId",
      ],
    }),
  ]);

  if (alumnoId !== null && !alumno) {
    return {
      status: 404,
      msg: "Alumno no encontrado",
    };
  }

  if (!grado) {
    return {
      status: 404,
      msg: "Grupo no encontrado",
    };
  }

  if (
    role === ROLES.MAESTRO &&
    Number(grado.maestroId) !== Number(userId)
  ) {
    return {
      status: 403,
      msg: "No puedes administrar incidencias en otro grupo",
    };
  }

  if (alumnoId !== null) {
    const pertenece = await alumnoPerteneceAlGrado(
      alumnoId,
      gradoId,
    );

    if (!pertenece) {
      return {
        status: 400,
        msg: "El alumno no pertenece al grupo seleccionado",
      };
    }
  }

  return null;
};

/**
 * Valida cadenas obligatorias y su longitud máxima.
 */
const validarTextoObligatorio = (
  valor,
  nombre,
  longitudMaxima,
) => {
  if (typeof valor !== "string" || !valor.trim()) {
    return `${nombre} es obligatorio`;
  }

  if (
    longitudMaxima &&
    valor.trim().length > longitudMaxima
  ) {
    return `${nombre} no puede superar ${longitudMaxima} caracteres`;
  }

  return null;
};

/**
 * GET /incidencias
 *
 * Administrador: consulta todas.
 * Maestro: consulta las incidencias de sus grupos.
 * Alumno: consulta solamente sus incidencias.
 */
export const getIncidencias = async (req, res) => {
  try {
    const { role, userId } = req;
    const where = {};

    let gradosIdsDelMaestro = [];
    let gradosIdsDelAlumno = [];

    if (role === ROLES.ALUMNO) {
      const perfil = await obtenerPerfilAlumno(userId);

      if (!perfil) {
        return res.status(404).json({
          msg: "Perfil de alumno no encontrado",
        });
      }

      gradosIdsDelAlumno =
        await obtenerGradosIdsDelAlumno(perfil.id);

      where[Op.or] = [
        { alumnoId: perfil.id },
        {
          alumnoId: null,
          gradoId: {
            [Op.in]: gradosIdsDelAlumno,
          },
        },
      ];
    } else if (role === ROLES.MAESTRO) {
      gradosIdsDelMaestro =
        await obtenerGradosIdsDelMaestro(userId);

      where.gradoId = {
        [Op.in]: gradosIdsDelMaestro,
      };
    } else if (role !== ROLES.ADMINISTRADOR) {
      return res.status(403).json({
        msg: "No tienes permiso para consultar incidencias",
      });
    }

    /*
     * Filtro por alumno
     */
    if (req.query.alumnoId !== undefined) {
      const alumnoId = enteroPositivo(
        req.query.alumnoId,
      );

      if (!alumnoId) {
        return res.status(400).json({
          msg: "El alumnoId no es válido",
        });
      }

      if (
        role === ROLES.ALUMNO &&
        Number(where.alumnoId) !== alumnoId
      ) {
        return res.status(403).json({
          msg: "No puedes consultar incidencias de otro alumno",
        });
      }

      where.alumnoId = alumnoId;
    }

    /*
     * Filtro por grupo
     */
    if (req.query.gradoId !== undefined) {
      const gradoId = enteroPositivo(
        req.query.gradoId,
      );

      if (!gradoId) {
        return res.status(400).json({
          msg: "El gradoId no es válido",
        });
      }

      if (
        role === ROLES.MAESTRO &&
        !gradosIdsDelMaestro.includes(gradoId)
      ) {
        return res.status(403).json({
          msg: "No puedes consultar incidencias de otro grupo",
        });
      }

      if (
        role === ROLES.ALUMNO &&
        !gradosIdsDelAlumno.includes(gradoId)
      ) {
        return res.status(403).json({
          msg: "No puedes consultar incidencias de otro grupo",
        });
      }

      where.gradoId = gradoId;
    }

    /*
     * Filtro por maestro creador
     */
    if (req.query.maestroId !== undefined) {
      const maestroId = enteroPositivo(
        req.query.maestroId,
      );

      if (!maestroId) {
        return res.status(400).json({
          msg: "El maestroId no es válido",
        });
      }

      if (
        role !== ROLES.ADMINISTRADOR &&
        Number(userId) !== maestroId
      ) {
        return res.status(403).json({
          msg: "No puedes filtrar incidencias de otro maestro",
        });
      }

      where.maestroId = maestroId;
    }

    /*
     * Filtros por fecha
     */
    const { desde, hasta } = req.query;

    if (
      desde !== undefined &&
      !esFechaValida(desde)
    ) {
      return res.status(400).json({
        msg: "La fecha desde no es válida",
      });
    }

    if (
      hasta !== undefined &&
      !esFechaValida(hasta)
    ) {
      return res.status(400).json({
        msg: "La fecha hasta no es válida",
      });
    }

    if (desde && hasta && desde > hasta) {
      return res.status(400).json({
        msg: "La fecha desde no puede ser posterior a la fecha hasta",
      });
    }

    if (desde && hasta) {
      where.fecha = {
        [Op.between]: [
          desde,
          hasta,
        ],
      };
    } else if (desde) {
      where.fecha = {
        [Op.gte]: desde,
      };
    } else if (hasta) {
      where.fecha = {
        [Op.lte]: hasta,
      };
    }

    /*
     * Filtro por tipo
     */
    if (
      typeof req.query.tipo === "string" &&
      req.query.tipo.trim()
    ) {
      where.tipo = req.query.tipo.trim();
    }

    const lista = await Incidencia.findAll({
      where,
      attributes: atributos,
      include: relaciones,
      order: [
        ["fecha", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.status(200).json(lista);
  } catch (error) {
    console.error(
      "Error al obtener incidencias:",
      error,
    );

    return res.status(500).json({
      msg: "No fue posible obtener las incidencias",
    });
  }
};

/**
 * GET /incidencias/:id
 */
export const getIncidenciasById = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(
      req.params.id,
    );

    if (!incidencia) {
      return res.status(404).json({
        msg: "Incidencia no encontrada",
      });
    }

    const errorAcceso = await validarAccesoLectura(
      incidencia,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({
          msg: errorAcceso.msg,
        });
    }

    return res.status(200).json(incidencia);
  } catch (error) {
    console.error(
      "Error al obtener incidencia:",
      error,
    );

    return res.status(500).json({
      msg: "No fue posible obtener la incidencia",
    });
  }
};

/**
 * POST /incidencias
 */
export const createIncidencias = async (req, res) => {
  try {
    const { tipo, descripcion } = req.body;

    const fecha =
      req.body.fecha || fechaHoyMonterrey();

    const alumnoId =
      req.body.alumnoId === null
        ? null
        : enteroPositivo(req.body.alumnoId);

    const gradoId = enteroPositivo(
      req.body.gradoId,
    );

    if (req.body.alumnoId !== null && !alumnoId) {
      return res.status(400).json({
        msg: "El alumnoId debe ser un entero positivo o null para una incidencia grupal",
      });
    }

    const errorTipo = validarTextoObligatorio(
      tipo,
      "El tipo de incidencia",
      100,
    );

    if (errorTipo) {
      return res.status(400).json({
        msg: errorTipo,
      });
    }

    const errorDescripcion =
      validarTextoObligatorio(
        descripcion,
        "La descripción",
      );

    if (errorDescripcion) {
      return res.status(400).json({
        msg: errorDescripcion,
      });
    }

    if (!esFechaValida(fecha)) {
      return res.status(400).json({
        msg: "La fecha no es válida",
      });
    }

    const errorDestino =
      await validarAlumnoYGradoParaStaff({
        alumnoId,
        gradoId,
        role: req.role,
        userId: req.userId,
      });

    if (errorDestino) {
      return res
        .status(errorDestino.status)
        .json({
          msg: errorDestino.msg,
        });
    }

    const creada = await Incidencia.create({
      tipo: tipo.trim(),
      descripcion: descripcion.trim(),
      fecha,
      alumnoId,
      gradoId,

      // El maestroId no debe recibirse desde el frontend.
      // Se obtiene del usuario autenticado.
      maestroId: req.userId,
    });

    const incidencia = await buscarIncidencia(
      creada.uuid,
    );

    return res.status(201).json({
      msg: "Incidencia creada correctamente",
      incidencia,
    });
  } catch (error) {
    console.error(
      "Error al crear incidencia:",
      error,
    );

    return res.status(500).json({
      msg: "No fue posible crear la incidencia",
    });
  }
};

/**
 * PATCH /incidencias/:id
 */
export const updateIncidencias = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(
      req.params.id,
    );

    if (!incidencia) {
      return res.status(404).json({
        msg: "Incidencia no encontrada",
      });
    }

    const errorAcceso = await validarAccesoEscritura(
      incidencia,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({
          msg: errorAcceso.msg,
        });
    }

    /*
     * El maestro creador no se puede modificar.
     */
    if (req.body.maestroId !== undefined) {
      return res.status(400).json({
        msg: "El maestro creador de la incidencia no se puede cambiar",
      });
    }

    const camposPermitidos = [
      "tipo",
      "descripcion",
      "fecha",
      "alumnoId",
      "gradoId",
    ];

    const tieneCamposPermitidos =
      camposPermitidos.some(
        (campo) => req.body[campo] !== undefined,
      );

    if (!tieneCamposPermitidos) {
      return res.status(400).json({
        msg: "No se proporcionaron datos válidos para actualizar",
      });
    }

    const updateData = {};

    /*
     * Validar tipo
     */
    if (req.body.tipo !== undefined) {
      const errorTipo = validarTextoObligatorio(
        req.body.tipo,
        "El tipo de incidencia",
        100,
      );

      if (errorTipo) {
        return res.status(400).json({
          msg: errorTipo,
        });
      }

      updateData.tipo = req.body.tipo.trim();
    }

    /*
     * Validar descripción
     */
    if (req.body.descripcion !== undefined) {
      const errorDescripcion =
        validarTextoObligatorio(
          req.body.descripcion,
          "La descripción",
        );

      if (errorDescripcion) {
        return res.status(400).json({
          msg: errorDescripcion,
        });
      }

      updateData.descripcion =
        req.body.descripcion.trim();
    }

    /*
     * Validar fecha
     */
    if (req.body.fecha !== undefined) {
      if (!esFechaValida(req.body.fecha)) {
        return res.status(400).json({
          msg: "La fecha no es válida",
        });
      }

      updateData.fecha = req.body.fecha;
    }

    /*
     * Si no se recibe alumnoId o gradoId,
     * conserva los valores actuales.
     */
    const alumnoIdActual =
      incidencia.alumnoId === null
        ? null
        : Number(incidencia.alumnoId);

    const alumnoId =
      req.body.alumnoId === undefined
        ? alumnoIdActual
        : req.body.alumnoId === null
          ? null
          : enteroPositivo(req.body.alumnoId);

    if (
      req.body.alumnoId !== undefined &&
      req.body.alumnoId !== null &&
      !alumnoId
    ) {
      return res.status(400).json({
        msg: "El alumnoId debe ser un entero positivo o null para una incidencia grupal",
      });
    }

    const gradoId =
      req.body.gradoId !== undefined
        ? enteroPositivo(req.body.gradoId)
        : Number(incidencia.gradoId);

    const errorDestino =
      await validarAlumnoYGradoParaStaff({
        alumnoId,
        gradoId,
        role: req.role,
        userId: req.userId,
      });

    if (errorDestino) {
      return res
        .status(errorDestino.status)
        .json({
          msg: errorDestino.msg,
        });
    }

    if (req.body.alumnoId !== undefined) {
      updateData.alumnoId = alumnoId;
    }

    if (req.body.gradoId !== undefined) {
      updateData.gradoId = gradoId;
    }

    await incidencia.update(updateData);

    const actualizada = await buscarIncidencia(
      incidencia.uuid,
    );

    return res.status(200).json({
      msg: "Incidencia actualizada correctamente",
      incidencia: actualizada,
    });
  } catch (error) {
    console.error(
      "Error al actualizar incidencia:",
      error,
    );

    return res.status(500).json({
      msg: "No fue posible actualizar la incidencia",
    });
  }
};

/**
 * DELETE /incidencias/:id
 */
export const deleteIncidencias = async (req, res) => {
  try {
    const incidencia = await buscarIncidencia(
      req.params.id,
    );

    if (!incidencia) {
      return res.status(404).json({
        msg: "Incidencia no encontrada",
      });
    }

    const errorAcceso = await validarAccesoEscritura(
      incidencia,
      req.role,
      req.userId,
    );

    if (errorAcceso) {
      return res
        .status(errorAcceso.status)
        .json({
          msg: errorAcceso.msg,
        });
    }

    await incidencia.destroy();

    return res.status(200).json({
      msg: "Incidencia eliminada correctamente",
    });
  } catch (error) {
    console.error(
      "Error al eliminar incidencia:",
      error,
    );

    return res.status(500).json({
      msg: "No fue posible eliminar la incidencia",
    });
  }
};