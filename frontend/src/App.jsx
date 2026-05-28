import { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultList from './components/ResultList';
import MapView    from './components/MapView';
import { calculateStations } from './services/api';

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿', NL:'🇳🇱', BE:'🇧🇪', FR:'🇫🇷', CH:'🇨🇭', LU:'🇱🇺', DK:'🇩🇰' };

export default function App() {
  const [results,      setResults]      = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [serviceErrors,setServiceErrors]= useState([]);
  const [meta,         setMeta]         = useState(null);

  async function handleSearch(formData) {
    setLoading(true);
    setError(null);
    setServiceErrors([]);
    setMeta(null);
    setUserLocation({ lat: formData.userLat, lng: formData.userLng });

    try {
      const data = await calculateStations(formData);
      setResults(data.results || []);
      setServiceErrors(data.serviceErrors || []);
      setMeta({ countries: data.countries, borderRegion: data.borderRegion });
      if (data.results?.length === 0 && data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError('Verbindungsfehler zum Backend. Läuft npm run dev?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily:'system-ui, sans-serif', maxWidth:900, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:24, marginBottom:4 }}>TankPilot</h1>
      <p style={{ color:'#666', marginBottom:20 }}>
        Findet die günstigste Tankstelle nach Gesamtkosten – inkl. Umweg.
      </p>

      <SearchForm onSearch={handleSearch} loading={loading} />

      {/* Erkannte Länder */}
      {meta && (
        <div style={{ marginBottom:12, fontSize:13, color:'#555' }}>
          {meta.borderRegion && <span style={{ marginRight:8, background:'#fefce8', border:'1px solid #fde68a', borderRadius:4, padding:'2px 8px' }}>Grenzregion</span>}
          {meta.countries?.map(c => (
            <span key={c} style={{ marginRight:6 }}>{FLAG[c] || c} {c}</span>
          ))}
        </div>
      )}

      {/* Service-Fehler – pro Land */}
      {serviceErrors.length > 0 && (
        <div style={{ marginBottom:16, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:12 }}>
          <div style={{ fontWeight:600, marginBottom:6, fontSize:13 }}>⚠️ Einige Länder konnten nicht geladen werden:</div>
          {serviceErrors.map((e, i) => (
            <div key={i} style={{ fontSize:12, marginBottom:4, display:'flex', gap:8, alignItems:'flex-start' }}>
              <span style={{ fontWeight:600, minWidth:28 }}>{FLAG[e.country] || ''} {e.country}</span>
              <span style={{ color:'#92400e' }}>{e.hint}</span>
            </div>
          ))}
          {serviceErrors.some(e => e.hint.includes('HERE'))}
        </div>
      )}

      {error && (
        <p style={{ color:'#dc2626', margin:'12px 0', fontSize:13 }}>{error}</p>
      )}

      {results.length > 0 && (
        <>
          <MapView stations={results} userLocation={userLocation} />
          <ResultList results={results} />
        </>
      )}
    </div>
  );
}
