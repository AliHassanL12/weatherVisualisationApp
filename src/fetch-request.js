
export async function fetchWeatherData() {
    try {
        const response = await fetch('http://127.0.0.1:5001/getWeatherData');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        };
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Problem fetching weather data', error);
        return null;
    };
};


/** 
 * we need to convert our latitude and longitude values to 3D cartesian coordinates 
 * The Formulas are as follows:
 * x = R * cos(lat) * cos(lon)
 * y = R * cos(lat) * sin(lon)
 * z = R *sin(lat)
 * 
 * Where R is the radius of the earth. Note this assumes the earth is a sphere rather than
 * an ellipsoid, which works in our case given that it is the former. 
 * */ 

export function convertToCartesian(lat, lon, radius) {
    const latRad = (lat * Math.PI) / 180; // Convert to radians (our function expect them in this format)
    const lonRad = (lon * Math.PI) / 180; // Convert to radians


    const x = radius * Math.cos(latRad) * Math.cos(lonRad);
    const y = radius * Math.cos(latRad) * Math.sin(lonRad);
    const z = radius * Math.sin(latRad);

    return { x, y, z }; // returning as an object
}


    

