# Personal Control - PRD

## Problema/Visão
Aplicação full-stack (React + FastAPI + MongoDB) para personal trainers gerenciarem alunos, agenda, presenças, financeiro e treinos. Painéis separados para Profissional e Aluno.

## Idioma do Usuário
Portuguese (pt-BR) — Responder sempre em pt-BR.

## Arquitetura
- Backend: FastAPI (Python), MongoDB (Motor Async), Pydantic, PyJWT
- Frontend: React + Tailwind + Shadcn UI + Axios
- API prefix: `/api`

## Funcionalidades Implementadas
- Auth (Profissional / Aluno) — JWT
- CRUD de Alunos (com tipos: pré-pago, pós-pago, mensalista)
- Agenda (grade semanal) — persistida no MongoDB via `/api/schedule-grid`
- Presenças (registro diário)
- Relatório Financeiro mensal (Total Esperado, Recebido)
- Treinos hierárquicos (Rotinas → Treinos → Exercícios)
- Biblioteca de Exercícios (página `/exercises`)
- Dashboards (Profissional e Aluno) com métricas dinâmicas
- Mobile responsive em tabelas (overflow-x-auto)

## Changelog Recente
- 2026-02: **4 ajustes** — (1) Alunos pré-pagos: presença debita 1 do `class_balance` e desmarcar/excluir estorna +1 (saldo pode ficar negativo); lógica simétrica em `mark_attendance`/`delete_attendance` (`server.py`), testada em `backend/tests/test_attendance_balance.py` (6/6). (2) Agenda: viewport alterna no foco/blur dos campos para impedir auto-zoom mantendo pinça (`ScheduleManagement.jsx`). (3) Financeiro: removidos gráficos "Receita por Aluno" e "Distribuição de Pagamentos" + import recharts (`FinancialManagement.jsx`). (4) WhatsApp: helper `openWhatsApp` usa deep link `whatsapp://` no mobile e fecha o diálogo/volta à lista (`StudentsManagement.jsx`).
- 2026-02: **Stripe webhook corrigido (fonte da verdade)** — `_apply_subscription` extrai `current_period_end` de `items.data[]`; webhook mapeia profissional por `metadata.professional_id` → `client_reference_id` → `stripe_customer_id`; frontend `/billing` faz polling de `/api/billing/status`. Testado em `backend/tests/test_stripe_webhook.py` (4/4).
- 2026-02: Removido o card "Exercícios" do Dashboard do Profissional e todas as variáveis/fetch vinculados (totalExercises, muscleGroups, fetch `/api/exercises`).
- 2026-02: StudentDashboard - removidos campos "Presenças/Faltas" do card Financeiro; adicionado histórico de datas no card Aulas.
- 2026-02: Migrada Agenda de localStorage → MongoDB para sync cross-device.
- 2026-02: Corrigido cálculo dinâmico de Taxa de Presença e Total Esperado.

## Roadmap / Backlog
### P0
- Integração WhatsApp (lembretes / mensagens motivacionais)
- Gateway de pagamento (Pix / Cartão / Stripe / PagSeguro)

### P1
- Google Calendar integration
- Geração avançada de relatórios em PDF
- Módulo de avaliações físicas

### P2
- Chat interno (profissional ↔ aluno)
- Tema escuro e personalização visual
- Backup em nuvem (Firebase/Supabase)
- Notificações push

## Endpoints Chave
- POST `/api/auth/login/professional`
- POST `/api/auth/login/student`
- GET `/api/dashboard/professional`
- GET `/api/dashboard/student`
- GET `/api/financial/report?month=YYYY-MM`
- GET/POST `/api/schedule-grid`
- CRUD `/api/students`, `/api/exercises`, `/api/workouts`, `/api/workout-routines`, `/api/attendance`

## DB Collections
- users, students, attendances, schedules, exercises, workouts, workout_routines, schedule_grids
