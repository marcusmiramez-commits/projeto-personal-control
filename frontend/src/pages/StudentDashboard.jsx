import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { CheckCircle, Activity } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = ({ user, onLogout }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/dashboard/student`, { headers: { Authorization: `Bearer ${token}` } });
        setDashboard(response.data);
      } catch (error) {
        toast.error('Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="student-dashboard">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Space Grotesk' }}>Olá, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span></h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6" data-testid="student-attendance-stat"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center"><CheckCircle className="w-6 h-6 text-white" /></div><div><p className="text-sm text-slate-600">Presenças do Mês</p><p className="text-2xl font-bold">{dashboard?.month_attendance || 0}</p></div></div></div>
          <div className="glass rounded-2xl p-6" data-testid="student-balance-stat"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-white" /></div><div><p className="text-sm text-slate-600">Saldo de Aulas</p><p className="text-2xl font-bold">{dashboard?.student?.class_balance || 0}</p></div></div></div>
          <div className="glass rounded-2xl p-6" data-testid="student-workouts-stat"><div className="flex items-center space-x-4"><div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center"><Activity className="w-6 h-6 text-white" /></div><div><p className="text-sm text-slate-600">Fichas de Treino</p><p className="text-2xl font-bold">{dashboard?.workouts?.length || 0}</p></div></div></div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;