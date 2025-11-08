import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Users, Calendar, DollarSign, TrendingUp, UserPlus, CalendarDays, CreditCard, ClipboardList, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ProfessionalDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/dashboard/professional`, { headers: { Authorization: `Bearer ${token}` } });
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

  const stats = [
    { icon: Users, label: 'Alunos Ativos', value: dashboard?.total_students || 0, color: 'from-blue-500 to-blue-600', testId: 'stat-total-students' },
    { icon: Calendar, label: 'Aulas Hoje', value: dashboard?.today_classes || 0, color: 'from-purple-500 to-purple-600', testId: 'stat-today-classes' },
    { icon: DollarSign, label: 'Receita Mensal', value: `R$ ${(dashboard?.month_revenue || 0).toFixed(2)}`, color: 'from-emerald-500 to-green-600', testId: 'stat-month-revenue' },
    { icon: TrendingUp, label: 'Aulas do Mês', value: dashboard?.month_classes || 0, color: 'from-orange-500 to-orange-600', testId: 'stat-month-classes' },
  ];

  const shortcuts = [
    { icon: UserPlus, label: 'Gerenciar Alunos', description: 'Cadastrar e editar alunos', color: 'from-blue-500 to-blue-600', path: '/students', testId: 'shortcut-students' },
    { icon: CalendarDays, label: 'Agenda', description: 'Visualizar e editar agenda', color: 'from-purple-500 to-purple-600', path: '/schedule', testId: 'shortcut-schedule' },
    { icon: ClipboardList, label: 'Presenças', description: 'Registrar presenças e faltas', color: 'from-orange-500 to-orange-600', path: '/attendance', testId: 'shortcut-attendance' },
    { icon: CreditCard, label: 'Financeiro', description: 'Pagamentos e relatórios', color: 'from-emerald-500 to-green-600', path: '/financial', testId: 'shortcut-financial' },
    { icon: Dumbbell, label: 'Exercícios', description: 'Gerenciar biblioteca de exercícios', color: 'from-red-500 to-red-600', path: '/exercises', testId: 'shortcut-exercises' },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="professional-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Bem-vindo, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span></h1>
          <p className="text-slate-600">Acompanhe suas métricas e gerencie seus alunos</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="glass rounded-2xl p-6 card-hover border border-emerald-100" data-testid={stat.testId}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Shortcuts Section */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Acesso Rápido
          </h2>
          <p className="text-slate-600">Navegue rapidamente para seus módulos principais</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortcuts.map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <div 
                key={index}
                onClick={() => navigate(shortcut.path)}
                className="glass rounded-2xl p-6 card-hover border border-emerald-100 cursor-pointer transition-all hover:shadow-xl hover:scale-105"
                data-testid={shortcut.testId}
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${shortcut.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{shortcut.label}</h3>
                    <p className="text-sm text-slate-600">{shortcut.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;