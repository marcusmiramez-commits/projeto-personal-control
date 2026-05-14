import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Mail, Phone, Camera, Lock, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const ProfileSettings = ({ user, onLogout, onUserUpdate }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', logo_url: '' });
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/profile/me`, { headers: { Authorization: `Bearer ${token}` } });
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          logo_url: res.data.logo_url || ''
        });
      } catch (err) {
        toast.error('Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/profile/me`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Perfil atualizado com sucesso!');

      // Update localStorage user so name shows correctly in Layout
      const updatedUser = { ...user, name: res.data.name, email: res.data.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao atualizar perfil';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (pwdForm.new_password.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (pwdForm.new_password !== pwdForm.confirm_password) {
      toast.error('A confirmação da nova senha não confere');
      return;
    }

    setChangingPwd(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/profile/me/password`, {
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Senha alterada com sucesso!');
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao alterar senha';
      toast.error(msg);
    } finally {
      setChangingPwd(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida');
      return;
    }

    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post(`${API}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      const newUrl = res.data.url;
      setProfile(p => ({ ...p, logo_url: newUrl }));

      // Persist immediately
      await axios.put(`${API}/profile/me`, { logo_url: newUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Foto de perfil atualizada!');
    } catch (err) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const photoSrc = profile.logo_url
    ? (profile.logo_url.startsWith('http') ? profile.logo_url : `${BACKEND_URL}${profile.logo_url}`)
    : null;

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
      <div data-testid="profile-settings" className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            Meu <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Perfil</span>
          </h1>
          <p className="text-slate-600 mt-2">Edite suas informações pessoais e altere sua senha</p>
        </div>

        {/* Photo + Header card */}
        <div className="glass rounded-2xl p-6 border border-emerald-100 mb-6 flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center border-4 border-white shadow-md">
              {photoSrc ? (
                <img src={photoSrc} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-60"
              data-testid="upload-photo-button"
              aria-label="Trocar foto de perfil"
            >
              {uploadingPhoto ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              data-testid="photo-input"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-slate-600">{profile.email}</p>
          </div>
        </div>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="info" data-testid="tab-info"><User className="w-4 h-4 mr-2" />Informações</TabsTrigger>
            <TabsTrigger value="password" data-testid="tab-password"><Lock className="w-4 h-4 mr-2" />Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <form onSubmit={handleSaveProfile} className="glass rounded-2xl p-6 border border-emerald-100 space-y-5">
              <div>
                <Label>Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                    minLength={3}
                    className="pl-9"
                    data-testid="profile-name-input"
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    required
                    className="pl-9"
                    data-testid="profile-email-input"
                  />
                </div>
              </div>

              <div>
                <Label>Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    required
                    placeholder="31999999999"
                    className="pl-9"
                    data-testid="profile-phone-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
                data-testid="save-profile-button"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Salvar alterações</>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="password">
            <form onSubmit={handleChangePassword} className="glass rounded-2xl p-6 border border-emerald-100 space-y-5">
              <div>
                <Label>Senha atual</Label>
                <Input
                  type="password"
                  value={pwdForm.current_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  required
                  data-testid="current-password-input"
                />
              </div>
              <div>
                <Label>Nova senha</Label>
                <Input
                  type="password"
                  value={pwdForm.new_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="new-password-input"
                />
                <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
              </div>
              <div>
                <Label>Confirmar nova senha</Label>
                <Input
                  type="password"
                  value={pwdForm.confirm_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="confirm-password-input"
                />
              </div>

              <Button
                type="submit"
                disabled={changingPwd}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600"
                data-testid="change-password-button"
              >
                {changingPwd ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><KeyRound className="w-4 h-4 mr-2" />Alterar senha</>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
