function setupScene() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);
    document.body.appendChild(renderer.domElement);
    return {
        scene,
        camera,
        renderer
    }
};

export { 
    setupScene
}

