import { useState } from 'react';
import {
  SafeAreaView, ScrollView, View, Text,
  StyleSheet, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import SearchForm  from './src/components/SearchForm';
import TankMap     from './src/components/MapView';
import ResultList  from './src/components/ResultList';
import { calculateStations } from './src/services/api';

const FLAG = { DE:'🇩🇪', AT:'🇦🇹', PL:'🇵🇱', CZ:'🇨🇿' };

export default function App() {
  const [results,       setResults]       = useState([]);
  const [userLocation,  setUserLocation]  = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [serviceErrors, setServiceErrors] = useState([]);
  const [meta,          setMeta]          = useState(null);

  async function handleSearch(formData) {
    setLoading(true);
    setError(null);
    setServiceErrors([]);
    setUserLocation({ lat: formData.userLat, lng: formData.userLng });

    try {
      const data = await calculateStations(formData);
      setResults(data.results || []);
      setServiceErrors(data.serviceErrors || []);
      setMeta({ countries: data.countries, borderRegion: data.borderRegion });
      if (data.results?.length === 0) {
        setError(data.message || 'Keine Tankstellen gefunden.');
      }
    } catch (err) {
      const msg = err.message?.includes('Network')
        ? 'Backend nicht erreichbar. Läuft npm run dev:backend? Lokale IP in src/services/api.js korrekt?'
        : 'Fehler beim Laden der Tankstellen.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>⛽ TankPilot</Text>
          <Text style={s.subtitle}>Günstigste Tankstelle nach Gesamtkosten</Text>
        </View>

        <SearchForm onSearch={handleSearch} loading={loading} />

        {/* Erkannte Länder */}
        {meta && (
          <View style={s.metaRow}>
            {meta.borderRegion && (
              <View style={s.badgeBorder}><Text style={s.badgeBorderText}>🌍 Grenzregion</Text></View>
            )}
            {meta.countries?.map(c => (
              <View key={c} style={s.badgeCountry}>
                <Text style={s.badgeCountryText}>{FLAG[c] || c} {c}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Service-Fehler */}
        {serviceErrors.length > 0 && (
          <View style={s.warningBox}>
            <Text style={s.warningTitle}>⚠️ Einige Länder nicht geladen:</Text>
            {serviceErrors.map((e, i) => (
              <Text key={i} style={s.warningText}>
                {FLAG[e.country] || ''} {e.country}: {e.hint}
              </Text>
            ))}
          </View>
        )}

        {/* Fehler */}
        {error && <Text style={s.errorText}>{error}</Text>}

        {/* Karte + Ergebnisse */}
        {results.length > 0 && (
          <>
            <TankMap stations={results} userLocation={userLocation} />
            <ResultList results={results} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f9fafb' },
  container:   { padding: 16, paddingBottom: 40 },
  header:      { marginBottom: 20 },
  title:       { fontSize: 26, fontWeight: '700', color: '#111' },
  subtitle:    { fontSize: 14, color: '#666', marginTop: 2 },
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badgeBorder: { backgroundColor: '#fefce8', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#fde68a' },
  badgeBorderText: { fontSize: 12, color: '#854d0e' },
  badgeCountry:{ backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  badgeCountryText: { fontSize: 12, color: '#374151' },
  warningBox:  { backgroundColor: '#fffbeb', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fde68a' },
  warningTitle:{ fontSize: 13, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  warningText: { fontSize: 12, color: '#92400e', marginBottom: 2 },
  errorText:   { color: '#dc2626', fontSize: 13, marginBottom: 12 },
});
