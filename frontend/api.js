const API_BASE_URL = "http://localhost:3000/api";

const apiService = {
    // 1. Módulo Auth
    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    password: password.trim() 
                })
            });
            const data = await res.json();
            console.log('Login response:', data, 'Status:', res.ok);
            if (res.ok && data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error en login:', error);
            return { ok: false, data: { error: error.message } };
        }
    },

    async register(nombre, email, password) {
        try {
            console.log('Iniciando registro con:', { nombre, email });
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    nombre: nombre.trim(), 
                    email: email.trim().toLowerCase(), 
                    password: password.trim() 
                })
            });
            const data = await res.json();
            console.log('Register response:', { status: res.status, ok: res.ok, data });
            if (res.ok && data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('Token y usuario guardados en localStorage');
            }
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error en registro:', error);
            return { ok: false, data: { error: error.message } };
        }
    },

    async logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return { ok: true };
    },

    // 2. Módulo Artículos
    async getArticulos() {
        try {
            const res = await fetch(`${API_BASE_URL}/articulos`);
            const data = await res.json();
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error obteniendo artículos:', error);
            return { ok: false, data: { error: error.message } };
        }
    },

    async crearArticulo(nombre, descripcion, estado, foto_url) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { ok: false, data: { error: 'No hay token de autenticación' } };
            }

            const res = await fetch(`${API_BASE_URL}/articulos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    estado: estado.trim(),
                    foto_url: foto_url // Enviar la imagen en base64
                })
            });
            const data = await res.json();
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error creando artículo:', error);
            return { ok: false, data: { error: error.message } };
        }
    },

    async actualizarArticulo(id_articulo, nombre, descripcion, estado, foto_url, disponible) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { ok: false, data: { error: 'No hay token de autenticación' } };
            }

            const res = await fetch(`${API_BASE_URL}/articulos/${id_articulo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({
                    nombre: nombre.trim(),
                    descripcion: descripcion.trim(),
                    estado: estado.trim(),
                    foto_url: foto_url,
                    disponible: disponible
                })
            });
            const data = await res.json();
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error actualizando artículo:', error);
            return { ok: false, data: { error: error.message } };
        }
    },

    async eliminarArticulo(id_articulo) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return { ok: false, data: { error: 'No hay token de autenticación' } };
            }

            const res = await fetch(`${API_BASE_URL}/articulos/${id_articulo}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token
                }
            });
            const data = await res.json();
            return { ok: res.ok, data };
        } catch (error) {
            console.error('Error eliminando artículo:', error);
            return { ok: false, data: { error: error.message } };
        }
    }
};