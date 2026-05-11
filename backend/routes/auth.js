const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { poolPromise, sql } = require('../db');

// Ruta: POST /api/auth/register
router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;

    // Validación simple de campos obligatorios
    if (!nombre || !email || !password) {
        return res.status(400).json({ msg: 'Por favor, ingrese todos los campos' });
    }

    try {
        const pool = await poolPromise;

        // 1. Verificar si el usuario ya existe
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // 2. Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Insertar en la base de datos
        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, passwordHash)
            .query('INSERT INTO Usuarios (nombre, email, password_hash) VALUES (@nombre, @email, @password)');

        res.status(201).json({ msg: 'Usuario registrado exitosamente' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
});


const jwt = require('jsonwebtoken');

// Ruta: POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Por favor, ingrese todos los campos' });
    }

    try {
        const pool = await poolPromise;

        // 1. Buscar al usuario por email
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Usuarios WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // 2. Comparar la contraseña enviada con la encriptada en la base
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        // 3. Crear el Token (JWT)
        const payload = {
            user: { id: user.id_usuario }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '8h' }, // El token dura 8 horas
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
});
module.exports = router;

