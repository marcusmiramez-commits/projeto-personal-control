import React from 'react';
import Layout from '../components/Layout';

const WorkoutsManagement = ({ user, onLogout }) => {
  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="workouts-management">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Gerenciar <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Treinos</span></h1>
        <div className="glass rounded-2xl p-8 text-center border border-emerald-100">
          <p className="text-slate-600">Módulo de Treinos em desenvolvimento</p>
          <p className="text-sm text-slate-500 mt-2">Em breve você poderá criar fichas de treino personalizadas</p>
        </div>
      </div>
    </Layout>
  );
};

export default WorkoutsManagement;