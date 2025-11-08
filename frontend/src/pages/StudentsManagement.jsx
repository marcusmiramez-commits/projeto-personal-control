import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { UserPlus, Search, Trash2, Dumbbell, Send, Edit, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const StudentsManagement = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddClassesDialogOpen, setIsAddClassesDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [classesToAdd, setClassesToAdd] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', age: '', goal: '', contract_type: 'monthly', monthly_value: '', class_balance: 0, class_value: '' });
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', age: '', goal: '', contract_type: 'monthly', monthly_value: '', class_balance: 0, class_value: '' });

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
      
      // Prepare data with proper type conversion
      const studentData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        goal: formData.goal || null,
        anamnesis: formData.anamnesis || null,
        observations: formData.observations || null,
        contract_type: formData.contract_type,
        monthly_value: formData.monthly_value ? parseFloat(formData.monthly_value) : null,
        class_balance: formData.class_balance ? parseInt(formData.class_balance) : 0,
        class_value: formData.class_value ? parseFloat(formData.class_value) : null
      };
      
      await axios.post(`${API}/students`, studentData, { headers: { Authorization: `Bearer ${token}` } });
      
      // Ask if user wants to send credentials via WhatsApp
      const sendWhatsApp = window.confirm(
        `Aluno cadastrado com sucesso!\n\nDeseja enviar os dados de acesso via WhatsApp para ${formData.name}?`
      );
      
      if (sendWhatsApp) {
        sendAccessDataViaWhatsApp(formData);
      } else {
        toast.success('Aluno cadastrado com sucesso!');
      }
      
      setIsDialogOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', age: '', goal: '', contract_type: 'monthly', monthly_value: '', class_balance: 0, class_value: '' });
      fetchStudents();
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'Erro ao cadastrar aluno';
      toast.error(errorMsg);
    }
  };

  const sendAccessDataViaWhatsApp = (studentData) => {
    const message = `Olá ${studentData.name}! 👋\n\nSeu cadastro no Personal Control foi realizado com sucesso! ✅\n\n📱 *Dados de Acesso:*\n\n🔹 Email: ${studentData.email}\n🔹 Senha: ${studentData.password}\n\n🌐 *Link de acesso:*\n${window.location.origin}/login\n\n⚠️ *Importante:* Use a aba "Login Aluno" para acessar o sistema.\n\nQualquer dúvida, estou à disposição! 💪`;
    
    // Remove formatting from phone number
    const cleanPhone = studentData.phone.replace(/\D/g, '');
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('WhatsApp aberto! Envie a mensagem para o aluno.');
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

  const handleEdit = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      phone: student.phone,
      age: student.age || '',
      goal: student.goal || '',
      contract_type: student.contract_type,
      monthly_value: student.monthly_value || '',
      class_balance: student.class_balance || 0,
      class_value: student.class_value || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Prepare data with proper type conversion
      const updateData = {
        name: editFormData.name,
        phone: editFormData.phone,
        age: editFormData.age ? parseInt(editFormData.age) : null,
        goal: editFormData.goal || null,
        contract_type: editFormData.contract_type,
        monthly_value: editFormData.monthly_value ? parseFloat(editFormData.monthly_value) : null,
        class_balance: editFormData.class_balance ? parseInt(editFormData.class_balance) : 0,
        class_value: editFormData.class_value ? parseFloat(editFormData.class_value) : null
      };
      
      await axios.put(`${API}/students/${editingStudent.id}`, updateData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      toast.success('Cadastro atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Erro detalhado:', error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || 'Erro ao atualizar cadastro';
      toast.error(errorMsg);
    }
  };

  const handleAddClasses = async (e) => {
    e.preventDefault();
    
    const classesNum = parseInt(classesToAdd);
    if (!classesNum || classesNum <= 0) {
      toast.error('Informe uma quantidade válida de aulas');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/students/${editingStudent.id}/add-classes`,
        { classes: classesNum },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      setIsAddClassesDialogOpen(false);
      setClassesToAdd('');
      fetchStudents();
      
      // Update editFormData to reflect new balance
      setEditFormData({
        ...editFormData,
        class_balance: response.data.new_balance
      });
    } catch (error) {
      console.error('Erro ao adicionar aulas:', error);
      toast.error('Erro ao adicionar aulas');
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <Layout user={user} onLogout={onLogout}><div className="flex items-center justify-center min-h-[400px]"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div></Layout>;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="students-management">
        <div className="flex justify-between items-center mb-8">
          <div><h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Gerenciar <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Alunos</span></h1><p className="text-slate-600 mt-2">Total: {students.length}</p></div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (open) {
              // Limpar formulário ao abrir
              setFormData({ 
                name: '', 
                email: '', 
                password: '', 
                phone: '', 
                age: '', 
                goal: '', 
                contract_type: 'monthly', 
                monthly_value: '', 
                class_balance: 0, 
                class_value: '' 
              });
            }
          }}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-emerald-500 to-green-600" data-testid="add-student-button"><UserPlus className="w-4 h-4 mr-2" />Novo Aluno</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Novo Aluno</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      minLength={3}
                      data-testid="student-name-input" 
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      required 
                      data-testid="student-email-input" 
                    />
                  </div>
                  <div>
                    <Label>Senha *</Label>
                    <Input 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({...formData, password: e.target.value})} 
                      required 
                      minLength={6}
                      data-testid="student-password-input" 
                    />
                  </div>
                  <div>
                    <Label>Telefone *</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      required 
                      placeholder="11999999999"
                      data-testid="student-phone-input" 
                    />
                  </div>
                  <div>
                    <Label>Idade</Label>
                    <Input 
                      type="number" 
                      value={formData.age} 
                      onChange={(e) => setFormData({...formData, age: e.target.value})} 
                      min="1"
                      max="120"
                      data-testid="student-age-input" 
                    />
                  </div>
                  <div>
                    <Label>Tipo de Contrato *</Label>
                    <Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                      <SelectTrigger data-testid="student-contract-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensalista</SelectItem>
                        <SelectItem value="prepaid">Pré-pago</SelectItem>
                        <SelectItem value="postpaid">Pós-pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.contract_type === 'monthly' && (
                  <div>
                    <Label>Valor Mensal (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={formData.monthly_value} 
                      onChange={(e) => setFormData({...formData, monthly_value: e.target.value})} 
                      placeholder="600.00"
                      data-testid="student-monthly-value-input" 
                    />
                  </div>
                )}
                {formData.contract_type === 'prepaid' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Saldo de Aulas</Label>
                      <Input 
                        type="number" 
                        min="0"
                        value={formData.class_balance} 
                        onChange={(e) => setFormData({...formData, class_balance: e.target.value})} 
                        placeholder="10"
                        data-testid="student-class-balance-input" 
                      />
                    </div>
                    <div>
                      <Label>Valor por Aula (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        value={formData.class_value} 
                        onChange={(e) => setFormData({...formData, class_value: e.target.value})} 
                        placeholder="50.00"
                        data-testid="student-class-value-input" 
                      />
                    </div>
                  </div>
                )}
                <div>
                  <Label>Objetivo</Label>
                  <Input 
                    value={formData.goal} 
                    onChange={(e) => setFormData({...formData, goal: e.target.value})} 
                    placeholder="Ex: Emagrecimento, ganho de massa..."
                    data-testid="student-goal-input" 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700" 
                  data-testid="submit-student-button"
                >
                  Cadastrar Aluno
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="mb-6"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" data-testid="search-student-input" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="glass rounded-2xl p-6 card-hover border border-emerald-100" data-testid="student-card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{student.name}</h3>
                  <p className="text-sm text-slate-600">{student.email}</p>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-blue-50 hover:text-blue-600" 
                    onClick={() => handleEdit(student)} 
                    data-testid="edit-student-button"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="hover:bg-red-50 hover:text-red-600" 
                    onClick={() => handleDelete(student.id)} 
                    data-testid="delete-student-button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Telefone:</span>
                  <span className="font-semibold">{student.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Contrato:</span>
                  <span className="font-semibold capitalize">{student.contract_type}</span>
                </div>
                {student.contract_type === 'prepaid' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Saldo:</span>
                    <span className="font-semibold">{student.class_balance} aulas</span>
                  </div>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => navigate(`/students/${student.id}/workouts`)} 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  data-testid="view-workouts-button"
                >
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Treinos
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const message = `Olá ${student.name}! 👋\n\n📱 *Lembrete - Dados de Acesso Personal Control*\n\n🔹 Email: ${student.email}\n🔹 Senha: (use a senha cadastrada)\n\n🌐 *Link de acesso:*\n${window.location.origin}/login\n\n⚠️ Use a aba "Login Aluno" para acessar.\n\nNos vemos no treino! 💪`;
                    const cleanPhone = student.phone.replace(/\D/g, '');
                    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                    toast.success('WhatsApp aberto!');
                  }}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                  data-testid="send-whatsapp-button"
                >
                  <Send className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          ))}
        </div>
        {filteredStudents.length === 0 && <div className="text-center py-12"><p className="text-slate-600">Nenhum aluno encontrado</p></div>}
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cadastro - {editingStudent?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4" data-testid="edit-student-form">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Email:</strong> {editingStudent?.email}
              </p>
              <p className="text-xs text-blue-600 mt-1">O email não pode ser alterado pois é usado para login</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                  minLength={3}
                  data-testid="edit-student-name-input"
                />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  required
                  placeholder="11999999999"
                  data-testid="edit-student-phone-input"
                />
              </div>
              <div>
                <Label>Idade</Label>
                <Input
                  type="number"
                  value={editFormData.age}
                  onChange={(e) => setEditFormData({...editFormData, age: e.target.value})}
                  min="1"
                  max="120"
                  data-testid="edit-student-age-input"
                />
              </div>
              <div>
                <Label>Tipo de Contrato *</Label>
                <Select value={editFormData.contract_type} onValueChange={(value) => setEditFormData({...editFormData, contract_type: value})}>
                  <SelectTrigger data-testid="edit-student-contract-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensalista</SelectItem>
                    <SelectItem value="prepaid">Pré-pago</SelectItem>
                    <SelectItem value="postpaid">Pós-pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editFormData.contract_type === 'monthly' && (
              <div>
                <Label>Valor Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.monthly_value}
                  onChange={(e) => setEditFormData({...editFormData, monthly_value: e.target.value})}
                  placeholder="600.00"
                  data-testid="edit-student-monthly-value-input"
                />
              </div>
            )}

            {editFormData.contract_type === 'prepaid' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Saldo de Aulas</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.class_balance}
                    onChange={(e) => setEditFormData({...editFormData, class_balance: e.target.value})}
                    placeholder="10"
                    data-testid="edit-student-class-balance-input"
                  />
                </div>
                <div>
                  <Label>Valor por Aula (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editFormData.class_value}
                    onChange={(e) => setEditFormData({...editFormData, class_value: e.target.value})}
                    placeholder="50.00"
                    data-testid="edit-student-class-value-input"
                  />
                </div>
              </div>
            )}

            {editFormData.contract_type === 'postpaid' && (
              <div>
                <Label>Valor por Aula (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.class_value}
                  onChange={(e) => setEditFormData({...editFormData, class_value: e.target.value})}
                  placeholder="50.00"
                  data-testid="edit-student-postpaid-class-value-input"
                />
              </div>
            )}

            <div>
              <Label>Objetivo</Label>
              <Input
                value={editFormData.goal}
                onChange={(e) => setEditFormData({...editFormData, goal: e.target.value})}
                placeholder="Ex: Emagrecimento, ganho de massa..."
                data-testid="edit-student-goal-input"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
                data-testid="cancel-edit-button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                data-testid="submit-edit-button"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default StudentsManagement;