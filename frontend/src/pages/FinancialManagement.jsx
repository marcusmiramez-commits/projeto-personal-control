import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DollarSign, CheckCircle, AlertCircle, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const FinancialManagement = ({ user, onLogout }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    fetchReport();
  }, [currentMonth, currentYear]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      const response = await axios.get(`${API}/financial/report?month=${monthStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setReport(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório financeiro');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setLoading(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      
      const response = await axios.post(`${API}/payments`, {
        student_id: selectedStudent.student_id,
        amount: parseFloat(paymentAmount),
        payment_date: new Date().toISOString().split('T')[0],
        reference_month: monthStr,
        payment_method: 'manual'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Show success message with classes added info if applicable
      if (response.data.classes_added > 0) {
        toast.success(`${response.data.message}`, { duration: 4000 });
      } else {
        toast.success('Pagamento registrado com sucesso!');
      }
      
      setIsPaymentDialogOpen(false);
      setPaymentAmount('');
      fetchReport();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    }
  };

  const openPaymentDialog = (student) => {
    setSelectedStudent(student);
    setPaymentAmount(student.expected_amount.toString());
    setIsPaymentDialogOpen(true);
  };

  const exportReport = () => {
    if (!report) return;
    
    let csv = 'Aluno,Tipo Contrato,Aulas,Esperado,Recebido,Status\n';
    
    report.students.forEach(student => {
      csv += `${student.student_name},${student.contract_type},${student.classes_count},${student.expected_amount.toFixed(2)},${student.paid_amount.toFixed(2)},${student.payment_status}\n`;
    });
    
    csv += `\nTotal,,${report.students.reduce((acc, s) => acc + s.classes_count, 0)},${report.total_expected.toFixed(2)},${report.total_received.toFixed(2)},\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_financeiro_${months[currentMonth]}_${currentYear}.csv`;
    a.click();
    toast.success('Relatório exportado!');
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

  // Prepare chart data
  const chartData = report?.students.map(s => ({
    name: s.student_name.split(' ')[0],
    Esperado: s.expected_amount,
    Recebido: s.paid_amount
  })) || [];

  const pieData = [
    { name: 'Recebido', value: report?.total_received || 0, color: '#10b981' },
    { name: 'Pendente', value: report?.total_pending || 0, color: '#ef4444' }
  ];

  const paidCount = report?.students.filter(s => s.payment_status === 'paid').length || 0;
  const pendingCount = report?.students.filter(s => s.payment_status === 'pending').length || 0;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="financial-management">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Gestão <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Financeira</span>
            </h1>
            <p className="text-slate-600 mt-2">Controle de receitas e pagamentos</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => changeMonth(-1)} data-testid="prev-month-button">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 bg-white border rounded-lg font-semibold min-w-[200px] text-center">
              {months[currentMonth]} {currentYear}
            </div>
            <Button variant="outline" onClick={() => changeMonth(1)} data-testid="next-month-button">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button onClick={exportReport} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" data-testid="export-report-button">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="total-expected-card">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Esperado</p>
            <p className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Space Grotesk' }}>
              R$ {report?.total_expected.toFixed(2)}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="total-received-card">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Recebido</p>
            <p className="text-3xl font-bold text-emerald-600" style={{ fontFamily: 'Space Grotesk' }}>
              R$ {report?.total_received.toFixed(2)}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="total-pending-card">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Total Pendente</p>
            <p className="text-3xl font-bold text-red-600" style={{ fontFamily: 'Space Grotesk' }}>
              R$ {report?.total_pending.toFixed(2)}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100" data-testid="payment-status-card">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-slate-600 mb-1">Status de Pagamento</p>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-emerald-600">{paidCount} pagos</span>
              <span className="text-slate-400">|</span>
              <span className="text-xl font-bold text-red-600">{pendingCount} pendentes</span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Receita por Aluno</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Esperado" fill="#3b82f6" />
                <Bar dataKey="Recebido" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass rounded-2xl p-6 border border-emerald-100">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Distribuição de Pagamentos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela de Alunos */}
        <div className="glass rounded-2xl p-6 border border-emerald-100">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Detalhamento por Aluno</h2>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="financial-table">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 font-semibold">Aluno</th>
                  <th className="text-left p-3 font-semibold">Contrato</th>
                  <th className="text-center p-3 font-semibold">Aulas</th>
                  <th className="text-right p-3 font-semibold">Esperado</th>
                  <th className="text-right p-3 font-semibold">Recebido</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-center p-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {report?.students.map((student) => (
                  <tr key={student.student_id} className="border-b border-slate-100 hover:bg-slate-50" data-testid="student-financial-row">
                    <td className="p-3 font-semibold">{student.student_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">
                        {student.contract_type}
                      </span>
                    </td>
                    <td className="p-3 text-center">{student.classes_count}</td>
                    <td className="p-3 text-right font-semibold text-blue-600">
                      R$ {student.expected_amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600">
                      R$ {student.paid_amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      {student.payment_status === 'paid' ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold flex items-center justify-center" data-testid="status-paid">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pago
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold flex items-center justify-center" data-testid="status-pending">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => openPaymentDialog(student)}
                        className="bg-gradient-to-r from-emerald-500 to-green-600"
                        data-testid="register-payment-button"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Registrar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Registro de Pagamento */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento - {selectedStudent?.student_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-blue-600 font-semibold">Tipo:</p>
                  <p className="capitalize">{selectedStudent?.contract_type}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Aulas:</p>
                  <p>{selectedStudent?.classes_count}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Esperado:</p>
                  <p>R$ {selectedStudent?.expected_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-blue-600 font-semibold">Já Pago:</p>
                  <p>R$ {selectedStudent?.paid_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Valor do Pagamento (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                required
                data-testid="payment-amount-input"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600"
                data-testid="confirm-payment-button"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default FinancialManagement;