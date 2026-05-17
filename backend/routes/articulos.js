const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware'); // Importamos tu "portero"
const { poolPromise, sql } = require('../db');
const multer = require('multer');
const path = require('path');

// ==========================================
// CONFIGURACIÓN DE MULTER (Subida de archivos)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de tener esta carpeta creada en la raíz del backend
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const fileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite 5MB
});


// ==========================================
// RUTAS DEL CATÁLOGO
// ==========================================

// @ruta    POST /api/articulos
// @desc    Crear un nuevo artículo con imagen local
// @acceso  Privado (Requiere Token)
router.post('/', auth, upload.single('foto'), async (req, res) => {
    const { nombre, descripcion, estado, disponible } = req.body;

    // 1. Validación de campos de texto
    if (!nombre || !descripcion || !estado) {
        return res.status(400).json({ error: 'Por favor, complete todos los campos obligatorios.' });
    }

    // 2. Validación de archivo físico
    if (!req.file) {
        return res.status(400).json({ error: 'Por favor, suba una imagen para el artículo.' });
    }

    // 3. Construimos la URL local de la imagen
    const foto_url = `http://localhost:3000/uploads/${req.file.filename}`;

    try {
        const pool = await poolPromise;

        await pool.request()
            .input('id_duenio', sql.Int, req.user.id) 
            .input('nombre', sql.VarChar, nombre)
            .input('descripcion', sql.VarChar, descripcion)
            .input('foto_url', sql.VarChar, foto_url)
            .input('estado', sql.VarChar, estado)
            .input('disponible', sql.Bit, disponible ?? true) // Por defecto true
            .query(`
                INSERT INTO Articulos (id_duenio, nombre, descripcion, foto_url, estado, disponible)
                VALUES (@id_duenio, @nombre, @descripcion, @foto_url, @estado, @disponible)
            `);

        res.status(201).json({ 
            msg: 'Artículo publicado con éxito en el catálogo.',
            foto_url: foto_url
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al intentar publicar el artículo.' });
    }
});

// @ruta    GET /api/articulos
// @desc    Obtener todos los artículos (Catálogo)
// @acceso  Público
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT * FROM Articulos WHERE disponible = 1'); 

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener el catálogo' });
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
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener los detalles del artículo' });
    }
});

// @ruta    PUT /api/articulos/:id
// @desc    Actualizar un artículo (Soporta actualización de imagen)
// @acceso  Privado
router.put('/:id', auth, upload.single('foto'), async (req, res) => {
    const { nombre, descripcion, estado, disponible } = req.body;
    let { foto_url } = req.body; // Capturamos la URL vieja en caso de que no suba una nueva
    const articuloId = req.params.id;

    // Si el usuario seleccionó un archivo nuevo, sobreescribimos foto_url
    if (req.file) {
        foto_url = `http://localhost:3000/uploads/${req.file.filename}`;
    }

    try {
        const pool = await poolPromise;

        // 1. Verificar si el artículo existe y quién es el dueño
        const articuloExistente = await pool.request()
            .input('id', sql.Int, articuloId)
            .query('SELECT id_duenio FROM Articulos WHERE id_articulo = @id');

        if (articuloExistente.recordset.length === 0) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        // 2. Validación de Seguridad
        if (articuloExistente.recordset[0].id_duenio !== req.user.id) {
            return res.status(401).json({ error: 'No autorizado para editar este artículo' });
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

        res.json({ msg: 'Artículo actualizado correctamente ✨', foto_url });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al intentar actualizar el artículo' });
    }
});

// @ruta    DELETE /api/articulos/:id
// @desc    Eliminar un artículo (Solo por el dueño)
// @acceso  Privado
router.delete('/:id', auth, async (req, res) => {
    const articuloId = req.params.id;

    try {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, articuloId)
            .query('SELECT id_duenio FROM Articulos WHERE id_articulo = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Artículo no encontrado' });
        }

        if (result.recordset[0].id_duenio !== req.user.id) {
            return res.status(401).json({ error: 'No autorizado para eliminar este artículo' });
        }

        await pool.request()
            .input('id', sql.Int, articuloId)
            .query('DELETE FROM Articulos WHERE id_articulo = @id');

        res.json({ msg: 'Artículo eliminado permanentemente del catálogo 🗑️' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al intentar eliminar el artículo' });
    }
});

module.exports = router;