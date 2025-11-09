import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, Trash2, ArrowLeft, Edit, ArrowRight, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutsList = ({ user, onLogout }) => {
  const { studentId, routineId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [workoutForm, setWorkoutForm] = useState({
    workout_name: '',
    division: '',
    progress_notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [studentId, routineId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [studentRes, routinesRes, workoutsRes] = await Promise.all([
        axios.get(`${API}/students`, { headers }),
        axios.get(`${API}/workout-routines/student/${studentId}`, { headers }),
        axios.get(`${API}/workouts/routine/${routineId}`, { headers })
      ]);
      
      const foundStudent = studentRes.data.find(s => s.id === studentId);
      const foundRoutine = routinesRes.data.find(r => r.id === routineId);
      
      setStudent(foundStudent);
      setRoutine(foundRoutine);
      setWorkouts(workoutsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setWorkoutForm({
        workout_name: workout.workout_name,
        division: workout.division,
        progress_notes: workout.progress_notes || ''
      });
    } else {
      setEditingWorkout(null);
      setWorkoutForm({ workout_name: '', division: '', progress_notes: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingWorkout) {
        await axios.put(`${API}/workouts/${editingWorkout.id}`, workoutForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Treino atualizado!');
      } else {
        await axios.post(`${API}/workouts`, {
          student_id: studentId,
          routine_id: routineId,
          exercises: [],
          ...workoutForm
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Treino criado!');
      }
      
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar treino');
    }
  };

  const handleDeleteWorkout = async (workoutId, workoutName) => {
    if (!window.confirm(`Excluir treino "${workoutName}"?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/workouts/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Treino excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir treino');
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
          onClick={() => navigate(`/students/${studentId}/routines`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Rotinas
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            {routine?.routine_name}
          </h1>
          <p className="text-slate-600">{student?.name} • {workouts.length} treinos</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Treinos</h2>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Treino
          </Button>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <Calendar className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <p className="text-xl text-slate-600 mb-2">Nenhum treino criado</p>
            <p className="text-slate-500">Adicione um treino com divisão e exercícios</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workouts.map(workout => (
              <div
                key={workout.id}
                className="glass rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/students/${studentId}/routines/${routineId}/workouts/${workout.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold">
                        {workout.division}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{workout.workout_name}</h3>
                    {workout.progress_notes && (
                      <p className="text-sm text-slate-600 line-clamp-2">{workout.progress_notes}</p>
                    )}
                    <p className="text-sm text-slate-500 mt-2">
                      {workout.exercises?.length || 0} exercícios
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(workout);
                      }}
                      className="hover:bg-blue-50 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(workout.id, workout.workout_name);
                      }}
                      className="hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-end text-blue-600 font-semibold group-hover:translate-x-1 transition-transform">
                  <span className="mr-2">Ver detalhes</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{editingWorkout ? 'Editar Treino' : 'Novo Treino'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveWorkout} className="space-y-4">
              <div>
                <Label>Nome do Treino *</Label>
                <Input
                  value={workoutForm.workout_name}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, workout_name: e.target.value })}
                  placeholder="Ex: Peito e Ombro, Inferiores, Costas"
                  required
                />
              </div>
              <div>
                <Label>Divisão *</Label>
                <Input
                  value={workoutForm.division}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, division: e.target.value })}
                  placeholder="Ex: A, B, C ou Segunda, Terça"
                  required
                />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={workoutForm.progress_notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, progress_notes: e.target.value })}
                  placeholder="Notas sobre o treino..."
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600">
                {editingWorkout ? 'Atualizar' : 'Criar'} Treino
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default WorkoutsList;
