require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ========================================
// CONEXIÓN A MYSQL (RAILWAY)
// ========================================
const conexion = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ========================================
// RUTA PRINCIPAL (PRUEBA)
// ========================================
app.get("/", (req, res) => {
    res.send("🚀 API Calendario Colombia funcionando");
});

// ========================================
// OBTENER FESTIVOS
// ========================================
app.get('/festivos', (req, res) => {
    conexion.query(
        "SELECT fecha FROM calendario WHERE es_festivo = 1",
        (error, resultados) => {
            if (error) {
                console.error("Error en /festivos:", error);
                return res.status(500).json({ error: "Error en la consulta" });
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

    // 📅 Días calendario
    if (tipo === 'calendario') {
        const consulta = `
            SELECT DATE_ADD(?, INTERVAL (? - 1) DAY) AS resultado
        `;

        conexion.query(consulta, [fecha, dias], (error, resultados) => {
            if (error) {
                console.error("Error en /calcular calendario:", error);
                return res.status(500).json({ error: "Error en la consulta" });
            }
            res.json(resultados[0]);
        });
    } 
    // 📅 Días hábiles
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
            ) AS dias_habiles
        `;

        conexion.query(consulta, [fecha, dias], (error, resultados) => {
            if (error) {
                console.error("Error en /calcular habiles:", error);
                return res.status(500).json({ error: "Error en la consulta" });
            }
            res.json(resultados[0]);
        });
    } 
    else {
        res.status(400).json({ error: 'Tipo inválido' });
    }
});

// ========================================
// SERVIDOR
// ========================================
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
    console.log(`🔥 Servidor corriendo en puerto ${PUERTO}`);
});
