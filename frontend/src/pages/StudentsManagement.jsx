import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UserPlus, Search, Trash2, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StudentsManagement = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', age: '', goal: '', contract_type: 'monthly', monthly_value: '', class_balance: 0, class_value: '' });

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/students`, { headers: { Authorization: `Bearer ${token}` } });
      setStudents(response.data);
    } catch (error) {
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/students`, formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Aluno cadastrado!');
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', age: '', goal: '', contract_type: 'monthly', monthly_value: '', class_balance: 0, class_value: '' });
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este aluno?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Aluno excluído!');
      fetchStudents();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="students-management">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Gerenciar <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Alunos</span></h1><p className="text-slate-600 mt-2">Total: {students.length}</p></div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-green-600" data-testid="add-student-button"><UserPlus className="w-4 h-4 mr-2" />Novo Aluno</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Novo Aluno</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required data-testid="student-name-input" /></div>
                  <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required data-testid="student-email-input" /></div>
                  <div><Label>Senha</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required data-testid="student-password-input" /></div>
                  <div><Label>Telefone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required data-testid="student-phone-input" /></div>
                  <div><Label>Idade</Label><Input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} data-testid="student-age-input" /></div>
                  <div><Label>Contrato</Label><Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}><SelectTrigger data-testid="student-contract-type-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Mensalista</SelectItem><SelectItem value="prepaid">Pré-pago</SelectItem><SelectItem value="postpaid">Pós-pago</SelectItem></SelectContent></Select></div>
                </div>
                {formData.contract_type === 'monthly' && <div><Label>Valor Mensal</Label><Input type="number" step="0.01" value={formData.monthly_value} onChange={(e) => setFormData({...formData, monthly_value: e.target.value})} data-testid="student-monthly-value-input" /></div>}
                {formData.contract_type === 'prepaid' && <div className="grid grid-cols-2 gap-4"><div><Label>Saldo</Label><Input type="number" value={formData.class_balance} onChange={(e) => setFormData({...formData, class_balance: e.target.value})} data-testid="student-class-balance-input" /></div><div><Label>Valor/Aula</Label><Input type="number" step="0.01" value={formData.class_value} onChange={(e) => setFormData({...formData, class_value: e.target.value})} data-testid="student-class-value-input" /></div></div>}
                <div><Label>Objetivo</Label><Input value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} data-testid="student-goal-input" /></div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-green-600" data-testid="submit-student-button">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-student-input" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="glass rounded-2xl p-6 card-hover border border-emerald-100" data-testid="student-card">
              <div className="flex justify-between items-start mb-4"><div><h3 className="text-lg font-bold">{student.name}</h3><p className="text-sm text-slate-600">{student.email}</p></div><Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(student.id)} data-testid="delete-student-button"><Trash2 className="w-4 h-4" /></Button></div>
              <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-600">Telefone:</span><span className="font-semibold">{student.phone}</span></div><div className="flex justify-between text-sm"><span className="text-slate-600">Contrato:</span><span className="font-semibold capitalize">{student.contract_type}</span></div></div>
            </div>
          ))}
        </div>
        {filteredStudents.length === 0 && <div className="text-center py-12"><p className="text-slate-600">Nenhum aluno encontrado</p></div>}
      </div>
    </Layout>
  );
};

export default StudentsManagement;