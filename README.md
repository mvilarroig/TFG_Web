# MyBudget

MyBudget es una aplicación web desarrollada como Trabajo de Fin de Grado (TFG), cuyo objetivo es facilitar la gestión de las finanzas personales de manera sencilla, intuitiva y accesible.

Permite a los usuarios registrar sus ingresos y gastos, categorizarlos y visualizar su situación económica para mejorar la toma de decisiones financieras.

---

## Tecnologías utilizadas

El proyecto sigue una arquitectura cliente-servidor:

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express

### Base de datos
- PostgreSQL

---

## Arquitectura del sistema

La aplicación se basa en una arquitectura de tres capas:

- **Frontend**: Interfaz de usuario desarrollada con React (SPA)
- **Backend**: API REST desarrollada con Node.js y Express
- **Base de datos**: Sistema relacional PostgreSQL

La comunicación entre frontend y backend se realiza mediante peticiones HTTP en formato JSON.

---

## Estructura del proyecto

El proyecto está organizado en dos directorios principales:

- **/frontend**: Contiene la aplicación cliente desarrollada con React. Incluye componentes, vistas, estilos y lógica de interacción con la API.
- **/backend**: Contiene la API REST desarrollada con Node.js y Express. Gestiona la lógica de negocio, autenticación y acceso a la base de datos.

Dentro del backend se incluyen también los scripts de migración y seed de la base de datos.

---

## Funcionalidades principales

- Registro e inicio de sesión de usuarios
- Gestión de ingresos y gastos
- Clasificación por categorías
- Visualización de datos financieros
- Interfaz intuitiva y responsive

---
## Requisitos previos

Antes de ejecutar la aplicación, es necesario disponer de las siguientes herramientas instaladas:

- Node.js
- npm
- PostgreSQL

Se recomienda utilizar versiones actualizadas para garantizar la compatibilidad.

---

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/mvilarroig/MyBudget_TFG.git
cd MyBudget_TFG
```

### 2. Configurar la base de datos

Asegúrate de tener PostgreSQL instalado y en ejecución. Crea una base de datos y configura las variables de entorno en `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mybudget
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
```

### 3. Instalar dependencias e inicializar la base de datos

```bash
# Backend
cd backend
npm install
npm run db:migrate
npm run db:seed   #carga las categorías iniciales necesarias para el funcionamiento de la aplicación
```

```bash
# Frontend
cd ../frontend
npm install
```

### 4. Ejecutar la aplicación

En dos terminales separadas:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` por defecto.

---

## Autor

Desarrollado por **mvilarroig** como Trabajo de Fin de Grado.
