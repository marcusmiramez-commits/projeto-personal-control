import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, ArrowLeft, Dumbbell, Edit } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutsManagement = ({ user, onLogout }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    workout_name: 'A',
    exercises: []
  });
  const [exerciseFormData, setExerciseFormData] = useState({
    name: '',
    muscle_group: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [studentRes, workoutsRes, exercisesRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}`, { headers }),
        axios.get(`${API}/workouts/student/${studentId}`, { headers }),
        axios.get(`${API}/exercises`, { headers })
      ]);
      
      setStudent(studentRes.data);
      setWorkouts(workoutsRes.data);
      setExercises(exercisesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkout = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/workouts`, { ...formData, student_id: studentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Treino criado!');
      setIsDialogOpen(false);
      setFormData({ workout_name: 'A', exercises: [] });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar treino');
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exercises`, exerciseFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Exercício criado!');
      setIsExerciseDialogOpen(false);
      setExerciseFormData({ name: '', muscle_group: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar exercício');
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Excluir este treino?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/workouts/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Treino excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm('Excluir este exercício?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/exercises/${exerciseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Exercício excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const addExerciseToWorkout = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { exercise_id: '', exercise_name: '', sets: 3, reps: '10', load: '', observations: '' }]
    });
  };

  const updateExerciseInWorkout = (index, field, value) => {
    const newExercises = [...formData.exercises];
    newExercises[index][field] = value;
    
    if (field === 'exercise_id') {
      const exercise = exercises.find(ex => ex.id === value);
      if (exercise) {
        newExercises[index].exercise_name = exercise.name;
      }
    }
    
    setFormData({ ...formData, exercises: newExercises });
  };

  const removeExerciseFromWorkout = (index) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index)
    });
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

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="workouts-management">
        <Button onClick={() => navigate('/students')} variant="ghost" className="mb-4" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Alunos
        </Button>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Treinos de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{student?.name}</span>
            </h1>
            <p className="text-slate-600 mt-2">Gerencie os treinos e exercícios do aluno</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" data-testid="manage-exercises-button">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Gerenciar Exercícios
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Exercício</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateExercise} className="space-y-4">
                  <div>
                    <Label>Nome do Exercício</Label>
                    <Input value={exerciseFormData.name} onChange={(e) => setExerciseFormData({...exerciseFormData, name: e.target.value})} required data-testid="exercise-name-input" />
                  </div>
                  <div>
                    <Label>Grupo Muscular</Label>
                    <Input value={exerciseFormData.muscle_group} onChange={(e) => setExerciseFormData({...exerciseFormData, muscle_group: e.target.value})} required data-testid="exercise-muscle-input" />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Input value={exerciseFormData.description} onChange={(e) => setExerciseFormData({...exerciseFormData, description: e.target.value})} data-testid="exercise-description-input" />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-blue-600" data-testid="submit-exercise-button">Adicionar Exercício</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600" data-testid="add-workout-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Treino
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Treino</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateWorkout} className="space-y-4">
                  <div>
                    <Label>Nome do Treino (A, B, C...)</Label>
                    <Input value={formData.workout_name} onChange={(e) => setFormData({...formData, workout_name: e.target.value})} required data-testid="workout-name-input" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Exercícios</Label>
                      <Button type="button" size="sm" onClick={addExerciseToWorkout} data-testid="add-exercise-to-workout-button">
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Exercício
                      </Button>
                    </div>
                    
                    {formData.exercises.map((exercise, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg mb-3 space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="font-bold">Exercício {index + 1}</Label>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeExerciseFromWorkout(index)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <Select value={exercise.exercise_id} onValueChange={(value) => updateExerciseInWorkout(index, 'exercise_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o exercício" />
                          </SelectTrigger>
                          <SelectContent>
                            {exercises.map(ex => (
                              <SelectItem key={ex.id} value={ex.id}>{ex.name} - {ex.muscle_group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Séries</Label>
                            <Input type="number" value={exercise.sets} onChange={(e) => updateExerciseInWorkout(index, 'sets', e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs">Repetições</Label>
                            <Input value={exercise.reps} onChange={(e) => updateExerciseInWorkout(index, 'reps', e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-xs">Carga</Label>
                            <Input value={exercise.load} onChange={(e) => updateExerciseInWorkout(index, 'load', e.target.value)} placeholder="10kg" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600" data-testid="submit-workout-button">Criar Treino</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Lista de Exercícios Disponíveis */}
        <div className="mb-8 glass rounded-2xl p-6 border border-blue-100">
          <h2 className="text-2xl font-bold mb-4">📚 Biblioteca de Exercícios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {exercises.map(ex => (
              <div key={ex.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <p className="text-xs text-slate-600">{ex.muscle_group}</p>
                  </div>
                  <button onClick={() => handleDeleteExercise(ex.id)} className="p-1 hover:bg-red-100 rounded">
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
            {exercises.length === 0 && <p className="text-slate-600 col-span-4">Nenhum exercício cadastrado. Crie exercícios para montar os treinos.</p>}
          </div>
        </div>

        {/* Lista de Treinos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workouts.map(workout => (
            <div key={workout.id} className="glass rounded-2xl p-6 border border-emerald-100" data-testid="workout-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold">Treino {workout.workout_name}</h3>
                  <p className="text-sm text-slate-600">{workout.exercises?.length || 0} exercícios</p>
                </div>
                <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteWorkout(workout.id)} data-testid="delete-workout-button">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {workout.exercises?.map((ex, idx) => (
                  <div key={idx} className="bg-emerald-50 rounded-lg p-3">
                    <p className="font-semibold text-sm">{ex.exercise_name}</p>
                    <p className="text-xs text-slate-600">{ex.sets}x{ex.reps} {ex.load && `- ${ex.load}`}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {workouts.length === 0 && (
          <div className="text-center py-12 glass rounded-2xl border border-emerald-100">
            <Dumbbell className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">Nenhum treino criado ainda</p>
            <p className="text-sm text-slate-500 mt-2">Clique em "Novo Treino" para começar</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default WorkoutsManagement;