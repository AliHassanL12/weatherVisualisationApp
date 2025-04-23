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
  
  function setupSliceSlider(material) {
    const slider = document.getElementById('sliceSlider');
    const toggle = document.getElementById('horizontalToggle');
    const metricDisplay = document.getElementById('metricDisplay');
  
    const pressureLevels = [
      975, 900, 825, 741.67, 600,
      450, 300, 200, 125, 50,
      12.33, 3.33, 1
    ];
  
    function updateMetricsDisplay(sliceValue, isHorizontal) {
      const zIndex = Math.floor(sliceValue * (pressureLevels.length - 1));
      const pressure = pressureLevels[zIndex];
      const direction = isHorizontal ? "Horizontal" : "Vertical";
      metricDisplay.innerText = `Slice: ${direction} | Pressure: ${pressure} hPa`;
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
      if (material?.uniforms?.u_sliceZ) {
        material.uniforms.u_sliceZ.value = value;
      }
      updateMetricsDisplay(value, toggle.checked);
    });
  
    // Set initial values
    const initialValue = parseFloat(slider.value);
    if (material?.uniforms?.u_sliceZ) {
      material.uniforms.u_sliceZ.value = initialValue;
    }
    if (material?.uniforms?.u_horizontalSlice) {
      material.uniforms.u_horizontalSlice.value = toggle.checked;
    }
  
    updateMetricsDisplay(initialValue, toggle.checked);
  }
  
  export { setupMonthListeners, setupSliceSlider };
  