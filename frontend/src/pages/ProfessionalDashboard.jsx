import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const ProfessionalDashboard = ({ user, onLogout }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/professional`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboard(response.data);
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      icon: Users,
      label: 'Alunos Ativos',
      value: dashboard?.total_students || 0,
      color: 'from-blue-500 to-blue-600',
      testId: 'stat-total-students'
    },
    {
      icon: Calendar,
      label: 'Aulas Hoje',
      value: dashboard?.today_classes || 0,
      color: 'from-purple-500 to-purple-600',
      testId: 'stat-today-classes'
    },
    {
      icon: DollarSign,
      label: 'Receita Mensal',
      value: `R$ ${(dashboard?.month_revenue || 0).toFixed(2)}`,
      color: 'from-emerald-500 to-green-600',
      testId: 'stat-month-revenue'
    },
    {
      icon: TrendingUp,
      label: 'Aulas do Mês',
      value: dashboard?.month_classes || 0,
      color: 'from-orange-500 to-orange-600',
      testId: 'stat-month-classes'
    },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="professional-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Bem-vindo, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-slate-600">Acompanhe suas métricas e gerencie seus alunos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Início Rápido</h2>
            <div className="space-y-3">
              <a href="/students" className="block p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                <h3 className="font-semibold text-emerald-900">Gerenciar Alunos</h3>
                <p className="text-sm text-emerald-700">Cadastre e acompanhe seus alunos</p>
              </a>
              <a href="/schedule" className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                <h3 className="font-semibold text-blue-900">Agendar Aula</h3>
                <p className="text-sm text-blue-700">Organize sua agenda de treinos</p>
              </a>
              <a href="/attendance" className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
                <h3 className="font-semibold text-purple-900">Marcar Presença</h3>
                <p className="text-sm text-purple-700">Controle a frequência dos alunos</p>
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Dicas do Sistema</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Cadastre seus exercícios</h4>
                  <p className="text-sm text-slate-600">Monte uma biblioteca personalizada</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Crie fichas de treino</h4>
                  <p className="text-sm text-slate-600">Personalize para cada aluno</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Acompanhe os pagamentos</h4>
                  <p className="text-sm text-slate-600">Mantenha seu financeiro organizado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;