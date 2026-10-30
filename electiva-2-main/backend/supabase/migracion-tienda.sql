-- backend/supabase/migracion-tienda.sql
-- Adapta la base de datos de Supabase para el backend de MóvilMarket.
-- Pégalo completo en Supabase → SQL Editor y ejecútalo. Se puede ejecutar
-- más de una vez sin dañar nada.
--
-- Qué hace:
--   1. Agrega dos columnas que el esquema no tenía: el modelo 3D del producto
--      y la referencia de pago de Wompi del pedido.
--   2. Crea funciones para las operaciones que tocan varias tablas a la vez
--      (guardar un producto, crear un pedido, registrar un pago), para que se
--      hagan completas o no se hagan.
--   3. Deja esas funciones solo para el backend (llave secreta) y activa RLS
--      en las tablas con datos privados.

begin;

-- 1. Columnas nuevas -------------------------------------------------------

alter table productos add column if not exists modelo3d_url varchar(255);

alter table pedidos add column if not exists referencia varchar(40);
create unique index if not exists unq_pedidos_referencia on pedidos (referencia);

-- Si los datos de ejemplo se cargaron con ids escritos a mano, el contador de
-- ids quedó atrás y el siguiente insert chocaría ("llave duplicada"). Esto lo
-- deja justo después del id más alto; si ya estaba bien, no cambia nada útil.
do $$
declare
    t text;
begin
    foreach t in array array[
        'marcas', 'modelos', 'productos', 'variantes_producto', 'imagenes_producto',
        'especificaciones_tecnicas', 'usuarios', 'pedidos', 'detalles_pedido', 'pagos',
        'historial_estados_pedido', 'movimientos_inventario'
    ] loop
        execute format(
            'select setval(pg_get_serial_sequence(%L, ''id''), coalesce((select max(id) from %I), 0) + 1, false)',
            t, t);
    end loop;
end $$;

-- 2. Funciones -------------------------------------------------------------

-- "PC Gamer RTX 4070" -> "pc-gamer-rtx-4070"
create or replace function tienda_slug(p_texto text)
returns text
language sql
immutable
set search_path = public
as $$
    select trim(both '-' from regexp_replace(
        lower(translate(p_texto, 'áéíóúüñÁÉÍÓÚÜÑªº', 'aeiouunaeiouunao')),
        '[^a-z0-9]+', '-', 'g'));
$$;

-- Precio que se cobra hoy: el de oferta si está vigente, si no el normal.
create or replace function tienda_precio_vigente(p_producto productos)
returns numeric
language sql
stable
set search_path = public
as $$
    select case
        when p_producto.precio_oferta is not null
         and (p_producto.oferta_desde is null or p_producto.oferta_desde <= now())
         and (p_producto.oferta_hasta is null or p_producto.oferta_hasta >= now())
        then p_producto.precio_oferta
        else p_producto.precio
    end;
$$;

-- Crea o actualiza un producto (identificado por su sku) con su marca, modelo,
-- variante estándar, imagen de portada y especificaciones.
-- Claves de p: sku, nombre, categoria (slug de categorias), marca, descripcion,
-- imagen, stock, modelo3d, linea, y opcionalmente precio y especificaciones
-- (si no vienen, al editar se conservan los actuales).
-- Errores: MM400 = datos inválidos.
create or replace function tienda_guardar_producto(p jsonb)
returns text
language plpgsql
set search_path = public
as $$
declare
    v_sku text := p->>'sku';
    v_nombre text := trim(p->>'nombre');
    v_marca text := coalesce(nullif(trim(p->>'marca'), ''), 'Genérica');
    v_stock int := (p->>'stock')::int;
    v_categoria_id int;
    v_marca_id int;
    v_modelo_id int;
    v_producto_id bigint;
    v_slug text;
    v_variante_id bigint;
    v_stock_base int;
    v_stock_variante int;
    v_clave text;
    v_valor text;
begin
    select id into v_categoria_id from categorias where slug = p->>'categoria';
    if v_categoria_id is null then
        raise exception 'La categoría % no existe', p->>'categoria' using errcode = 'MM400';
    end if;

    select id into v_marca_id from marcas where lower(nombre) = lower(v_marca);
    if v_marca_id is null then
        insert into marcas (nombre, slug) values (v_marca, tienda_slug(v_marca))
        returning id into v_marca_id;
    end if;

    select id into v_modelo_id from modelos
    where marca_id = v_marca_id and nombre_modelo = left(v_nombre, 100);
    if v_modelo_id is null then
        insert into modelos (marca_id, nombre_modelo) values (v_marca_id, left(v_nombre, 100))
        returning id into v_modelo_id;
    end if;

    select id into v_producto_id from productos where sku = v_sku for update;

    if v_producto_id is null then
        if p->>'precio' is null then
            raise exception 'El precio es obligatorio' using errcode = 'MM400';
        end if;
        v_slug := left(tienda_slug(v_nombre), 150);
        if exists (select 1 from productos where slug = v_slug) then
            v_slug := left(tienda_slug(v_nombre), 130) || '-' || tienda_slug(v_sku);
        end if;
        insert into productos (sku, slug, nombre, descripcion, precio, categoria_id, marca_id, modelo_id, modelo3d_url)
        values (v_sku, v_slug, v_nombre, nullif(p->>'descripcion', ''), (p->>'precio')::numeric,
                v_categoria_id, v_marca_id, v_modelo_id, nullif(p->>'modelo3d', ''))
        returning id into v_producto_id;
    else
        update productos set
            nombre = v_nombre,
            descripcion = nullif(p->>'descripcion', ''),
            categoria_id = v_categoria_id,
            marca_id = v_marca_id,
            modelo_id = v_modelo_id,
            modelo3d_url = nullif(p->>'modelo3d', ''),
            activo = true
        where id = v_producto_id;

        -- Un precio nuevo puesto por el administrador reemplaza cualquier oferta.
        if p ? 'precio' then
            update productos
            set precio = (p->>'precio')::numeric, precio_oferta = null, oferta_desde = null, oferta_hasta = null
            where id = v_producto_id;
        end if;
    end if;

    -- Stock: la tienda solo vende las variantes sin recargo (precio_adicional = 0),
    -- así lo que se cobra siempre es el precio que se muestra.
    if not exists (select 1 from variantes_producto where producto_id = v_producto_id) then
        insert into variantes_producto (producto_id, sku, nombre, stock)
        values (v_producto_id, left(v_sku, 56) || '-STD', 'Estandar', v_stock);
    else
        select coalesce(sum(stock), 0) into v_stock_base
        from variantes_producto
        where producto_id = v_producto_id and activo and precio_adicional = 0;

        if v_stock <> v_stock_base then
            select id, stock into v_variante_id, v_stock_variante
            from variantes_producto
            where producto_id = v_producto_id and activo and precio_adicional = 0
            order by stock desc, id
            limit 1
            for update;

            if v_variante_id is null or v_stock_variante + (v_stock - v_stock_base) < 0 then
                raise exception 'Este producto tiene varias variantes: ajusta su stock directamente en Supabase'
                    using errcode = 'MM400';
            end if;

            update variantes_producto
            set stock = stock + (v_stock - v_stock_base)
            where id = v_variante_id;
        end if;
    end if;

    if nullif(p->>'imagen', '') is not null then
        update imagenes_producto set url_imagen = p->>'imagen'
        where producto_id = v_producto_id and es_portada;
        if not found then
            insert into imagenes_producto (producto_id, url_imagen, es_portada, orden)
            values (v_producto_id, p->>'imagen', true, 0);
        end if;
    end if;

    -- "Resumen" guarda el texto libre de especificaciones del formulario y
    -- "Línea" la línea del producto (Ultra, Series, SE...).
    foreach v_clave in array array['Resumen', 'Línea'] loop
        if v_clave = 'Resumen' and not (p ? 'especificaciones') then
            continue;
        end if;
        v_valor := nullif(trim(case v_clave when 'Resumen' then p->>'especificaciones' else p->>'linea' end), '');
        if v_valor is null then
            delete from especificaciones_tecnicas where producto_id = v_producto_id and clave = v_clave;
        else
            insert into especificaciones_tecnicas (producto_id, clave, valor)
            values (v_producto_id, v_clave, left(v_valor, 255))
            on conflict (producto_id, clave) do update set valor = excluded.valor;
        end if;
    end loop;

    return v_sku;
end;
$$;

-- Crea un pedido con sus líneas en una sola transacción (el trigger de
-- subtotal exige que existan juntos). Los precios salen de la base de datos,
-- nunca del navegador.
-- p_items: [{"sku": "cel-1", "cantidad": 2}, ...] con skus sin repetir.
-- Errores: MM400 = producto inexistente, MM409 = stock insuficiente.
create or replace function tienda_crear_pedido(
    p_referencia text,
    p_usuario_id bigint,
    p_direccion_texto text,
    p_snapshot jsonb,
    p_costo_envio numeric,
    p_items jsonb
)
returns bigint
language plpgsql
set search_path = public
as $$
declare
    v_item jsonb;
    v_producto productos%rowtype;
    v_precio numeric;
    v_cantidad int;
    v_disponible int;
    v_restante int;
    v_variante record;
    v_lineas jsonb := '[]'::jsonb;
    v_linea jsonb;
    v_subtotal numeric := 0;
    v_pedido_id bigint;
begin
    for v_item in select * from jsonb_array_elements(p_items) loop
        v_cantidad := (v_item->>'cantidad')::int;

        select * into v_producto from productos where sku = v_item->>'sku' and activo;
        if not found then
            raise exception 'El producto % no existe', v_item->>'sku' using errcode = 'MM400';
        end if;
        v_precio := tienda_precio_vigente(v_producto);

        select coalesce(sum(stock), 0) into v_disponible
        from variantes_producto
        where producto_id = v_producto.id and activo and precio_adicional = 0;
        if v_disponible < v_cantidad then
            raise exception 'Solo quedan % unidades de %', v_disponible, v_producto.nombre using errcode = 'MM409';
        end if;

        -- Reparte la cantidad entre las variantes sin recargo, la de más stock primero.
        v_restante := v_cantidad;
        for v_variante in
            select id, sku, stock from variantes_producto
            where producto_id = v_producto.id and activo and precio_adicional = 0 and stock > 0
            order by stock desc, id
        loop
            exit when v_restante = 0;
            v_lineas := v_lineas || jsonb_build_object(
                'variante_id', v_variante.id,
                'sku', v_variante.sku,
                'nombre', v_producto.nombre,
                'cantidad', least(v_restante, v_variante.stock),
                'precio', v_precio);
            v_subtotal := v_subtotal + least(v_restante, v_variante.stock) * v_precio;
            v_restante := v_restante - least(v_restante, v_variante.stock);
        end loop;
    end loop;

    insert into pedidos (referencia, usuario_id, direccion_texto, facturacion_snapshot, subtotal, costo_envio, monto_total)
    values (p_referencia, p_usuario_id, p_direccion_texto, p_snapshot, v_subtotal, p_costo_envio, v_subtotal + p_costo_envio)
    returning id into v_pedido_id;

    for v_linea in select * from jsonb_array_elements(v_lineas) loop
        insert into detalles_pedido (pedido_id, variante_id, nombre_producto, sku, cantidad, precio_unitario)
        values (v_pedido_id, (v_linea->>'variante_id')::bigint, v_linea->>'nombre', v_linea->>'sku',
                (v_linea->>'cantidad')::int, (v_linea->>'precio')::numeric);
    end loop;

    return v_pedido_id;
end;
$$;

-- Guarda el resultado de un pago de Wompi. Al aprobarse por primera vez
-- descuenta el stock (los triggers del esquema pasan el pedido a "pagado" y
-- registran el movimiento de inventario).
-- p_estado: pendiente | aprobado | rechazado.  Errores: MM404 = pedido inexistente.
create or replace function tienda_registrar_pago(
    p_referencia text,
    p_transaccion_id text,
    p_estado text,
    p_respuesta jsonb default null,
    p_descontar_stock boolean default true
)
returns void
language plpgsql
set search_path = public
as $$
declare
    v_pedido pedidos%rowtype;
    v_pago_id bigint;
    v_estado_previo text;
    v_fecha timestamptz := coalesce((p_respuesta->>'verificadoEn')::timestamptz, now());
begin
    select * into v_pedido from pedidos where referencia = p_referencia for update;
    if not found then
        raise exception 'Pedido % no encontrado', p_referencia using errcode = 'MM404';
    end if;

    select id, estado_pago into v_pago_id, v_estado_previo
    from pagos where pedido_id = v_pedido.id and pasarela = 'wompi'
    order by id desc limit 1;

    if v_pago_id is null then
        insert into pagos (pedido_id, metodo_pago, pasarela, monto, transaccion_id, estado_pago, respuesta_pasarela, fecha_pago)
        values (v_pedido.id, 'wompi', 'wompi', v_pedido.monto_total, p_transaccion_id, p_estado, p_respuesta, v_fecha);
    else
        update pagos
        set transaccion_id = p_transaccion_id, estado_pago = p_estado, respuesta_pasarela = p_respuesta, fecha_pago = v_fecha
        where id = v_pago_id;
    end if;

    if p_estado = 'aprobado' and v_estado_previo is distinct from 'aprobado' and p_descontar_stock then
        perform set_config('app.tipo_movimiento', 'venta', true);
        perform set_config('app.referencia_tipo', 'pedido', true);
        perform set_config('app.referencia_id', v_pedido.id::text, true);

        -- Bloquea las variantes siempre en orden de id: dos pagos simultáneos
        -- con productos en común esperan su turno en vez de bloquearse entre sí.
        perform 1 from variantes_producto
        where id in (select variante_id from detalles_pedido where pedido_id = v_pedido.id)
        order by id
        for update;

        update variantes_producto v
        set stock = greatest(0, v.stock - d.cantidad)
        from detalles_pedido d
        where d.pedido_id = v_pedido.id and d.variante_id = v.id;

        perform set_config('app.tipo_movimiento', '', true);
        perform set_config('app.referencia_tipo', '', true);
        perform set_config('app.referencia_id', '', true);
    end if;
end;
$$;

-- 3. Permisos --------------------------------------------------------------

-- Postgres deja ejecutar cualquier función nueva a todo el mundo; estas solo
-- las usa el backend con la llave secreta.
revoke execute on function
    tienda_slug(text),
    tienda_precio_vigente(productos),
    tienda_guardar_producto(jsonb),
    tienda_crear_pedido(text, bigint, text, jsonb, numeric, jsonb),
    tienda_registrar_pago(text, text, text, jsonb, boolean)
from public, anon, authenticated;

grant execute on function
    tienda_slug(text),
    tienda_precio_vigente(productos),
    tienda_guardar_producto(jsonb),
    tienda_crear_pedido(text, bigint, text, jsonb, numeric, jsonb),
    tienda_registrar_pago(text, text, text, jsonb, boolean)
to service_role;

-- Tablas con datos de clientes: RLS sin políticas = nadie las lee con la llave
-- publicable. El backend usa la llave secreta, que no pasa por RLS.
alter table usuarios enable row level security;
alter table sesiones enable row level security;
alter table tokens_usuario enable row level security;
alter table direcciones enable row level security;
alter table datos_facturacion enable row level security;
alter table pedidos enable row level security;
alter table detalles_pedido enable row level security;
alter table historial_estados_pedido enable row level security;
alter table pagos enable row level security;
alter table envios enable row level security;
alter table carrito enable row level security;
alter table favoritos enable row level security;
alter table cupones_usados enable row level security;
alter table devoluciones enable row level security;
alter table movimientos_inventario enable row level security;

commit;

-- Para que la API de Supabase vea las columnas y funciones nuevas.
notify pgrst, 'reload schema';
