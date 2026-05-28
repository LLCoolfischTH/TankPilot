import { useState } from 'react';

const FLAG    = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿', NL:'🇳🇱', BE:'🇧🇪', FR:'🇫🇷', CH:'🇨🇭', LU:'🇱🇺', DK:'🇩🇰' };
const SOURCE_LABEL = { tankerkoening: 'Tankerkönig', econtrol: 'E-Control AT', here: 'HERE Maps' };
const SOURCE_COLOR = { tankerkoening: '#166534', econtrol: '#1e40af', here: '#7c3aed' };
const SOURCE_BG    = { tankerkoening: '#f0fdf4', econtrol: '#eff6ff', here: '#f5f3ff' };

export default function StationCard({ station, rank }) {
  const [open, setOpen] = useState(false);
  const isBest  = rank === 1;
  const { breakdown, distanceMethod } = station;
  const flag    = FLAG[station.country]        || '';
  const srcLbl  = SOURCE_LABEL[station.dataSource] || station.dataSource;
  const srcClr  = SOURCE_COLOR[station.dataSource] || '#555';
  const srcBg   = SOURCE_BG[station.dataSource]    || '#f5f5f5';
  const hasLocal = station.priceLocal && station.currency && station.currency !== 'EUR';

  return (
    <div style={{
      border: `2px solid ${isBest ? '#2563eb' : '#e5e7eb'}`,
      borderRadius: 10, padding: 14, marginBottom: 10,
      background: isBest ? '#eff6ff' : '#fff',
    }}>

      {/* ── Kopfzeile ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap: 6 }}>
            <span style={{ fontWeight:700, fontSize:15 }}>{rank}. {flag} {station.name}</span>
            {isBest && (
              <span style={{ background:'#2563eb', color:'#fff', borderRadius:4, padding:'2px 7px', fontSize:11 }}>
                Beste Wahl
              </span>
            )}
            {!station.isOpen && (
              <span style={{ background:'#fef2f2', color:'#dc2626', borderRadius:4, padding:'2px 7px', fontSize:11, border:'1px solid #fca5a5' }}>
                Geschlossen
              </span>
            )}
            <span style={{ background: srcBg, color: srcClr, borderRadius:4, padding:'2px 7px', fontSize:11, border:`1px solid ${srcClr}40` }}>
              {srcLbl}
            </span>
          </div>
          <div style={{ color:'#555', fontSize:13, marginTop:3 }}>{station.address}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:20 }}>{breakdown.totalCost.toFixed(2)} €</div>
          <div style={{ fontSize:11, color:'#888' }}>Gesamtkosten</div>
        </div>
      </div>

      {/* ── Kurzinfo ── */}
      <div style={{ display:'flex', gap:14, marginTop:10, fontSize:13, flexWrap:'wrap', alignItems:'center' }}>
        <span>
          <strong>{station.pricePerLiter.toFixed(3)} €</strong>/L
          {hasLocal && (
            <span style={{ color:'#888', fontSize:11, marginLeft:5 }}>
              ({station.priceLocal.toFixed(2)} {station.currency})
            </span>
          )}
        </span>
        <span>
          {station.distanceKm} km
          <span style={{
            marginLeft:4, fontSize:11, borderRadius:4, padding:'1px 5px',
            color:      distanceMethod==='navigation' ? '#16a34a' : '#92400e',
            background: distanceMethod==='navigation' ? '#f0fdf4' : '#fffbeb',
            border:    `1px solid ${distanceMethod==='navigation' ? '#bbf7d0' : '#fde68a'}`,
          }}>
            {distanceMethod==='navigation' ? 'Navigation' : 'Schätzung'}
          </span>
        </span>
        <span style={{ color: station.worthIt ? '#16a34a' : '#dc2626', fontWeight:600 }}>
          {station.worthIt
            ? `${Math.abs(station.savings).toFixed(2)} € günstiger`
            : `${Math.abs(station.savings).toFixed(2)} € teurer`}
        </span>
      </div>

      {/* ── Formel-Breakdown ── */}
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ marginTop:10, background:'none', border:'none', color:'#2563eb', fontSize:12, cursor:'pointer', padding:0, textDecoration:'underline' }}>
        {open ? 'Berechnung verbergen' : 'Berechnung zeigen'}
      </button>

      {open && (
        <div style={{ marginTop:8, background:'#f8faff', borderRadius:8, padding:12, fontSize:12, lineHeight:1.9, border:'1px solid #dbeafe' }}>
          <div style={{ fontWeight:600, marginBottom:6, fontSize:13 }}>Wie wird dieser Preis berechnet?</div>

          <div>
            <span style={{ color:'#555' }}>① Tankkosten</span>
            <span style={{ float:'right' }}>{breakdown.fuelCost.toFixed(2)} €</span>
          </div>
          <div style={{ color:'#888', marginLeft:16, marginBottom:4, fontFamily:'monospace', fontSize:11 }}>
            {station.pricePerLiter.toFixed(3)} €/L × Tankmenge
            {hasLocal && ` (${station.priceLocal.toFixed(2)} ${station.currency}/L → EUR)`}
          </div>

          <div>
            <span style={{ color:'#555' }}>② Umwegkosten (Hin + Rück)</span>
            <span style={{ float:'right' }}>{breakdown.detourCost.toFixed(2)} €</span>
          </div>
          <div style={{ color:'#888', marginLeft:16, marginBottom:8, fontFamily:'monospace', fontSize:11 }}>
            {station.distanceKm} km × 2 = {(station.distanceKm*2).toFixed(1)} km → {breakdown.detourFuelLiters.toFixed(2)} L Verbrauch
          </div>

          <div style={{ borderTop:'1px solid #bfdbfe', paddingTop:6, fontWeight:700 }}>
            <span>① + ② Gesamtkosten</span>
            <span style={{ float:'right' }}>{breakdown.totalCost.toFixed(2)} €</span>
          </div>

          {distanceMethod !== 'navigation' && (
            <div style={{ marginTop:8, color:'#92400e', background:'#fffbeb', borderRadius:4, padding:'4px 8px', fontSize:11 }}>
              Distanz ist eine Schätzung. Für echte Straßendistanzen: ORS_API_KEY setzen.
            </div>
          )}
          {hasLocal && (
            <div style={{ marginTop:6, color:'#5b21b6', background:'#f5f3ff', borderRadius:4, padding:'4px 8px', fontSize:11 }}>
              Preis umgerechnet: {station.priceLocal.toFixed(2)} {station.currency}/L → {station.pricePerLiter.toFixed(3)} €/L (aktueller Wechselkurs)
            </div>
          )}
          <div style={{ marginTop:6, color: srcClr, background: srcBg, borderRadius:4, padding:'4px 8px', fontSize:11 }}>
            Datenquelle: {srcLbl}
          </div>
        </div>
      )}
    </div>
  );
}
