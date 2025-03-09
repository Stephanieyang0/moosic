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

// Add a test route
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

const emotionToGenre = {
  happy: ['pop', 'dance', 'electronic'],
  sad: ['blues', 'acoustic', 'sad'],
  angry: ['rock', 'metal', 'punk'],
  neutral: ['ambient', 'classical', 'jazz']
};

app.get('/api/recommendations', async (req, res) => {
  try {
    const { emotion } = req.query;
    const genres = emotionToGenre[emotion] || ['pop'];

    // Refresh token logic here

    const recommendations = await spotifyApi.getRecommendations({
      seed_genres: genres,
      limit: 5
    });

    res.json({ tracks: recommendations.body.tracks });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 