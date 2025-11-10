import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Login from '@/pages/Login';
import ProfessionalDashboard from '@/pages/ProfessionalDashboard';
import StudentDashboard from '@/pages/StudentDashboard';
import StudentsManagement from '@/pages/StudentsManagement';
import WorkoutRoutines from '@/pages/WorkoutRoutines';
import WorkoutsList from '@/pages/WorkoutsList';
import WorkoutDetail from '@/pages/WorkoutDetail';
import ScheduleManagement from '@/pages/ScheduleManagement';
import AttendanceManagement from '@/pages/AttendanceManagement';
import FinancialManagement from '@/pages/FinancialManagement';
import ExercisesManagement from '@/pages/ExercisesManagement';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && parsedUser.id && parsedUser.type) {
          setUser(parsedUser);
        } else {
          // Dados inválidos, limpar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    try {
      if (!userData || !token) {
        console.error('Dados de login inválidos');
        return;
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Erro ao salvar dados de login:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route
          path="/login"
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={
            user ? (
              user.type === 'professional' ? (
                <ProfessionalDashboard user={user} onLogout={handleLogout} />
              ) : (
                <StudentDashboard user={user} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              user.type === 'professional' ? (
                <ProfessionalDashboard user={user} onLogout={handleLogout} />
              ) : (
                <StudentDashboard user={user} onLogout={handleLogout} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/students"
          element={user?.type === 'professional' ? <StudentsManagement user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/students/:studentId/routines"
          element={user ? <WorkoutRoutines user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/students/:studentId/routines/:routineId/workouts"
          element={user ? <WorkoutsList user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/students/:studentId/routines/:routineId/workouts/:workoutId"
          element={user ? <WorkoutDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/exercises"
          element={user?.type === 'professional' ? <ExercisesManagement user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/schedule"
          element={user ? <ScheduleManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/attendance"
          element={user?.type === 'professional' ? <AttendanceManagement user={user} onLogout={handleLogout} /> : <Navigate to="/" />}
        />
        <Route
          path="/financial"
          element={user ? <FinancialManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;