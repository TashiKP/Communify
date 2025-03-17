const fetchPictogram = async (keyword: string) => {
    try {
      const encodedKeyword = encodeURIComponent(keyword);
      const pictogramId = 1234; // Example of a specific pictogram ID
      const apiUrl = `https://api.arasaac.org/v1/pictograms/${pictogramId}?color=true&resolution=2500`;
  
      const pictogramResponse = await axios.get(apiUrl);
      const pictogramData = pictogramResponse.data;
  
      if (!pictogramData) {
        setError('No pictogram available');
        setLoading(false);
        return;
      }
  
      setPictogramUrl(pictogramData.image_url || '');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching pictogram:', err);
      setError('Error fetching data');
      setLoading(false);
    }
  };
const [error, setError] = useState<string | null>(null);

function setError(errorMessage: string) {
    setError(errorMessage);
}
  