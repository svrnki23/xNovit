import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, Image } from 'react-native';

// Our own backend, running locally for now.
const API_BASE = 'http://localhost:3000';

// Public Mapbox token — safe to embed in the app, unlike the backend's secret keys.
const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

type Coordinate = { latitude: number; longitude: number };

// Just the fields we actually use on screen — the real response has a lot more.
type TripResult = {
  route: { distanceMiles: number; durationMinutes: number };
  origin: { coordinate: Coordinate | null };
  destination: { coordinate: Coordinate | null };
};

// Builds a plain map picture with two pins on it, via Mapbox's Static Images API.
// No map library needed — this is just an image, so it works the same on web and phone.
function buildMapUrl(origin: Coordinate, destination: Coordinate) {
  const originPin = `pin-s-a+285A98(${origin.longitude},${origin.latitude})`;
  const destPin = `pin-s-b+285A98(${destination.longitude},${destination.latitude})`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${originPin},${destPin}/auto/600x400@2x?access_token=${MAPBOX_TOKEN}`;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calls the real backend with a hardcoded test trip, same one we tested by hand.
  async function calculateTrip() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/trips/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { name: 'Chicago, IL' },
          destination: { name: 'St. Louis, MO' },
          tripType: 'oneWay',
          leaveNow: true,
          preferences: {},
          userType: 'passenger',
          measurementSystem: 'us',
        }),
      });
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const data = await response.json();
      setTrip(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // Only build a map once we actually have real coordinates to put on it.
  const mapUrl = trip?.origin.coordinate && trip?.destination.coordinate
    ? buildMapUrl(trip.origin.coordinate, trip.destination.coordinate)
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>xNovit</Text>
      <Text style={styles.subtitle}>Chicago, IL → St. Louis, MO</Text>

      <Button title="Calculate trip" onPress={calculateTrip} />

      {loading && <ActivityIndicator style={styles.spacer} />}

      {trip && (
        <View style={styles.result}>
          <Text>Distance: {trip.route.distanceMiles} miles</Text>
          <Text>Duration: {trip.route.durationMinutes} minutes</Text>
        </View>
      )}

      {mapUrl && <Image source={{ uri: mapUrl }} style={styles.map} />}

      {error && <Text style={styles.error}>Error: {error}</Text>}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666' },
  spacer: { marginTop: 12 },
  result: { marginTop: 16, alignItems: 'center' },
  map: { width: 300, height: 200, marginTop: 16, borderRadius: 8 },
  error: { marginTop: 16, color: 'red' },
});
