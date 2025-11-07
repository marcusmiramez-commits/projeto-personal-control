import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Users, Dumbbell, Calendar, CheckCircle, DollarSign, Activity, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isProfessional = user?.type === 'professional';

  const professionalMenuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Alunos' },
    { path: '/exercises', icon: Dumbbell, label: 'Exercícios' },
    { path: '/workouts', icon: Activity, label: 'Treinos' },
    { path: '/schedule', icon: Calendar, label: 'Agenda' },
    { path: '/attendance', icon: CheckCircle, label: 'Presenças' },
    { path: '/financial', icon: DollarSign, label: 'Financeiro' },
  ];

  const studentMenuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/workouts', icon: Activity, label: 'Meus Treinos' },
    { path: '/schedule', icon: Calendar, label: 'Aulas' },
    { path: '/financial', icon: DollarSign, label: 'Pagamentos' },
  ];

  const menuItems = isProfessional ? professionalMenuItems : studentMenuItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      {/* Header */}
      <header className="glass border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Personal Control</span>
              </h1>
              <p className="text-xs text-slate-600">{user?.name}</p>
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={isActive ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'hover:bg-emerald-50'}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="hover:bg-red-50 hover:text-red-600"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-emerald-50 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                    <div className={`flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' : 'hover:bg-emerald-50'}`}>
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              <button
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 text-red-600 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;