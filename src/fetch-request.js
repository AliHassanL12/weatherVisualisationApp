
async function fetchRawCloudData() {
    try {
        const response = await fetch('http://127.0.0.1:5001/getWeatherData');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        };
        const json = await response.json();
        return json;
    } catch (error) {
        console.error('Problem fetching weather data', error);
        return null;
    };
};

export {
    fetchRawCloudData
}
    

