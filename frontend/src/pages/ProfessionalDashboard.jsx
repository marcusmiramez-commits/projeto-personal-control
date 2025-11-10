import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Users, Calendar, DollarSign, UserPlus, CalendarDays, CreditCard, ClipboardList, Dumbbell, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

const ProfessionalDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch dashboard data
        const dashboardResponse = await axios.get(`${API}/dashboard/professional`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setDashboard(dashboardResponse.data);
        
        // Fetch students
        const studentsResponse = await axios.get(`${API}/students`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setStudents(studentsResponse.data);
        
        // Fetch exercises
        const exercisesResponse = await axios.get(`${API}/exercises`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setExercises(exercisesResponse.data);
        
      } catch (error) {
        toast.error('Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Listen for schedule updates
    const handleScheduleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
    };
  }, []);

  // Calculate schedule statistics from localStorage
  const getScheduleStats = () => {
    try {
      const scheduleData = localStorage.getItem(`schedule_${user?.id}`);
      if (!scheduleData) return { today: 0, month: 0, weeklyAvg: 0 };
      
      const schedule = JSON.parse(scheduleData);
      const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
      const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const todayName = todayIndex === 0 ? 'Domingo' : weekDays[todayIndex - 1];
      
      let todayClasses = 0;
      let totalClasses = 0;
      
      Object.keys(schedule).forEach(time => {
        weekDays.forEach(day => {
          const studentName = schedule[time]?.[day]?.trim();
          if (studentName && studentName.toLowerCase() !== 'aluno') {
            totalClasses++;
            if (day === todayName) {
              todayClasses++;
            }
          }
        });
      });
      
      const weeklyAvg = Math.round(totalClasses / 7);
      const monthEstimate = totalClasses * 4; // Aproximação: 4 semanas no mês
      
      return { 
        today: todayClasses, 
        month: monthEstimate, 
        weeklyAvg: weeklyAvg 
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas da agenda:', error);
      return { today: 0, month: 0, weeklyAvg: 0 };
    }
  };

  // Recalculate stats when refreshTrigger changes
  const scheduleStats = getScheduleStats();

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  // Calculate additional metrics
  const activeStudents = students.filter(s => s.status === 'active').length;
  const prepaidStudents = students.filter(s => s.contract_type === 'prepaid').length;
  const postpaidStudents = students.filter(s => s.contract_type === 'postpaid').length;
  const monthlyStudents = students.filter(s => s.contract_type === 'monthly').length;
  const totalExercises = exercises.length;
  
  // Get unique muscle groups
  const muscleGroups = [...new Set(exercises.map(e => e.muscle_group))].length;

  const moduleCards = [
    {
      icon: Users,
      title: 'Alunos',
      color: 'from-blue-500 to-blue-600',
      path: '/students',
      stats: [
        { label: 'Total de Alunos', value: students.length },
        { label: 'Ativos', value: activeStudents },
        { label: 'Pré-pagos', value: prepaidStudents },
        { label: 'Pós-pagos', value: postpaidStudents },
        { label: 'Mensalistas', value: monthlyStudents },
      ],
      testId: 'module-students'
    },
    {
      icon: CalendarDays,
      title: 'Agenda',
      color: 'from-purple-500 to-purple-600',
      path: '/schedule',
      stats: [
        { label: 'Aulas Hoje', value: scheduleStats.today },
        { label: 'Aulas do Mês', value: scheduleStats.month },
        { label: 'Média Semanal', value: scheduleStats.weeklyAvg },
      ],
      testId: 'module-schedule'
    },
    {
      icon: ClipboardList,
      title: 'Presenças',
      color: 'from-orange-500 to-orange-600',
      path: '/attendance',
      stats: [
        { label: 'Presenças Hoje', value: dashboard?.today_classes || 0 },
        { label: 'Taxa do Mês', value: `${dashboard?.attendance_rate || 0}%` },
        { label: 'Total Registradas', value: dashboard?.month_classes || 0 },
      ],
      testId: 'module-attendance'
    },
    {
      icon: CreditCard,
      title: 'Financeiro',
      color: 'from-emerald-500 to-green-600',
      path: '/financial',
      stats: [
        { label: 'Receita Mensal', value: `R$ ${(dashboard?.month_revenue || 0).toFixed(2)}` },
        { label: 'Total Esperado', value: `R$ ${(students.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.monthly_value || s.class_value || 0), 0)).toFixed(2)}` },
        { label: 'Status', value: dashboard?.paid_count ? `${dashboard.paid_count} ${dashboard.paid_count === 1 ? 'pago' : 'pagos'}` : 'Nenhum pagamento', icon: dashboard?.paid_count > 0 ? CheckCircle : AlertCircle, iconColor: dashboard?.paid_count > 0 ? 'text-green-500' : 'text-orange-500' },
      ],
      testId: 'module-financial'
    },
    {
      icon: Dumbbell,
      title: 'Exercícios',
      color: 'from-red-500 to-red-600',
      path: '/exercises',
      stats: [
        { label: 'Total de Exercícios', value: totalExercises },
        { label: 'Grupos Musculares', value: muscleGroups },
        { label: 'Biblioteca', value: 'Ativa', icon: CheckCircle, iconColor: 'text-green-500' },
      ],
      testId: 'module-exercises'
    },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="professional-dashboard">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Bem-vindo, <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-slate-600">Visão geral dos seus módulos e métricas principais</p>
        </div>
        
        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleCards.map((module, index) => {
            const Icon = module.icon;
            return (
              <div 
                key={index}
                className="glass rounded-2xl p-6 border border-emerald-100 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]"
                data-testid={module.testId}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                      {module.title}
                    </h3>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  {module.stats.map((stat, statIndex) => (
                    <div key={statIndex} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">{stat.label}</span>
                      <div className="flex items-center space-x-2">
                        {stat.icon && <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />}
                        <span className="text-lg font-bold">{stat.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => navigate(module.path)}
                  className={`w-full bg-gradient-to-r ${module.color} hover:opacity-90`}
                >
                  Acessar Módulo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default ProfessionalDashboard;