
import React, { useEffect, useReducer, useRef, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from './services/supabase';
import { AppProvider, initialState, appReducer, useAppContext } from './context/AppContext';
import { ToastProvider, Skeleton } from './components/UI';
import { MainLayout } from './components/Layout';
import { RefreshCcw, WifiOff, AlertTriangle, ShieldAlert, Calendar, Filter, ArrowRight, DollarSign, Landmark, TrendingUp, CheckCircle2, Clock, ReceiptText, Users, Building, Briefcase, Target } from 'lucide-react';
import { FirstAccessModal } from './components/Modals';

// Views
import LoginScreen from './views/LoginScreen';
import { CooperadosView, CooperadoDetalheView } from './views/Cooperados';
import { ClientesView, ClienteDetalheView } from './views/Clientes';
import { ProjetosView, ProjetoDetalheView } from './views/Projetos';
import RelatoriosIAView from './views/Relatorios';
import FaturamentosView, { FaturamentoDetalheView } from './views/Faturamentos';
import OportunidadesView from './views/Oportunidades';
import InsightsIAView from './views/Insights';
import UsuariosView from './views/Usuarios';
import SettingsView from './views/Settings';
import EquipamentosView, { EquipamentoDetalheView } from './views/Equipamentos';

function LoadingScreen({ message = "Carregando Portal..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-400 mt-6 font-black uppercase text-[10px] tracking-[0.2em] animate-pulse">{message}</p>
    </div>
  );
}

function ErrorScreen({ title, message, details, onRetry }: { title: string, message: string, details?: string, onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 p-6 text-center">
      <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 text-rose-500">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4 font-medium">{message}</p>
      {details && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-left mb-8 max-w-md">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" /> Diagnóstico Técnico:
          </p>
          <code className="text-xs text-rose-600 dark:text-rose-400 break-all font-mono">{details}</code>
        </div>
      )}
      <button onClick={onRetry} className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 uppercase text-xs tracking-widest">
        <RefreshCcw className="h-4 w-4" /> Reiniciar Portal
      </button>
    </div>
  );
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

function InicioView() {
  const { supabase, dispatch } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [dateDe, setDateDe] = useState(new Date().toISOString().substring(0, 7));
  const [dateAte, setDateAte] = useState('2027-12');
  const [data, setData] = useState({ faturamentos: [] as any[], clientes: [] as any[], projetos: [] as any[] });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fat, cli, proj] = await Promise.all([
        supabase.from('faturamentos').select('valor, valor_realizado, status, mes_referencia, cliente_id, projeto_id'),
        supabase.from('clientes').select('id, nome'),
        supabase.from('projetos').select('id, nome')
      ]);
      setData({ faturamentos: fat.data || [], clientes: cli.data || [], projetos: proj.data || [] });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const filteredData = data.faturamentos.filter(f => f.mes_referencia >= dateDe && f.mes_referencia <= dateAte);
    const totalPlanejado = filteredData.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    const totalFaturado = filteredData.filter(f => f.status === 'Faturado').reduce((acc, curr) => acc + (Number(curr.valor_realizado) || Number(curr.valor) || 0), 0);
    const recebimentoEsperado = filteredData.filter(f => f.status !== 'Faturado').reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    
    const pipelineCount = {
      previsto: filteredData.filter(f => f.status === 'Previsto').length,
      pendente: filteredData.filter(f => f.status === 'Pendente').length,
      validado: filteredData.filter(f => f.status === 'Validado com Cliente').length,
      solicitado: filteredData.filter(f => f.status === 'Solicitação Enviada').length,
      nota: filteredData.filter(f => f.status === 'Nota Enviada').length,
      faturado: filteredData.filter(f => f.status === 'Faturado').length,
    };
    return { totalPlanejado, totalFaturado, recebimentoEsperado, pipelineCount };
  }, [data, dateDe, dateAte]);

  if (loading) return <div className="p-8 space-y-8 animate-pulse"><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}</div><Skeleton className="h-80 rounded-[2.5rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Início</h2>
          <p className="text-gray-500 font-medium mt-2">Dados estratégicos baseados no período de referência.</p>
        </div>
      </div>

      {/* 2. Atalhos Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ShortcutButton icon={Users} label="Cooperados" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'cooperados' } })} color="blue" />
        <ShortcutButton icon={Briefcase} label="Projetos" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'projetos' } })} color="emerald" />
        <ShortcutButton icon={ReceiptText} label="Faturamento" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'faturamentos' } })} color="indigo" />
        <ShortcutButton icon={Target} label="Oportunidades" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'oportunidades' } })} color="violet" />
      </div>

      {/* 3. Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-[1.8rem] shadow-xl border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-2xl">
           <Filter className="h-4 w-4 text-blue-600" />
           <div className="flex items-center gap-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">De</label>
             <input type="month" value={dateDe} onChange={e => setDateDe(e.target.value)} className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 text-gray-900 dark:text-white cursor-pointer" />
           </div>
           <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-2"></div>
           <div className="flex items-center gap-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Até</label>
             <input type="month" value={dateAte} onChange={e => setDateAte(e.target.value)} className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 text-gray-900 dark:text-white cursor-pointer" />
           </div>
        </div>
        <button onClick={fetchData} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><RefreshCcw className="h-5 w-5" /></button>
      </div>

      {/* 4. Indicadores Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard label="Total Planejado no Período" value={formatCurrency(stats.totalPlanejado)} icon={Calendar} color="blue" />
        <SummaryCard label="Total Faturado" value={formatCurrency(stats.totalFaturado)} icon={ReceiptText} color="emerald" />
        <SummaryCard label="Recebimento Esperado" value={formatCurrency(stats.recebimentoEsperado)} icon={Clock} color="rose" />
      </div>

      {/* 5. Pipeline de Fluxo */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-10 tracking-tight flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-600" /> Pipeline de Fluxo</h3>
        <div className="relative flex justify-between overflow-x-auto no-scrollbar pb-2">
          <PipelineStep label="Previsto" count={stats.pipelineCount.previsto} active={stats.pipelineCount.previsto > 0} />
          <PipelineStep label="Pendente" count={stats.pipelineCount.pendente} active={stats.pipelineCount.pendente > 0} />
          <PipelineStep label="Validado" count={stats.pipelineCount.validado} active={stats.pipelineCount.validado > 0} />
          <PipelineStep label="Solicitado" count={stats.pipelineCount.solicitado} active={stats.pipelineCount.solicitado > 0} />
          <PipelineStep label="Nota Enviada" count={stats.pipelineCount.nota} active={stats.pipelineCount.nota > 0} />
          <PipelineStep label="Faturado" count={stats.pipelineCount.faturado} active={stats.pipelineCount.faturado > 0} last />
        </div>
      </div>
    </div>
  );
}

function ShortcutButton({ icon: Icon, label, onClick, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/20",
  };
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95 group">
      <div className={`p-4 rounded-2xl mb-3 transition-transform group-hover:scale-110 ${colors[color]}`}><Icon className="h-6 w-6" /></div>
      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30",
    rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30",
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group">
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}><Icon className="h-6 w-6" /></div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  );
}

function PipelineStep({ label, count, active, last }: any) {
  return (
    <div className={`flex flex-col items-center flex-1 min-w-[100px] z-10 ${last ? '' : 'relative'}`}>
      <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-500 mb-4 ${
        active ? 'bg-blue-600 border-blue-100 dark:border-blue-900 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300'
      }`}>
        {active ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest text-center px-1 ${active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-[10px] font-bold mt-1 ${active ? 'text-blue-600' : 'text-gray-400'}`}>({count})</span>
    </div>
  );
}

function RenderCurrentView() {
  const { state } = useAppContext();
  switch (state.view) {
    case 'inicio': return <InicioView />;
    case 'cooperados': return <CooperadosView />;
    case 'detalheCooperado': return <CooperadoDetalheView cooperadoId={state.selectedId || ''} />;
    case 'clientes': return <ClientesView />;
    case 'detalheCliente': return <ClienteDetalheView clienteId={state.selectedId || ''} />;
    case 'projetos': return <ProjetosView />;
    case 'detalheProjeto': return <ProjetoDetalheView projetoId={state.selectedId || ''} />;
    case 'faturamentos': return <FaturamentosView />;
    case 'detalheFaturamento': return <FaturamentoDetalheView faturamentoId={state.selectedId || ''} />;
    case 'oportunidades':
    case 'detalheOportunidade':
      return <OportunidadesView />;
    case 'relatorios': return <RelatoriosIAView />;
    case 'equipamentos': return <EquipamentosView />;
    case 'detalheEquipamento': return <EquipamentoDetalheView equipamentoId={state.selectedId || ''} />;
    case 'insights': return <InsightsIAView />;
    case 'usuarios': return <UsuariosView />;
    case 'settings': return <SettingsView />;
    default: return <InicioView />;
  }
}

function MainContent() {
  const { state, dispatch, supabase } = useAppContext();
  const authInitialized = useRef(false);

  const loadPortalConfig = async () => {
    try {
      const { data, error } = await supabase.from('portal_config').select('*').eq('id', 'main').single();
      if (data && !error) {
        dispatch({ 
          type: 'UPDATE_PORTAL_CONFIG', 
          payload: { 
            logoLarge: data.logo_large, 
            logoMini: data.logo_mini 
          } 
        });
      }
    } catch (e) {
      console.warn("Falha ao carregar config de branding do banco.");
    }
  };

  const initializeAuth = async () => {
    if (!isSupabaseConfigured()) {
      dispatch({ type: 'SET_AUTH_READY', payload: { id: 'config-missing' } });
      return;
    }
    try {
      // Carrega branding primeiro
      await loadPortalConfig();

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        dispatch({
          type: 'LOGIN',
          payload: {
            id: session.user.id,
            profileId: session.user.id,
            name: session.user.user_metadata?.full_name || 'Usuário',
            role: 'Administrador'
          }
        });
      } else {
        dispatch({ type: 'SET_AUTH_READY', payload: { id: '', name: '' } });
      }
    } catch (err) {
      dispatch({ type: 'SET_AUTH_READY', payload: { id: '', name: '' } });
    } finally {
      authInitialized.current = true;
    }
  };

  useEffect(() => {
    if (!authInitialized.current) {
      initializeAuth();
    }
  }, []);

  useEffect(() => {
    if (state.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [state.darkMode]);

  if (!state.isAuthReady) return <LoadingScreen message="Autenticando..." />;
  if (state.userId === 'config-missing') return <ErrorScreen title="Configuração Errada" message="As chaves do banco de dados não foram encontradas." onRetry={() => window.location.reload()} />;
  if (!state.isAuthenticated) return <LoginScreen />;

  return (
    <>
      <MainLayout><RenderCurrentView /></MainLayout>
      {state.needsPasswordChange && <FirstAccessModal />}
    </>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <ToastProvider>
      <AppProvider value={{ state, dispatch, supabase }}><MainContent /></AppProvider>
    </ToastProvider>
  );
}
