import * as THREE from 'three';

function setupMonthListeners(loadMonthFn, monthsArrayRef) {
    const nextButton = document.getElementById('nextMonth');
    const prevButton = document.getElementById('prevMonth');
  
    let currentIndex = 0;
  
    nextButton.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % monthsArrayRef.length;
      loadMonthFn(currentIndex);
    });
  
    prevButton.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + monthsArrayRef.length) % monthsArrayRef.length;
      loadMonthFn(currentIndex);
    });
  
    return () => currentIndex;
  }
  
  function setupSliceSlider(material, uniformName = 'u_sliceZ', mode) {
    const slider = document.getElementById('sliceSlider');
    const toggle = document.getElementById('horizontalToggle');
    const metricDisplay = document.getElementById('metricDisplay');
  
    const pressureLevels = [
      1000 ,975 ,950 ,925 ,900 ,875 ,850 ,825 ,800 ,775 ,750 ,700 ,650 ,600, 550, 500, 450, 400, 350, 300, 250, 225 ,200 ,175, 150, 125, 100, 70, 50,
      30, 20, 10, 7, 5,
      3, 2, 1
    ];

  
    function updateMetricsDisplay(sliceValue, isHorizontal) {
      const zIndex = Math.floor(sliceValue * (pressureLevels.length - 1));
      const pressure = pressureLevels[zIndex];
      const direction = isHorizontal ? "Horizontal" : "Vertical";
      if (mode === 'cloudSlice') {
        metricDisplay.innerText = `Pressure: ${pressure} hPa`;
      } else {
        metricDisplay.innerText = `Slice: ${direction} | Pressure: ${pressure} hPa`;
      }
    }
  
    toggle.addEventListener('change', () => {
      const isHorizontal = toggle.checked;
      if (material?.uniforms?.u_horizontalSlice) {
        material.uniforms.u_horizontalSlice.value = isHorizontal;
      }
      updateMetricsDisplay(parseFloat(slider.value), isHorizontal);
    });
  
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      if (material?.uniforms?.[uniformName]) {
        material.uniforms[uniformName].value = value;
      }
      if (material?.uniforms?.uPressureIndex) {
        const pressureIndex = Math.floor(value * (pressureLevels.length - 1));
        material.uniforms.uPressureIndex.value = pressureIndex;
      }
      updateMetricsDisplay(value, toggle.checked);
    });
  
    // Set initial values
    const initialValue = parseFloat(slider.value);
    if (material?.uniforms?.[uniformName]) {
      material.uniforms[uniformName].value = initialValue;
    }
    if (material?.uniforms?.uPressureIndex) {
      const pressureIndex = Math.floor(initialValue * (pressureLevels.length - 1));
      material.uniforms.uPressureIndex.value = pressureIndex;
    }
    if (material?.uniforms?.u_horizontalSlice) {
      material.uniforms.u_horizontalSlice.value = toggle.checked;
    } 
    updateMetricsDisplay(initialValue, toggle.checked);
  }
  
function trackMouse(raycaster, camera, getMeshAndMode, getTextures, tooltipElement) {
    const mouse = new THREE.Vector2();
    
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    
        tooltipElement.style.left = `${e.clientX + 10}px`;
        tooltipElement.style.top = `${e.clientY + 10}px`;
    
        const { mesh, mode } = getMeshAndMode();
        if (!mesh) {
            tooltipElement.style.display = 'none';
            return;
        }
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(mesh);
  
        if (mode === 'wind' && intersects.length > 0) {
            const intersect = intersects[0];
            if (intersect.instanceId !== undefined) {
            const idx = intersect.instanceId;
            const textures = getTextures();
            const u = textures.wind_u[idx];
            const v = textures.wind_v[idx];
            const speed = Math.sqrt(u * u + v * v).toFixed(2);
    
            tooltipElement.innerText = `Wind speed: ${speed} m/s`;
            tooltipElement.style.display = 'block';
        } else {
            tooltipElement.style.display = 'none';
        }
    } else {
        tooltipElement.style.display = 'none';
    }
});
}

function setUIVisibility(mode) {
  const legend = document.getElementById('legend');
  const horizontalToggle = document.getElementById('horizontalToggle');
  const toggleLabel = horizontalToggle?.parentElement;

  const shouldShowWindUI = mode === 'wind';
  const shouldShowHorizontal = mode === 'cloudSlice' || mode === 'tempSlice';

  legend.style.display = shouldShowWindUI ? 'block' : 'none';
  toggleLabel.style.display = shouldShowHorizontal ? 'inline-block' : 'none';
}
  


  export { setupMonthListeners, setupSliceSlider, trackMouse, setUIVisibility };
  