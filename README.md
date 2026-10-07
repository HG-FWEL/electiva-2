# MóvilMarket 🛒📱

Tienda en línea de tecnología y telefonía desarrollada con **React + Vite** como proyecto de la asignatura **Electiva 2**. Permite explorar productos por categoría, verlos en detalle (incluido un **modelo 3D interactivo del iPhone 15**), guardarlos en favoritos, comprarlos mediante un carrito y administrarlos desde un panel para administradores.

---

## 📑 Tabla de contenidos

1. [Características](#-características)
2. [Tecnologías](#-tecnologías)
3. [Estructura del repositorio](#-estructura-del-repositorio)
4. [Estructura del código fuente](#-estructura-del-código-fuente)
5. [Requisitos previos](#-requisitos-previos)
6. [Instalación y ejecución](#-instalación-y-ejecución)
7. [Scripts disponibles](#-scripts-disponibles)
8. [Rutas de la aplicación](#-rutas-de-la-aplicación)
9. [Usuario administrador](#-usuario-administrador)
10. [Persistencia de datos](#-persistencia-de-datos)
11. [Modelo 3D](#-modelo-3d)
12. [Estado actual y pendientes](#-estado-actual-y-pendientes)

---

## ✨ Características

- **Catálogo de productos** (64 productos) organizado en 9 categorías: celulares, computadores, escritorio, all‑in‑one, gaming, consolas, tablets, Apple Watch y accesorios.
- **Buscador** en la barra de navegación con página de resultados.
- **Detalle de producto** con visor **3D** (rotar, acercar y alejar) para los productos que tienen modelo.
- **Carrito de compras** en ventana modal con contador de artículos.
- **Favoritos** para guardar productos de interés.
- **Checkout** con datos de envío, método de envío y resumen del pedido.
- **Registro e inicio de sesión** de usuarios (contraseñas guardadas como hash SHA‑256).
- **Panel de administración** (ruta protegida) para:
  - Crear, editar y eliminar productos.
  - Gestionar pedidos y cambiar su estado (por ejemplo, de *en revisión* a *enviado*).
- Persistencia local de la información con `localStorage`.

## 🛠 Tecnologías

| Área | Herramienta |
|------|-------------|
| Interfaz | [React 19](https://react.dev/) |
| Empaquetador / servidor de desarrollo | [Vite 8](https://vite.dev/) |
| Enrutamiento | [React Router 7](https://reactrouter.com/) |
| 3D | [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| Íconos | [Font Awesome](https://fontawesome.com/) |
| Linter | [Oxlint](https://oxc.rs/) |
| Backend (en preparación) | [Express 5](https://expressjs.com/) |

## 📂 Estructura del repositorio

```text
electiva-2/
├── README.md                  ← este archivo
└── electiva-2-main/           ← proyecto (versión más reciente)
    ├── backend/               ← servidor Express (aún sin implementar)
    ├── iphone-15/             ← recursos originales del modelo 3D (ZIP + texturas)
    ├── public/                ← archivos estáticos (imágenes, modelos 3D)
    ├── src/                   ← código fuente de React
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🧩 Estructura del código fuente

```text
src/
├── main.jsx                 ← punto de entrada
├── App.jsx                  ← proveedores de contexto, navbar, rutas y footer
├── components/
│   ├── AdminPedidos.jsx     ← gestión de pedidos en el panel de administración
│   ├── CarritoModal.jsx     ← ventana modal del carrito
│   ├── CategoryLayout.jsx   ← plantilla común de las páginas de categoría
│   ├── Modelo3DViewer.jsx   ← visor 3D de modelos FBX
│   ├── ProductCard.jsx      ← tarjeta de producto
│   └── ProductoModal.jsx    ← vista rápida de un producto
├── context/
│   ├── AuthContext.jsx          ← usuarios, sesión y rol de administrador
│   ├── AdminProductsContext.jsx ← productos creados/editados/eliminados por el admin
│   ├── CartContext.jsx          ← carrito y favoritos
│   └── OrdersContext.jsx        ← pedidos y sus estados
├── data/
│   └── Productos.js         ← catálogo base de productos
├── hooks/
│   ├── useDocumentTitle.js  ← cambia el título de la pestaña
│   └── useEscapeKey.js      ← cierra modales con la tecla Escape
├── pages/                   ← una página por ruta (Inicio, Productos, categorías,
│                              DetalleProducto, Checkout, Favoritos, Buscar,
│                              Login, Registro, Admin)
└── utils/
    ├── precio.js            ← formato de precios
    └── placeholder.js       ← imagen por defecto para productos sin foto
```

## ✅ Requisitos previos

- [Node.js](https://nodejs.org/) **20.19 o superior** (requerido por Vite 8)
- npm (incluido con Node.js)

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/HG-FWEL/electiva-2.git

# 2. Entrar a la carpeta del proyecto
cd electiva-2/electiva-2-main

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Luego abre en el navegador la URL que muestra la terminal (por defecto `http://localhost:5173`).

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Genera el build de producción en `dist/` (es decir, `electiva-2-main/dist`). |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | Revisa el código con Oxlint. |

## 🗺 Rutas de la aplicación

| Ruta | Página |
|------|--------|
| `/` | Inicio |
| `/productos` | Todos los productos |
| `/celulares`, `/computadores`, `/escritorio`, `/all-in-one`, `/gaming`, `/consolas`, `/tablets`, `/apple-watch`, `/accesorios` | Páginas de categoría |
| `/producto/:id` | Detalle de un producto |
| `/buscar?q=texto` | Resultados de búsqueda |
| `/favoritos` | Productos favoritos |
| `/checkout` | Finalizar compra |
| `/login` | Iniciar sesión |
| `/registro` | Crear cuenta |
| `/admin` | Panel de administración (solo administradores) |

## 🔐 Usuario administrador

La primera vez que se ejecuta la aplicación se crea automáticamente una cuenta de administrador para pruebas:

| Campo | Valor |
|-------|-------|
| Correo | `admin@movimarket.com` |
| Contraseña | `Admin123!` |

> ⚠️ Esta cuenta existe solo con fines académicos y de demostración. La autenticación ocurre en el navegador, por lo que **no es segura para un entorno real**.

## 💾 Persistencia de datos

Mientras el backend no esté implementado, toda la información se guarda en el `localStorage` del navegador:

| Clave | Contenido |
|-------|-----------|
| `movimarket_usuarios` | Usuarios registrados |
| `movimarket_sesion` | Sesión activa |
| `movimarket_carrito` | Productos en el carrito |
| `movimarket_favoritos` | Productos favoritos |
| `movimarket_pedidos` | Pedidos realizados |
| `movimarket_productos_admin` | Productos creados por el administrador |
| `movimarket_productos_overrides` | Cambios hechos a productos del catálogo base |
| `movimarket_productos_eliminados` | Productos ocultados por el administrador |

Para reiniciar la aplicación a su estado inicial, borra estas claves desde las herramientas de desarrollo del navegador (*Application → Local Storage*).

## 🧊 Modelo 3D

El iPhone 15 se muestra en 3D con `Modelo3DViewer.jsx`, que carga un archivo **FBX** mediante `FBXLoader` de Three.js. Los archivos se sirven desde:

```text
public/models/iphone-15/
├── iphone15.fbx
└── iphone15.fbm/   ← texturas (cámara, flash, fondo de pantalla)
```

Para agregar un modelo a otro producto, copia el `.fbx` (y su carpeta de texturas) en `public/models/` y añade la propiedad `modelo3d` al producto en `src/data/Productos.js`:

```js
{
  id: 'cel-1',
  nombre: 'iPhone 15 Pro Max',
  // ...
  modelo3d: '/models/iphone-15/iphone15.fbx',
}
```

## 📌 Estado actual y pendientes

- [x] Catálogo, categorías, búsqueda y detalle de productos
- [x] Carrito, favoritos y checkout
- [x] Registro, inicio de sesión y roles
- [x] Panel de administración de productos y pedidos
- [x] Visor 3D del iPhone 15
- [ ] Implementar el backend con Express (`backend/backend.js` está vacío)
- [ ] Mover usuarios, productos y pedidos a una base de datos
- [ ] Unificar las carpetas duplicadas del repositorio en una sola

---

Proyecto académico — **Electiva 2**.
