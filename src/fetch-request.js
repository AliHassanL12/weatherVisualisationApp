import { sphereRadius, earthGroup } from ".";
import * as THREE from 'three';

export async function fetchWeatherData() {
    try {
        const response = await fetch('http://127.0.0.1:5001/getWeatherData');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        };
        const data = await response.json();
        console.log('Weather Data:', data);
        const latitudes = data.latitudes;
        console.log(latitudes)
        const longitudes = data.longitudes;
        console.log(longitudes)
        const temperature = data.t2m;
        plotWeatherPoints(latitudes, longitudes, temperature);
        return data;
    } catch (error) {
        console.error('Problem fetching weather data', error);
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

function plotWeatherPoints(latitudes, longitudes, dataValues) {
    for (let i = 0; i < latitudes.length; i++) {
        for (let j = 0; j < longitudes.length; j++) {
            const lat = latitudes[i];
            const lon = longitudes[j];
            const { x, y, z } = convertToCartesian(lat, lon, sphereRadius + 0.05); // technique called object destructuring. Extracts x, y and z from the object returned by the converToCartesian function

            const pointGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const pointMaterial = new THREE.MeshStandardMaterial({
                color: 'red', // CHANGE this later to depend on the data value
            });
            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            pointMesh.position.set(x, y, z);
            earthGroup.add(pointMesh);
        }
    }
}