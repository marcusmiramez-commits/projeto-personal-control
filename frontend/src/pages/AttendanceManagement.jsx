import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Save, Download, ChevronLeft, ChevronRight, UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const AttendanceManagement = ({ user, onLogout }) => {
  const [students, setStudents] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    fetchData();
  }, [currentMonth, currentYear]);

  // Auto-refresh DESABILITADO para evitar sobrescrever mudanças do usuário
  // O usuário pode mudar de mês para forçar refresh manual se necessário

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Buscar alunos
      const studentsRes = await axios.get(`${API}/students`, { headers });
      setStudents(studentsRes.data);
      
      // Buscar presenças do mês
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const attendanceRes = await axios.get(`${API}/attendance?month=${monthStr}`, { headers });
      
      // Criar mapa de presenças
      const attendanceMap = {};
      attendanceRes.data.forEach(att => {
        const key = `${att.student_id}_${att.date}`;
        attendanceMap[key] = att.present;
      });
      
      // Criar linhas de presença (iniciar com alunos cadastrados)
      const rows = studentsRes.data.map(student => ({
        studentId: student.id,
        studentName: student.name,
        attendance: {}
      }));
      
      // Adicionar linhas vazias se necessário
      while (rows.length < 10) {
        rows.push({
          studentId: null,
          studentName: '',
          attendance: {}
        });
      }
      
      // Preencher dados de presença
      rows.forEach(row => {
        days.forEach(day => {
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const key = `${row.studentId}_${dateStr}`;
          row.attendance[day] = attendanceMap[key];
        });
      });
      
      setAttendanceRows(rows);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (rowIndex, day, isRightClick = false) => {
    const row = attendanceRows[rowIndex];
    
    // Se não tem aluno associado, não faz nada
    if (!row.studentId) {
      toast.error('Adicione um aluno a esta linha primeiro');
      return;
    }
    
    const currentValue = row.attendance[day];
    let newValue;
    
    if (isRightClick) {
      // Click direito: falta (false) ou limpar
      newValue = currentValue === false ? undefined : false;
    } else {
      // Click esquerdo: presença (true) ou limpar
      newValue = currentValue === true ? undefined : true;
    }
    
    // Atualizar estado local IMEDIATAMENTE
    const newRows = [...attendanceRows];
    newRows[rowIndex].attendance[day] = newValue;
    setAttendanceRows(newRows);
    
    // Salvar no backend de forma assíncrona
    setSaving(true);
    const token = localStorage.getItem('token');
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    try {
      if (newValue !== undefined) {
        // Salvar presença/falta
        await axios.post(`${API}/attendance`, {
          student_id: row.studentId,
          date: dateStr,
          present: newValue
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Atualizar timestamp de último salvamento
        setLastSaved(new Date());
        console.log(`✓ Salvo: ${row.studentName} - Dia ${day} - ${newValue ? 'Presente' : 'Falta'}`);
      } else {
        // DELETAR presença do backend quando desmarcar
        await axios.delete(`${API}/attendance/${row.studentId}/${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setLastSaved(new Date());
        console.log(`✓ Deletado: ${row.studentName} - Dia ${day}`);
      }
    } catch (error) {
      console.error('Erro ao salvar presença:', error);
      
      // Reverter mudança local em caso de erro
      const revertRows = [...attendanceRows];
      revertRows[rowIndex].attendance[day] = currentValue;
      setAttendanceRows(revertRows);
      
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleStudentNameChange = (rowIndex, studentId) => {
    const newRows = [...attendanceRows];
    const student = students.find(s => s.id === studentId);
    if (student) {
      newRows[rowIndex].studentId = student.id;
      newRows[rowIndex].studentName = student.name;
      setAttendanceRows(newRows);
    }
  };

  const addEmptyRow = () => {
    setAttendanceRows([...attendanceRows, {
      studentId: null,
      studentName: '',
      attendance: {}
    }]);
  };

  const removeRow = (rowIndex) => {
    const newRows = attendanceRows.filter((_, index) => index !== rowIndex);
    setAttendanceRows(newRows);
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
  };

  const exportToCSV = () => {
    let csv = 'Nome,' + days.join(',') + '\n';
    
    attendanceRows.forEach(row => {
      if (row.studentName) {
        const line = [row.studentName];
        days.forEach(day => {
          const val = row.attendance[day];
          line.push(val === true ? 'P' : val === false ? 'F' : '');
        });
        csv += line.join(',') + '\n';
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presencas_${months[currentMonth]}_${currentYear}.csv`;
    a.click();
    toast.success('Arquivo CSV exportado!');
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
      <div data-testid="attendance-management">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
              Controle de <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Presenças</span>
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <p className="text-slate-600">Click esquerdo: ✓ Presença | Click direito: ✗ Falta</p>
              <div className="flex items-center space-x-2">
                {saving ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Salvando...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Save className="w-4 h-4" />
                    <span className="text-sm">Salvo automaticamente às {lastSaved.toLocaleTimeString('pt-BR')}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-2">
            <div className="flex items-center space-x-2 justify-center">
              <Button variant="outline" onClick={() => changeMonth(-1)} size="sm" data-testid="prev-month-button">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-3 md:px-4 py-2 bg-white border rounded-lg font-semibold text-sm md:text-base min-w-[160px] md:min-w-[200px] text-center">
                {months[currentMonth]} {currentYear}
              </div>
              <Button variant="outline" onClick={() => changeMonth(1)} size="sm" data-testid="next-month-button">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setLoading(true);
                  fetchData();
                  toast.success('Dados atualizados!');
                }} 
                variant="outline" 
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 flex-1 md:flex-none text-sm" 
                data-testid="refresh-button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Atualizar</span>
              </Button>
              <Button onClick={exportToCSV} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 flex-1 md:flex-none text-sm" data-testid="export-button">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Exportar CSV</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-2 md:p-6 border border-emerald-100 overflow-x-auto shadow-inner">
          <div className="overflow-x-scroll">
            <table className="w-full border-collapse min-w-max" data-testid="attendance-table">
              <thead>
                <tr>
                  <th className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-1 md:p-3 border border-slate-600 font-bold sticky left-0 z-10 min-w-[80px] md:min-w-[200px] text-[10px] md:text-base leading-tight">
                    NOME
                  </th>
                  {days.map(day => (
                    <th key={day} className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-0.5 md:p-3 border border-blue-500 font-bold text-center min-w-[26px] md:min-w-[40px] text-[10px] md:text-base">
                      {day}
                    </th>
                  ))}
                  <th className="bg-gradient-to-br from-slate-700 to-slate-800 text-white p-1 md:p-3 border border-slate-600 font-bold text-center min-w-[40px] md:min-w-[60px] text-[10px] md:text-base">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-1 md:p-2 border border-blue-500 sticky left-0 z-10">
                      {row.studentId ? (
                        <div className="font-semibold px-1 md:px-2 text-xs md:text-base">{row.studentName}</div>
                      ) : (
                        <Select onValueChange={(value) => handleStudentNameChange(rowIndex, value)}>
                          <SelectTrigger className="bg-white text-slate-900 border-0 h-7 md:h-8 text-xs md:text-base">
                            <SelectValue placeholder="Selecionar aluno..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.filter(s => !attendanceRows.some(r => r.studentId === s.id)).map(student => (
                              <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    {days.map(day => {
                      const value = row.attendance[day];
                      let bgColor = 'bg-blue-50';
                      let content = '';
                      
                      if (value === true) {
                        bgColor = 'bg-green-100';
                        content = '✓';
                      } else if (value === false) {
                        bgColor = 'bg-red-100';
                        content = '✗';
                      }
                      
                      return (
                        <td
                          key={day}
                          className={`${bgColor} p-1 md:p-2 border border-blue-200 text-center cursor-pointer hover:opacity-70 transition-opacity`}
                          onClick={() => handleCellClick(rowIndex, day, false)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleCellClick(rowIndex, day, true);
                          }}
                          data-testid={`attendance-cell-${rowIndex}-${day}`}
                        >
                          <span className="text-sm md:text-lg font-bold">{content}</span>
                        </td>
                      );
                    })}
                    <td className="bg-slate-50 p-1 md:p-2 border border-slate-200 text-center">
                      <button
                        onClick={() => removeRow(rowIndex)}
                        className="p-1 hover:bg-red-100 rounded"
                        data-testid={`remove-row-${rowIndex}`}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dica de scroll para mobile */}
          <div className="mt-3 md:hidden text-center">
            <p className="text-xs text-slate-500">↔️ Deslize para os lados para ver todos os dias</p>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <Button onClick={addEmptyRow} variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-sm md:text-base" data-testid="add-row-button">
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Linha
            </Button>
            <div className="flex items-center justify-center md:justify-end space-x-2 md:space-x-4 text-xs md:text-sm flex-wrap">
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 border border-green-300 rounded flex items-center justify-center text-sm">✓</div>
                <span>Presente</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-red-100 border border-red-300 rounded flex items-center justify-center text-sm">✗</div>
                <span>Falta</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Vazio</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">💡 Dica 1</h3>
            <p className="text-sm text-slate-600">Click esquerdo marca presença (✓), click novamente para desmarcar</p>
          </div>
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">🖱️ Dica 2</h3>
            <p className="text-sm text-slate-600">Click direito marca falta (✗), click novamente para desmarcar</p>
          </div>
          <div className="glass rounded-xl p-4 border border-emerald-100">
            <h3 className="font-bold text-emerald-700 mb-2">💾 Dica 3</h3>
            <p className="text-sm text-slate-600">As presenças são salvas automaticamente ao clicar</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceManagement;