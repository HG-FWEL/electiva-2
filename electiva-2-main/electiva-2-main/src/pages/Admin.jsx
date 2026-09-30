// src/pages/Admin.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminProducts } from '../context/AdminProductsContext';
import { useOrders } from '../context/OrdersContext';
import AdminPedidos from '../components/AdminPedidos';
import { categorias } from '../data/Productos';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faPen,
  faTrash,
  faBoxOpen,
  faTriangleExclamation,
  faLayerGroup,
  faTags,
  faMagnifyingGlass,
  faXmark,
  faUserShield,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import './Admin.css';

const PRODUCTO_VACIO = {
  nombre: '',
  categoria: categorias[0]?.slug || '',
  marca: '',
  linea: '',
  especificaciones: '',
  descripcion: '',
  precio: '',
  stock: '',
  imagen: '',
  modelo3d: '',
};

function estadoStock(stock) {
  if (stock <= 0) return { texto: 'Agotado', clase: 'stock-agotado' };
  if (stock <= 3) return { texto: `Bajo (${stock})`, clase: 'stock-bajo' };
  return { texto: `${stock} und.`, clase: 'stock-ok' };
}

function Admin() {
  const { usuarioActual } = useAuth();
  const { catalogoCompleto, agregarProducto, editarProducto, eliminarProducto } = useAdminProducts();
  const { pedidos } = useOrders();
  useDocumentTitle('Panel de administración');

  const [pestana, setPestana] = useState('productos');
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(PRODUCTO_VACIO);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const estadisticas = useMemo(() => {
    const total = catalogoCompleto.length;
    const sinStock = catalogoCompleto.filter((p) => Number(p.stock) <= 0).length;
    const stockBajo = catalogoCompleto.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3).length;
    const categoriasActivas = new Set(catalogoCompleto.map((p) => p.categoria)).size;
    return { total, sinStock, stockBajo, categoriasActivas };
  }, [catalogoCompleto]);

  const pedidosPendientes = pedidos.filter((p) => p.estado === 'revision').length;

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return catalogoCompleto;
    return catalogoCompleto.filter(
      (p) => p.nombre.toLowerCase().includes(texto) || p.categoria.toLowerCase().includes(texto)
    );
  }, [catalogoCompleto, busqueda]);

  const abrirFormularioNuevo = () => {
    setFormulario(PRODUCTO_VACIO);
    setEditandoId(null);
    setError('');
    setMensajeExito('');
    setMostrarFormulario(true);
  };

  const abrirFormularioEdicion = (producto) => {
    setFormulario({
      nombre: producto.nombre || '',
      categoria: producto.categoria || categorias[0]?.slug || '',
      marca: producto.marca || '',
      linea: producto.linea || '',
      especificaciones: producto.especificaciones || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      imagen: producto.imagen || '',
      modelo3d: producto.modelo3d || '',
    });
    setEditandoId(producto.id);
    setError('');
    setMensajeExito('');
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(PRODUCTO_VACIO);
    setError('');
  };

  const handleChange = (campo) => (e) => {
    setFormulario((prev) => ({ ...prev, [campo]: e.target.value }));
  };

  const validar = () => {
    if (!formulario.nombre.trim()) return 'Ingresa el nombre del producto.';
    if (!formulario.categoria.trim()) return 'Selecciona una categoría.';
    if (formulario.precio === '' || Number(formulario.precio) < 0) return 'Ingresa un precio válido.';
    if (formulario.stock === '' || Number(formulario.stock) < 0) return 'Ingresa un stock válido.';
    if (!formulario.imagen.trim()) return 'Ingresa la URL de una imagen.';
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const mensajeError = validar();
    if (mensajeError) {
      setError(mensajeError);
      setMensajeExito('');
      return;
    }

    const datosProducto = {
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria.trim(),
      marca: formulario.marca.trim() || undefined,
      linea: formulario.linea.trim() || undefined,
      especificaciones: formulario.especificaciones.trim(),
      descripcion: formulario.descripcion.trim() || formulario.especificaciones.trim(),
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
      imagen: formulario.imagen.trim(),
      modelo3d: formulario.modelo3d.trim() || undefined,
    };

    if (editandoId) {
      editarProducto(editandoId, datosProducto);
      setMensajeExito('Producto actualizado correctamente.');
    } else {
      agregarProducto(datosProducto);
      setMensajeExito('Producto agregado correctamente.');
    }

    setError('');
    setMostrarFormulario(false);
    setEditandoId(null);
    setFormulario(PRODUCTO_VACIO);
  };

  const handleEliminar = (producto) => {
    const confirmado = window.confirm(`¿Eliminar "${producto.nombre}" de la tienda?`);
    if (!confirmado) return;
    eliminarProducto(producto.id);
    setMensajeExito('Producto eliminado.');
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-info">
          <span className="admin-header-icono">
            <FontAwesomeIcon icon={faUserShield} />
          </span>
          <div>
            <h1>Panel de administración</h1>
            <p className="admin-subtitulo">
              Sesión iniciada como <strong>{usuarioActual?.nombre}</strong> · {usuarioActual?.email}
            </p>
          </div>
        </div>
        {pestana === 'productos' && (
          <button type="button" className="btn-admin-nuevo" onClick={abrirFormularioNuevo}>
            <FontAwesomeIcon icon={faPlus} /> Agregar producto
          </button>
        )}
      </div>

      <div className="admin-pestanas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'productos'}
          className={`admin-pestana ${pestana === 'productos' ? 'activa' : ''}`}
          onClick={() => setPestana('productos')}
        >
          <FontAwesomeIcon icon={faBoxOpen} /> Productos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pestana === 'pedidos'}
          className={`admin-pestana ${pestana === 'pedidos' ? 'activa' : ''}`}
          onClick={() => setPestana('pedidos')}
        >
          <FontAwesomeIcon icon={faReceipt} /> Pedidos
          {pedidosPendientes > 0 && <span className="admin-pestana-badge">{pedidosPendientes}</span>}
        </button>
      </div>

      {pestana === 'pedidos' ? (
        <AdminPedidos />
      ) : (
      <>
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-azul">
            <FontAwesomeIcon icon={faBoxOpen} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.total}</span>
            <span className="admin-stat-label">Productos totales</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-morado">
            <FontAwesomeIcon icon={faLayerGroup} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.categoriasActivas}</span>
            <span className="admin-stat-label">Categorías activas</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-naranja">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.stockBajo}</span>
            <span className="admin-stat-label">Con stock bajo</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <span className="admin-stat-icono icono-rojo">
            <FontAwesomeIcon icon={faTags} />
          </span>
          <div>
            <span className="admin-stat-valor">{estadisticas.sinStock}</span>
            <span className="admin-stat-label">Agotados</span>
          </div>
        </div>
      </div>

      {mensajeExito && <div className="admin-exito">{mensajeExito}</div>}

      {mostrarFormulario && (
        <div className="admin-form-overlay" onClick={cerrarFormulario}>
          <form className="admin-form" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} noValidate>
            <div className="admin-form-header">
              <h2>{editandoId ? 'Editar producto' : 'Nuevo producto'}</h2>
              <button type="button" className="btn-admin-cerrar" onClick={cerrarFormulario} aria-label="Cerrar">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            {error && <div className="auth-error">{error}</div>}

            <label>
              Nombre
              <input type="text" value={formulario.nombre} onChange={handleChange('nombre')} />
            </label>

            <div className="admin-form-fila">
              <label>
                Categoría
                <select value={formulario.categoria} onChange={handleChange('categoria')}>
                  {categorias.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Marca (opcional)
                <input type="text" value={formulario.marca} onChange={handleChange('marca')} />
              </label>
            </div>

            <label>
              Especificaciones
              <input
                type="text"
                value={formulario.especificaciones}
                onChange={handleChange('especificaciones')}
                placeholder="Ej: 256GB · Chip A17 Pro · Cámara 48MP"
              />
            </label>

            <label>
              Descripción (opcional)
              <textarea rows="3" value={formulario.descripcion} onChange={handleChange('descripcion')} />
            </label>

            <div className="admin-form-fila">
              <label>
                Precio (USD)
                <input type="number" min="0" step="0.01" value={formulario.precio} onChange={handleChange('precio')} />
              </label>

              <label>
                Stock
                <input type="number" min="0" step="1" value={formulario.stock} onChange={handleChange('stock')} />
              </label>
            </div>

            <label>
              URL de la imagen
              <input type="text" value={formulario.imagen} onChange={handleChange('imagen')} placeholder="https://…" />
            </label>

            {formulario.imagen && (
              <div className="admin-form-preview">
                <img src={formulario.imagen} alt="Vista previa" onError={handleImgError} />
                <span>Vista previa</span>
              </div>
            )}

            <div className="admin-form-acciones">
              <button type="button" className="btn-admin-cancelar" onClick={cerrarFormulario}>
                Cancelar
              </button>
              <button type="submit" className="btn-admin-guardar">
                {editandoId ? 'Guardar cambios' : 'Agregar producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-buscador">
        <div className="admin-buscador-input">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="admin-buscador-contador">
          {productosFiltrados.length} producto{productosFiltrados.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="admin-tabla-contenedor">
        <table className="admin-tabla">
          <thead>
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => {
              const stockInfo = estadoStock(Number(producto.stock) || 0);
              return (
                <tr key={producto.id}>
                  <td>
                    <img
                      src={producto.imagen}
                      alt={producto.nombre}
                      onError={handleImgError}
                      className="admin-tabla-imagen"
                    />
                  </td>
                  <td className="admin-tabla-nombre">{producto.nombre}</td>
                  <td>
                    <span className="admin-badge-categoria">{producto.categoria}</span>
                  </td>
                  <td className="admin-tabla-precio">{formatPrecioCOP(producto.precio)}</td>
                  <td>
                    <span className={`admin-badge-stock ${stockInfo.clase}`}>{stockInfo.texto}</span>
                  </td>
                  <td className="admin-tabla-acciones">
                    <button
                      type="button"
                      className="btn-admin-editar"
                      onClick={() => abrirFormularioEdicion(producto)}
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      className="btn-admin-eliminar"
                      onClick={() => handleEliminar(producto)}
                      title="Eliminar"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-tabla-vacia">
                  No hay productos que coincidan con tu búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}

export default Admin;
