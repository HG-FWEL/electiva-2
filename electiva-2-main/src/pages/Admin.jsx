// src/pages/Admin.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProductos } from '../context/ProductosContext';
import { usePedidos } from '../hooks/usePedidos';
import AdminPedidos from '../components/AdminPedidos';
import FormularioProducto from '../components/FormularioProducto';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { handleImgError } from '../utils/placeholder';
import { formatPrecioCOP } from '../utils/precio';
import { categorias } from '../data/Productos';
import { ICONOS_CATEGORIA } from '../utils/categorias';
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
  faUserShield,
  faReceipt,
  faChevronDown,
  faBox,
} from '@fortawesome/free-solid-svg-icons';
import './Admin.css';

function estadoStock(stock) {
  if (stock <= 0) return { texto: 'Agotado', clase: 'stock-agotado' };
  if (stock <= 3) return { texto: `Bajo (${stock})`, clase: 'stock-bajo' };
  return { texto: `${stock} und.`, clase: 'stock-ok' };
}

// Agrupa los productos en el orden del menú; los de categorías desconocidas van al final.
function agruparPorCategoria(productos) {
  const grupos = categorias.map((cat) => ({
    ...cat,
    productos: productos.filter((p) => p.categoria === cat.slug),
  }));
  const conocidas = new Set(categorias.map((cat) => cat.slug));
  const otras = productos.filter((p) => !conocidas.has(p.categoria));
  if (otras.length > 0) grupos.push({ slug: 'otras', nombre: 'Otras', productos: otras });
  return grupos;
}

function contarAlertas(productos) {
  const agotados = productos.filter((p) => Number(p.stock) <= 0).length;
  const bajos = productos.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3).length;
  return { agotados, bajos };
}

function Admin() {
  const { usuarioActual } = useAuth();
  const {
    productos: catalogoCompleto,
    cargando: cargandoProductos,
    error: errorProductos,
    agregarProducto,
    editarProducto,
    eliminarProducto,
  } = useProductos();
  const pedidosApi = usePedidos();
  const { pedidos } = pedidosApi;
  useDocumentTitle('Panel de administración');

  const [pestana, setPestana] = useState('productos');
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [plegadas, setPlegadas] = useState(() => new Set());
  // null = formulario cerrado; { producto: null } = nuevo; { producto } = editar
  const [formulario, setFormulario] = useState(null);
  const [mensajeExito, setMensajeExito] = useState('');

  const estadisticas = useMemo(() => {
    const total = catalogoCompleto.length;
    const sinStock = catalogoCompleto.filter((p) => Number(p.stock) <= 0).length;
    const stockBajo = catalogoCompleto.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 3).length;
    const categoriasActivas = new Set(catalogoCompleto.map((p) => p.categoria)).size;
    return { total, sinStock, stockBajo, categoriasActivas };
  }, [catalogoCompleto]);

  const pedidosPendientes = pedidos.filter((p) => p.envio.estado === 'revision').length;

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return catalogoCompleto;
    return catalogoCompleto.filter(
      (p) =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto) ||
        (p.marca ?? '').toLowerCase().includes(texto)
    );
  }, [catalogoCompleto, busqueda]);

  // Los chips cuentan sobre la búsqueda, para que reflejen lo que se va a ver.
  const gruposFiltrados = useMemo(
    () => agruparPorCategoria(productosFiltrados),
    [productosFiltrados]
  );

  const gruposVisibles = gruposFiltrados.filter(
    (g) => g.productos.length > 0 && (categoriaActiva === 'todas' || g.slug === categoriaActiva)
  );

  const totalVisible = gruposVisibles.reduce((suma, g) => suma + g.productos.length, 0);

  const alternarPlegada = (slug) => {
    setPlegadas((anteriores) => {
      const siguientes = new Set(anteriores);
      if (siguientes.has(slug)) siguientes.delete(slug);
      else siguientes.add(slug);
      return siguientes;
    });
  };

  const abrirFormulario = (producto = null) => {
    setMensajeExito('');
    setFormulario({ producto });
  };

  // Si el backend rechaza el guardado, el error sube al formulario y se muestra allí.
  const handleGuardar = async (datosProducto) => {
    const { producto } = formulario;
    if (producto) {
      await editarProducto(producto.id, datosProducto);
      setMensajeExito(`"${datosProducto.nombre}" se actualizó correctamente.`);
    } else {
      await agregarProducto(datosProducto);
      setMensajeExito(`"${datosProducto.nombre}" ya está a la venta en la tienda.`);
    }
    setFormulario(null);
  };

  const handleEliminar = async (producto) => {
    const confirmado = window.confirm(`¿Eliminar "${producto.nombre}" de la tienda?`);
    if (!confirmado) return;
    try {
      await eliminarProducto(producto.id);
      setMensajeExito('Producto eliminado.');
    } catch (errorEliminado) {
      window.alert(`No se pudo eliminar el producto: ${errorEliminado.message}`);
    }
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
          <button type="button" className="btn-admin-nuevo" onClick={() => abrirFormulario()}>
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
        <AdminPedidos {...pedidosApi} />
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

      {formulario && (
        <FormularioProducto
          producto={formulario.producto}
          productos={catalogoCompleto}
          onGuardar={handleGuardar}
          onCerrar={() => setFormulario(null)}
        />
      )}

      <div className="admin-buscador">
        <div className="admin-buscador-input">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o categoría…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <span className="admin-buscador-contador">
          {totalVisible} producto{totalVisible === 1 ? '' : 's'}
        </span>
      </div>

      <div className="admin-categorias" role="group" aria-label="Filtrar por categoría">
        <button
          type="button"
          className={`admin-categoria-chip ${categoriaActiva === 'todas' ? 'activa' : ''}`}
          aria-pressed={categoriaActiva === 'todas'}
          onClick={() => setCategoriaActiva('todas')}
        >
          <FontAwesomeIcon icon={faLayerGroup} /> Todas
          <span className="admin-categoria-chip-cantidad">{productosFiltrados.length}</span>
        </button>
        {gruposFiltrados.map((grupo) => (
          <button
            key={grupo.slug}
            type="button"
            className={`admin-categoria-chip ${categoriaActiva === grupo.slug ? 'activa' : ''}`}
            aria-pressed={categoriaActiva === grupo.slug}
            disabled={grupo.productos.length === 0}
            onClick={() => setCategoriaActiva(grupo.slug)}
          >
            <FontAwesomeIcon icon={ICONOS_CATEGORIA[grupo.slug] ?? faBox} /> {grupo.nombre}
            <span className="admin-categoria-chip-cantidad">{grupo.productos.length}</span>
          </button>
        ))}
      </div>

      {gruposVisibles.length === 0 && (
        <div className="admin-tabla-contenedor admin-tabla-vacia">
          {cargandoProductos
            ? 'Cargando productos…'
            : errorProductos
            ? `No se pudieron cargar los productos: ${errorProductos}`
            : 'No hay productos que coincidan con tu búsqueda.'}
        </div>
      )}

      <div className="admin-grupos">
        {gruposVisibles.map((grupo) => {
          const plegada = plegadas.has(grupo.slug);
          const alertas = contarAlertas(grupo.productos);
          const idCuerpo = `admin-grupo-${grupo.slug}`;
          return (
            <section key={grupo.slug} className="admin-grupo">
              <button
                type="button"
                className="admin-grupo-header"
                aria-expanded={!plegada}
                aria-controls={idCuerpo}
                onClick={() => alternarPlegada(grupo.slug)}
              >
                <span className="admin-grupo-icono">
                  <FontAwesomeIcon icon={ICONOS_CATEGORIA[grupo.slug] ?? faBox} />
                </span>
                <span className="admin-grupo-titulo">
                  <h2>{grupo.nombre}</h2>
                  <span className="admin-grupo-cantidad">
                    {grupo.productos.length} producto{grupo.productos.length === 1 ? '' : 's'}
                  </span>
                </span>
                <span className="admin-grupo-alertas">
                  {alertas.bajos > 0 && (
                    <span className="admin-badge-stock stock-bajo">{alertas.bajos} con stock bajo</span>
                  )}
                  {alertas.agotados > 0 && (
                    <span className="admin-badge-stock stock-agotado">
                      {alertas.agotados} agotado{alertas.agotados === 1 ? '' : 's'}
                    </span>
                  )}
                </span>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`admin-grupo-flecha ${plegada ? 'plegada' : ''}`}
                />
              </button>

              {!plegada && (
                <div className="admin-tabla-contenedor" id={idCuerpo}>
                  <table className="admin-tabla">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Nombre</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.productos.map((producto) => {
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
                            <td className="admin-tabla-marca">{producto.marca || '—'}</td>
                            <td className="admin-tabla-precio">{formatPrecioCOP(producto.precio)}</td>
                            <td>
                              <span className={`admin-badge-stock ${stockInfo.clase}`}>{stockInfo.texto}</span>
                            </td>
                            <td className="admin-tabla-acciones">
                              <button
                                type="button"
                                className="btn-admin-editar"
                                onClick={() => abrirFormulario(producto)}
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
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}

export default Admin;
