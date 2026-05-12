# NeighborShare

Una producto para que los vecinos se presten cosas entre sí.

## ¿Qué hace?

- Te registras, inicias sesión
- Publicas artículos que puedes prestar
- Ves lo que otros vecinos tienen disponible
- Solo tú puedes editar o borrar tus propios artículos

## Stack

- **Backend:** Node.js + Express
- **Base de datos:** SQL Server
- **Auth:** JWT + bcrypt
- **Frontend:** HTML, CSS y JS vanilla

## Cómo correrlo

1. Clona el repo y entra al backend:
   ```bash
   git clone https://github.com/DaniMF05/NeighborShare.git
   cd NeighborShare/backend
   npm install
   ```

2. Crea un archivo `.env` en `/backend`:
   ```env
   DB_USER=...
   DB_PASSWORD=...
   DB_SERVER=...
   DB_NAME=NeighborShare
   JWT_SECRET=algo_secreto
   PORT=3000
   ```

3. Corre el script `BD/CREACION_DATOS.sql` en SSMS para crear las tablas.

4. Levanta el servidor:
   ```bash
   node index.js
   ```

5. Abre `frontend/NeighboreShare.html` en el navegador.

## Endpoints principales

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/articulos` | Ver catálogo |
| POST | `/api/articulos` | Publicar artículo  |
| PUT | `/api/articulos/:id` | Editar artículo  |
| DELETE | `/api/articulos/:id` | Borrar artículo  |


## Estado del proyecto

 En desarrollo
