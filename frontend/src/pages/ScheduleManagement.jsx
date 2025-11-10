import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ScheduleManagement = ({ user, onLogout }) => {
  const [timeSlots, setTimeSlots] = useState([
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ]);
  
  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  const [schedule, setSchedule] = useState(() => {
    const initial = {};
    timeSlots.forEach(time => {
      initial[time] = {};
      weekDays.forEach(day => {
        initial[time][day] = '';
      });
    });
    return initial;
  });

  // Load schedule from backend on mount
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/schedule-grid`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.grid_data && Object.keys(response.data.grid_data).length > 0) {
          setSchedule(response.data.grid_data);
          // Também salvar no localStorage como cache
          localStorage.setItem(`schedule_${user.id}`, JSON.stringify(response.data.grid_data));
        } else {
          // Se não houver dados no backend, tentar carregar do localStorage
          const saved = localStorage.getItem(`schedule_${user.id}`);
          if (saved) {
            try {
              setSchedule(JSON.parse(saved));
            } catch (error) {
              console.error('Error parsing saved schedule:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error);
        // Fallback para localStorage
        const saved = localStorage.getItem(`schedule_${user.id}`);
        if (saved) {
          try {
            setSchedule(JSON.parse(saved));
          } catch (error) {
            console.error('Error parsing saved schedule:', error);
          }
        }
      }
    };
    
    fetchSchedule();
  }, [user?.id]);

  // Auto-save to localStorage (for backward compatibility)
  useEffect(() => {
    localStorage.setItem(`schedule_${user?.id}`, JSON.stringify(schedule));
    window.dispatchEvent(new Event('scheduleUpdated'));
  }, [schedule, user]);

  // Save schedule to backend and localStorage
  const handleSaveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Salvar no backend
      await axios.post(`${API}/schedule-grid`, schedule, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Também salvar no localStorage como cache
      localStorage.setItem(`schedule_${user?.id}`, JSON.stringify(schedule));
      window.dispatchEvent(new Event('scheduleUpdated'));
      
      toast.success('Agenda salva com sucesso!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Erro ao salvar agenda: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCellChange = (time, day, value) => {
    setSchedule(prev => ({
      ...prev,
      [time]: {
        ...prev[time],
        [day]: value
      }
    }));
  };

  const handleTimeChange = (oldTime, newTime) => {
    if (!newTime) return;
    const newSchedule = { ...schedule };
    newSchedule[newTime] = newSchedule[oldTime];
    delete newSchedule[oldTime];
    setSchedule(newSchedule);
    
    const newTimeSlots = timeSlots.map(t => t === oldTime ? newTime : t);
    setTimeSlots(newTimeSlots);
  };

  const addTimeSlot = () => {
    const newTime = '23:00';
    setTimeSlots([...timeSlots, newTime]);
    setSchedule(prev => ({
      ...prev,
      [newTime]: weekDays.reduce((acc, day) => ({ ...acc, [day]: '' }), {})
    }));
    toast.success('Horário adicionado!');
  };

  const removeTimeSlot = (time) => {
    if (timeSlots.length <= 1) {
      toast.error('Deve haver pelo menos um horário!');
      return;
    }
    const newSchedule = { ...schedule };
    delete newSchedule[time];
    setSchedule(newSchedule);
    setTimeSlots(timeSlots.filter(t => t !== time));
    toast.success('Horário removido!');
  };

  const saveSchedule = async () => {
    // Save to backend and localStorage
    await handleSaveSchedule();
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="schedule-management">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Agenda</span> Semanal
            </h1>
            <p className="text-slate-600 mt-1 md:mt-2 text-sm md:text-base">Grade de horários editável - clique nas células para editar</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={addTimeSlot} variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-sm md:text-base" data-testid="add-timeslot-button">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Horário
            </Button>
            <Button onClick={saveSchedule} className="bg-gradient-to-r from-emerald-500 to-green-600 text-sm md:text-base" data-testid="save-schedule-button">
              <Save className="w-4 h-4 mr-2" />
              Salvar Agenda
            </Button>
          </div>
        </div>

        <div className="glass rounded-2xl p-2 md:p-6 border border-emerald-100 overflow-x-auto shadow-inner">
          <div className="overflow-x-scroll md:overflow-x-auto">
            <table className="w-full border-collapse min-w-max" data-testid="schedule-grid">
              <thead>
                <tr>
                  <th className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-1 md:p-3 border border-slate-600 font-bold sticky left-0 z-10 min-w-[60px] md:min-w-[150px] text-[10px] md:text-base leading-tight">
                    HOR
                  </th>
                  {weekDays.map(day => {
                    // Abreviar dias para mobile
                    const shortDay = day.substring(0, 3);
                    return (
                      <th key={day} className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-1 md:p-3 border border-amber-500 font-bold text-center min-w-[42px] md:min-w-[120px] text-[10px] md:text-base">
                        <span className="md:hidden">{shortDay}</span>
                        <span className="hidden md:inline">{day}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr key={time}>
                    <td className="bg-gradient-to-br from-amber-600 to-amber-700 text-white p-0.5 md:p-2 border border-amber-500 sticky left-0 z-10">
                      <div className="flex items-center justify-between gap-0.5 md:gap-1">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => handleTimeChange(time, e.target.value)}
                          className="w-12 md:w-24 h-6 md:h-8 text-[9px] md:text-sm bg-white text-slate-900 border-0 font-semibold px-0.5"
                          data-testid={`time-input-${timeIndex}`}
                        />
                        <button
                          onClick={() => removeTimeSlot(time)}
                          className="p-0.5 md:p-1 hover:bg-red-500 rounded"
                          data-testid={`remove-timeslot-${timeIndex}`}
                        >
                          <Trash2 className="w-2.5 h-2.5 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </td>
                    {weekDays.map((day, dayIndex) => (
                      <td key={`${time}-${day}`} className="bg-amber-50 p-0 border border-amber-200">
                        <Input
                          value={schedule[time]?.[day] || ''}
                          onChange={(e) => handleCellChange(time, day, e.target.value)}
                          placeholder=""
                          className="w-full h-8 md:h-12 border-0 text-center text-[9px] md:text-sm font-medium text-slate-700 bg-transparent hover:bg-amber-100 focus:bg-white focus:border-2 focus:border-emerald-500 transition-colors px-0.5"
                          data-testid={`schedule-cell-${timeIndex}-${dayIndex}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <p>✏️ Clique em qualquer célula para editar o nome do aluno</p>
            <p>💾 Suas alterações são salvas automaticamente localmente</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">📝 Dica 1</h3>
            <p className="text-sm text-slate-600">Clique nos horários à esquerda para editá-los</p>
          </div>
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">➕ Dica 2</h3>
            <p className="text-sm text-slate-600">Use "Adicionar Horário" para criar novos slots</p>
          </div>
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">💾 Dica 3</h3>
            <p className="text-sm text-slate-600">Clique em "Salvar" para garantir que as mudanças sejam mantidas</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScheduleManagement;