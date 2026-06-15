const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const clienteRoutes = require('./routes/clientes.routes');
const categoriaRoutes = require('./routes/categorias.routes');
const productoRoutes = require('./routes/productos.routes');
const pedidoRoutes = require('./routes/pedidos.routes');
const facturaRoutes = require('./routes/facturas.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS para desarrollo y producción
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Desarrollo local (Vite)
    'http://localhost:3000',  // Desarrollo local (alternativo)
    'https://hackthonyperu-ventas.netlify.app',  // Producción Netlify
    /\.netlify\.app$/  // Cualquier subdominio de Netlify (regex)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Ruta de health check para verificar que el backend está vivo
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/facturas', facturaRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;