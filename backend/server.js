const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('/app/frontend/public'));

const INFLUX_URL = process.env.INFLUX_URL || 'http://localhost:8086';
const INFLUX_DB  = process.env.INFLUX_DB  || 'iobroker';
const INFLUX_USER = process.env.INFLUX_USER || '';
const INFLUX_PASS = process.env.INFLUX_PASS || '';

function influxParams(extra = {}) {
  const p = { db: INFLUX_DB, ...extra };
  if (INFLUX_USER) { p.u = INFLUX_USER; p.p = INFLUX_PASS; }
  return p;
}

// GET /api/measurements  – list all measurements
app.get('/api/measurements', async (req, res) => {
  try {
    const r = await axios.get(`${INFLUX_URL}/query`, {
      params: influxParams({ q: 'SHOW MEASUREMENTS' })
    });
    const series = r.data?.results?.[0]?.series?.[0]?.values || [];
    res.json(series.map(v => v[0]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/data?measurement=&from=&to=&limit=
app.get('/api/data', async (req, res) => {
  const { measurement, from, to, limit = 2000 } = req.query;
  if (!measurement) return res.status(400).json({ error: 'measurement required' });

  let where = [];
  if (from) where.push(`time >= '${from}'`);
  if (to)   where.push(`time <= '${to}'`);
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const q = `SELECT * FROM "${measurement}" ${whereClause} ORDER BY time DESC LIMIT ${limit}`;
  try {
    const r = await axios.get(`${INFLUX_URL}/query`, {
      params: influxParams({ q, epoch: 'ms' })
    });
    const series = r.data?.results?.[0]?.series?.[0];
    if (!series) return res.json({ columns: [], values: [] });
    res.json({ columns: series.columns, values: series.values || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/data  – delete specific timestamps
app.delete('/api/data', async (req, res) => {
  const { measurement, timestamps } = req.body;
  if (!measurement || !Array.isArray(timestamps) || timestamps.length === 0)
    return res.status(400).json({ error: 'measurement and timestamps[] required' });

  // InfluxDB 1.x: delete by exact time using DELETE WHERE time = X
  const errors = [];
  for (const ts of timestamps) {
    const q = `DELETE FROM "${measurement}" WHERE time = ${ts}ms`;
    try {
      await axios.post(`${INFLUX_URL}/query`, null, {
        params: influxParams({ q })
      });
    } catch (e) {
      errors.push({ ts, error: e.message });
    }
  }
  if (errors.length) return res.status(207).json({ deleted: timestamps.length - errors.length, errors });
  res.json({ deleted: timestamps.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`InfluxDB Editor running on :${PORT}`));
