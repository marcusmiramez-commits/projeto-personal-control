import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Trash2, Search, Edit, Image, Video, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'musculacao', label: 'Musculação', color: 'from-red-500 to-red-600' },
  { value: 'alongamento', label: 'Alongamento', color: 'from-blue-500 to-blue-600' },
  { value: 'mobilidade', label: 'Mobilidade', color: 'from-green-500 to-green-600' },
  { value: 'domesticos', label: 'Exercícios Domésticos', color: 'from-purple-500 to-purple-600' },
];

const ExercisesManagement = ({ user, onLogout }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    muscle_group: '',
    description: '',
    image_url: '',
    video_url: ''
  });

  useEffect(() => { fetchExercises(); }, []);

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/exercises`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setExercises(response.data);
    } catch (error) {
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      if (type === 'image') {
        setUploadingImage(true);
      } else {
        setUploadingVideo(true);
      }

      const response = await axios.post(`${API}/upload`, formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const fileUrl = response.data.url;
      
      if (type === 'image') {
        setFormData({ ...formData, image_url: fileUrl });
        toast.success('Imagem enviada com sucesso!');
      } else {
        setFormData({ ...formData, video_url: fileUrl });
        toast.success('Vídeo enviado com sucesso!');
      }
    } catch (error) {
      toast.error(`Erro ao enviar ${type === 'image' ? 'imagem' : 'vídeo'}`);
    } finally {
      if (type === 'image') {
        setUploadingImage(false);
      } else {
        setUploadingVideo(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/exercises`, formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('Exercício criado!');
      setIsCreateDialogOpen(false);
      setFormData({ name: '', category: '', muscle_group: '', description: '', image_url: '', video_url: '' });
      fetchExercises();
    } catch (error) {
      toast.error('Erro ao criar exercício');
    }
  };

  const handleEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group,
      description: exercise.description || '',
      image_url: exercise.image_url || '',
      video_url: exercise.video_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/exercises/${editingExercise.id}`, formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('Exercício atualizado!');
      setIsEditDialogOpen(false);
      setEditingExercise(null);
      setFormData({ name: '', category: '', muscle_group: '', description: '', image_url: '', video_url: '' });
      fetchExercises();
    } catch (error) {
      toast.error('Erro ao atualizar exercício');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Excluir "${name}"?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/exercises/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      toast.success('Exercício excluído!');
      fetchExercises();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  // Filtrar exercícios
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Agrupar por categoria
  const groupedExercises = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = filteredExercises.filter(ex => ex.category === cat.value);
    return acc;
  }, {});

  const getCategoryColor = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'from-gray-500 to-gray-600';
  };

  const getCategoryLabel = (category) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </Layout>
  );

  const ExerciseForm = ({ onSubmit, isEdit }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label>Nome do Exercício *</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          placeholder="Ex: Supino Reto"
          required 
        />
      </div>

      <div>
        <Label>Categoria *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Músculo Alvo *</Label>
        <Input 
          value={formData.muscle_group} 
          onChange={(e) => setFormData({...formData, muscle_group: e.target.value})} 
          placeholder="Ex: Peito"
          required 
        />
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
          placeholder="Como executar o exercício..."
          rows={3}
        />
      </div>

      <div>
        <Label>URL da Imagem</Label>
        <div className="flex space-x-2">
          <Image className="w-5 h-5 text-slate-400 mt-2" />
          <Input 
            value={formData.image_url} 
            onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
            placeholder="https://exemplo.com/imagem.jpg"
            type="url"
          />
        </div>
        {formData.image_url && (
          <img src={formData.image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" onError={(e) => e.target.style.display = 'none'} />
        )}
      </div>

      <div>
        <Label>URL do Vídeo</Label>
        <div className="flex space-x-2">
          <Video className="w-5 h-5 text-slate-400 mt-2" />
          <Input 
            value={formData.video_url} 
            onChange={(e) => setFormData({...formData, video_url: e.target.value})} 
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600">
        {isEdit ? 'Atualizar Exercício' : 'Criar Exercício'}
      </Button>
    </form>
  );

  return (
    <Layout user={user} onLogout={onLogout}>
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                Biblioteca de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Exercícios</span>
              </h1>
              <p className="text-slate-600 mt-2">
                {exercises.length} exercícios cadastrados
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600">
                  <Plus className="w-4 h-4 mr-2" />Novo Exercício
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Novo Exercício</DialogTitle></DialogHeader>
                <ExerciseForm onSubmit={handleSubmit} isEdit={false} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Buscar exercícios..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 'all' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({exercises.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = exercises.filter(ex => ex.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.value 
                      ? `bg-gradient-to-r ${cat.color} text-white` 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Exercises by Category */}
        {selectedCategory === 'all' ? (
          CATEGORIES.map(cat => {
            const categoryExercises = groupedExercises[cat.value];
            if (categoryExercises.length === 0) return null;

            return (
              <div key={cat.value} className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center">
                  <span className={`inline-block w-1 h-8 bg-gradient-to-b ${cat.color} rounded mr-3`}></span>
                  {cat.label}
                  <span className="ml-2 text-sm text-slate-500 font-normal">({categoryExercises.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryExercises.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">Nenhum exercício encontrado</p>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros ou buscar por outros termos</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Exercício</DialogTitle></DialogHeader>
            <ExerciseForm onSubmit={handleUpdate} isEdit={true} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

// Exercise Card Component
const ExerciseCard = ({ exercise, onEdit, onDelete }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'musculacao': 'from-red-500 to-red-600',
      'alongamento': 'from-blue-500 to-blue-600',
      'mobilidade': 'from-green-500 to-green-600',
      'domesticos': 'from-purple-500 to-purple-600',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="glass rounded-2xl p-4 border border-slate-200 hover:shadow-lg transition-all">
      {/* Image/Video Preview */}
      {exercise.image_url && (
        <img 
          src={exercise.image_url} 
          alt={exercise.name} 
          className="w-full h-32 object-cover rounded-lg mb-3"
          onError={(e) => e.target.style.display = 'none'}
        />
      )}
      {exercise.video_url && !exercise.image_url && (
        <div className="w-full h-32 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
          <Video className="w-12 h-12 text-slate-400" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{exercise.name}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getCategoryColor(exercise.category)} text-white`}>
              {exercise.muscle_group}
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(exercise)}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDelete(exercise.id, exercise.name)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

    </div>
  );
};

export default ExercisesManagement;
