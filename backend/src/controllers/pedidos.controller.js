const pool = require('../config/db');

const getPedidos = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM pedidos');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT p.*, 
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        u.nombres || ' ' || u.apellidos AS vendedor_nombre
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.fecha_pedido DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedidos', error });
  }
};

const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;

    const pedido = await pool.query(
      `SELECT p.*,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        u.nombres || ' ' || u.apellidos AS vendedor_nombre
       FROM pedidos p
       LEFT JOIN clientes c ON p.cliente_id = c.id
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const detalle = await pool.query(
      `SELECT dp.*, pr.nombre AS producto_nombre
       FROM detalle_pedidos dp
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       WHERE dp.pedido_id = $1`,
      [id]
    );

    res.json({ ...pedido.rows[0], detalle: detalle.rows });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener pedido', error });
  }
};

const createPedido = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { cliente_id, observaciones, detalle } = req.body;
    const usuario_id = req.usuario.id;

    if (!cliente_id || !detalle || detalle.length === 0) {
      return res.status(400).json({ mensaje: 'Cliente y al menos un producto son requeridos' });
    }

    // Generar número de pedido
    const numero_pedido = `PED-${Date.now()}`;

    // Calcular totales
    let subtotal = 0;
    for (const item of detalle) {
      subtotal += item.precio_unitario * item.cantidad;
    }
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    // Crear pedido
    const pedidoResult = await client.query(
      `INSERT INTO pedidos (cliente_id, usuario_id, numero_pedido, subtotal, igv, total, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [cliente_id, usuario_id, numero_pedido, subtotal.toFixed(2), igv.toFixed(2), total.toFixed(2), observaciones || null]
    );

    const pedido = pedidoResult.rows[0];

    // Insertar detalle y descontar stock
    for (const item of detalle) {
      const subtotalItem = item.precio_unitario * item.cantidad;

      await client.query(
        `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedido.id, item.producto_id, item.cantidad, item.precio_unitario, subtotalItem.toFixed(2)]
      );

      // Descontar stock
      await client.query(
        `UPDATE productos SET stock = stock - $1 WHERE id = $2`,
        [item.cantidad, item.producto_id]
      );

      // Registrar movimiento de stock
      const stockResult = await client.query(
        'SELECT stock FROM productos WHERE id = $1', [item.producto_id]
      );
      const stockActual = stockResult.rows[0].stock;

      await client.query(
        `INSERT INTO movimientos_stock (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_posterior, motivo)
         VALUES ($1, $2, 'SALIDA', $3, $4, $5, $6)`,
        [item.producto_id, usuario_id, item.cantidad, stockActual + item.cantidad, stockActual, `Pedido ${numero_pedido}`]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ mensaje: 'Error al crear pedido', error: error.message });
  } finally {
    client.release();
  }
};

const updateEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'ENTREGADO', 'CANCELADO'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const result = await pool.query(
      `UPDATE pedidos SET estado=$1,
       fecha_entrega = CASE WHEN $2='ENTREGADO' THEN NOW() ELSE fecha_entrega END
       WHERE id=$3 RETURNING *`,
      [estado, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('ERROR updateEstadoPedido:', error.message);
    res.status(500).json({ mensaje: 'Error al actualizar pedido', error: error.message });
  }
};

module.exports = { getPedidos, getPedidoById, createPedido, updateEstadoPedido };