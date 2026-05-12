const express = require('express');
const cors = require('cors');
const { poolPromise } = require('./db'); // Importamos la conexión
require('dotenv').config();
const app = express();
const authRoutes = require('./routes/auth');
const articulosRoutes = require('./routes/articulos');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes); // Rutas de autenticación
app.use('/api/articulos', articulosRoutes); // Rutas de artículos

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API de NeighborShare funcionando 🚀');
});

// Ruta para verificar la base de datos (Prueba rápida)
app.get('/test-db', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT 1 + 1 AS resultado');
        res.json({ status: 'Base de datos activa', data: result.recordset });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
//test