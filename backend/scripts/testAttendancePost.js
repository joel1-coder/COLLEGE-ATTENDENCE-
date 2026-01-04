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

    const students = await studentsRes.json();
    console.log('STUDENTS:', JSON.stringify(students, null, 2));

    if (!students || students.length === 0) {
      console.error('No students found; stopping');
      process.exit(1);
    }

    const studentId = students[0]._id;
    const today = new Date().toISOString().split('T')[0];

    const attendancePayload = {
      date: today,
      records: [
        { student: studentId, status: 'present' }
      ]
    };

    const attRes = await fetch('http://localhost:5000/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(attendancePayload),
    });

    const attJson = await attRes.json();
    console.log('ATTENDANCE RESPONSE:', JSON.stringify(attJson, null, 2));
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
})();
