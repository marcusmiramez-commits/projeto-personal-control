import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Sparkles, Check, ExternalLink, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const Billing = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const flag = params.get('status');
    if (flag === 'success') {
      toast.success('Assinatura confirmada! Sincronizando... 🎉');
      // Tenta sincronizar com Stripe (fallback caso webhook ainda não esteja configurado)
      (async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.post(`${API}/billing/sync`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) {
          // silencioso
        }
        // Sempre re-busca o status depois
        fetchStatus();
        // Limpa o query param da URL
        window.history.replaceState({}, '', '/billing');
      })();
    }
    if (flag === 'cancel') toast.info('Compra cancelada. Você pode escolher outro plano quando quiser.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/billing/status`, { headers: { Authorization: `Bearer ${token}` } });
      setStatus(res.data);
    } catch {
      toast.error('Erro ao carregar status da assinatura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const startCheckout = async (plan) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API}/billing/checkout`,
        { plan, origin_url: window.location.origin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao iniciar checkout');
      setSubmitting(false);
    }
  };

  const openPortal = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API}/billing/portal`,
        { origin_url: window.location.origin },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      window.location.href = res.data.portal_url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao abrir portal');
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return iso; }
  };

  const daysLeftInTrial = () => {
    if (!status?.trial_ends_at) return null;
    const ms = new Date(status.trial_ends_at).getTime() - Date.now();
    if (ms < 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const subStatus = status?.subscription_status;
  const isLifetime = status?.is_lifetime_admin;
  const isActive = subStatus === 'active' || subStatus === 'trialing' || isLifetime;
  const trialDays = daysLeftInTrial();

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  // Status bar contextual
  const renderStatus = () => {
    if (isLifetime) {
      return (
        <div className="glass rounded-2xl p-6 border border-emerald-200 bg-emerald-50/50 mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-600" />
            <div>
              <h2 className="text-lg font-bold text-emerald-900">Acesso vitalício (Admin)</h2>
              <p className="text-sm text-emerald-700">Sua conta é administradora e tem acesso completo sem assinatura.</p>
            </div>
          </div>
        </div>
      );
    }
    if (subStatus === 'trialing') {
      return (
        <div className="glass rounded-2xl p-6 border border-amber-200 bg-amber-50/40 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-amber-600" />
              <div>
                <h2 className="text-lg font-bold text-amber-900">Você está no período de teste grátis</h2>
                <p className="text-sm text-amber-800">{trialDays > 0 ? `${trialDays} dia(s) restantes` : 'Termina hoje'} — cobrança a partir de {formatDate(status?.trial_ends_at)}</p>
              </div>
            </div>
            <Button onClick={openPortal} variant="outline" disabled={submitting} data-testid="manage-subscription-button">
              <CreditCard className="w-4 h-4 mr-2" /> Gerenciar assinatura
            </Button>
          </div>
        </div>
      );
    }
    if (subStatus === 'active') {
      return (
        <div className="glass rounded-2xl p-6 border border-emerald-200 bg-emerald-50/50 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-emerald-900">Assinatura ativa</h2>
                <p className="text-sm text-emerald-800">Plano {status?.subscription_plan === 'yearly' ? 'Anual' : 'Mensal'} • Próxima cobrança em {formatDate(status?.current_period_end)}</p>
              </div>
            </div>
            <Button onClick={openPortal} variant="outline" disabled={submitting} data-testid="manage-subscription-button">
              <CreditCard className="w-4 h-4 mr-2" /> Gerenciar assinatura
            </Button>
          </div>
        </div>
      );
    }
    if (subStatus === 'past_due' || subStatus === 'unpaid') {
      return (
        <div className="glass rounded-2xl p-6 border border-red-300 bg-red-50/50 mb-8">
          <h2 className="text-lg font-bold text-red-900">Pagamento pendente</h2>
          <p className="text-sm text-red-800 mb-3">Seu último pagamento não foi processado. Atualize seu cartão para continuar.</p>
          <Button onClick={openPortal} className="bg-red-600 hover:bg-red-700" disabled={submitting}>
            <CreditCard className="w-4 h-4 mr-2" /> Atualizar pagamento
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            {isActive ? 'Sua ' : 'Assine o '}
            <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Personal Control</span>
          </h1>
          <p className="text-slate-600 mt-3 text-base">
            {isActive ? 'Veja os detalhes do seu plano' : '31 dias grátis pra testar. Cancele quando quiser.'}
          </p>
        </div>

        {renderStatus()}

        {!isActive && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Plano Mensal */}
            <div className="glass rounded-3xl p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-all" data-testid="plan-monthly">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-700">Mensal</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">R$ 29</span>
                  <span className="text-xl text-slate-600">,90</span>
                  <span className="text-base text-slate-500 ml-1">/mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Cobrado mensalmente após o teste</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm text-slate-700">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Alunos ilimitados</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Agenda + Presenças + Financeiro</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Relatórios automáticos via WhatsApp</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> 31 dias grátis pra testar</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Cancele quando quiser</li>
              </ul>
              <Button
                onClick={() => startCheckout('monthly')}
                disabled={submitting}
                className="w-full h-12 bg-slate-800 hover:bg-slate-900 text-base"
                data-testid="checkout-monthly-button"
              >
                Começar teste grátis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Plano Anual */}
            <div className="glass rounded-3xl p-8 border-2 border-emerald-400 relative overflow-hidden" data-testid="plan-yearly">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                ⭐ MAIS POPULAR
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-emerald-700">Anual</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">R$ 299</span>
                  <span className="text-base text-slate-500 ml-1">/ano</span>
                </div>
                <p className="text-xs text-emerald-700 font-semibold mt-1">Equivale a R$ 24,92/mês — economize ~17%</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm text-slate-700">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> <span><b>Tudo do plano mensal</b></span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Quase 2 meses grátis</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> Preço travado por 1 ano</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 mt-0.5" /> 31 dias grátis pra testar</li>
              </ul>
              <Button
                onClick={() => startCheckout('yearly')}
                disabled={submitting}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-base"
                data-testid="checkout-yearly-button"
              >
                Começar teste grátis <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>🔒 Pagamento processado por Stripe. Não armazenamos dados do seu cartão.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Billing;
