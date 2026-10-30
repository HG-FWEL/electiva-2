# MóvilMarket 🛒📱

Tienda en línea de tecnología y telefonía desarrollada con **React + Vite**, un backend en **Express** y una base de datos en **Supabase**, como proyecto de la asignatura **Electiva 2**. Permite explorar productos por categoría, verlos en detalle (incluido un **modelo 3D interactivo del iPhone 15**), guardarlos en favoritos, comprarlos con pago real de pruebas a través de **Wompi**, recibir correos del estado del pedido y administrar todo desde un panel para administradores.

---

## 📑 Tabla de contenidos

1. [Características](#-características)
2. [Tecnologías](#-tecnologías)
3. [Estructura del repositorio](#-estructura-del-repositorio)
4. [Estructura del código fuente](#-estructura-del-código-fuente)
5. [Requisitos previos](#-requisitos-previos)
6. [Instalación y ejecución](#-instalación-y-ejecución)
7. [Variables de entorno](#-variables-de-entorno)
8. [Scripts disponibles](#-scripts-disponibles)
9. [Rutas de la aplicación](#-rutas-de-la-aplicación)
10. [API del backend](#-api-del-backend)
11. [Pagos con Wompi](#-pagos-con-wompi)
12. [Correos a clientes](#-correos-a-clientes)
13. [Usuario administrador](#-usuario-administrador)
14. [Persistencia de datos](#-persistencia-de-datos)
15. [Modelo 3D](#-modelo-3d)
16. [Estado actual y pendientes](#-estado-actual-y-pendientes)

---

## ✨ Características

- **Catálogo de más de 80 productos** en 9 categorías (celulares, computadores, escritorio, all‑in‑one, gaming, consolas, tablets, Apple Watch y accesorios), guardado en Supabase y servido por el backend. Precios en **pesos colombianos (COP)**.
- **Inicio y vitrina de productos** con datos reales del catálogo: cantidad de productos y precio "desde" por categoría, destacados y "últimas unidades".
- **Páginas de categoría** con filtro por marca (o por línea, cuando todos son de la misma marca), búsqueda y orden por precio o nombre.
- **Buscador** en la barra de navegación con página de resultados.
- **Detalle de producto** con selector de cantidad y visor **3D** (rotar, acercar y alejar) para los productos que tienen modelo.
- **Carrito** sincronizado con el catálogo: si un precio o el stock cambian, el carrito se actualiza y avisa.
- **Checkout** por secciones (envío, método de envío y pago) con validación por campo.
- **Correos a clientes** por Gmail: confirmación cuando se aprueba el pago y aviso cuando el pedido se marca como enviado.
- **Pago con Wompi**: el backend calcula el total desde su propio catálogo, firma el pago y **verifica la transacción con Wompi** antes de darla por pagada. Al aprobarse, descuenta el stock.
- **Registro e inicio de sesión** en el backend: contraseñas cifradas con **bcrypt** y sesiones con **JWT**.
- **Panel de administración** (solo administradores):
  - Productos organizados **por categoría**: botones para filtrar, secciones plegables y avisos de stock bajo y agotado. Buscador por nombre, marca o categoría.
  - Crear, editar y desactivar productos con vista previa en vivo y subida de imágenes.
  - Ver los pedidos pagados, verificar pagos pendientes con Wompi y marcarlos como enviados.
- **Documentación de la API con Swagger** en `http://localhost:4000/api-docs`.
- Diseño adaptable a celular y colores con contraste accesible (WCAG AA).

## 🛠 Tecnologías

| Área | Herramienta |
|------|-------------|
| Interfaz | [React 19](https://react.dev/) |
| Empaquetador / servidor de desarrollo | [Vite 8](https://vite.dev/) |
| Enrutamiento | [React Router 7](https://reactrouter.com/) |
| 3D | [Three.js](https://threejs.org/), [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei) |
| Íconos | [Font Awesome](https://fontawesome.com/) |
| Linter | [Oxlint](https://oxc.rs/) |
| Backend | [Express 5](https://expressjs.com/) |
| Base de datos | [Supabase](https://supabase.com/) (PostgreSQL) con `@supabase/supabase-js` |
| Documentación de la API | [Swagger](https://swagger.io/) (`swagger-jsdoc` + `swagger-ui-express`) |
| Autenticación | [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| Subida de imágenes | [Multer](https://github.com/expressjs/multer) |
| Pagos | [Wompi](https://docs.wompi.co/) (widget de checkout) |
| Correos | [Nodemailer](https://nodemailer.com/) con Gmail |

## 📂 Estructura del repositorio

```text
electiva-2/
├── README.md                  ← este archivo
└── electiva-2-main/           ← proyecto
    ├── .claude/skills/        ← Agent Skills de Supabase para Claude Code
    ├── backend/               ← API en Express (puerto 4000)
    ├── iphone-15/             ← recursos originales del modelo 3D (ZIP + texturas)
    ├── public/                ← archivos estáticos (imágenes, modelos 3D)
    ├── src/                   ← código fuente de React
    ├── .env.example           ← plantilla de variables del frontend
    ├── index.html
    ├── package.json
    └── vite.config.js
```

```text
backend/
├── backend.js               ← punto de entrada: monta las rutas y Swagger
├── swagger.js               ← configuración de la documentación
├── auth.js                  ← bcrypt, JWT y middlewares requiereSesion / requiereAdmin
├── supabase.js              ← cliente de Supabase con la llave secreta
├── almacen.js               ← lectura y escritura de los datos en Supabase
├── wompi.js                 ← firma de integridad y consulta de transacciones
├── correo.js                ← correos a clientes por Gmail (pedido confirmado y enviado)
├── rutas/
│   ├── auth.js              ← registro, login y sesión actual
│   ├── productos.js         ← catálogo (CRUD)
│   ├── imagenes.js          ← subida de imágenes de productos
│   └── pedidos.js           ← pedidos, pago con Wompi y estado de envío
├── supabase/
│   └── migracion-tienda.sql ← columnas y funciones SQL que necesita el backend
├── scripts/
│   └── migrar-json-a-supabase.js ← pasa a Supabase los datos de los antiguos JSON
├── datos/
│   └── productos-iniciales.json  ← catálogo base de antes de Supabase (lo usa el script)
└── .env.example             ← plantilla de variables del backend
```

## 🧩 Estructura del código fuente

```text
src/
├── main.jsx                 ← punto de entrada
├── App.jsx                  ← proveedores de contexto, navbar, rutas y pie de página
├── index.css                ← sistema de diseño: variables de color, tipografía y foco
├── components/
│   ├── AdminPedidos.jsx     ← gestión de pedidos en el panel de administración
│   ├── CarritoModal.jsx     ← panel lateral del carrito
│   ├── CategoryLayout.jsx   ← plantilla común de las páginas de categoría
│   ├── FormularioProducto.jsx ← formulario de producto del admin con vista previa
│   ├── Modelo3DViewer.jsx   ← visor 3D de modelos FBX
│   ├── ProductCard.jsx      ← tarjeta de producto
│   ├── ProductoModal.jsx    ← vista rápida de un producto
│   └── SelectorCantidad.jsx ← botones − / + limitados al stock
├── context/
│   ├── AuthContext.jsx      ← sesión del usuario (token del backend)
│   ├── CartContext.jsx      ← carrito y favoritos
│   └── ProductosContext.jsx ← catálogo cargado desde el backend
├── data/
│   └── Productos.js         ← lista de categorías del menú
├── hooks/
│   ├── useDocumentTitle.js  ← cambia el título de la pestaña
│   ├── useEscapeKey.js      ← cierra modales con la tecla Escape
│   └── usePedidos.js        ← pedidos del panel de administración
├── pages/                   ← una página por ruta (Inicio, Productos, categorías,
│                              DetalleProducto, Checkout, Favoritos, Buscar,
│                              Login, Registro, Admin)
└── utils/
    ├── api.js               ← llamadas al backend (agrega el token de sesión)
    ├── carrito.js           ← avisos de productos que cambiaron en el carrito
    ├── categorias.js        ← resumen de cada categoría a partir del catálogo
    ├── migrarPreciosCOP.js  ← convierte a pesos los datos guardados en versiones anteriores
    ├── precio.js            ← formato de precios en COP
    ├── placeholder.js       ← imagen por defecto para productos sin foto
    └── supabase.js          ← cliente de Supabase con la llave publicable (preparado; hoy todo pasa por el backend)
```

## ✅ Requisitos previos

- [Node.js](https://nodejs.org/) **20.19 o superior** (requerido por Vite 8)
- npm (incluido con Node.js)
- Una cuenta de comercio en [Wompi](https://comercios.wompi.co/) para las llaves de pruebas (gratis)

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/HG-FWEL/electiva-2.git
cd electiva-2/electiva-2-main

# 2. Instalar dependencias del frontend y del backend
npm install
cd backend && npm install && cd ..

# 3. Crear los archivos de variables de entorno a partir de las plantillas
cp .env.example .env
cp backend/.env.example backend/.env
#    …y completar los valores (ver la sección "Variables de entorno")

# 4. Solo si montas una base de datos de Supabase NUEVA. La del equipo ya está lista:
#    en ese caso basta con poner SUPABASE_URL y SUPABASE_SECRET_KEY en backend/.env
#    a) En Supabase → SQL Editor, ejecutar backend/supabase/migracion-tienda.sql
#    b) Cargar el catálogo inicial:
cd backend && node scripts/migrar-json-a-supabase.js && cd ..
```

Luego, en **dos terminales**:

```bash
# Terminal 1 — backend (http://localhost:4000)
cd electiva-2-main/backend
node backend.js

# Terminal 2 — frontend (http://localhost:5173)
cd electiva-2-main
npm run dev
```

Abre `http://localhost:5173` para la tienda y `http://localhost:4000/api-docs` para la documentación de la API.

> El backend debe estar encendido: el catálogo, el inicio de sesión y los pagos dependen de él. Los datos viven en Supabase, así que también necesita internet.

## 🔑 Variables de entorno

Los archivos `.env` **no se suben al repositorio** (contienen claves). Usa las plantillas `.env.example`.

**Frontend — `electiva-2-main/.env`**

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Dirección del backend (por defecto `http://localhost:4000`). |
| `VITE_WOMPI_PUBLIC_KEY` | Llave pública de Wompi (`pub_test_…` en modo pruebas). |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Opcionales. Dirección y llave **publicable** de Supabase para `src/utils/supabase.js` (hoy no se usan: todo pasa por el backend). |

**Backend — `electiva-2-main/backend/.env`**

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del backend (por defecto `4000`). |
| `WOMPI_INTEGRITY_KEY` | Secreto de integridad de Wompi, para firmar los pagos. |
| `WOMPI_API_URL` | Opcional. Por defecto el sandbox (`https://sandbox.wompi.co/v1`). |
| `JWT_SECRET` | Clave para firmar las sesiones (mínimo 32 caracteres). **Sin ella el backend no arranca.** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Cuenta de administrador que se crea en el primer arranque. |
| `SUPABASE_URL` | Dirección del proyecto de Supabase. |
| `SUPABASE_SECRET_KEY` | Llave secreta (`sb_secret_…`). Salta las reglas de seguridad de la base de datos: **solo va en el `.env` del backend**. |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | Opcionales. Cuenta de Gmail y su [contraseña de aplicación](https://myaccount.google.com/apppasswords) para enviar los correos a clientes. Sin ellas la tienda funciona igual, pero no envía correos. |

## 📜 Scripts disponibles

En `electiva-2-main/`:

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Genera el build de producción en `dist/`. |
| `npm run preview` | Sirve localmente el build de producción. |
| `npm run lint` | Revisa el código con Oxlint. |

En `electiva-2-main/backend/`: `node backend.js` inicia la API.

## 🗺 Rutas de la aplicación

| Ruta | Página |
|------|--------|
| `/` | Inicio |
| `/productos` | Vitrina de categorías |
| `/celulares`, `/computadores`, `/escritorio`, `/all-in-one`, `/gaming`, `/consolas`, `/tablets`, `/apple-watch`, `/accesorios` | Páginas de categoría |
| `/producto/:id` | Detalle de un producto |
| `/buscar?q=texto` | Resultados de búsqueda |
| `/favoritos` | Productos favoritos |
| `/checkout` | Finalizar compra |
| `/login` | Iniciar sesión |
| `/registro` | Crear cuenta |
| `/admin` | Panel de administración (solo administradores) |

## 🔌 API del backend

Documentación interactiva: **`http://localhost:4000/api-docs`**. Para probar las rutas de administrador, inicia sesión con `POST /api/auth/login`, copia el `token` y pégalo en el botón **Authorize**.

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| `POST` | `/api/auth/registro` | Público | Crea una cuenta de cliente y devuelve un token |
| `POST` | `/api/auth/login` | Público | Inicia sesión y devuelve un token (dura 8 horas) |
| `GET` | `/api/auth/yo` | Con sesión | Usuario de la sesión actual |
| `GET` | `/api/productos` | Público | Catálogo completo |
| `GET` | `/api/productos/:id` | Público | Un producto |
| `POST` | `/api/productos` | Admin | Crea un producto |
| `PUT` | `/api/productos/:id` | Admin | Actualiza un producto |
| `DELETE` | `/api/productos/:id` | Admin | Desactiva un producto (deja de verse en la tienda) |
| `POST` | `/api/imagenes` | Admin | Sube una imagen (JPG, PNG o WebP, máximo 5 MB) |
| `POST` | `/api/pedidos` | Público | Crea un pedido y devuelve la firma para pagarlo (con sesión, queda a nombre del usuario) |
| `POST` | `/api/pedidos/:referencia/confirmar` | Público | Verifica el pago con Wompi; si queda aprobado, envía el correo de confirmación |
| `GET` | `/api/pedidos` | Admin | Lista los pedidos (filtro `?estadoPago=aprobado,pendiente`) |
| `GET` | `/api/pedidos/:referencia` | Admin | Consulta un pedido |
| `PATCH` | `/api/pedidos/:referencia/envio` | Admin | Marca un pedido como enviado (y avisa al cliente por correo) o en revisión |

Las rutas de administrador responden **401** sin sesión y **403** si la sesión no es de administrador.

## 💳 Pagos con Wompi

1. El cliente envía solo los productos y cantidades. El **backend** toma los precios de su catálogo, revisa el stock, suma el envío y firma el total; el navegador nunca decide cuánto se cobra.
2. Se abre el widget de Wompi con ese monto y esa firma.
3. Al terminar, el backend **consulta la transacción a Wompi** y comprueba que la referencia, el monto y la moneda coincidan con el pedido. Si el pago queda aprobado, descuenta el stock una sola vez.

En modo pruebas (llaves `pub_test_…`) no se cobra dinero real. Usa la tarjeta **`4242 4242 4242 4242`**, cualquier fecha futura y CVC **`123`**.

## 📧 Correos a clientes

La tienda envía correos por Gmail (`backend/correo.js`) a la dirección que el cliente escribe en el checkout:

| Cuándo | Correo |
|--------|--------|
| El backend verifica con Wompi que el pago quedó **aprobado** | Confirmación con la referencia, los productos, el envío, el total y la dirección |
| El administrador marca el pedido como **enviado** | Aviso de que el pedido va en camino |

- Cada correo se envía **una sola vez**: volver a verificar un pago o marcarlo otra vez como enviado no lo repite.
- Se envían en segundo plano: si Gmail falla, el pago y el panel siguen funcionando y el error queda en la consola del backend.
- Para activarlos se necesita una **contraseña de aplicación** de Google (no la contraseña normal):
  1. En [myaccount.google.com](https://myaccount.google.com) → **Seguridad**, activa la **Verificación en dos pasos**.
  2. Entra a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crea una con el nombre `MovilMarket` y copia las 16 letras.
  3. Ponlas en `backend/.env` como `GMAIL_APP_PASSWORD` (sin espacios), junto con `GMAIL_USER`.
- Recomendado: usar una cuenta de Gmail solo para la tienda, porque los clientes ven esa dirección como remitente.

## 🔐 Usuario administrador

La cuenta de administrador se crea automáticamente la primera vez que arranca el backend, con los valores de `ADMIN_EMAIL` y `ADMIN_PASSWORD` del archivo `backend/.env`.

- Las contraseñas se guardan cifradas con **bcrypt**; nunca en texto plano ni en el código del frontend.
- Para cambiar la contraseña del administrador: edita `backend/.env`, borra su fila en la tabla `usuarios` de Supabase y reinicia el backend.
- Mientras desarrollas (`npm run dev`), la pantalla de login recuerda dónde está configurada la cuenta; en el build de producción ese aviso no aparece.

## 💾 Persistencia de datos

**En Supabase** (base de datos PostgreSQL). El backend se conecta con la llave secreta; el navegador nunca habla directo con estas tablas.

| Datos | Tablas |
|-------|--------|
| Catálogo | `productos`, `variantes_producto` (stock), `imagenes_producto`, `especificaciones_tecnicas`, `categorias`, `marcas`, `modelos` |
| Pedidos | `pedidos`, `detalles_pedido`, `pagos`, `historial_estados_pedido` |
| Usuarios | `usuarios` (contraseñas cifradas; `rol_id` 2 = administrador) |

- El `id` de un producto en la API es su `sku`.
- Eliminar un producto desde el panel lo **desactiva** (`activo = false`), porque los pedidos lo referencian.
- La tienda solo vende las variantes **sin recargo** (`precio_adicional = 0`): así se cobra siempre el precio que se muestra.
- Quien compra sin iniciar sesión queda con una cuenta de invitado sin contraseña; si luego se registra con ese correo, la cuenta se activa.

**En el backend** (`electiva-2-main/backend/uploads/`, no se sube al repositorio): imágenes subidas desde el panel de administración.

**En el navegador** (`localStorage`):

| Clave | Contenido |
|-------|-----------|
| `movimarket_token` | Token de la sesión |
| `movimarket_carrito` | Productos en el carrito |
| `movimarket_favoritos` | Productos favoritos |
| `movimarket_datos_envio` | Teléfono, dirección y ciudad de la última compra |

## 🧊 Modelo 3D

El iPhone 15 se muestra en 3D con `Modelo3DViewer.jsx`, que carga un archivo **FBX** mediante `FBXLoader` de Three.js. Los archivos se sirven desde:

```text
public/models/iphone-15/
├── iphone15.fbx
└── iphone15.fbm/   ← texturas (cámara, flash, fondo de pantalla)
```

Para agregar un modelo a otro producto, copia el `.fbx` (y su carpeta de texturas) en `public/models/` y escribe su ruta en el campo **Modelo 3D** (en *Opciones avanzadas*) al editar el producto desde el panel de administración, por ejemplo `/models/iphone-15/iphone15.fbx`.

## 📌 Estado actual y pendientes

- [x] Catálogo, categorías, búsqueda y detalle de productos
- [x] Carrito, favoritos y checkout
- [x] Backend en Express con documentación Swagger
- [x] Pagos con Wompi verificados por el backend
- [x] Registro e inicio de sesión con bcrypt y JWT; rutas de administrador protegidas
- [x] Panel de administración de productos (por categorías, con subida de imágenes) y pedidos
- [x] Visor 3D del iPhone 15
- [x] Datos en una base de datos (Supabase)
- [x] Correos de pedido confirmado y pedido enviado
- [ ] Selector de variantes (color, capacidad) en la tienda
- [ ] Subir las imágenes a Supabase Storage en vez del disco del backend
- [ ] Notificaciones de Wompi por webhook (hoy un pago pendiente se verifica desde el panel)
- [ ] Límite de intentos de inicio de sesión
- [ ] Verificación de correo al registrarse y recuperación de contraseña
- [ ] Carrito y favoritos guardados en la cuenta (hoy viven en el navegador)
- [ ] Página "Mis pedidos" para los clientes

---

Proyecto académico — **Electiva 2**.
