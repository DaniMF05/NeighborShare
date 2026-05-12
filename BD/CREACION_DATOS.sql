-- 1. Crear la base de datos
CREATE DATABASE NeighborShare;
GO

USE NeighborShare;
GO

-- 2. Tabla de Usuarios (Base para la autenticación y reputación)
CREATE TABLE Usuarios (
    id_usuario INT PRIMARY KEY IDENTITY(1,1),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Para almacenar la contraseña encriptada
    reputacion_promedio DECIMAL(3, 2) DEFAULT 0.00
);

-- 3. Tabla de Artículos (Inventario Comunitario)
CREATE TABLE Articulos (
    id_articulo INT PRIMARY KEY IDENTITY(1,1),
    id_duenio INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(MAX) NOT NULL,
    foto_url VARCHAR(2083) NOT NULL, -- Soporta URLs largas
    estado VARCHAR(20) NOT NULL,
    disponible BIT DEFAULT 1, -- 1 para disponible, 0 para no disponible
    CONSTRAINT FK_Articulo_Duenio FOREIGN KEY (id_duenio) REFERENCES Usuarios(id_usuario),
    CONSTRAINT CHK_Estado_Articulo CHECK (estado IN ('Nuevo', 'Usado', 'Desgastado'))
);

-- 4. Tabla de Reservas (Gestión de préstamos y calendario)
CREATE TABLE Reservas (
    id_reserva INT PRIMARY KEY IDENTITY(1,1),
    id_articulo INT NOT NULL,
    id_solicitante INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado_reserva VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    CONSTRAINT FK_Reserva_Articulo FOREIGN KEY (id_articulo) REFERENCES Articulos(id_articulo),
    CONSTRAINT FK_Reserva_Solicitante FOREIGN KEY (id_solicitante) REFERENCES Usuarios(id_usuario),
    CONSTRAINT CHK_Fechas_Reserva CHECK (fecha_inicio < fecha_fin),
    CONSTRAINT CHK_Estado_Reserva CHECK (estado_reserva IN ('Pendiente', 'Aceptada', 'Rechazada', 'Finalizada'))
);

-- 5. Tabla de Calificaciones (Módulo de confianza post-préstamo)
CREATE TABLE Calificaciones (
    id_calificacion INT PRIMARY KEY IDENTITY(1,1),
    id_reserva INT NOT NULL UNIQUE, -- Restricción 1:1 para evitar doble calificación
    id_calificador INT NOT NULL,
    estrellas INT NOT NULL,
    comentario VARCHAR(MAX),
    CONSTRAINT FK_Calificacion_Reserva FOREIGN KEY (id_reserva) REFERENCES Reservas(id_reserva),
    CONSTRAINT FK_Calificacion_Usuario FOREIGN KEY (id_calificador) REFERENCES Usuarios(id_usuario),
    CONSTRAINT CHK_Estrellas CHECK (estrellas BETWEEN 1 AND 5)
);