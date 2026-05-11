const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Importamos tu "portero"
const { poolPromise, sql } = require('../db');

// @ruta    POST /api/articulos
// @desc    Crear un nuevo artículo
// @acceso  Privado (Requiere Token)
router.post('/', auth, async (req, res) => {
    const { nombre, descripcion, foto_url, estado } = req.body;

    // 1. Validación de campos obligatorios (Criterio de Aceptación)
    if (!nombre || !descripcion || !foto_url || !estado) {
        return res.status(400).json({ msg: 'Por favor, complete todos los campos obligatorios: nombre, descripción, foto y estado.' });
    }

    try {
        const pool = await poolPromise;

        // 2. Insertar el artículo usando el id del usuario que viene en el TOKEN (req.user.id)
        await pool.request()
            .input('id_duenio', sql.Int, req.user.id) // Extraído automáticamente del middleware
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion)
            .input('foto_url', sql.VarChar, foto_url)
            .input('estado', sql.VarChar, estado)
            .query(`
                INSERT INTO Articulos (id_duenio, nombre, descripcion, foto_url, estado)
                VALUES (@id_duenio, @nombre, @descripcion, @foto_url, @estado)
            `);

        res.status(201).json({ msg: 'Artículo publicado con éxito en el catálogo.' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al intentar publicar el artículo.');
    }
});

// @ruta    GET /api/articulos
// @desc    Obtener todos los artículos (Catálogo)
// @acceso  Público
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM Articulos WHERE disponible = 1'); // Solo mostramos lo disponible

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener el catálogo');
    }
});

// @ruta    GET /api/articulos/:id
// @desc    Obtener un artículo por su ID
// @acceso  Público
router.get('/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Articulos WHERE id_articulo = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Artículo no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener los detalles del artículo');
    }
});

// @ruta    PUT /api/articulos/:id
// @desc    Actualizar un artículo (Solo por el dueño)
// @acceso  Privado
router.put('/:id', auth, async (req, res) => {
    const { nombre, descripcion, foto_url, estado, disponible } = req.body;
    const articuloId = req.params.id;

    try {
        const pool = await poolPromise;

        // 1. Verificar si el artículo existe y quién es el dueño
        const articuloExistente = await pool.request()
            .input('id', sql.Int, articuloId)
            .query('SELECT id_duenio FROM Articulos WHERE id_articulo = @id');

        if (articuloExistente.recordset.length === 0) {
            return res.status(404).json({ msg: 'Artículo no encontrado' });
        }

        // 2. Validación de Seguridad: ¿Es el usuario el dueño?
        if (articuloExistente.recordset[0].id_duenio !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado para editar este artículo' });
        }

        // 3. Ejecutar la actualización
        await pool.request()
            .input('id', sql.Int, articuloId)
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion)
            .input('foto_url', sql.VarChar, foto_url)
            .input('estado', sql.VarChar, estado)
            .input('disponible', sql.Bit, disponible)
            .query(`
                UPDATE Articulos 
                SET nombre = @nombre, 
                    descripcion = @descripcion, 
                    foto_url = @foto_url, 
                    estado = @estado, 
                    disponible = @disponible
                WHERE id_articulo = @id
            `);

        res.json({ msg: 'Artículo actualizado correctamente ✨' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al intentar actualizar el artículo');
    }
});

// @ruta    DELETE /api/articulos/:id
// @desc    Eliminar un artículo (Solo por el dueño)
// @acceso  Privado
router.delete('/:id', auth, async (req, res) => {
    const articuloId = req.params.id;

    try {
        const pool = await poolPromise;

        // 1. Verificar si el artículo existe y quién es el dueño
        const result = await pool.request()
            .input('id', sql.Int, articuloId)
            .query('SELECT id_duenio FROM Articulos WHERE id_articulo = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Artículo no encontrado' });
        }

        // 2. Validación de Seguridad: ¿Es el usuario el dueño?
        if (result.recordset[0].id_duenio !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado para eliminar este artículo' });
        }

        // 3. Ejecutar la eliminación física
        await pool.request()
            .input('id', sql.Int, articuloId)
            .query('DELETE FROM Articulos WHERE id_articulo = @id');

        res.json({ msg: 'Artículo eliminado permanentemente del catálogo 🗑️' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al intentar eliminar el artículo');
    }
});

module.exports = router;