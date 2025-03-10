export async function fetchWeatherData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/getWeatherData');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        };
        const data = await response.json();
        console.log('Weather Data:', data);
        return data;
    } catch (error) {
        console.error('Problem fetching weather data', error);
    };
};