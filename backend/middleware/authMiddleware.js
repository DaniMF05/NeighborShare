const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Leer el token del encabezado de la petición
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next(); // Continuar a la siguiente función
    } catch (err) {
        res.status(401).json({ msg: 'Token no es válido' });
    }
};