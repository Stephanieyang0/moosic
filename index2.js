const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Add CORS middleware
app.use(cors());
app.use(express.json());

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Helper function for error logging
function logSpotifyError(error) {
  console.error('Spotify API Error:', {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    body: error.body,
    stack: error.stack
  });
}

// Authentication function
async function authenticate() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    console.log('Access token obtained');
    spotifyApi.setAccessToken(data.body['access_token']);
    return true;
  } catch (error) {
    logSpotifyError(error);
    return false;
  }
}

// Test endpoint
app.get('/test', async (req, res) => {
  try {
    const authenticated = await authenticate();
    if (!authenticated) {
      throw new Error('Failed to authenticate with Spotify');
    }
    res.json({ 
      message: 'Server is working and authenticated with Spotify',
      status: 'success'
    });
  } catch (error) {
    logSpotifyError(error);
    res.status(500).json({ error: error.message });
  }
});

// Predefined popular tracks with preview URLs
const popularTracks = {
  happy: [
    '6DCZcSspjsKoFjzjrWoCdn', // Perfect - Ed Sheeran
    '0V3wPSX9ygBnCm8psDIegu', // Anti-Hero - Taylor Swift
    '3k3NWokhRRkEPhCzPmV8TW'  // Flowers - Miley Cyrus
  ],
  sad: [
    '0QHEIqNKsMoOY5urbzN48u', // Stay With Me - Sam Smith
    '4AGVWzuWahYdP4jWRxzyLq', // Say You Won't Let Go - James Arthur
    '7qEHsqek33rTcFNT9PFqLf'  // Someone You Loved - Lewis Capaldi
  ],
  angry: [
    '7lQ8MOhq6IN2w8EYcFNSUk', // Without Me - Eminem
    '5Z01UMMf7V1o0MzF86s6WJ', // lose yourself - Eminem
    '7D5jcDrB6wYvKe4KO6Jz8f'  // Numb - Linkin Park
  ],
  neutral: [
    '3AJwUDP919kvQ9QcozQPxg', // Yellow - Coldplay
    '6lanRgr6wXibZr8KgzXxBl', // Photograph - Ed Sheeran
    '0ct6r3EGTcMLPtrXHDvVjc'  // The Scientist - Coldplay
  ]
};

// Main recommendations endpoint
app.get('/api/recommendations', async (req, res) => {
  try {
    const authenticated = await authenticate();
    if (!authenticated) {
      throw new Error('Failed to authenticate with Spotify');
    }

    const { emotion } = req.query;
    console.log('Received emotion:', emotion);

    // Get tracks for the emotion or default to happy
    const trackIds = popularTracks[emotion] || popularTracks.happy;
    console.log('Using track IDs:', trackIds);

    // Get multiple tracks
    const tracksResponse = await Promise.all(
      trackIds.map(id => spotifyApi.getTrack(id))
    );

    const tracks = tracksResponse
      .map(response => response.body)
      .map(track => ({
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        albumArt: track.album.images[0]?.url,
        previewUrl: track.preview_url,
        externalUrl: track.external_urls.spotify
      }));

    console.log(`Found ${tracks.length} tracks`);
    res.json({
      success: true,
      emotion: emotion,
      tracks: tracks
    });

  } catch (error) {
    logSpotifyError(error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      details: {
        message: error.message,
        statusCode: error.statusCode,
        type: error.name
      }
    });
  }
});

// Verify endpoint
app.get('/verify', async (req, res) => {
  try {
    const authenticated = await authenticate();
    if (!authenticated) {
      throw new Error('Failed to authenticate with Spotify');
    }

    res.json({
      success: true,
      message: 'Spotify connection verified',
      credentials: {
        clientIdPresent: !!process.env.SPOTIFY_CLIENT_ID,
        clientSecretPresent: !!process.env.SPOTIFY_CLIENT_SECRET,
        redirectUriPresent: !!process.env.SPOTIFY_REDIRECT_URI
      }
    });
  } catch (error) {
    logSpotifyError(error);
    res.status(500).json({
      error: 'Verification failed',
      details: error.message
    });
  }
});

// Test single track endpoint
app.get('/test-track', async (req, res) => {
  try {
    const authenticated = await authenticate();
    if (!authenticated) {
      throw new Error('Failed to authenticate with Spotify');
    }

    // Get Ed Sheeran's Perfect as a test track
    const trackId = '6DCZcSspjsKoFjzjrWoCdn';
    const track = await spotifyApi.getTrack(trackId);

    res.json({
      success: true,
      track: {
        id: track.body.id,
        name: track.body.name,
        artist: track.body.artists[0].name,
        albumArt: track.body.album.images[0]?.url,
        previewUrl: track.body.preview_url,
        externalUrl: track.body.external_urls.spotify
      }
    });
  } catch (error) {
    logSpotifyError(error);
    res.status(500).json({
      error: 'Failed to get test track',
      details: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Attempting initial authentication...');
  const success = await authenticate();
  console.log('Initial authentication:', success ? 'Success' : 'Failed');
});
