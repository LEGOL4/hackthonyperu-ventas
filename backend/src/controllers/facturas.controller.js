const pool = require('../config/db');

const getFacturas = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM facturas');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT f.*,
        p.numero_pedido,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        c.dni AS cliente_dni
       FROM facturas f
       LEFT JOIN pedidos p ON f.pedido_id = p.id
       LEFT JOIN clientes c ON f.cliente_id = c.id
       ORDER BY f.fecha_emision DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ data: result.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener facturas', error });
  }
};

const getFacturaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT f.*,
        p.numero_pedido, p.observaciones,
        c.nombres || ' ' || c.apellidos AS cliente_nombre,
        c.dni AS cliente_dni,
        c.email AS cliente_email,
        c.telefono AS cliente_telefono,
        c.direccion AS cliente_direccion
       FROM facturas f
       LEFT JOIN pedidos p ON f.pedido_id = p.id
       LEFT JOIN clientes c ON f.cliente_id = c.id
       WHERE f.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }

    // Obtener detalle del pedido
    const detalle = await pool.query(
      `SELECT dp.*, pr.nombre AS producto_nombre
       FROM detalle_pedidos dp
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       WHERE dp.pedido_id = $1`,
      [result.rows[0].pedido_id]
    );

    res.json({ ...result.rows[0], detalle: detalle.rows });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener factura', error });
  }
};

const createFactura = async (req, res) => {
  try {
    const { pedido_id } = req.body;

    if (!pedido_id) {
      return res.status(400).json({ mensaje: 'El pedido es requerido' });
    }

    // Verificar que el pedido existe y está entregado
    const pedido = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1', [pedido_id]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    if (pedido.rows[0].estado !== 'ENTREGADO') {
      return res.status(400).json({ mensaje: 'Solo se pueden facturar pedidos con estado ENTREGADO' });
    }

    // Verificar que no tenga factura ya
    const facturaExistente = await pool.query(
      'SELECT id FROM facturas WHERE pedido_id = $1', [pedido_id]
    );

    if (facturaExistente.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Este pedido ya tiene una factura emitida' });
    }

    // Generar número de serie
    const countResult = await pool.query('SELECT COUNT(*) FROM facturas');
    const numero = parseInt(countResult.rows[0].count) + 1;
    const numero_serie = `F001-${String(numero).padStart(6, '0')}`;

    const result = await pool.query(
      `INSERT INTO facturas (pedido_id, cliente_id, numero_serie, subtotal, igv, total)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [pedido_id, pedido.rows[0].cliente_id, numero_serie,
       pedido.rows[0].subtotal, pedido.rows[0].igv, pedido.rows[0].total]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear factura', error: error.message });
  }
};

const anularFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE facturas SET estado='ANULADA' WHERE id=$1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Factura no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al anular factura', error });
  }
};

const getReportes = async (req, res) => {
  try {
    const ventasTotales = await pool.query(
      `SELECT 
        COUNT(*) AS total_pedidos,
        SUM(total) AS ingresos_totales,
        SUM(igv) AS igv_total,
        AVG(total) AS ticket_promedio
       FROM pedidos WHERE estado != 'CANCELADO'`
    );

    const ventasPorEstado = await pool.query(
      `SELECT estado, COUNT(*) AS cantidad, SUM(total) AS total
       FROM pedidos GROUP BY estado ORDER BY estado`
    );

    const topProductos = await pool.query(
      `SELECT pr.nombre, SUM(dp.cantidad) AS unidades_vendidas,
        SUM(dp.subtotal) AS ingresos
       FROM detalle_pedidos dp
       LEFT JOIN productos pr ON dp.producto_id = pr.id
       GROUP BY pr.nombre
       ORDER BY unidades_vendidas DESC
       LIMIT 5`
    );

    const ventasPorMes = await pool.query(
      `SELECT 
        TO_CHAR(fecha_pedido, 'YYYY-MM') AS mes,
        COUNT(*) AS pedidos,
        SUM(total) AS total
       FROM pedidos
       WHERE estado != 'CANCELADO'
       GROUP BY mes ORDER BY mes DESC LIMIT 6`
    );

    res.json({
      resumen: ventasTotales.rows[0],
      por_estado: ventasPorEstado.rows,
      top_productos: topProductos.rows,
      ventas_por_mes: ventasPorMes.rows
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener reportes', error });
  }
};

module.exports = { getFacturas, getFacturaById, createFactura, anularFactura, getReportes };