import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Trash2, ArrowLeft, Dumbbell, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutRoutines = ({ user, onLogout }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [routineForm, setRoutineForm] = useState({ routine_name: '' });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [studentRes, routinesRes] = await Promise.all([
        axios.get(`${API}/students`, { headers }),
        axios.get(`${API}/workout-routines/student/${studentId}`, { headers })
      ]);
      
      const foundStudent = studentRes.data.find(s => s.id === studentId);
      setStudent(foundStudent);
      setRoutines(routinesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/workout-routines`, {
        student_id: studentId,
        routine_name: routineForm.routine_name
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Rotina criada!');
      setIsDialogOpen(false);
      setRoutineForm({ routine_name: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar rotina');
    }
  };

  const handleDeleteRoutine = async (routineId, routineName) => {
    if (!window.confirm(`Excluir rotina "${routineName}" e todos os treinos?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/workout-routines/${routineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Rotina excluída!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir rotina');
    }
  };

  if (loading) return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  return (
    <Layout user={user} onLogout={onLogout}>
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/students')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Alunos
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Treinos de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{student?.name}</span>
          </h1>
          <p className="text-slate-600">{routines.length} rotinas de treino</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Rotinas de Treino</h2>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Rotina
          </Button>
        </div>

        {routines.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <Dumbbell className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-xl text-slate-600 mb-2">Nenhuma rotina criada</p>
            <p className="text-slate-500">Crie uma rotina como "Musculação" ou "Aeróbico"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routines.map(routine => (
              <div
                key={routine.id}
                className="glass rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/students/${studentId}/routines/${routine.id}/workouts`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-1">{routine.routine_name}</h3>
                      <p className="text-sm text-slate-500">Clique para ver treinos</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoutine(routine.id, routine.routine_name);
                    }}
                    className="hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-end text-emerald-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <span className="mr-2">Ver treinos</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Nova Rotina de Treino</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <Label>Nome da Rotina *</Label>
                <Input
                  value={routineForm.routine_name}
                  onChange={(e) => setRoutineForm({ routine_name: e.target.value })}
                  placeholder="Ex: Musculação, Aeróbico, Funcional"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600">
                Criar Rotina
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default WorkoutRoutines;
