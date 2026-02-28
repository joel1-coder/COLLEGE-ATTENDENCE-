(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff1@example.com', password: 'password' }),
    });

    const loginJson = await loginRes.json();
    console.log('LOGIN:', JSON.stringify(loginJson, null, 2));

    const token = loginJson.token;
    if (!token) process.exit(1);

    // call verify with token
    const verifyRes = await fetch('http://localhost:5000/api/auth/verify', {
      headers: { Authorization: 'Bearer ' + token },
    });
    const verifyJson = await verifyRes.json();
    console.log('VERIFY:', JSON.stringify(verifyJson, null, 2));

    // call verify without token (should 401)
    try {
      await fetch('http://localhost:5000/api/auth/verify');
    } catch (e) {
      console.log('VERIFY without token resulted in error (expected)');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
