import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { geocodeAddress } from '../services/api';

const DEFAULTS = {
  fillAmount:  '40',
  consumption: '7.5',
  fuelType:    'e5',
  radius:      '15',
};

export default function SearchForm({ onSearch, loading }) {
  const [form,       setForm]       = useState(DEFAULTS);
  const [query,      setQuery]      = useState('Salzburg');
  const [suggestions,setSugg]       = useState([]);
  const [geocoding,  setGeocoding]  = useState(false);
  const [coords,     setCoords]     = useState({ lat: 47.7981, lng: 13.0465 });
  const [resolved,   setResolved]   = useState('Salzburg');
  const debounce = useRef(null);

  function handleField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleAddressChange(text) {
    setQuery(text);
    setResolved(null);
    clearTimeout(debounce.current);
    if (text.length < 4) { setSugg([]); return; }
    debounce.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const results = await geocodeAddress(text);
        setSugg(results.slice(0, 5));
      } catch { setSugg([]); }
      finally { setGeocoding(false); }
    }, 400);
  }

  function pickSuggestion(s) {
    setCoords({ lat: s.lat, lng: s.lng });
    const label = s.displayName.split(',').slice(0, 2).join(',');
    setQuery(label);
    setResolved(label);
    setSugg([]);
  }

  async function handleGPS() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('GPS-Berechtigung verweigert.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setQuery('GPS-Standort');
    setResolved(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
    setSugg([]);
  }

  function handleSubmit() {
    onSearch({
      userLat:     coords.lat,
      userLng:     coords.lng,
      fillAmount:  parseFloat(form.fillAmount),
      consumption: parseFloat(form.consumption),
      fuelType:    form.fuelType,
      radius:      parseInt(form.radius),
    });
  }

  return (
    <View style={s.card}>

      {/* Adresseingabe */}
      <Text style={s.label}>Mein Standort</Text>
      <View style={s.row}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          value={query}
          onChangeText={handleAddressChange}
          placeholder="Adresse eingeben…"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={s.btnSecondary} onPress={handleGPS}>
          <Text style={s.btnSecondaryText}>GPS</Text>
        </TouchableOpacity>
      </View>

      {geocoding && <ActivityIndicator size="small" color="#2563eb" style={{ marginTop: 4 }} />}
      {resolved && <Text style={s.hint}>✓ {resolved}</Text>}

      {/* Autocomplete-Liste */}
      {suggestions.length > 0 && (
        <View style={s.suggBox}>
          {suggestions.map((sug, i) => (
            <TouchableOpacity
              key={i}
              style={[s.suggItem, i < suggestions.length - 1 && s.suggBorder]}
              onPress={() => pickSuggestion(sug)}
            >
              <Text style={s.suggText} numberOfLines={2}>{sug.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Felder */}
      <View style={s.grid}>
        <View style={s.gridItem}>
          <Text style={s.label}>Menge (L)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad"
            value={form.fillAmount} onChangeText={v => handleField('fillAmount', v)} />
          <Text style={s.hint}>Nicht zwingend voller Tank</Text>
        </View>

        <View style={s.gridItem}>
          <Text style={s.label}>Verbrauch (L/100km)</Text>
          <TextInput style={s.input} keyboardType="decimal-pad"
            value={form.consumption} onChangeText={v => handleField('consumption', v)} />
        </View>

        <View style={s.gridItem}>
          <Text style={s.label}>Radius (km)</Text>
          <TextInput style={s.input} keyboardType="number-pad"
            value={form.radius} onChangeText={v => handleField('radius', v)} />
        </View>
      </View>

      {/* Kraftstoffart Picker */}
      <Text style={s.label}>Kraftstoffart</Text>
      <View style={s.pickerWrapper}>
        <Picker
          selectedValue={form.fuelType}
          onValueChange={v => handleField('fuelType', v)}
          style={s.picker}
        >
          <Picker.Item label="Super E5"  value="e5"     />
          <Picker.Item label="Super E10" value="e10"    />
          <Picker.Item label="Diesel"    value="diesel" />
        </Picker>
      </View>

      <TouchableOpacity
        style={[s.btnPrimary, loading && s.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnPrimaryText}>Tankstellen berechnen</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card:          { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 16 },
  label:         { fontSize: 12, color: '#555', marginBottom: 4, marginTop: 8 },
  hint:          { fontSize: 11, color: '#16a34a', marginTop: 2 },
  row:           { flexDirection: 'row', gap: 8 },
  input:         { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#111' },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  gridItem:      { flex: 1, minWidth: 100 },
  pickerWrapper: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginBottom: 12 },
  picker:        { height: 44 },
  suggBox:       { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 4, zIndex: 10 },
  suggItem:      { padding: 10 },
  suggBorder:    { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggText:      { fontSize: 13, color: '#333' },
  btnPrimary:    { backgroundColor: '#2563eb', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnPrimaryText:{ color: '#fff', fontWeight: '600', fontSize: 15 },
  btnDisabled:   { opacity: 0.6 },
  btnSecondary:  { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 14, justifyContent: 'center' },
  btnSecondaryText: { fontSize: 13, color: '#333' },
});
