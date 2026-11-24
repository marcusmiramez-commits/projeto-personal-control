import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2 } from 'lucide-react';

export const getInitials = (name) => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const CellEditor = ({ editing, draft, setDraft, studentNames, onSave, onClose, onRemoveTime }) => {
  const isTime = editing?.type === 'time';
  return (
    <Dialog open={!!editing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] rounded-2xl" data-testid="mobile-cell-dialog">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Space Grotesk' }}>
            {isTime ? 'Editar horário' : `${editing?.day} • ${editing?.time}`}
          </DialogTitle>
        </DialogHeader>
        <Input
          type={isTime ? 'time' : 'text'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isTime ? '' : 'Nome do aluno'}
          className="h-12 text-base"
          data-testid="mobile-cell-input"
        />
        {!isTime && studentNames.length > 0 && (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto" data-testid="mobile-student-chips">
            {studentNames.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setDraft(name)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${draft === name ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'}`}
                data-testid={`mobile-student-chip-${i}`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
        <DialogFooter className="flex-row gap-2 sm:justify-between">
          {isTime ? (
            <Button variant="outline" className="flex-1 border-red-300 text-red-600" onClick={() => { onRemoveTime(editing.time); onClose(); }} data-testid="mobile-remove-time-button">
              <Trash2 className="w-4 h-4 mr-1" /> Remover
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={() => setDraft('')} data-testid="mobile-clear-cell-button">
              Limpar
            </Button>
          )}
          <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600" onClick={onSave} data-testid="mobile-save-cell-button">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Legend = ({ schedule }) => {
  const names = [...new Set(Object.values(schedule || {}).flatMap(d => Object.values(d || {})).filter(Boolean).map(n => n.trim()))].sort();
  if (names.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600" data-testid="mobile-schedule-legend">
      {names.map(n => (
        <span key={n}><b className="text-emerald-700">{getInitials(n)}</b> {n}</span>
      ))}
    </div>
  );
};

export const MobileScheduleGrid = ({ timeSlots, weekDays, schedule, studentNames, onCellChange, onTimeChange, onRemoveTime }) => {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const open = (target, value) => { setEditing(target); setDraft(value || ''); };
  const close = () => setEditing(null);
  const save = () => {
    if (editing.type === 'time') onTimeChange(editing.time, draft);
    else onCellChange(editing.time, editing.day, draft.trim());
    close();
  };

  return (
    <>
      <table className="w-full table-fixed border-collapse" data-testid="mobile-schedule-grid">
        <thead>
          <tr>
            <th className="w-10 bg-slate-800 text-white text-[10px] font-bold py-1.5 border border-slate-600">HOR</th>
            {weekDays.map(day => (
              <th key={day} className="bg-amber-600 text-white text-[10px] font-bold py-1.5 border border-amber-500">{day.substring(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time, ti) => (
            <tr key={time}>
              <td className="p-0 border border-amber-500 bg-amber-600">
                <button type="button" onClick={() => open({ type: 'time', time }, time)} className="w-full h-9 text-[10px] font-semibold text-white" data-testid={`mobile-time-${ti}`}>
                  {time}
                </button>
              </td>
              {weekDays.map((day, di) => {
                const name = schedule[time]?.[day] || '';
                return (
                  <td key={day} className="p-0 border border-amber-200">
                    <button
                      type="button"
                      onClick={() => open({ type: 'cell', time, day }, name)}
                      className={`w-full h-9 text-[11px] font-bold transition-colors active:bg-emerald-100 ${name ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-slate-400'}`}
                      data-testid={`mobile-cell-${ti}-${di}`}
                    >
                      {getInitials(name)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <Legend schedule={schedule} />
      <CellEditor editing={editing} draft={draft} setDraft={setDraft} studentNames={studentNames} onSave={save} onClose={close} onRemoveTime={onRemoveTime} />
    </>
  );
};
