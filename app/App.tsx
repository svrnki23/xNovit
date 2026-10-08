import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, ActivityIndicator, Image, TextInput } from 'react-native';

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
  // --- Login state ---
  // What the user types into the email/password boxes.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Set once login succeeds. While this is empty, the user isn't logged in.
  const [accessToken, setAccessToken] = useState('');
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- Trip planner state ---
  const [originName, setOriginName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [trip, setTrip] = useState<TripResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Creates a brand new account. Supabase sends a confirmation email — the
  // account can't log in until that email is confirmed.
  async function signUp() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Sign up failed');
      setAuthError('Account created — check your email to confirm it, then log in.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  }

  // Logs in with an existing (and confirmed) account, and saves the token
  // that proves who's logged in for later use.
  async function logIn() {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Log in failed');
      setAccessToken(data.session.access_token);
      setLoggedInEmail(data.user.email);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  }

  // Just clears what's stored on this screen — nothing to tell the server.
  function logOut() {
    setAccessToken('');
    setLoggedInEmail('');
  }

  // Calls the real backend with whatever the user typed into the two fields.
  async function calculateTrip() {
    // Don't bother hitting the backend if either field is still empty.
    if (!originName.trim() || !destinationName.trim()) {
      setError('Please enter both an origin and a destination.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/trips/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { name: originName.trim() },
          destination: { name: destinationName.trim() },
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

  // Not logged in yet — show the sign up / log in form, and stop here.
  // (The trip planner below only appears once accessToken is set.)
  if (!accessToken) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>xNovit</Text>
        <Text style={styles.subtitle}>Log in or create an account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.buttonRow}>
          <Button title="Sign up" onPress={signUp} />
          <Button title="Log in" onPress={logIn} />
        </View>

        {authLoading && <ActivityIndicator style={styles.spacer} />}
        {authError && <Text style={styles.error}>{authError}</Text>}

        <StatusBar style="auto" />
      </View>
    );
  }

  // Logged in — show who's logged in, a way to log out, and the trip planner.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>xNovit</Text>
      <Text style={styles.subtitle}>Logged in as {loggedInEmail}</Text>
      <Button title="Log out" onPress={logOut} />

      <TextInput
        style={styles.input}
        placeholder="Origin (e.g. Chicago, IL)"
        value={originName}
        onChangeText={setOriginName}
      />
      <TextInput
        style={styles.input}
        placeholder="Destination (e.g. St. Louis, MO)"
        value={destinationName}
        onChangeText={setDestinationName}
      />

      <Button title="Calculate trip" onPress={calculateTrip} />

      {loading && <ActivityIndicator style={styles.spacer} />}

      {trip && (
        <View style={styles.result}>
          <Text>Distance: {trip.route.distanceMiles} miles</Text>
          <Text>Duration: {trip.route.durationMinutes} minutes</Text>
        </View>
      )}

      {mapUrl && <Image source={{ uri: mapUrl }} style={styles.map} />}

      {error && <Text style={styles.error}>{error}</Text>}

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
    padding: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#666' },
  input: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  spacer: { marginTop: 12 },
  result: { marginTop: 16, alignItems: 'center' },
  map: { width: 300, height: 200, marginTop: 16, borderRadius: 8 },
  error: { marginTop: 16, color: 'red', textAlign: 'center' },
});
