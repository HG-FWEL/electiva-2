// src/components/FormularioProducto.jsx
// Formulario del panel de admin para crear o editar un producto, con vista
// previa en vivo de cómo se verá la tarjeta en la tienda.
import React, { useMemo, useRef, useState } from 'react';
import { categorias } from '../data/Productos';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { formatPrecioCOP } from '../utils/precio';
import { FALLBACK_IMAGE } from '../utils/placeholder';
import { subirImagen } from '../utils/api';
import ProductCard from './ProductCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faCloudArrowUp, faLink, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import './FormularioProducto.css';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO = 5 * 1024 * 1024; // igual que el backend

function formularioDesde(producto) {
  return {
    nombre: producto?.nombre || '',
    categoria: producto?.categoria || categorias[0]?.slug || '',
    marca: producto?.marca || '',
    linea: producto?.linea || '',
    especificaciones: producto?.especificaciones || '',
    descripcion: producto?.descripcion || '',
    precio: producto?.precio ?? '',
    stock: producto?.stock ?? '',
    imagen: producto?.imagen || '',
    modelo3d: producto?.modelo3d || '',
  };
}

// Mismas reglas que valida el backend (backend/rutas/productos.js), pero
// mostrando todos los errores a la vez y junto a cada campo.
function validar(formulario) {
  const errores = {};
  if (!formulario.nombre.trim()) errores.nombre = 'Escribe el nombre del producto';
  if (!formulario.categoria) errores.categoria = 'Elige una categoría';
  if (formulario.precio === '' || !Number.isFinite(Number(formulario.precio)) || Number(formulario.precio) < 0) {
    errores.precio = 'Escribe un precio válido en pesos';
  }
  if (formulario.stock === '' || !Number.isInteger(Number(formulario.stock)) || Number(formulario.stock) < 0) {
    errores.stock = 'El stock debe ser un número entero, 0 o más';
  }
  if (!formulario.imagen.trim()) errores.imagen = 'Sube una imagen o pega su URL';
  return errores;
}

function CampoForm({ etiqueta, error, ayuda, children }) {
  return (
    <label className={`form-producto-campo ${error ? 'con-error' : ''}`}>
      <span className="form-producto-etiqueta">{etiqueta}</span>
      {children}
      {error ? <span className="form-producto-error">{error}</span> : ayuda && <span className="form-producto-ayuda">{ayuda}</span>}
    </label>
  );
}

function FormularioProducto({ producto, productos, onGuardar, onCerrar }) {
  const editando = Boolean(producto);
  const inicial = useMemo(() => formularioDesde(producto), [producto]);
  const [formulario, setFormulario] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [errorGuardado, setErrorGuardado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modoImagen, setModoImagen] = useState(producto?.imagen ? 'url' : 'subir');
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [imagenRota, setImagenRota] = useState(false);
  const inputArchivo = useRef(null);

  const hayCambios = JSON.stringify(formulario) !== JSON.stringify(inicial);

  const cerrar = () => {
    if (hayCambios && !window.confirm('Tienes cambios sin guardar. ¿Cerrar de todas formas?')) return;
    onCerrar();
  };

  useEscapeKey(cerrar, true);

  // Marcas que ya existen en la categoría elegida, para sugerirlas al escribir
  const marcasSugeridas = useMemo(
    () => [...new Set(productos.filter((p) => p.categoria === formulario.categoria && p.marca).map((p) => p.marca))].sort(),
    [productos, formulario.categoria]
  );

  const cambiar = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: undefined }));
    if (campo === 'imagen') setImagenRota(false);
  };

  const handleChange = (campo) => (e) => cambiar(campo, e.target.value);

  const procesarArchivo = async (archivo) => {
    if (!archivo) return;
    if (!TIPOS_IMAGEN.includes(archivo.type)) {
      setErrores((prev) => ({ ...prev, imagen: 'Solo se permiten imágenes JPG, PNG o WebP' }));
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setErrores((prev) => ({ ...prev, imagen: 'La imagen no puede pesar más de 5 MB' }));
      return;
    }
    setSubiendo(true);
    try {
      cambiar('imagen', await subirImagen(archivo));
    } catch (error) {
      setErrores((prev) => ({ ...prev, imagen: error.message }));
    } finally {
      setSubiendo(false);
    }
  };

  const handleSoltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    procesarArchivo(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (guardando || subiendo) return;

    const nuevosErrores = validar(formulario);
    setErrores(nuevosErrores);
    setErrorGuardado('');
    if (Object.keys(nuevosErrores).length > 0) return;

    setGuardando(true);
    try {
      await onGuardar({
        nombre: formulario.nombre.trim(),
        categoria: formulario.categoria,
        marca: formulario.marca.trim(),
        linea: formulario.linea.trim(),
        especificaciones: formulario.especificaciones.trim(),
        descripcion: formulario.descripcion.trim() || formulario.especificaciones.trim(),
        precio: Number(formulario.precio),
        stock: Number(formulario.stock),
        imagen: formulario.imagen.trim(),
        modelo3d: formulario.modelo3d.trim(),
      });
    } catch (error) {
      setErrorGuardado(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const productoVistaPrevia = {
    id: 'vista-previa',
    nombre: formulario.nombre.trim() || 'Nombre del producto',
    especificaciones: formulario.especificaciones.trim() || 'Especificaciones principales',
    precio: Number(formulario.precio) || 0,
    stock: formulario.stock === '' ? undefined : Number(formulario.stock),
    imagen: formulario.imagen.trim() || FALLBACK_IMAGE,
  };
  const nombreCategoria = categorias.find((c) => c.slug === formulario.categoria)?.nombre;
  const totalErrores = Object.values(errores).filter(Boolean).length;

  return (
    <div className="admin-form-overlay" onClick={cerrar}>
      <form className="admin-form form-producto" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} noValidate>
        <div className="admin-form-header">
          <div>
            <h2>{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
            <p className="form-producto-subtitulo">
              {editando ? 'Los cambios se ven en la tienda apenas guardes.' : 'Completa los datos; a la derecha ves cómo quedará.'}
            </p>
          </div>
          <button type="button" className="btn-admin-cerrar" onClick={cerrar} aria-label="Cerrar">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="form-producto-cuerpo">
          <div className="form-producto-campos">
            <fieldset className="form-producto-grupo">
              <legend>Información básica</legend>
              <CampoForm etiqueta="Nombre" error={errores.nombre}>
                <input type="text" value={formulario.nombre} onChange={handleChange('nombre')} placeholder="Ej: iPhone 15 Pro Max" autoFocus />
              </CampoForm>

              <div className="admin-form-fila">
                <CampoForm etiqueta="Categoría" error={errores.categoria}>
                  <select value={formulario.categoria} onChange={handleChange('categoria')}>
                    {categorias.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.nombre}</option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm etiqueta="Marca (opcional)" ayuda={marcasSugeridas.length > 0 ? `Ej: ${marcasSugeridas.slice(0, 3).join(', ')}` : undefined}>
                  <input type="text" list="marcas-sugeridas" value={formulario.marca} onChange={handleChange('marca')} />
                  <datalist id="marcas-sugeridas">
                    {marcasSugeridas.map((marca) => <option key={marca} value={marca} />)}
                  </datalist>
                </CampoForm>
              </div>

              <CampoForm etiqueta="Especificaciones" ayuda="Lo que se ve en la tarjeta. Separa cada dato con ·">
                <input
                  type="text"
                  value={formulario.especificaciones}
                  onChange={handleChange('especificaciones')}
                  placeholder="256GB · Chip A17 Pro · Cámara 48MP"
                />
              </CampoForm>

              <CampoForm etiqueta="Descripción (opcional)" ayuda="Si la dejas vacía se usan las especificaciones.">
                <textarea rows="3" value={formulario.descripcion} onChange={handleChange('descripcion')} />
              </CampoForm>
            </fieldset>

            <fieldset className="form-producto-grupo">
              <legend>Precio e inventario</legend>
              <div className="admin-form-fila">
                <CampoForm
                  etiqueta="Precio (COP)"
                  error={errores.precio}
                  ayuda={formulario.precio !== '' && Number(formulario.precio) >= 0 ? `Se mostrará como ${formatPrecioCOP(formulario.precio)}` : undefined}
                >
                  <div className="form-producto-prefijo">
                    <span>$</span>
                    <input type="number" min="0" step="1000" inputMode="numeric" value={formulario.precio} onChange={handleChange('precio')} placeholder="4796000" />
                  </div>
                </CampoForm>
                <CampoForm
                  etiqueta="Unidades en stock"
                  error={errores.stock}
                  ayuda={formulario.stock !== '' && Number(formulario.stock) === 0 ? 'Con 0 se mostrará como agotado' : undefined}
                >
                  <input type="number" min="0" step="1" inputMode="numeric" value={formulario.stock} onChange={handleChange('stock')} placeholder="10" />
                </CampoForm>
              </div>
            </fieldset>

            <fieldset className="form-producto-grupo">
              <legend>Imagen</legend>
              <div className="form-producto-pestanas" role="tablist">
                <button type="button" role="tab" aria-selected={modoImagen === 'subir'} className={modoImagen === 'subir' ? 'activa' : ''} onClick={() => setModoImagen('subir')}>
                  <FontAwesomeIcon icon={faCloudArrowUp} /> Subir archivo
                </button>
                <button type="button" role="tab" aria-selected={modoImagen === 'url'} className={modoImagen === 'url' ? 'activa' : ''} onClick={() => setModoImagen('url')}>
                  <FontAwesomeIcon icon={faLink} /> Pegar URL
                </button>
              </div>

              {modoImagen === 'subir' ? (
                <div
                  className={`form-producto-zona ${arrastrando ? 'arrastrando' : ''} ${errores.imagen ? 'con-error' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
                  onDragLeave={() => setArrastrando(false)}
                  onDrop={handleSoltar}
                  onClick={() => inputArchivo.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputArchivo.current?.click()}
                >
                  <input
                    ref={inputArchivo}
                    type="file"
                    accept={TIPOS_IMAGEN.join(',')}
                    hidden
                    onChange={(e) => { procesarArchivo(e.target.files?.[0]); e.target.value = ''; }}
                  />
                  {subiendo ? (
                    <p><strong>Subiendo imagen…</strong></p>
                  ) : formulario.imagen ? (
                    <>
                      <img src={formulario.imagen} alt="Imagen del producto" onError={() => setImagenRota(true)} />
                      <p>Arrastra otra imagen o <strong>haz clic</strong> para cambiarla</p>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCloudArrowUp} className="form-producto-zona-icono" />
                      <p>Arrastra una imagen aquí o <strong>haz clic para elegirla</strong></p>
                      <small>JPG, PNG o WebP · máximo 5 MB</small>
                    </>
                  )}
                </div>
              ) : (
                <CampoForm etiqueta="URL de la imagen">
                  <input type="url" value={formulario.imagen} onChange={handleChange('imagen')} placeholder="https://…" />
                </CampoForm>
              )}
              {errores.imagen && <span className="form-producto-error">{errores.imagen}</span>}
              {imagenRota && !errores.imagen && (
                <span className="form-producto-advertencia">
                  <FontAwesomeIcon icon={faTriangleExclamation} /> No pudimos cargar esta imagen. Revisa la URL o sube el archivo.
                </span>
              )}
            </fieldset>

            <details className="form-producto-avanzado">
              <summary>Opciones avanzadas</summary>
              <CampoForm etiqueta="Línea (opcional)" ayuda="Para categorías sin marca: se usa como filtro en la tienda (ej: Pro, Air).">
                <input type="text" value={formulario.linea} onChange={handleChange('linea')} />
              </CampoForm>
              <CampoForm etiqueta="Modelo 3D (opcional)" ayuda="Ruta a un archivo .fbx en /public. Si lo pones, la ficha muestra el visor 3D.">
                <input type="text" value={formulario.modelo3d} onChange={handleChange('modelo3d')} placeholder="/models/iphone-15/iphone15.fbx" />
              </CampoForm>
            </details>
          </div>

          <aside className="form-producto-vista-previa" aria-label="Vista previa">
            <span className="form-producto-vista-previa-titulo">Vista previa en la tienda</span>
            {/* Solo de muestra: no se puede hacer clic ni marcar como favorito */}
            <div className="form-producto-tarjeta" inert>
              <ProductCard producto={productoVistaPrevia} onSeleccionar={() => {}} />
            </div>
            {nombreCategoria && <p className="form-producto-vista-previa-nota">Aparecerá en <strong>{nombreCategoria}</strong></p>}
          </aside>
        </div>

        {errorGuardado && <div className="auth-error">{errorGuardado}</div>}

        <div className="admin-form-acciones">
          {totalErrores > 0 && (
            <span className="form-producto-resumen-errores">
              Revisa {totalErrores === 1 ? 'el campo marcado' : `los ${totalErrores} campos marcados`}
            </span>
          )}
          <button type="button" className="btn-admin-cancelar" onClick={cerrar}>Cancelar</button>
          <button type="submit" className="btn-admin-guardar" disabled={guardando || subiendo}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioProducto;
