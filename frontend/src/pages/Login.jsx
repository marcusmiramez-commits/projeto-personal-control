import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { UserCircle, Dumbbell, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('professional-login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleProfessionalLogin = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.email || !formData.password) {
      toast.error('Preencha email e senha');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login/professional`, { 
        email: formData.email.trim().toLowerCase(), 
        password: formData.password 
      });
      
      if (response.data && response.data.access_token && response.data.user) {
        toast.success(`Bem-vindo, ${response.data.user.name}!`);
        onLogin(response.data.user, response.data.access_token);
      } else {
        toast.error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      let errorMsg = 'Erro ao fazer login';
      
      if (error.response?.status === 401) {
        errorMsg = 'Email ou senha incorretos';
      } else if (error.response?.status === 500) {
        errorMsg = 'Erro no servidor. Tente novamente.';
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (!error.response) {
        errorMsg = 'Erro de conexão. Verifique sua internet.';
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register/professional`, { 
        name: formData.name.trim(), 
        email: formData.email.trim().toLowerCase(), 
        password: formData.password, 
        phone: formData.phone.trim() 
      });
      
      if (response.data && response.data.access_token && response.data.user) {
        toast.success(`Cadastro realizado! Bem-vindo, ${response.data.user.name}!`);
        onLogin(response.data.user, response.data.access_token);
      } else {
        toast.error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      let errorMsg = 'Erro ao cadastrar';
      
      if (error.response?.status === 400) {
        errorMsg = error.response.data?.detail || 'Email já cadastrado';
      } else if (error.response?.data?.detail) {
        errorMsg = error.response.data.detail;
      } else if (!error.response) {
        errorMsg = 'Erro de conexão. Verifique sua internet.';
      }
      
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Personal Control</span>
          </h1>
          <p className="text-slate-600 text-lg">Gestão completa para Personal Trainers</p>
        </div>

        <div className="glass rounded-3xl shadow-2xl p-8 border border-emerald-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="professional-login" className="rounded-lg" data-testid="tab-professional-login">
                <UserCircle className="w-4 h-4 mr-2" />Login Personal
              </TabsTrigger>
              <TabsTrigger value="professional-register" className="rounded-lg" data-testid="tab-professional-register">
                <UserPlus className="w-4 h-4 mr-2" />Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professional-login">
              <form onSubmit={handleProfessionalLogin} className="space-y-6">
                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className="pl-10 h-12" required data-testid="professional-email-input" />
                  </div>
                </div>
                <div>
                  <Label>Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input name="password" type="password" value={formData.password} onChange={handleChange} className="pl-10 h-12" required data-testid="professional-password-input" />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600" data-testid="professional-login-button">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><LogIn className="w-5 h-5 mr-2" />Entrar</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="professional-register">
              <form onSubmit={handleProfessionalRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Nome</Label><Input name="name" value={formData.name} onChange={handleChange} required data-testid="professional-register-name-input" /></div>
                  <div><Label>Telefone</Label><Input name="phone" value={formData.phone} onChange={handleChange} required data-testid="professional-register-phone-input" /></div>
                </div>
                <div><Label>Email</Label><Input name="email" type="email" value={formData.email} onChange={handleChange} required data-testid="professional-register-email-input" /></div>
                <div><Label>Senha</Label><Input name="password" type="password" value={formData.password} onChange={handleChange} required data-testid="professional-register-password-input" /></div>
                <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600" data-testid="professional-register-button">Criar Conta</Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;