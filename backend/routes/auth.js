const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../db');

// Ruta: POST /api/auth/register
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validación simple de campos obligatorios
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Por favor, ingrese todos los campos' });
    }

    try {
        const pool = await poolPromise;

        // 1. Verificar si el usuario ya existe
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // 2. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insertar en la base de datos
        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, passwordHash)
            .query('INSERT INTO Usuarios (nombre, email, password_hash) VALUES (@nombre, @email, @password); SELECT SCOPE_IDENTITY() AS id_usuario');

        const userId = result.recordset[0].id_usuario;

        // 4. Crear el Token JWT
        const payload = {
            user: { id: userId }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // 5. Devolver token y datos del usuario
        return res.status(201).json({
            token,
            user: {
                id_usuario: userId,
                nombre,
                email
            }
        });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta: POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Por favor, ingrese todos los campos' });
    }

    try {
        const pool = await poolPromise;

        // 1. Buscar al usuario por email
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ error: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // 2. Comparar la contraseña enviada con la encriptada en la base
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 3. Crear el Token JWT
        const payload = {
            user: { id: user.id_usuario }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        // 4. Devolver token y datos del usuario
        return res.json({
            token,
            user: {
                id_usuario: user.id_usuario,
                nombre: user.nombre,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;