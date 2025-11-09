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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Edit, Dumbbell, ArrowLeft, FolderOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutsManagement = ({ user, onLogout }) => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [isRoutineDialogOpen, setIsRoutineDialogOpen] = useState(false);
  const [isWorkoutDialogOpen, setIsWorkoutDialogOpen] = useState(false);
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [currentWorkoutForExercise, setCurrentWorkoutForExercise] = useState(null);
  
  // Forms
  const [routineForm, setRoutineForm] = useState({ routine_name: '' });
  const [workoutForm, setWorkoutForm] = useState({ workout_name: '', division: '', exercises: [], progress_notes: '' });
  const [exerciseForm, setExerciseForm] = useState({
    exercise_id: '',
    sets: '',
    reps: '',
    rest_time: '',
    load: '',
    duration: '',
    observations: ''
  });

  useEffect(() => {
    fetchData();
  }, [studentId]);

  useEffect(() => {
    if (selectedRoutine) {
      fetchWorkouts(selectedRoutine.id);
    }
  }, [selectedRoutine]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [studentRes, routinesRes, exercisesRes] = await Promise.all([
        axios.get(`${API}/students`, { headers }),
        axios.get(`${API}/workout-routines/student/${studentId}`, { headers }),
        axios.get(`${API}/exercises`, { headers })
      ]);
      
      const foundStudent = studentRes.data.find(s => s.id === studentId);
      setStudent(foundStudent);
      setRoutines(routinesRes.data);
      setExercises(exercisesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkouts = async (routineId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/workouts/routine/${routineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkouts(response.data);
    } catch (error) {
      toast.error('Erro ao carregar treinos');
    }
  };

  // ===== ROUTINES =====
  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/workout-routines`, {
        student_id: studentId,
        routine_name: routineForm.routine_name
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Rotina criada!');
      setIsRoutineDialogOpen(false);
      setRoutineForm({ routine_name: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao criar rotina');
    }
  };

  const handleDeleteRoutine = async (routineId) => {
    if (!window.confirm('Excluir rotina e todos os treinos?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/workout-routines/${routineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Rotina excluída!');
      if (selectedRoutine?.id === routineId) {
        setSelectedRoutine(null);
        setWorkouts([]);
      }
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir rotina');
    }
  };

  // ===== WORKOUTS =====
  const handleOpenWorkoutDialog = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout);
      setWorkoutForm({
        workout_name: workout.workout_name,
        division: workout.division,
        exercises: workout.exercises || [],
        progress_notes: workout.progress_notes || ''
      });
    } else {
      setEditingWorkout(null);
      setWorkoutForm({ workout_name: '', division: '', exercises: [], progress_notes: '' });
    }
    setIsWorkoutDialogOpen(true);
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
          routine_id: selectedRoutine.id,
          ...workoutForm
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Treino criado!');
      }
      
      setIsWorkoutDialogOpen(false);
      fetchWorkouts(selectedRoutine.id);
    } catch (error) {
      toast.error('Erro ao salvar treino');
    }
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Excluir treino?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/workouts/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Treino excluído!');
      fetchWorkouts(selectedRoutine.id);
    } catch (error) {
      toast.error('Erro ao excluir treino');
    }
  };

  // ===== EXERCISES IN WORKOUT =====
  const handleOpenExerciseDialog = (workout, exercise = null, index = null) => {
    setCurrentWorkoutForExercise(workout);
    
    if (exercise) {
      setEditingExercise({ exercise, index });
      setExerciseForm({
        exercise_id: exercise.exercise_id,
        sets: exercise.sets || '',
        reps: exercise.reps || '',
        rest_time: exercise.rest_time || '',
        load: exercise.load || '',
        duration: exercise.duration || '',
        observations: exercise.observations || ''
      });
    } else {
      setEditingExercise(null);
      setExerciseForm({
        exercise_id: '',
        sets: '',
        reps: '',
        rest_time: '',
        load: '',
        duration: '',
        observations: ''
      });
    }
    setIsExerciseDialogOpen(true);
  };

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    
    const selectedExercise = exercises.find(ex => ex.id === exerciseForm.exercise_id);
    if (!selectedExercise) {
      toast.error('Selecione um exercício');
      return;
    }
    
    const exerciseData = {
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
      sets: exerciseForm.sets ? parseInt(exerciseForm.sets) : null,
      reps: exerciseForm.reps || null,
      rest_time: exerciseForm.rest_time || null,
      load: exerciseForm.load || null,
      duration: exerciseForm.duration || null,
      observations: exerciseForm.observations || null
    };
    
    let updatedExercises = [...currentWorkoutForExercise.exercises];
    
    if (editingExercise !== null) {
      updatedExercises[editingExercise.index] = exerciseData;
    } else {
      updatedExercises.push(exerciseData);
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${currentWorkoutForExercise.id}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success(editingExercise ? 'Exercício atualizado!' : 'Exercício adicionado!');
      setIsExerciseDialogOpen(false);
      fetchWorkouts(selectedRoutine.id);
    } catch (error) {
      toast.error('Erro ao salvar exercício');
    }
  };

  const handleDeleteExerciseFromWorkout = async (workout, exerciseIndex) => {
    if (!window.confirm('Remover exercício do treino?')) return;
    
    const updatedExercises = workout.exercises.filter((_, i) => i !== exerciseIndex);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workout.id}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Exercício removido!');
      fetchWorkouts(selectedRoutine.id);
    } catch (error) {
      toast.error('Erro ao remover exercício');
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
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/students')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Alunos
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Treinos de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{student?.name}</span>
              </h1>
              <p className="text-slate-600 mt-2">{routines.length} rotinas • {workouts.length} treinos</p>
            </div>
          </div>
        </div>

        {/* Routines Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Rotinas de Treino</h2>
            <Button
              onClick={() => setIsRoutineDialogOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Rotina
            </Button>
          </div>

          {routines.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhuma rotina criada ainda</p>
              <p className="text-sm text-slate-500">Crie uma rotina como "Musculação" ou "Aeróbico"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routines.map(routine => (
                <div
                  key={routine.id}
                  onClick={() => setSelectedRoutine(routine)}
                  className={`glass rounded-2xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedRoutine?.id === routine.id ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{routine.routine_name}</h3>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoutine(routine.id);
                      }}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workouts Section */}
        {selectedRoutine && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Treinos - {selectedRoutine.routine_name}
              </h2>
              <Button
                onClick={() => handleOpenWorkoutDialog()}
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </div>

            {workouts.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600">Nenhum treino nesta rotina</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.map(workout => (
                  <div key={workout.id} className="glass rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold">
                            {workout.division}
                          </span>
                          <h3 className="text-xl font-bold">{workout.workout_name}</h3>
                        </div>
                        {workout.progress_notes && (
                          <p className="text-sm text-slate-600 mt-2">{workout.progress_notes}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenWorkoutDialog(workout)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWorkout(workout.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Exercises in workout */}
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-slate-700">Exercícios ({workout.exercises?.length || 0})</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenExerciseDialog(workout)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {workout.exercises && workout.exercises.length > 0 ? (
                        <div className="space-y-2">
                          {workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                              <div className="flex-1">
                                <p className="font-semibold">{exercise.exercise_name}</p>
                                <div className="flex flex-wrap gap-2 mt-2 text-sm text-slate-600">
                                  {exercise.sets && <span>Séries: {exercise.sets}</span>}
                                  {exercise.reps && <span>• Reps: {exercise.reps}</span>}
                                  {exercise.rest_time && <span>• Pausa: {exercise.rest_time}</span>}
                                  {exercise.load && <span>• Carga: {exercise.load}</span>}
                                  {exercise.duration && <span>• Tempo: {exercise.duration}</span>}
                                </div>
                                {exercise.observations && (
                                  <p className="text-xs text-slate-500 mt-1 italic">{exercise.observations}</p>
                                )}
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenExerciseDialog(workout, exercise, idx)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteExerciseFromWorkout(workout, idx)}
                                  className="hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-4">Nenhum exercício adicionado</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dialog: Create Routine */}
        <Dialog open={isRoutineDialogOpen} onOpenChange={setIsRoutineDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Nova Rotina de Treino</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRoutine} className="space-y-4">
              <div>
                <Label>Nome da Rotina *</Label>
                <Input
                  value={routineForm.routine_name}
                  onChange={(e) => setRoutineForm({ ...routineForm, routine_name: e.target.value })}
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

        {/* Dialog: Create/Edit Workout */}
        <Dialog open={isWorkoutDialogOpen} onOpenChange={setIsWorkoutDialogOpen}>
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

        {/* Dialog: Add/Edit Exercise */}
        <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
          <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExercise ? 'Editar Exercício' : 'Adicionar Exercício'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveExercise} className="space-y-4">
              <div>
                <Label>Exercício *</Label>
                <Select
                  value={exerciseForm.exercise_id}
                  onValueChange={(value) => setExerciseForm({ ...exerciseForm, exercise_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(ex => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name} ({ex.muscle_group})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Séries</Label>
                  <Input
                    type="number"
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: e.target.value })}
                    placeholder="Ex: 4"
                  />
                </div>
                <div>
                  <Label>Repetições</Label>
                  <Input
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                    placeholder="Ex: 12 ou 8-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pausa</Label>
                  <Input
                    value={exerciseForm.rest_time}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, rest_time: e.target.value })}
                    placeholder="Ex: 60s ou 1min"
                  />
                </div>
                <div>
                  <Label>Carga</Label>
                  <Input
                    value={exerciseForm.load}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, load: e.target.value })}
                    placeholder="Ex: 50kg"
                  />
                </div>
              </div>

              <div>
                <Label>Tempo/Duração</Label>
                <Input
                  value={exerciseForm.duration}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, duration: e.target.value })}
                  placeholder="Ex: 30s ou 2min"
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={exerciseForm.observations}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, observations: e.target.value })}
                  placeholder="Notas sobre execução, técnica, progressão..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600">
                {editingExercise ? 'Atualizar' : 'Adicionar'} Exercício
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default WorkoutsManagement;
