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
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProfessionalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login/professional`, {
        email: formData.email,
        password: formData.password
      });
      toast.success('Login realizado com sucesso!');
      onLogin(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register/professional`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });
      toast.success('Cadastro realizado com sucesso!');
      onLogin(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login/student`, {
        email: formData.email,
        password: formData.password
      });
      toast.success('Login realizado com sucesso!');
      onLogin(response.data.user, response.data.access_token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="professional-login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" data-testid="tab-professional-login">
                <UserCircle className="w-4 h-4 mr-2" />
                Login Personal
              </TabsTrigger>
              <TabsTrigger value="professional-register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" data-testid="tab-professional-register">
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastro Personal
              </TabsTrigger>
              <TabsTrigger value="student-login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md" data-testid="tab-student-login">
                <Dumbbell className="w-4 h-4 mr-2" />
                Login Aluno
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professional-login" data-testid="professional-login-form">
              <form onSubmit={handleProfessionalLogin} className="space-y-6">
                <div>
                  <Label htmlFor="prof-email" className="text-sm font-medium text-slate-700 mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="prof-email"
                      data-testid="professional-email-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prof-password" className="text-sm font-medium text-slate-700 mb-2 block">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="prof-password"
                      data-testid="professional-password-input"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  data-testid="professional-login-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="professional-register" data-testid="professional-register-form">
              <form onSubmit={handleProfessionalRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="prof-reg-name" className="text-sm font-medium text-slate-700 mb-2 block">Nome Completo</Label>
                    <Input
                      id="prof-reg-name"
                      data-testid="professional-register-name-input"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="João Silva"
                      className="h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="prof-reg-phone" className="text-sm font-medium text-slate-700 mb-2 block">Telefone</Label>
                    <Input
                      id="prof-reg-phone"
                      data-testid="professional-register-phone-input"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(11) 99999-9999"
                      className="h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prof-reg-email" className="text-sm font-medium text-slate-700 mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="prof-reg-email"
                      data-testid="professional-register-email-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="prof-reg-password" className="text-sm font-medium text-slate-700 mb-2 block">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="prof-reg-password"
                      data-testid="professional-register-password-input"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  data-testid="professional-register-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="student-login" data-testid="student-login-form">
              <form onSubmit={handleStudentLogin} className="space-y-6">
                <div>
                  <Label htmlFor="student-email" className="text-sm font-medium text-slate-700 mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="student-email"
                      data-testid="student-email-input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="student-password" className="text-sm font-medium text-slate-700 mb-2 block">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                      id="student-password"
                      data-testid="student-password-input"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 h-12 border-slate-200 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                <Button
                  data-testid="student-login-button"
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Entrar como Aluno
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;