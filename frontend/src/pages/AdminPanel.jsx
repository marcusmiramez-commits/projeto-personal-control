import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Shield, CheckCircle2, AlertOctagon, Ban, KeyRound, Trash2, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';

const statusMeta = {
  pending: { label: 'Aguardando aprovação', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  active: { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  suspended: { label: 'Suspenso', cls: 'bg-orange-100 text-orange-800 border-orange-300' },
  blocked: { label: 'Bloqueado (inadimplente)', cls: 'bg-red-100 text-red-800 border-red-300' },
};

const AdminPanel = ({ user, onLogout }) => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // dialogs
  const [statusDialog, setStatusDialog] = useState({ open: false, prof: null, newStatus: '', reason: '' });
  const [pwdDialog, setPwdDialog] = useState({ open: false, prof: null, newPassword: '' });

  useEffect(() => { fetchProfessionals(); }, []);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/admin/professionals`, { headers: { Authorization: `Bearer ${token}` } });
      setProfessionals(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao carregar cadastros');
    } finally {
      setLoading(false);
    }
  };

  const openStatusDialog = (prof, newStatus) => {
    setStatusDialog({ open: true, prof, newStatus, reason: prof.status_reason || '' });
  };

  const handleConfirmStatus = async () => {
    const { prof, newStatus, reason } = statusDialog;
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/professionals/${prof.id}/status`,
        { status: newStatus, reason: reason || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status atualizado com sucesso');
      setStatusDialog({ open: false, prof: null, newStatus: '', reason: '' });
      fetchProfessionals();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao atualizar status');
    }
  };

  const handleResetPassword = async () => {
    const { prof, newPassword } = pwdDialog;
    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin/professionals/${prof.id}/password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Senha de ${prof.name} redefinida`);
      setPwdDialog({ open: false, prof: null, newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao redefinir senha');
    }
  };

  const handleDelete = async (prof) => {
    if (!window.confirm(`Excluir DEFINITIVAMENTE o cadastro de ${prof.name}?\n\nIsso vai apagar TODOS os dados dele (alunos, agenda, financeiro). Esta ação não pode ser desfeita.`)) return;
    if (!window.confirm(`Tem certeza absoluta? Digite OK no próximo prompt para confirmar.`)) return;
    const confirm = window.prompt('Digite EXCLUIR para confirmar:');
    if (confirm !== 'EXCLUIR') {
      toast.info('Operação cancelada');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/professionals/${prof.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Cadastro excluído');
      fetchProfessionals();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const filtered = professionals.filter(p => filter === 'all' ? true : p.status === filter);
  const counts = {
    all: professionals.length,
    pending: professionals.filter(p => p.status === 'pending').length,
    active: professionals.filter(p => p.status === 'active').length,
    suspended: professionals.filter(p => p.status === 'suspended').length,
    blocked: professionals.filter(p => p.status === 'blocked').length,
  };

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
      <div data-testid="admin-panel">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk' }}>
              <Shield className="w-9 h-9 text-emerald-600" />
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Administração</span>
            </h1>
            <p className="text-slate-600 mt-2">Controle de cadastros de profissionais — ativação, suspensão e bloqueio por inadimplência</p>
            <p className="text-xs text-slate-500 mt-1 italic">⚠️ Por ética, dados de alunos/financeiro/agenda dos profissionais não são acessíveis aqui.</p>
          </div>
          <Button variant="outline" onClick={fetchProfessionals} data-testid="refresh-admin-button">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { key: 'all', label: 'Todos', count: counts.all },
            { key: 'pending', label: 'Pendentes', count: counts.pending },
            { key: 'active', label: 'Ativos', count: counts.active },
            { key: 'suspended', label: 'Suspensos', count: counts.suspended },
            { key: 'blocked', label: 'Bloqueados', count: counts.blocked },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`p-3 rounded-xl border transition-all text-left ${filter === f.key ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'glass border-emerald-100 hover:border-emerald-300'}`}
              data-testid={`filter-${f.key}`}
            >
              <div className="text-xs opacity-80">{f.label}</div>
              <div className="text-2xl font-bold">{f.count}</div>
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">Nenhum cadastro nesta categoria</div>
          )}
          {filtered.map(prof => {
            const meta = statusMeta[prof.status] || statusMeta.active;
            const isMe = prof.id === user.id;
            return (
              <div key={prof.id} className="glass rounded-2xl p-5 border border-emerald-100" data-testid={`prof-row-${prof.id}`}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold">{prof.name}</h3>
                      {prof.role === 'admin' && <Badge className="bg-emerald-600">ADMIN</Badge>}
                      {isMe && <Badge variant="outline">você</Badge>}
                      <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-600 space-y-0.5">
                      <div>📧 {prof.email}</div>
                      <div>📱 {prof.phone}</div>
                      <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {prof.student_count} aluno{prof.student_count === 1 ? '' : 's'} cadastrado{prof.student_count === 1 ? '' : 's'}</div>
                      {prof.status_reason && (
                        <div className="text-xs text-slate-500 italic mt-1">Motivo: {prof.status_reason}</div>
                      )}
                      <div className="text-xs text-slate-400">Cadastrado em {new Date(prof.created_at).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {prof.status !== 'active' && (
                      <Button size="sm" onClick={() => openStatusDialog(prof, 'active')} className="bg-emerald-600 hover:bg-emerald-700" data-testid={`activate-${prof.id}`}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Ativar
                      </Button>
                    )}
                    {prof.status === 'active' && !isMe && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openStatusDialog(prof, 'suspended')} className="border-orange-300 text-orange-700 hover:bg-orange-50" data-testid={`suspend-${prof.id}`}>
                          <AlertOctagon className="w-4 h-4 mr-1" /> Suspender
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openStatusDialog(prof, 'blocked')} className="border-red-300 text-red-700 hover:bg-red-50" data-testid={`block-${prof.id}`}>
                          <Ban className="w-4 h-4 mr-1" /> Bloquear
                        </Button>
                      </>
                    )}
                    {!isMe && (
                      <Button size="sm" variant="outline" onClick={() => setPwdDialog({ open: true, prof, newPassword: '' })} data-testid={`reset-pwd-${prof.id}`}>
                        <KeyRound className="w-4 h-4 mr-1" /> Senha
                      </Button>
                    )}
                    {!isMe && (
                      <Button size="sm" variant="outline" onClick={() => handleDelete(prof)} className="border-red-400 text-red-700 hover:bg-red-50" data-testid={`delete-${prof.id}`}>
                        <Trash2 className="w-4 h-4 mr-1" /> Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dialog: Alterar status */}
        <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog(s => ({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {statusDialog.newStatus === 'active' && 'Ativar cadastro'}
                {statusDialog.newStatus === 'suspended' && 'Suspender cadastro'}
                {statusDialog.newStatus === 'blocked' && 'Bloquear por inadimplência'}
                {statusDialog.newStatus === 'pending' && 'Marcar como pendente'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-600">
                {statusDialog.prof?.name} ({statusDialog.prof?.email})
              </p>
              {(statusDialog.newStatus === 'suspended' || statusDialog.newStatus === 'blocked') && (
                <div>
                  <Label>Motivo (será exibido no login)</Label>
                  <Textarea
                    value={statusDialog.reason}
                    onChange={(e) => setStatusDialog(s => ({ ...s, reason: e.target.value }))}
                    placeholder={statusDialog.newStatus === 'blocked' ? 'Ex: Pagamento da mensalidade em atraso há 15 dias.' : 'Ex: Conta suspensa por uso indevido.'}
                    rows={3}
                    data-testid="status-reason-input"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialog({ open: false, prof: null, newStatus: '', reason: '' })}>Cancelar</Button>
              <Button onClick={handleConfirmStatus} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-status-button">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Resetar senha */}
        <Dialog open={pwdDialog.open} onOpenChange={(open) => setPwdDialog(s => ({ ...s, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Redefinir senha de {pwdDialog.prof?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-600">Essa nova senha substituirá a atual. Avise o profissional pelo WhatsApp.</p>
              <div>
                <Label>Nova senha (mín. 6 caracteres)</Label>
                <Input
                  type="text"
                  value={pwdDialog.newPassword}
                  onChange={(e) => setPwdDialog(s => ({ ...s, newPassword: e.target.value }))}
                  placeholder="ex: NovaSenha123"
                  data-testid="admin-new-password-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPwdDialog({ open: false, prof: null, newPassword: '' })}>Cancelar</Button>
              <Button onClick={handleResetPassword} className="bg-emerald-600 hover:bg-emerald-700" data-testid="confirm-reset-password">Redefinir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPanel;
