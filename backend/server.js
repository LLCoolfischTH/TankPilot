require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stations',  require('./routes/stations'));
app.use('/api/calculate', require('./routes/calculate'));
app.use('/api/route',     require('./routes/route'));
app.use('/api/geocode',   require('./routes/geocode'));
app.use('/api/diagnose',  require('./routes/diagnose'));

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', version:'0.1.0', name:'TankPilot API' });
});

app.use((err, req, res, next) => {
  console.error('[TankPilot Error]', err.message);
  res.status(500).json({ error:'Interner Serverfehler', detail: err.message });
});

app.listen(PORT, () => {
  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);
  console.log(`\nTankPilot Backend  →  http://localhost:${PORT}`);
  console.log(`Diagnose           →  http://localhost:${PORT}/api/diagnose\n`);
  console.log(`  .env vorhanden:        ${envExists ? '✓' : '✗ FEHLT – bitte anlegen!'}`);
  console.log(`  TANKERKOENING_KEY:     ${process.env.TANKERKOENING_API_KEY ? '✓' : '✗ (Demo-Key)'}`);
  console.log(`  HERE_API_KEY:          ${process.env.HERE_API_KEY && process.env.HERE_API_KEY !== 'dein_here_api_key_hier' ? '✓' : '✗ (PL/CZ/NL/... nicht verfügbar)'}`);
  console.log(`  ORS_API_KEY:           ${process.env.ORS_API_KEY && process.env.ORS_API_KEY !== 'dein_ors_api_key_hier' ? '✓' : '✗ (Haversine-Fallback)'}\n`);
});

module.exports = app;
