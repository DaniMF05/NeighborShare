
### 🚀 Guía de Configuración: Backend NeighborShare

Ya subí el backend limpio al repositorio. Sigue estos pasos para que lo tengas corriendo en tu máquina y puedas empezar a conectar el frontend:

**1. Instalar dependencias:**
Como no se suben los `node_modules` por peso, lo primero que debes hacer al bajar el repo es entrar a la carpeta del backend y ejecutar:

```bash
cd backend
npm install

```

**2. Configurar la Base de Datos (SQL Server):**
En el repositorio verás una carpeta llamada **`BD`**. Dentro hay un archivo `.sql` con toda la estructura de tablas.

* Abre tu **SSMS (SQL Server Management Studio)**.
* Abre el archivo `.sql` de la carpeta `BD`, ejecútalo y ¡listo! Ya tienes la base de datos y las tablas creadas.

**3. Crear tu archivo `.env`:**
En la raíz de la carpeta `backend` tienes que crear un archivo llamado `.env`. asi mismo .env, no le pongas nada antes ni después. Dentro de ese archivo, copia y pega lo siguiente:

```env

PORT=3000
DB_USER=sa
DB_PASSWORD=P@ssw0rd
DB_SERVER=localhost
DB_NAME=NeighborShare
JWT_SECRET=NeighborShare_EPN_ByteBuilders_2026_SecureKey_!#%&
```

Tienes que ver en el SSMS como se llama tu servidor, si es `localhost` o `localhost\SQLEXPRESS` o algo diferente. Cambia el valor de `DB_SERVER` en el `.env` por el nombre de tu servidor.

**4. Correr el servidor:**
Para encender la API, solo ejecuta:

```bash
npm run dev

```

Aunque yo use el  

```bash
node index.js

```
Eso si, se ejecuta estando dentro de la carpeta `backend`.

Si en la terminal sale el check verde de **"Conectado a SQL Server"**, ya puedes empezar a disparar las peticiones desde el frontend a `http://localhost:3000`.

---