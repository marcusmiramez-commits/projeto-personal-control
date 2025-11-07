import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Calendar, Activity, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = ({ user, onLogout }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/student`, {
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

  const student = dashboard?.student;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="student-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Olá, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-slate-600">Acompanhe seu progresso e próximas aulas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="student-attendance-stat">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Presenças do Mês</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{dashboard?.month_attendance || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="student-balance-stat">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Saldo de Aulas</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{student?.class_balance || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="student-workouts-stat">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Fichas de Treino</p>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>{dashboard?.workouts?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{ fontFamily: 'Space Grotesk' }}>
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              Próximas Aulas
            </h2>
            {dashboard?.next_classes?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.next_classes.slice(0, 5).map((schedule, index) => (
                  <div key={index} className="p-4 bg-emerald-50 rounded-xl">
                    <p className="font-semibold text-emerald-900">{new Date(schedule.date).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm text-emerald-700">{schedule.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Nenhuma aula agendada</p>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4 flex items-center" style={{ fontFamily: 'Space Grotesk' }}>
              <Activity className="w-5 h-5 mr-2 text-emerald-600" />
              Meus Treinos
            </h2>
            {dashboard?.workouts?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.workouts.map((workout, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-xl">
                    <p className="font-semibold text-blue-900">Treino {workout.workout_name}</p>
                    <p className="text-sm text-blue-700">{workout.exercises?.length || 0} exercícios</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600">Nenhum treino cadastrado ainda</p>
            )}
          </div>
        </div>

        <div className="mt-6 glass rounded-2xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Informações do Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Tipo de Contrato</p>
              <p className="font-semibold capitalize">{student?.contract_type}</p>
            </div>
            {student?.monthly_value && (
              <div>
                <p className="text-sm text-slate-600">Valor Mensal</p>
                <p className="font-semibold">R$ {student.monthly_value.toFixed(2)}</p>
              </div>
            )}
            {student?.goal && (
              <div className="md:col-span-2">
                <p className="text-sm text-slate-600">Objetivo</p>
                <p className="font-semibold">{student.goal}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;