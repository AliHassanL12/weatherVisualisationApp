import * as THREE from 'three';

function create3DTextureFromData(data,shape) {
    const expectedLength = shape[0] * shape[1] * shape[2];
    if (data.length !== expectedLength) {
        console.error(`❌ Data length mismatch. Got ${data.length}, expected ${expectedLength}.`);
        return null;
    }
    const textureArray = new Float32Array(data);
    // essentially extracting width, height and depth from shape
    const texture = new THREE.Data3DTexture(textureArray, shape[2], shape[1], shape[0])

    texture.format = THREE.RedFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    
    return texture;
}

export {
    create3DTextureFromData
}