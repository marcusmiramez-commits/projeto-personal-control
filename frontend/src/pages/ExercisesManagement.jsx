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
      fetchExercises();
    } catch (error) {
      toast.error('Erro');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/exercises/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Excluído!');
      fetchExercises();
    } catch (error) {
      toast.error('Erro');
    }
  };

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="exercises-management">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Biblioteca de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Exercícios</span></h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-green-600" data-testid="add-exercise-button"><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Exercício</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required data-testid="exercise-name-input" /></div>
                <div><Label>Grupo Muscular</Label><Input value={formData.muscle_group} onChange={(e) => setFormData({...formData, muscle_group: e.target.value})} required data-testid="exercise-muscle-group-input" /></div>
                <div><Label>Descrição</Label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} data-testid="exercise-description-input" /></div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600" data-testid="submit-exercise-button">Criar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <div key={ex.id} className="glass rounded-xl p-6 border border-emerald-100" data-testid="exercise-card">
              <div className="flex justify-between items-start mb-2"><h3 className="font-bold">{ex.name}</h3><Button size="sm" variant="ghost" onClick={() => handleDelete(ex.id)} data-testid="delete-exercise-button"><Trash2 className="w-4 h-4" /></Button></div>
              <p className="text-sm text-slate-600">{ex.muscle_group}</p>
              {ex.description && <p className="text-xs text-slate-500 mt-2">{ex.description}</p>}
            </div>
          ))}
        </div>
        {exercises.length === 0 && <div className="text-center py-12"><p className="text-slate-600">Nenhum exercício cadastrado</p></div>}
      </div>
    </Layout>
  );
};

export default ExercisesManagement;