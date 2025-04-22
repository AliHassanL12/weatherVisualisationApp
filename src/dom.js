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
  
  function setupSliceSlider(cloudMaterial) {
    const slider = document.getElementById('sliceSlider');
  
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      if (cloudMaterial?.uniforms?.u_sliceZ) {
        cloudMaterial.uniforms.u_sliceZ.value = value;
      }
    });
};  
  export { setupMonthListeners, setupSliceSlider };
  