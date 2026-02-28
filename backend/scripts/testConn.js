(async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/');
    const txt = await res.text();
    console.log('OK:', txt.slice(0, 120));
  } catch (err) {
    console.error('ERR:', err);
    process.exit(1);
  }
})();
