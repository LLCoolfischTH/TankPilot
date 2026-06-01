import { useState, useRef } from 'react';
import { geocodeAddress } from '../services/api';

const DEFAULTS = {
  userLat: 47.8415, userLng: 12.9685, 
  fillAmount: 40, consumption: 7.5,
  fuelType: 'e5', radius: 15,
};

const s = {
  input:  { padding: '7px 10px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  label:  { fontSize: 12, color: '#555', display: 'block', marginBottom: 4, marginTop: 8 },
  hint:   { fontSize: 11, color: '#888', marginTop: 3 },
  hintOk: { fontSize: 11, color: '#16a34a', marginTop: 3 },
  btn:    { padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
  btnAlt: { padding: '8px 14px', borderRadius: 6, border: '1px solid #999', background: '#fff', cursor: 'pointer', fontSize: 13 },
};

export default function SearchForm({ onSearch, loading, onLocationChange }) {
  const [form,         setForm]         = useState(DEFAULTS);
  const [query,        setQuery]        = useState('Freilassing, Deutschland');
  const [suggestions,  setSugg]         = useState([]);
  const [geocoding,    setGeocoding]    = useState(false);
  const [resolved,     setResolved]     = useState('Freilassing');
  const debounce = useRef(null);

  function handleField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function setLocation(lat, lng, label) {
    setForm(prev => ({ ...prev, userLat: lat, userLng: lng }));
    setResolved(`${label} · ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    setSugg([]);
    // Karte sofort zentrieren
    onLocationChange?.({ lat, lng });
  }

  function handleAddressChange(text) {
    setQuery(text);
    setResolved(null);
    clearTimeout(debounce.current);
    if (text.length < 4) { setSugg([]); return; }
    debounce.current = setTimeout(async () => {
      setGeocoding(true);
      try { setSugg((await geocodeAddress(text)).slice(0, 5)); }
      catch { setSugg([]); }
      finally { setGeocoding(false); }
    }, 400);
  }

  function pickSuggestion(sug) {
    const label = sug.displayName.split(',').slice(0, 2).join(',');
    setQuery(label);
    setLocation(sug.lat, sug.lng, label);
  }

  function handleGPS() {
    if (!navigator.geolocation) return alert('GPS nicht verfügbar.');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setQuery('GPS-Standort');
        setLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          'GPS-Standort'
        );
      },
      () => alert('GPS-Zugriff verweigert.'),
      { enableHighAccuracy: true, timeout: 10000 }  // Höhere GPS-Genauigkeit
    );
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

      {/* Standorteingabe */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <label style={s.label}>Mein Standort</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...s.input, flex: 1 }} type="text"
            placeholder="Adresse eingeben…"
            value={query} onChange={e => handleAddressChange(e.target.value)} />
          <button type="button" onClick={handleGPS} style={s.btnAlt}>GPS</button>
        </div>
        {geocoding && <div style={{ ...s.hint, color: '#2563eb' }}>Suche…</div>}
        {resolved  && <div style={s.hintOk}>✓ {resolved}</div>}

        {suggestions.length > 0 && (
          <ul style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', borderRadius: 6, listStyle: 'none', margin: 0, padding: 0, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,.1)', top: '100%', marginTop: 2 }}>
            {suggestions.map((sug, i) => (
              <li key={i} onClick={() => pickSuggestion(sug)}
                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: i < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {sug.displayName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Felder */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div>
          <label style={s.label}>Zu tankende Menge (L)</label>
          <input style={s.input} type="number" min="1" max="200"
            value={form.fillAmount} onChange={e => handleField('fillAmount', e.target.value)} required />
        </div>
        <div>
          <label style={s.label}>Verbrauch (L/100 km)</label>
          <input style={s.input} type="number" step="0.1" min="1" max="30"
            value={form.consumption} onChange={e => handleField('consumption', e.target.value)} required />
        </div>
        <div>
          <label style={s.label}>Kraftstoffart</label>
          <select style={s.input} value={form.fuelType} onChange={e => handleField('fuelType', e.target.value)}>
            <option value="e5">Super E5</option>
            <option value="e10">Super E10</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
        <div>
          <label style={s.label}>Suchradius (km)</label>
          <input style={s.input} type="number" min="1" max="50"
            value={form.radius} onChange={e => handleField('radius', e.target.value)} required />
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
