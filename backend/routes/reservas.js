const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Asegurando la ruta corregida
const { poolPromise, sql } = require('../db');

// @ruta    POST /api/reservas
// @desc    Crear una nueva solicitud de reserva (Validando que no haya choques de fechas)
// @acceso  Privado
router.post('/', auth, async (req, res) => {
    const { id_articulo, fecha_inicio, fecha_fin } = req.body;
    const id_solicitante = req.user.id; // Extraído del token por el middleware

    // 1. Validación de campos obligatorios
    if (!id_articulo || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Por favor, proporcione todos los campos: id_articulo, fecha_inicio y fecha_fin.' });
    }

    // 2. Validación de consistencia temporal (Regla de negocio)
    const inicio = new Date(fecha_inicio);
    const fin = new Date(fecha_fin);

    if (inicio >= fin) {
        return res.status(400).json({ error: 'La fecha de inicio debe ser estrictamente anterior a la fecha de fin.' });
    }

    try {
        const pool = await poolPromise;

        // 3. ALGORITMO ANTI-TRASLAPES (HU6)
        // Buscamos si ya existe una reserva ACEPTADA para ese mismo artículo que se cruce con las fechas solicitadas
        const choques = await pool.request()
            .input('id_articulo', sql.Int, id_articulo)
            .input('fecha_inicio', sql.Date, fecha_inicio)
            .input('fecha_fin', sql.Date, fecha_fin)
            .query(`
                SELECT * FROM Reservas 
                WHERE id_articulo = @id_articulo 
                  AND estado_reserva = 'Aceptada'
                  AND (@fecha_inicio <= fecha_fin AND @fecha_fin >= fecha_inicio)
            `);

        if (choques.recordset.length > 0) {
            return res.status(400).json({ 
                error: 'Lo sentimos, este artículo ya está reservado y aceptado en el rango de fechas seleccionado. 📅❌' 
            });
        }

        // 4. Inserción en la Base de Datos si pasó los filtros
        // Usamos 'estado_reserva' tal cual como está en tu diagrama
        await pool.request()
            .input('id_articulo', sql.Int, id_articulo)
            .input('id_solicitante', sql.Int, id_solicitante)
            .input('fecha_inicio', sql.Date, fecha_inicio)
            .input('fecha_fin', sql.Date, fecha_fin)
            .input('estado_reserva', sql.VarChar, 'Pendiente') // Nace como pendiente de aprobación
            .query(`
                INSERT INTO Reservas (id_articulo, id_solicitante, fecha_inicio, fecha_fin, estado_reserva)
                VALUES (@id_articulo, @id_solicitante, @fecha_inicio, @fecha_fin, @estado_reserva)
            `);

        res.status(201).json({ msg: '¡Tu solicitud de reserva ha sido enviada al dueño del objeto! Queda en estado Pendiente. ⏳' });

    } catch (err) {
        console.error('Error al crear reserva:', err);
        res.status(500).json({ error: 'Error interno del servidor al procesar la reserva.' });
    }
});


// @ruta    GET /api/reservas/recibidas
// @desc    Obtener todas las solicitudes de reserva recibidas por el dueño autenticado
// @acceso  Privado
// @ruta    GET /api/reservas/recibidas
// @desc    Obtener todas las solicitudes de reserva recibidas por el dueño autenticado
// @acceso  Privado
router.get('/recibidas', auth, async (req, res) => {
    try {
        const pool = await poolPromise;

        // ¡Ahora sí incluimos r.fecha_creacion con total seguridad!
        const result = await pool.request()
            .input('id_duenio', sql.Int, req.user.id)
            .query(`
                SELECT 
                    r.id_reserva,
                    r.fecha_inicio,
                    r.fecha_fin,
                    r.estado_reserva,
                    r.fecha_creacion, -- <--- Columna de auditoría recuperada
                    a.nombre AS articulo_nombre,
                    a.id_articulo,
                    u.nombre AS solicitante_nombre,
                    u.email AS solicitante_email
                FROM Reservas r
                INNER JOIN Articulos a ON r.id_articulo = a.id_articulo
                INNER JOIN Usuarios u ON r.id_solicitante = u.id_usuario
                WHERE a.id_duenio = @id_duenio
                ORDER BY r.fecha_creacion DESC -- <--- Ordenamos cronológicamente por creación
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error('Error al obtener reservas recibidas:', err);
        res.status(500).json({ error: 'Error al obtener las solicitudes de reserva.' });
    }
});

// @ruta    PUT /api/reservas/:id/estado
// @desc    Aceptar o Rechazar una solicitud de reserva (Solo por el dueño del artículo)
// @acceso  Privado
router.put('/:id/estado', auth, async (req, res) => {
    const id_reserva = req.params.id;
    const { nuevo_estado } = req.body; // Debería recibir 'Aceptada' o 'Rechazada'

    // 1. Validar el estado entrante
    if (!['Aceptada', 'Rechazada'].includes(nuevo_estado)) {
        return res.status(400).json({ error: 'Estado no válido. Solo se permite Aceptada o Rechazada.' });
    }

    try {
        const pool = await poolPromise;

        // 2. Validación de Seguridad: Verificar si la reserva existe y si el artículo pertenece al usuario logueado
        const reservaCheck = await pool.request()
            .input('id_reserva', sql.Int, id_reserva)
            .query(`
                SELECT a.id_duenio 
                FROM Reservas r
                INNER JOIN Articulos a ON r.id_articulo = a.id_articulo
                WHERE r.id_reserva = @id_reserva
            `);

        if (reservaCheck.recordset.length === 0) {
            return res.status(404).json({ error: 'Solicitud de reserva no encontrada.' });
        }

        if (reservaCheck.recordset[0].id_duenio !== req.user.id) {
            return res.status(401).json({ error: 'No autorizado. No eres el dueño del artículo de esta reserva.' });
        }

        // 3. Actualizar el estado de la reserva
        await pool.request()
            .input('id_reserva', sql.Int, id_reserva)
            .input('estado_reserva', sql.VarChar, nuevo_estado)
            .query(`
                UPDATE Reservas 
                SET estado_reserva = @estado_reserva 
                WHERE id_reserva = @id_reserva
            `);

        res.json({ msg: `La reserva ha sido ${nuevo_estado.toLowerCase()} con éxito. ✔️` });

    } catch (err) {
        console.error('Error al actualizar estado de la reserva:', err);
        res.status(500).json({ error: 'Error interno al procesar la decisión.' });
    }
});

module.exports = router;