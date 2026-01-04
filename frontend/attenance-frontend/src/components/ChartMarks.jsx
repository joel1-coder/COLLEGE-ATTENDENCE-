import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ChartMarks({ limit = 8 }){
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = async () => {
      try {
        const api = axios.create({ baseURL: 'http://localhost:5000/api' });
        const stored = JSON.parse(localStorage.getItem('user')) || null;
        if (stored?.token) api.defaults.headers.common['Authorization'] = `Bearer ${stored.token}`;
        const res = await api.get('/admin/charts/marks', { params: { limit } });
        const rows = res.data?.data || [];
        setData({ labels: rows.map(r => r.name || r.studentId), datasets: [{ label: 'Avg Mark', data: rows.map(r => Number(r.avgMark || 0)), backgroundColor: 'rgba(54,162,235,0.6)' }] });
      } catch (err) { console.error('ChartMarks fetch error', err); }
    };
    fetch();
  }, [limit]);

  if (!data) return <div>Loading marks chart...</div>;
  return <div style={{ maxWidth: 700 }}><Bar data={data} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} /></div>;
}
