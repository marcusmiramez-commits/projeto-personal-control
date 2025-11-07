import React from 'react';
import Layout from '../components/Layout';

const FinancialManagement = ({ user, onLogout }) => {
  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="financial-management">
        <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Gestão <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Financeira</span></h1>
        <div className="glass rounded-2xl p-8 text-center border border-emerald-100">
          <p className="text-slate-600">Módulo Financeiro em desenvolvimento</p>
          <p className="text-sm text-slate-500 mt-2">Em breve você poderá controlar pagamentos e relatórios</p>
        </div>
      </div>
    </Layout>
  );
};

export default FinancialManagement;