(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff1@example.com', password: 'password' }),
    });

    const loginJson = await loginRes.json();
    console.log('LOGIN:', JSON.stringify(loginJson, null, 2));

    if (!loginJson.token) {
      console.error('No token returned; stopping');
      process.exit(1);
    }

    const token = loginJson.token;

    const studentsRes = await fetch('http://localhost:5000/api/students?class=10&section=A', {
      headers: { Authorization: 'Bearer ' + token },
    });

    const studentsJson = await studentsRes.json();
    console.log('STUDENTS:', JSON.stringify(studentsJson, null, 2));
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
