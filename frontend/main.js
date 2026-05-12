const STORAGE_KEY = "neighborshare_data";

const state = {
    usuarioActual: null, // { id_usuario, email, nombre }
    articulos: [] // Array de artículos del servidor
};

const els = {
    sessionBadge: document.getElementById("sessionBadge"),
    screenLogin: document.getElementById("screenLogin"),
    screenMenu: document.getElementById("screenMenu"),
    screenPublish: document.getElementById("screenPublish"),
    screenCatalog: document.getElementById("screenCatalog"),
    screenNotice: document.getElementById("screenNotice"),
    
    // Tabs
    tabRegister: document.getElementById("tabRegister"),
    tabLogin: document.getElementById("tabLogin"),
    formRegister: document.getElementById("formRegister"),
    formLogin: document.getElementById("formLogin"),
    
    // Register fields
    regEmail: document.getElementById("regEmail"),
    regName: document.getElementById("regName"),
    regPwd: document.getElementById("regPwd"),
    registerStatus: document.getElementById("registerStatus"),
    
    // Login fields
    loginEmail: document.getElementById("loginEmail"),
    loginPwd: document.getElementById("loginPwd"),
    loginStatus: document.getElementById("loginStatus"),
    
    btnRegister: document.getElementById("btnRegister"),
    btnLogin: document.getElementById("btnLogin"),
    btnLogout: document.getElementById("btnLogout"),
    goPublish: document.getElementById("goPublish"),
    goCatalog: document.getElementById("goCatalog"),
    objName: document.getElementById("objName"),
    objDesc: document.getElementById("objDesc"),
    objState: document.getElementById("objState"),
    objImage: document.getElementById("objImage"),
    btnSaveObject: document.getElementById("btnSaveObject"),
    btnBackMenuFromPublish: document.getElementById("btnBackMenuFromPublish"),
    btnBackMenuFromCatalog: document.getElementById("btnBackMenuFromCatalog"),
    catalogList: document.getElementById("catalogList"),
    noticeText: document.getElementById("noticeText"),
    btnNoticeOk: document.getElementById("btnNoticeOk")
};

        async function loadUserFromStorage() { 
            // Recuperar usuario del localStorage si existe sesión previa
            try {
                const userStr = localStorage.getItem('user');
                const token = localStorage.getItem('token');
                console.log('Cargando usuario del localStorage:', userStr, 'Token:', token);
                if (userStr && token) {
                    state.usuarioActual = JSON.parse(userStr);
                    console.log('Usuario cargado desde localStorage:', state.usuarioActual);
                    return true;
                }
            } catch (error) {
                console.error('Error cargando usuario:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
            return false;
        }

function resetForm() {
    els.objName.value = "";
    els.objDesc.value = "";
    els.objState.value = "Nuevo";
    els.objImage.value = "";
    pendingImageUrl = "";
}

function showScreen(screen) { // Función para mostrar una pantalla y ocultar las demás
    [els.screenLogin, els.screenMenu, els.screenPublish, els.screenCatalog, els.screenNotice].forEach((node) => {
        node.classList.add("hidden");
    });
    screen.classList.remove("hidden");
}

function switchLoginTab(isRegister) {
    clearRegisterMessage();
    clearLoginMessage();
    if (isRegister) {
        els.formRegister.style.display = "block";
        els.formLogin.style.display = "none";
        els.tabRegister.style.borderBottom = "2px solid var(--accent)";
        els.tabLogin.style.borderBottom = "none";
        // Limpiar campo de login
        els.loginEmail.value = "";
        els.loginPwd.value = "";
    } else {
        els.formRegister.style.display = "none";
        els.formLogin.style.display = "block";
        els.tabRegister.style.borderBottom = "none";
        els.tabLogin.style.borderBottom = "2px solid var(--accent)";
        // Limpiar campos de registro
        els.regEmail.value = "";
        els.regName.value = "";
        els.regPwd.value = "";
    }
}

function clearRegisterMessage() {
    if (!els.registerStatus) {
        return;
    }
    els.registerStatus.textContent = "";
    els.registerStatus.classList.remove("success", "error");
}

function showRegisterMessage(message, type) {
    if (!els.registerStatus) {
        return;
    }
    els.registerStatus.textContent = message;
    els.registerStatus.classList.remove("success", "error");
    if (type) {
        els.registerStatus.classList.add(type);
    }
}

function clearLoginMessage() {
    if (!els.loginStatus) {
        return;
    }
    els.loginStatus.textContent = "";
    els.loginStatus.classList.remove("success", "error");
}

function showLoginMessage(message, type) {
    if (!els.loginStatus) {
        return;
    }
    els.loginStatus.textContent = message;
    els.loginStatus.classList.remove("success", "error");
    if (type) {
        els.loginStatus.classList.add(type);
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+$/.test(email);
}

function isValidusername(nombre) {
    return /^(?=.*[a-zA-Z])[a-zA-Z0-9]+$/.test(nombre);
}

function updateSessionBadge() {
    els.sessionBadge.textContent = state.usuarioActual
        ? `Sesión: ${state.usuarioActual.nombre}`
        : "Sesión no iniciada";
}

function showNotice(message) {
    els.noticeText.textContent = message;
    showScreen(els.screenNotice);
}

function pantallaLogin() {
    updateSessionBadge();
    switchLoginTab(true);
    // Asegurar que todo esté limpio
    clearRegisterMessage();
    clearLoginMessage();
    els.regEmail.value = "";
    els.regName.value = "";
    els.regPwd.value = "";
    els.loginEmail.value = "";
    els.loginPwd.value = "";
    showScreen(els.screenLogin);
}

        function pantallaMenu() { // Mostrar la pantalla de menú principal y actualizar el badge de sesión
            updateSessionBadge();
            resetForm(); // Limpiar formulario de productos
            clearRegisterMessage(); // Limpiar mensajes
            clearLoginMessage();
            showScreen(els.screenMenu);
        }

        function pantallaPublicar() { // Mostrar la pantalla de publicación de objetos y actualizar el badge de sesión
            updateSessionBadge();
            resetForm(); // Limpiar el formulario antes de mostrar
            
            // Reiniciar estado del botón (en caso de que venga de una edición)
            delete els.btnSaveObject.dataset.articuloId;
            els.btnSaveObject.textContent = "Publicar producto";
            
            showScreen(els.screenPublish);
        }

function renderCatalog() {
    els.catalogList.innerHTML = "";

    if (!state.articulos || !state.articulos.length) {
        const empty = document.createElement("div");
        empty.className = "note";
        empty.textContent = "No hay artículos publicados todavía.";
        els.catalogList.appendChild(empty);
        return;
    }

    console.log('Renderizando catálogo con', state.articulos.length, 'artículos');

    state.articulos.forEach((articulo) => {
        console.log('Artículo completo:', {
            id: articulo.id_articulo,
            nombre: articulo.nombre,
            descripcion: articulo.descripcion,
            foto_url: articulo.foto_url,
            estado: articulo.estado,
            disponible: articulo.disponible,
            id_duenio: articulo.id_duenio,
            nombre_duenio: articulo.nombre_duenio
        });
        
        const card = document.createElement("article");
        card.className = "card";
        card.style.position = "relative"; // Para el menú posicionado

        // Menú de 3 puntos solo si es el dueño
        if (state.usuarioActual && articulo.id_duenio === state.usuarioActual.id_usuario) {
            const menuBtn = document.createElement("button");
            menuBtn.textContent = "⋮";
            menuBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #fff;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            `;
            
            menuBtn.addEventListener("mouseenter", () => {
                menuBtn.style.background = "rgba(255,255,255,0.1)";
            });
            menuBtn.addEventListener("mouseleave", () => {
                menuBtn.style.background = "none";
            });

            const menu = document.createElement("div");
            menu.style.cssText = `
                display: none;
                position: absolute;
                top: 50px;
                right: 10px;
                background: #1a1a2e;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                z-index: 1000;
                min-width: 150px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;

            const editBtn = document.createElement("button");
            editBtn.textContent = "Editar";
            editBtn.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px;
                border: none;
                background: none;
                color: #fff;
                text-align: left;
                cursor: pointer;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                transition: background 0.2s;
            `;
            editBtn.addEventListener("mouseenter", () => {
                editBtn.style.background = "rgba(255,255,255,0.1)";
            });
            editBtn.addEventListener("mouseleave", () => {
                editBtn.style.background = "none";
            });
            editBtn.addEventListener("click", () => {
                editarArticulo(articulo);
                menu.style.display = "none";
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Eliminar";
            deleteBtn.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px;
                border: none;
                background: none;
                color: #ff6b6b;
                text-align: left;
                cursor: pointer;
                transition: background 0.2s;
            `;
            deleteBtn.addEventListener("mouseenter", () => {
                deleteBtn.style.background = "rgba(255,107,107,0.1)";
            });
            deleteBtn.addEventListener("mouseleave", () => {
                deleteBtn.style.background = "none";
            });
            deleteBtn.addEventListener("click", () => {
                eliminarArticulo(articulo);
                menu.style.display = "none";
            });

            menu.appendChild(editBtn);
            menu.appendChild(deleteBtn);

            menuBtn.addEventListener("click", () => {
                menu.style.display = menu.style.display === "none" ? "block" : "none";
            });

            card.appendChild(menuBtn);
            card.appendChild(menu);
        }

        const thumb = document.createElement("div");
        thumb.className = "thumb";

        if (articulo.foto_url && articulo.foto_url.trim() !== "") {
            console.log('Intentando cargar imagen:', articulo.foto_url);
            const image = document.createElement("img");
            image.src = articulo.foto_url;
            image.alt = articulo.nombre;
            image.onerror = (event) => {
                console.error('Error al cargar imagen. URL:', articulo.foto_url, 'Error:', event);
                thumb.innerHTML = '<span style="color: #999; font-size: 12px;">Imagen no disponible</span>';
            };
            image.onload = () => {
                console.log('Imagen cargada correctamente:', articulo.foto_url);
            };
            thumb.appendChild(image);
        } else {
            console.log('No hay URL de imagen para:', articulo.nombre);
            thumb.textContent = "Sin imagen";
        }

        const info = document.createElement("div");
        info.className = "info-block";

        const title = document.createElement("h3");
        title.textContent = `${articulo.nombre} (${articulo.estado})`;

        const desc = document.createElement("p");
        desc.className = "muted";
        desc.textContent = articulo.descripcion;

        const owner = document.createElement("div");
        owner.className = "chip";
        owner.textContent = `Publicado por: ${articulo.nombre_duenio || 'Usuario desconocido'}`;

        info.appendChild(title);
        info.appendChild(desc);
        info.appendChild(owner);

        // Mostrar botón de solicitar préstamo si el artículo está disponible y NO es del usuario actual
        if (state.usuarioActual && articulo.disponible && articulo.id_duenio !== state.usuarioActual.id_usuario) {
            const requestBtn = document.createElement("button");
            requestBtn.className = "primary";
            requestBtn.textContent = "Solicitar préstamo";
            requestBtn.addEventListener("click", () => solicitarPrestamo(articulo));
            info.appendChild(requestBtn);
        }

        card.appendChild(thumb);
        card.appendChild(info);
        els.catalogList.appendChild(card);
    });
}

        async function pantallaCatalogo() { // Mostrar la pantalla de catálogo, cargar artículos del backend y renderizarlos
            updateSessionBadge();
            
            // Cargar artículos del backend
            console.log('Cargando artículos del backend...');
            const result = await apiService.getArticulos();
            console.log('Resultado de getArticulos:', result);
            
            if (result.ok) {
                state.articulos = result.data;
                console.log('Artículos cargados:', state.articulos);
            } else {
                showNotice("No se pudieron cargar los artículos");
                return;
            }
            
            renderCatalog();
            showScreen(els.screenCatalog);
        }

async function registrar() {
    const email = els.regEmail.value.trim().toLowerCase();
    const nombre = els.regName.value.trim();
    const password = els.regPwd.value.trim();

    if (!email || !nombre || !password) {
        showRegisterMessage("Todos los campos son obligatorios", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showRegisterMessage("Ingresa un correo valido con formato usuario@dominio", "error");
        return;
    }

    if (!isValidusername(nombre)) {
        showRegisterMessage("El nombre de usuario solo puede contener letras y números", "error");
        return;
    }

    // Mostrar que se está procesando
    showRegisterMessage("Registrando... por favor espera", "");
    
    // Llamar al backend para registrar
    const result = await apiService.register(nombre, email, password);
    console.log('Resultado del registro:', result);
    
    if (result.ok && result.data.user) {
        // Si la respuesta es ok, guardar el usuario en el estado
        state.usuarioActual = result.data.user;
        console.log('Usuario guardado en estado:', state.usuarioActual);
        
        // Limpiar formulario
        els.regEmail.value = "";
        els.regName.value = "";
        els.regPwd.value = "";
        showRegisterMessage("¡Cuenta registrada. Bienvenido!", "success");
        
        // Redirigir al menú después de 1.5 segundos
        setTimeout(() => {
            pantallaMenu();
        }, 1500);
    } else {
        const errorMsg = result.data.error || "No se pudo crear la cuenta - error desconocido";
        console.error('Error al registrar:', errorMsg);
        showRegisterMessage(errorMsg, "error");
    }
}

async function login() {
    const email = els.loginEmail.value.trim().toLowerCase();
    const password = els.loginPwd.value.trim();

    if (!email || !password) {
        showLoginMessage("Campos vacíos", "error");
        return;
    }

    // Llamar al backend para iniciar sesión
    const result = await apiService.login(email, password);
    console.log('Resultado del login:', result);

    if (result.ok && result.data.user) {
        state.usuarioActual = result.data.user;
        console.log('Usuario guardado en estado:', state.usuarioActual);
        els.loginEmail.value = "";
        els.loginPwd.value = "";
        showLoginMessage("¡Sesión iniciada!", "success");
        setTimeout(() => {
            pantallaMenu();
        }, 1000);
    } else {
        showLoginMessage(result.data.error || "Credenciales incorrectas", "error");
    }
}

        function logout() { // Función para cerrar sesión, limpiar el usuario actual, actualizar el badge de sesión y mostrar la pantalla de login
            state.usuarioActual = null;
            apiService.logout();
            updateSessionBadge();
            pantallaLogin();
        }

let pendingImageUrl = ""; // Variable para almacenar la URL de la imagen

function handleImageSelection(url) {
    pendingImageUrl = url ? url.trim() : "";
}

async function guardarObjeto() {
    if (!state.usuarioActual) {
        showNotice("Debes iniciar sesión primero");
        return;
    }

    const nombre = els.objName.value.trim();
    const descripcion = els.objDesc.value.trim();
    const estado = els.objState.value;
    const fotoUrl = els.objImage.value.trim();
    const articuloId = els.btnSaveObject.dataset.articuloId;

    if (!nombre || !descripcion) {
        showNotice("Campos obligatorios: nombre y descripción");
        return;
    }

    if (!fotoUrl) {
        showNotice("Debes ingresar una URL válida de la imagen");
        return;
    }

    // Validar que sea una URL válida
    try {
        new URL(fotoUrl);
    } catch (error) {
        showNotice("La URL de la imagen no es válida. Debe comenzar con http:// o https://");
        return;
    }

    // Detectar URLs problemáticas con restricciones CORS
    const dominiosBloqueados = [
        'wikipedia.org',
        'github.com', 
        'ovacen.com',
        'wordpress.com',
        'blogger.com',
        'instagram.com',
        'twitter.com',
        'facebook.com'
    ];

    const tieneRestriccion = dominiosBloqueados.some(dominio => fotoUrl.toLowerCase().includes(dominio));
    
    if (tieneRestriccion) {
        showNotice("⚠️ Esta imagen no se puede cargar (restricción de seguridad). Usa: Imgur, Postimages o https://via.placeholder.com/300x200");
        return;
    }

    // Diferenciar entre crear y actualizar
    let result;
    if (articuloId) {
        // Actualizar producto existente
        result = await apiService.actualizarArticulo(articuloId, nombre, descripcion, estado, fotoUrl, 1);
    } else {
        // Crear producto nuevo
        result = await apiService.crearArticulo(nombre, descripcion, estado, fotoUrl);
    }

    if (result.ok) {
        resetForm();
        
        // Limpiar el dataset después de actualizar
        delete els.btnSaveObject.dataset.articuloId;
        els.btnSaveObject.textContent = "Publicar producto";
        
        showNotice("✅ " + (articuloId ? "Producto actualizado correctamente" : "Artículo publicado correctamente"));
        // Redirigir al catálogo si fue actualización, al menú si fue creación
        setTimeout(() => {
            if (articuloId) {
                pantallaCatalogo();
            } else {
                pantallaMenu();
            }
        }, 1500);
    } else {
        showNotice(result.data.error || "No se pudo guardar el producto");
    }
}


async function solicitarPrestamo(articulo) {
    if (!state.usuarioActual) {
        showNotice("Debes iniciar sesión primero");
        return;
    }

    // TODO: Implementar endpoint en el backend para crear reservas
    showNotice(`Solicitud de préstamo enviada para: ${articulo.nombre}`);
}

async function editarArticulo(articulo) {
    if (!confirm(`¿Deseas editar "${articulo.nombre}"?`)) {
        return;
    }
    
    // Rellenar el formulario con los datos actuales
    els.objName.value = articulo.nombre;
    els.objDesc.value = articulo.descripcion;
    els.objState.value = articulo.estado;
    els.objImage.value = articulo.foto_url;
    pendingImageUrl = articulo.foto_url;
    
    // Cambiar el texto del botón para indicar que es actualizar
    els.btnSaveObject.textContent = "Actualizar producto";
    els.btnSaveObject.dataset.articuloId = articulo.id_articulo;
    
    showScreen(els.screenPublish);
}

async function eliminarArticulo(articulo) {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${articulo.nombre}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    showNotice("Eliminando producto...");
    const result = await apiService.eliminarArticulo(articulo.id_articulo);
    
    if (result.ok) {
        showNotice("✅ Producto eliminado correctamente");
        setTimeout(() => {
            pantallaCatalogo(); // Recargar catálogo
        }, 1000);
    } else {
        showNotice(result.data.error || "No se pudo eliminar el producto");
    }
}

// Event listeners
els.tabRegister.addEventListener("click", () => switchLoginTab(true));
els.tabLogin.addEventListener("click", () => switchLoginTab(false));
els.btnRegister.addEventListener("click", registrar);
els.btnLogin.addEventListener("click", login);
els.btnLogout.addEventListener("click", logout);
els.goPublish.addEventListener("click", pantallaPublicar);
els.goCatalog.addEventListener("click", pantallaCatalogo);
els.btnSaveObject.addEventListener("click", guardarObjeto);
els.btnBackMenuFromPublish.addEventListener("click", pantallaMenu);
els.btnBackMenuFromCatalog.addEventListener("click", pantallaMenu);
els.btnNoticeOk.addEventListener("click", () => {
    if (state.usuarioActual) {
        pantallaMenu();
    } else {
        pantallaLogin();
    }
});

loadUserFromStorage().then(() => {
    updateSessionBadge();
    if (state.usuarioActual) {
        pantallaMenu();
    } else {
        pantallaLogin();
    }
});
