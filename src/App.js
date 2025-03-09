const fetchMusicRecommendations = async (emotion) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/recommendations?emotion=${emotion}`);
    setRecommendedTracks(response.data.tracks);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
  }
}; 