import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Trash2, Users, Dumbbell, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const ExercisesManagement = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ name: '', muscle_group: '', description: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch exercises, students, and all workouts
      const [exercisesRes, studentsRes] = await Promise.all([
        axios.get(`${API}/exercises`, { headers }),
        axios.get(`${API}/students`, { headers })
      ]);
      
      setExercises(exercisesRes.data);
      setStudents(studentsRes.data);
      
      // Fetch all workouts for all students
      const allWorkouts = [];
      for (const student of studentsRes.data) {
        try {
          const workoutsRes = await axios.get(`${API}/workouts/student/${student.id}`, { headers });
          allWorkouts.push(...workoutsRes.data.map(w => ({ ...w, student_id: student.id, student_name: student.name })));
        } catch (err) {
          // Student might not have workouts yet
        }
      }
      setWorkouts(allWorkouts);
      
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exercises`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Exercício criado!');
      setIsDialogOpen(false);
      setFormData({ name: '', muscle_group: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir exercício? Ele será removido de todos os treinos.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/exercises/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  // Count how many workouts use each exercise
  const getExerciseUsageCount = (exerciseId) => {
    let count = 0;
    workouts.forEach(workout => {
      if (workout.exercises && workout.exercises.some(ex => ex.exercise_id === exerciseId)) {
        count++;
      }
    });
    return count;
  };

  // Get students using this exercise
  const getStudentsUsingExercise = (exerciseId) => {
    const studentIds = new Set();
    workouts.forEach(workout => {
      if (workout.exercises && workout.exercises.some(ex => ex.exercise_id === exerciseId)) {
        studentIds.add(workout.student_id);
      }
    });
    return Array.from(studentIds);
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by muscle group
  const muscleGroups = [...new Set(exercises.map(e => e.muscle_group))].sort();

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="exercises-management">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Biblioteca de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Exercícios</span>
              </h1>
              <p className="text-slate-600 mt-2">
                {exercises.length} exercícios • {muscleGroups.length} grupos musculares
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600" data-testid="add-exercise-button">
                  <Plus className="w-4 h-4 mr-2" />Novo Exercício
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader><DialogTitle>Novo Exercício</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nome do Exercício</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ex: Supino Reto"
                      required 
                      data-testid="exercise-name-input" 
                    />
                  </div>
                  <div>
                    <Label>Grupo Muscular</Label>
                    <Input 
                      value={formData.muscle_group} 
                      onChange={(e) => setFormData({...formData, muscle_group: e.target.value})} 
                      placeholder="Ex: Peito"
                      required 
                      data-testid="exercise-muscle-group-input" 
                    />
                  </div>
                  <div>
                    <Label>Descrição (opcional)</Label>
                    <Input 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})} 
                      placeholder="Detalhes sobre o exercício"
                      data-testid="exercise-description-input" 
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600" data-testid="submit-exercise-button">
                    Criar Exercício
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Buscar exercícios..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((ex) => {
            const usageCount = getExerciseUsageCount(ex.id);
            const studentsUsing = getStudentsUsingExercise(ex.id);
            
            return (
              <div key={ex.id} className="glass rounded-2xl p-6 border border-emerald-100 hover:shadow-lg transition-all" data-testid="exercise-card">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{ex.name}</h3>
                      <p className="text-sm text-slate-600">{ex.muscle_group}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(ex.id)} 
                    className="hover:bg-red-50 hover:text-red-600"
                    data-testid="delete-exercise-button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Description */}
                {ex.description && (
                  <p className="text-sm text-slate-500 mb-4">{ex.description}</p>
                )}

                {/* Usage Info */}
                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Usado em treinos:</span>
                    <span className="font-bold">{usageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Alunos usando:</span>
                    <span className="font-bold">{studentsUsing.length}</span>
                  </div>
                </div>

                {/* View Students Button */}
                {studentsUsing.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => {
                      // Navigate to students page
                      navigate('/students');
                      toast.info(`${studentsUsing.length} aluno(s) usando este exercício`);
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Ver Alunos
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">
              {searchTerm ? 'Nenhum exercício encontrado' : 'Nenhum exercício cadastrado'}
            </p>
            <p className="text-slate-500 text-sm">
              {searchTerm ? 'Tente buscar com outros termos' : 'Comece criando seu primeiro exercício'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExercisesManagement;