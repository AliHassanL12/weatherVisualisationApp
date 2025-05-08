async function benchmarkJSON(month) {
    const t0 = performance.now();
    const res = await fetch('http://localhost:5001/getWeatherData?month=2020-01-01')
    const t1 = performance.now();
    const json = await res.json();
    const t2 = performance.now();
  
    const raw = JSON.stringify(json.temperature);
    const sizeKB = (new Blob([raw]).size / 1024).toFixed(1);
  
    console.log(
      `[JSON] fetch+header: ${(t1-t0).toFixed(1)} ms, ` +
      `parse JSON: ${(t2-t1).toFixed(1)} ms, ` +
      `size ${sizeKB} KB`
    );
  }
  
  async function benchmarkBinary(month) {
    const t0 = performance.now();
    const res = await fetch('http://localhost:5001/getWeatherDataBinary?month=2020-01-01');
    const t1 = performance.now();
    const buf = await res.arrayBuffer();
    const t2 = performance.now();
    const arr = new Float32Array(buf);
    const t3 = performance.now();
  
    console.log(
      `[BIN] fetch+header: ${(t1-t0).toFixed(1)} ms, ` +
      `arrayBuffer→binary: ${(t2-t1).toFixed(1)} ms, ` +
      `Float32Array wrap: ${(t3-t2).toFixed(1)} ms, ` +
      `size ${(buf.byteLength/1024).toFixed(1)} KB`
    );
  }
  
  export {benchmarkJSON, benchmarkBinary}