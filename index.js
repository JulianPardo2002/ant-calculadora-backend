require('dotenv').config(); // 1. IMPORTANTE: Carga las variables de entorno
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// EN LA NUBE - Cambié 'connection' a 'conexion' para que coincida con el resto de tu código
const conexion = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT || 3306 // Puerto por defecto si no existe la variable
});

conexion.connect((error) => {
    if (error) {
        console.log('Error de conexión:', error);
        return;
    }
    console.log('✅ Conectado a MySQL');
});

// ========================================
// RUTA PRINCIPAL
// ========================================
app.get('/', (req, res) => {
    res.send('🚀 API Calendario Colombia funcionando');
});

// ========================================
// OBTENER FESTIVOS
// ========================================
app.get('/festivos', (req, res) => {
    conexion.query(
        "SELECT fecha FROM calendario WHERE es_festivo = 1",
        (error, resultados) => {
            if (error) {
                return res.status(500).json(error);
            }
            res.json(resultados);
        }
    );
});

// ========================================
// CALCULAR FECHAS
// ========================================
app.get('/calcular', (req, res) => {
    const fecha = req.query.fecha;
    const dias = parseInt(req.query.dias);
    const tipo = req.query.tipo;

    if (!fecha || !dias || !tipo) {
        return res.status(400).json({
            error: 'Faltan parámetros'
        });
    }

    if (tipo === 'calendario') {
        const consulta = `SELECT DATE_ADD(?, INTERVAL (? - 1) DAY) AS resultado`;
        conexion.query(consulta, [fecha, dias], (error, resultados) => {
            if (error) return res.status(500).json(error);
            res.json(resultados[0]);
        });
    } 
    else if (tipo === 'habiles') {
        const consulta = `
            SELECT MAX(fecha) AS resultado
            FROM (
                SELECT fecha
                FROM calendario
                WHERE fecha >= ?
                AND es_fin_semana = 0
                AND es_festivo = 0
                ORDER BY fecha
                LIMIT ?
            ) AS dias_habiles`;

        conexion.query(consulta, [fecha, dias], (error, resultados) => {
            if (error) return res.status(500).json(error);
            res.json(resultados[0]);
        });
    } 
    else {
        res.status(400).json({ error: 'Tipo inválido' });
    }
});

// ========================================
// SERVIDOR - AJUSTE PARA RENDER
// ========================================
// Render asigna un puerto automáticamente, por eso usamos process.env.PORT
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
    console.log(`🔥 Servidor corriendo en puerto ${PUERTO}`);
});