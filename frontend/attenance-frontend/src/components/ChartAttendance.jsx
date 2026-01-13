import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ChartAttendance({ limit = 8 }){
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = async () => {
      try {
        const api = axios.create({ baseURL: 'https://college-attendence.onrender.com/api' });
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
        const res = await api.get('/admin/charts/attendance', { params: { limit } });
        const rows = res.data?.data || [];
        setData({ labels: rows.map(r => r.name || r.studentId), datasets: [{ label: 'Attendance %', data: rows.map(r => Number(r.percent || 0)), borderColor: 'rgba(75,192,192,1)', backgroundColor: 'rgba(75,192,192,0.2)' }] });
      } catch (err) { console.error('ChartAttendance fetch error', err); }
    };
    fetch();
  }, [limit]);

  if (!data) return <div>Loading attendance chart...</div>;
  return <div style={{ maxWidth: 700 }}><Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} /></div>;
}
