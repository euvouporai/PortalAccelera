
import React, { useState, useRef, useEffect } from 'react';
import { Home, Users, Building, Briefcase, Calendar, BarChart3, Sparkles, LogOut, X, List, Sun, Moon, ChevronRight, User, Settings, ChevronDown, ReceiptText, Key, Shield, UserCircle, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Logo } from './UI';

export function Header() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nome = fd.get('nome') as string;
    const login = fd.get('login') as string;
    const senha = fd.get('senha') as string;

    if (state.profileId === 'master-admin') {
      addToast("O perfil mestre não pode ser editado pelo portal.", "warning");
      setIsProfileModalOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios_acesso')
        .update({ nome, login, senha })
        .eq('id', state.profileId);

      if (error) throw error;
      
      addToast("Perfil atualizado com sucesso!");
      dispatch({ type: 'UPDATE_PROFILE', payload: { name: nome } });
      setIsProfileModalOpen(false);
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 shadow-sm border-b border-gray-100 dark:border-gray-700 p-4 flex justify-between items-center z-30 transition-all">
      <div className="flex items-center">
        <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} className="p-3 mr-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-95 shadow-sm bg-white dark:bg-gray-800 border border-gray-50 dark:border-gray-700">
          <List className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter truncate max-w-[200px] md:max-w-none">
          {state.breadcrumbs[state.breadcrumbs.length - 1].label}
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          {state.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-3 p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-[1.2rem] transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              {state.userName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-black text-gray-900 dark:text-white leading-none tracking-tight">{state.userName || 'Usuário'}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-black tracking-widest">{state.userRole || 'Acesso'}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 py-3 animate-fade-in z-50 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700/50 mb-2">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{state.userName}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{state.userRole}</p>
              </div>
              
              <button 
                onClick={() => { setIsProfileModalOpen(true); setIsUserMenuOpen(false); }}
                className="w-full flex items-center px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold"
              >
                <UserCircle className="h-4 w-4 mr-3" /> Meu Perfil
              </button>

              <button 
                onClick={() => { dispatch({ type: 'NAVIGATE', payload: { view: 'usuarios' } }); setIsUserMenuOpen(false); }}
                className="w-full flex items-center px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold"
              >
                <Settings className="h-4 w-4 mr-3" /> Gestão de Usuários
              </button>
              
              <div className="h-px bg-gray-50 dark:bg-gray-700/50 my-2"></div>
              
              <button 
                onClick={() => dispatch({ type: 'LOGOUT' })}
                className="w-full flex items-center px-6 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors font-bold"
              >
                <LogOut className="h-4 w-4 mr-3" /> Sair do Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 animate-fade-in border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
            
            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center">
                <Shield className="h-6 w-6 mr-3 text-blue-600" /> Meu Perfil
              </h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                <X className="h-6 w-6 text-gray-400"/>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                  <input name="nome" defaultValue={state.userName || ''} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-3.5 pl-12 pr-4 font-bold shadow-inner" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Login / Acesso</label>
                <div className="relative group">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                  <input name="login" placeholder="seu.login" required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-3.5 pl-12 pr-4 font-bold shadow-inner" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Senha</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600" />
                  <input name="senha" type="password" required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-3.5 pl-12 pr-4 font-bold shadow-inner" />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export function Sidebar() {
  const { state, dispatch } = useAppContext();
  
  const navItems = [
    { name: 'Início', view: 'inicio', icon: Home },
    { name: 'Clientes', view: 'clientes', icon: Building },
    { name: 'Cooperados', view: 'cooperados', icon: Users },
    { name: 'Projetos', view: 'projetos', icon: Briefcase },
    { name: 'Faturamento', view: 'faturamentos', icon: ReceiptText },
    { name: 'Oportunidades', view: 'oportunidades', icon: Target },
    { name: 'Relatórios', view: 'relatorios', icon: BarChart3 },
    { name: 'Configurações', view: 'settings', icon: Settings },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${state.isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
      ></div>
      
      <nav className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col p-6 ${state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full opacity-0'}`}>
        
        {/* Logo Container */}
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="hover:scale-105 transition-transform duration-300">
            <Logo className="h-9" />
          </div>
          <button 
            onClick={() => dispatch({ type: 'CLOSE_SIDEBAR' })} 
            className="p-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all active:rotate-90 group"
          >
            <X className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2 -mr-2">
          {navItems.map(item => {
            const isActive = state.view === item.view;
            return (
              <button 
                key={item.name} 
                onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: item.view } })} 
                className={`group flex items-center w-full p-4 rounded-[1.8rem] transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30 active:scale-[0.98]' 
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.5)]"></div>
                )}
                
                <div className={`p-2 rounded-xl mr-4 transition-all duration-300 ${
                  isActive ? 'bg-white/20' : 'bg-transparent group-hover:scale-110'
                }`}>
                  <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[3px]' : 'stroke-[2px]'}`} />
                </div>
                
                <span className={`text-sm font-black tracking-tight ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                  {item.name}
                </span>

                {/* Subtle Hover Glow */}
                {!isActive && (
                  <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.03] transition-colors pointer-events-none"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function Breadcrumbs() {
  const { state, dispatch } = useAppContext();
  if (state.view === 'inicio') return null;
  return (
    <nav className="flex text-sm text-gray-400 dark:text-gray-500 mb-6 animate-fade-in px-2">
      <ol className="inline-flex items-center space-x-2">
        {state.breadcrumbs.map((crumb, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 mx-2 text-gray-300 dark:text-gray-700" />}
            <button 
              onClick={() => index < state.breadcrumbs.length - 1 && dispatch({ type: 'NAVIGATE', payload: { view: crumb.view, id: crumb.id, label: crumb.label } })} 
              className={`inline-flex items-center font-bold tracking-tight text-[11px] uppercase ${index === state.breadcrumbs.length - 1 ? 'text-blue-600 dark:text-blue-400 cursor-default' : 'hover:text-gray-900 dark:hover:text-white transition-colors'}`} 
              disabled={index === state.breadcrumbs.length - 1}
            >
              {index === 0 && <Home className="w-3.5 h-3.5 mr-2" />}{crumb.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth no-scrollbar relative z-10">
          <Breadcrumbs />
          <div className="mt-2">{children}</div>
        </main>
      </div>
    </div>
  );
}
