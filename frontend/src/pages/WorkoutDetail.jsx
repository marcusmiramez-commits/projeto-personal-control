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
import { Plus, Trash2, ArrowLeft, Copy, ChevronDown, ChevronUp, Image } from 'lucide-react';
import { toast } from 'sonner';

const WorkoutDetail = ({ user, onLogout }) => {
  const { studentId, routineId, workoutId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [routine, setRoutine] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [expandedExercises, setExpandedExercises] = useState({});

  useEffect(() => {
    fetchData();
  }, [studentId, routineId, workoutId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [studentRes, routinesRes, workoutsRes, exercisesRes] = await Promise.all([
        axios.get(`${API}/students`, { headers }),
        axios.get(`${API}/workout-routines/student/${studentId}`, { headers }),
        axios.get(`${API}/workouts/routine/${routineId}`, { headers }),
        axios.get(`${API}/exercises`, { headers })
      ]);
      
      const foundStudent = studentRes.data.find(s => s.id === studentId);
      const foundRoutine = routinesRes.data.find(r => r.id === routineId);
      const foundWorkout = workoutsRes.data.find(w => w.id === workoutId);
      
      // Migrate old structure to new series structure
      if (foundWorkout && foundWorkout.exercises) {
        foundWorkout.exercises = foundWorkout.exercises.map(ex => {
          if (!ex.series || ex.series.length === 0) {
            // Create default series array
            return {
              ...ex,
              series: [{ reps: '', rest_time: '', load: '', duration: '', observations: '' }]
            };
          }
          return ex;
        });
      }
      
      setStudent(foundStudent);
      setRoutine(foundRoutine);
      setWorkout(foundWorkout);
      setExercises(exercisesRes.data);
      
      if (foundWorkout?.exercises) {
        const expanded = {};
        foundWorkout.exercises.forEach((_, idx) => {
          expanded[idx] = true;
        });
        setExpandedExercises(expanded);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async () => {
    if (!selectedExerciseId) {
      toast.error('Selecione um exercício');
      return;
    }
    
    const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (!selectedExercise) return;
    
    const newExercise = {
      exercise_id: selectedExercise.id,
      exercise_name: selectedExercise.name,
      series: [{ reps: '', rest_time: '', load: '', duration: '', observations: '' }]
    };
    
    const updatedExercises = [...(workout.exercises || []), newExercise];
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Exercício adicionado!');
      setIsExerciseDialogOpen(false);
      setSelectedExerciseId('');
      fetchData();
    } catch (error) {
      toast.error('Erro ao adicionar exercício');
    }
  };

  const handleDeleteExercise = async (exerciseIndex) => {
    if (!window.confirm('Remover exercício do treino?')) return;
    
    const updatedExercises = workout.exercises.filter((_, i) => i !== exerciseIndex);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Exercício removido!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover exercício');
    }
  };

  const handleAddSeries = async (exerciseIndex) => {
    const exercise = workout.exercises[exerciseIndex];
    const updatedExercise = {
      ...exercise,
      series: [...(exercise.series || []), { reps: '', rest_time: '', load: '', duration: '', observations: '' }]
    };
    
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Série adicionada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao adicionar série');
    }
  };

  const handleReplicateSeries = async (exerciseIndex) => {
    const exercise = workout.exercises[exerciseIndex];
    if (!exercise.series || exercise.series.length === 0) {
      toast.error('Nenhuma série para replicar');
      return;
    }
    
    const lastSeries = exercise.series[exercise.series.length - 1];
    const updatedExercise = {
      ...exercise,
      series: [...exercise.series, { ...lastSeries }]
    };
    
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Série replicada!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao replicar série');
    }
  };

  const handleDeleteSeries = async (exerciseIndex, seriesIndex) => {
    const exercise = workout.exercises[exerciseIndex];
    const updatedSeries = exercise.series.filter((_, i) => i !== seriesIndex);
    
    const updatedExercise = {
      ...exercise,
      series: updatedSeries
    };
    
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Série removida!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover série');
    }
  };

  const handleUpdateSeries = async (exerciseIndex, seriesIndex, field, value) => {
    const exercise = workout.exercises[exerciseIndex];
    const updatedSeries = [...exercise.series];
    updatedSeries[seriesIndex] = {
      ...updatedSeries[seriesIndex],
      [field]: value
    };
    
    const updatedExercise = {
      ...exercise,
      series: updatedSeries
    };
    
    const updatedExercises = [...workout.exercises];
    updatedExercises[exerciseIndex] = updatedExercise;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/workouts/${workoutId}`, {
        exercises: updatedExercises
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      toast.error('Erro ao atualizar série');
    }
  };

  const toggleExercise = (index) => {
    setExpandedExercises(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  const getExerciseDetails = (exerciseId) => {
    return exercises.find(ex => ex.id === exerciseId);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(`/students/${studentId}/routines/${routineId}/workouts`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Treinos
        </Button>

        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold">
              {workout?.division}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            {workout?.workout_name}
          </h1>
          <p className="text-slate-600">{routine?.routine_name} • {student?.name}</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Exercícios</h2>
          <Button
            onClick={() => setIsExerciseDialogOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Exercício
          </Button>
        </div>

        {!workout?.exercises || workout.exercises.length === 0 ? (
          <div className="text-center py-16 glass rounded-2xl">
            <p className="text-xl text-slate-600 mb-2">Nenhum exercício adicionado</p>
            <p className="text-slate-500">Adicione exercícios da sua biblioteca</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIdx) => {
              const exerciseDetails = getExerciseDetails(exercise.exercise_id);
              const isExpanded = expandedExercises[exerciseIdx];
              
              return (
                <div key={exerciseIdx} className="glass rounded-2xl overflow-hidden">
                  {/* Exercise Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleExercise(exerciseIdx)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {exerciseDetails?.image_url && (
                          <img
                            src={exerciseDetails.image_url}
                            alt={exercise.exercise_name}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        {!exerciseDetails?.image_url && (
                          <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Image className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{exercise.exercise_name}</h3>
                          {exerciseDetails && (
                            <p className="text-sm text-slate-600">{exerciseDetails.muscle_group}</p>
                          )}
                          <p className="text-sm text-slate-500 mt-1">
                            {exercise.series?.length || 0} série(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(exerciseIdx);
                          }}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Series */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-4 bg-slate-50">
                      <div className="space-y-3">
                        {exercise.series && exercise.series.map((series, seriesIdx) => (
                          <div key={seriesIdx} className="bg-white rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-slate-700">Série {seriesIdx + 1}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSeries(exerciseIdx, seriesIdx)}
                                className="hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Repetições</Label>
                                <Input
                                  value={series.reps || ''}
                                  onChange={(e) => handleUpdateSeries(exerciseIdx, seriesIdx, 'reps', e.target.value)}
                                  placeholder="Ex: 12"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Carga</Label>
                                <Input
                                  value={series.load || ''}
                                  onChange={(e) => handleUpdateSeries(exerciseIdx, seriesIdx, 'load', e.target.value)}
                                  placeholder="Ex: 50kg"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Pausa</Label>
                                <Input
                                  value={series.rest_time || ''}
                                  onChange={(e) => handleUpdateSeries(exerciseIdx, seriesIdx, 'rest_time', e.target.value)}
                                  placeholder="Ex: 60s"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Tempo</Label>
                                <Input
                                  value={series.duration || ''}
                                  onChange={(e) => handleUpdateSeries(exerciseIdx, seriesIdx, 'duration', e.target.value)}
                                  placeholder="Ex: 30s"
                                  className="h-9"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <Label className="text-xs">Observações</Label>
                              <Textarea
                                value={series.observations || ''}
                                onChange={(e) => handleUpdateSeries(exerciseIdx, seriesIdx, 'observations', e.target.value)}
                                placeholder="Notas sobre esta série..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex space-x-3 mt-4">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleAddSeries(exerciseIdx)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Série
                        </Button>
                        {exercise.series && exercise.series.length > 0 && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleReplicateSeries(exerciseIdx)}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Replicar Última
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Adicionar Exercício</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Selecione o Exercício</Label>
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha da biblioteca" />
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
              <Button
                onClick={handleAddExercise}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
              >
                Adicionar Exercício
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default WorkoutDetail;
