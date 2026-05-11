const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_NAME,
    options: {
        encrypt: true, // Para Azure o conexiones seguras
        trustServerCertificate: true // Necesario para conexiones locales en SSMS
    }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Conectado a SQL Server correctamente ✅');
        return pool;
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos ❌:', err);
        process.exit(1);
    });

module.exports = {
    sql,
    poolPromise
};