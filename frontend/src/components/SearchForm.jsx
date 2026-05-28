import { useState, useRef } from 'react';
import { geocodeAddress } from '../services/api';

const DEFAULT_VALUES = {
  userLat:     47.7981,
  userLng:     13.0465,
  fillAmount:  40,
  consumption: 7.5,
  fuelType:    'e5',
  radius:      15,
};

const s = {
  input:  { padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  label:  { fontSize: 12, color: '#555', display: 'block', marginBottom: 4 },
  hint:   { fontSize: 11, color: '#888', marginTop: 3 },
  btn:    { padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnAlt: { padding: '8px 14px', borderRadius: 6, border: '1px solid #999', background: '#fff', cursor: 'pointer', fontSize: 13 },
};

export default function SearchForm({ onSearch, loading }) {
  const [form, setForm]           = useState(DEFAULT_VALUES);
  const [addressQuery, setQuery]  = useState('Salzburg, 5020, Österreich');
  const [suggestions, setSugg]    = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [resolved, setResolved]   = useState('Salzburg, 5020 · 47.7981, 13.0465');
  const debounce = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAddressChange(e) {
    const q = e.target.value;
    setQuery(q);
    setResolved(null);
    clearTimeout(debounce.current);
    if (q.length < 4) { setSugg([]); return; }
    debounce.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const results = await geocodeAddress(q);
        setSugg(results.slice(0, 5));
      } catch { setSugg([]); }
      finally { setGeocoding(false); }
    }, 400);
  }

  function pickSuggestion(s) {
    setForm((prev) => ({ ...prev, userLat: s.lat, userLng: s.lng }));
    setQuery(s.displayName);
    setResolved(`${s.displayName.split(',').slice(0, 2).join(',')} · ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}`);
    setSugg([]);
  }

  function handleGPS() {
    if (!navigator.geolocation) return alert('GPS nicht verfügbar.');
    navigator.geolocation.getCurrentPosition((pos) => {
      setForm((prev) => ({ ...prev, userLat: pos.coords.latitude, userLng: pos.coords.longitude }));
      setQuery('GPS-Standort');
      setResolved(`GPS · ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      setSugg([]);
    }, () => alert('GPS-Zugriff verweigert.'));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({
      userLat:     parseFloat(form.userLat),
      userLng:     parseFloat(form.userLng),
      fillAmount:  parseFloat(form.fillAmount),
      consumption: parseFloat(form.consumption),
      fuelType:    form.fuelType,
      radius:      parseInt(form.radius),
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: 16, borderRadius: 10, marginBottom: 20 }}>

      {/* Adresseingabe – volle Breite */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <label style={s.label}>Mein Standort</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...s.input, flex: 1 }}
            type="text"
            placeholder="Adresse eingeben, z. B. Słubice, Polen"
            value={addressQuery}
            onChange={handleAddressChange}
          />
          <button type="button" onClick={handleGPS} style={s.btnAlt}>GPS</button>
        </div>
        {geocoding && <div style={{ ...s.hint, color: '#2563eb' }}>Suche…</div>}
        {resolved  && <div style={{ ...s.hint, color: '#16a34a' }}>✓ {resolved}</div>}

        {/* Vorschlagsliste */}
        {suggestions.length > 0 && (
          <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 6, listStyle: 'none', margin: 0, padding: 0, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,.1)', top: '100%', marginTop: 2 }}>
            {suggestions.map((sug, i) => (
              <li key={i}
                onClick={() => pickSuggestion(sug)}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                {sug.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Restliche Felder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>

        <div>
          <label style={s.label}>Zu tankende Menge (L)</label>
          <input style={s.input} type="number" min="1" max="200" name="fillAmount"
            value={form.fillAmount} onChange={handleChange} required />
          <div style={s.hint}>Nicht zwingend voller Tank</div>
        </div>

        <div>
          <label style={s.label}>Verbrauch (L/100 km)</label>
          <input style={s.input} type="number" step="0.1" min="1" max="30" name="consumption"
            value={form.consumption} onChange={handleChange} required />
        </div>

        <div>
          <label style={s.label}>Kraftstoffart</label>
          <select style={s.input} name="fuelType" value={form.fuelType} onChange={handleChange}>
            <option value="e5">Super E5</option>
            <option value="e10">Super E10</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>

        <div>
          <label style={s.label}>Suchradius (km)</label>
          <input style={s.input} type="number" min="1" max="50" name="radius"
            value={form.radius} onChange={handleChange} required />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <button type="submit" disabled={loading} style={s.btn}>
          {loading ? 'Berechne…' : 'Tankstellen berechnen'}
        </button>
      </div>
    </form>
  );
}
