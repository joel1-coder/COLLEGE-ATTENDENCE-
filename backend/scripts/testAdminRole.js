(async () => {
  try {
    // login as staff
    const staffRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff1@example.com', password: 'password' })
    });
    const staffJson = await staffRes.json();
    console.log('STAFF LOGIN:', staffJson.message, 'role=', staffJson.role);

    try {
      const r = await fetch('http://localhost:5000/api/attendance', { headers: { Authorization: 'Bearer ' + staffJson.token } });
      console.log('STAFF ATTENDANCE GET status:', r.status);
      const j = await r.json();
      console.log('STAFF ATTENDANCE GET body:', j);
    } catch (e) {
      console.error('staff GET error', e);
    }

    // login as admin
    const adminRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
    });
    const adminJson = await adminRes.json();
    console.log('ADMIN LOGIN:', adminJson.message, 'role=', adminJson.role);

    const r2 = await fetch('http://localhost:5000/api/attendance', { headers: { Authorization: 'Bearer ' + adminJson.token } });
    console.log('ADMIN ATTENDANCE GET status:', r2.status);
    const j2 = await r2.json();
    console.log('ADMIN ATTENDANCE GET body:', j2);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
