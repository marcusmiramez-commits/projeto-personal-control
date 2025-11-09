import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { CheckCircle, XCircle, Dumbbell, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const StudentDashboard = ({ user, onLogout }) => {
  const [dashboard, setDashboard] = useState(null);
  const [workoutRoutines, setWorkoutRoutines] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch dashboard data
        const dashboardResponse = await axios.get(`${API}/dashboard/student`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setDashboard(dashboardResponse.data);
        
        // Fetch workout routines for the student
        const routinesResponse = await axios.get(`${API}/workout-routines/student/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWorkoutRoutines(routinesResponse.data);
        
        // Fetch attendances (all time for better reporting)
        const attendancesResponse = await axios.get(`${API}/attendances`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendances(attendancesResponse.data);
        
        // Fetch payments
        const paymentsResponse = await axios.get(`${API}/payments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPayments(paymentsResponse.data);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  if (loading) return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  // Get student data
  const student = dashboard?.student;
  const contractType = student?.contract_type;

  // Calculate attendance statistics for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthAttendances = attendances.filter(a => a.date && a.date.startsWith(currentMonth));
  const presentCount = monthAttendances.filter(a => a.present).length;
  const absentCount = monthAttendances.filter(a => !a.present).length;
  const totalClasses = monthAttendances.length;

  // Count total workouts across all routines
  const totalWorkouts = workoutRoutines.reduce((sum, routine) => {
    return sum + (routine.workouts?.length || 0);
  }, 0);

  // Calculate financial data based on contract type
  const calculateFinancialData = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    if (contractType === 'prepaid') {
      // Pré-pago: calcular valor pendente de pagamentos pendentes
      return {
        classBalance: student?.classes_remaining || 0,
        pendingAmount: totalPending,
        showClassBalance: true,
        type: 'Pré-pago'
      };
    } else if (contractType === 'postpaid') {
      // Pós-pago: calcular valor a pagar com base nas aulas dadas
      const classValue = student?.class_value || 0;
      const totalToPay = presentCount * classValue;
      return {
        amountToPay: totalToPay,
        classValue: classValue,
        showClassBalance: false,
        type: 'Pós-pago'
      };
    } else if (contractType === 'monthly') {
      // Mensalista: mostrar valor mensal e pendências
      return {
        monthlyValue: student?.monthly_value || 0,
        pendingAmount: totalPending,
        showClassBalance: false,
        type: 'Mensal'
      };
    }
    
    return {
      showClassBalance: false,
      type: 'N/A'
    };
  };

  const financialData = calculateFinancialData();

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="student-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Olá, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-slate-600">Acompanhe seu progresso e informações importantes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card: Aulas */}
          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="student-attendance-stat">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Aulas</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Presenças do Mês</span>
                <span className="text-lg font-bold">{presentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Aulas Agendadas</span>
                <span className="text-lg font-bold">{totalScheduledThisMonth}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Taxa de Presença</span>
                <span className="text-lg font-bold text-emerald-600">{attendanceRate}%</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Aulas na Semana</span>
                <span className="text-lg font-bold">{scheduleInfo.weeklyClasses}</span>
              </div>
            </div>
          </div>

          {/* Card: Financeiro */}
          <div className="glass rounded-2xl p-6 border border-blue-100" data-testid="student-balance-stat">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Financeiro</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tipo de Contrato</span>
                <span className="text-sm font-bold capitalize">
                  {student?.contract_type === 'prepaid' ? 'Pré-pago' : 'Mensal'}
                </span>
              </div>
              {student?.contract_type === 'prepaid' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Saldo de Aulas</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {student?.classes_remaining || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Valor por Aula</span>
                    <span className="text-lg font-bold">
                      R$ {(student?.class_value || 0).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Valor Mensal</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {(student?.monthly_value || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    <span className="text-sm font-bold text-emerald-600">Ativo</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card: Fichas de Treino */}
          <div className="glass rounded-2xl p-6 border border-purple-100" data-testid="student-workouts-stat">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk' }}>Treinos</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Rotinas Ativas</span>
                <span className="text-2xl font-bold text-purple-600">{workoutRoutines.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total de Treinos</span>
                <span className="text-lg font-bold">{totalWorkouts}</span>
              </div>
              {workoutRoutines.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Suas rotinas:</p>
                  {workoutRoutines.slice(0, 3).map((routine, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-1">
                      <CheckCircle className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-slate-700">{routine.routine_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional info section */}
        {workoutRoutines.length === 0 && (
          <div className="mt-6 glass rounded-xl p-4 border border-amber-200 bg-amber-50">
            <p className="text-sm text-amber-800">
              ℹ️ Você ainda não possui fichas de treino. Entre em contato com seu personal trainer!
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;