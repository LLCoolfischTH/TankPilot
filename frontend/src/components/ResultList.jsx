import StationCard from './StationCard';

export default function ResultList({ results }) {
  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>
        Ergebnisse – sortiert nach Gesamtkosten
      </h2>
      {results.map((station, index) => (
        <StationCard key={station.stationId || index} station={station} rank={index + 1} />
      ))}
    </div>
  );
}
