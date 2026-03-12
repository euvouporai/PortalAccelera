
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, PieChart, Info, LayoutGrid, Clock, Building, Briefcase, 
  ChevronRight, ChevronLeft, Filter, AlertCircle, CheckCircle2, 
  Target, Sparkles, BrainCircuit, Loader2, Download, RefreshCcw,
  BarChart3, Zap, TrendingUp, ShieldCheck, ArrowRight, Star, History, UserCheck, X, Search,
  Heart, AlertTriangle, Activity, MessageSquare, Award
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { GoogleGenAI } from "@google/genai";
import { FeriasDetalheModal } from '../components/Modals';

const formatMonthYear = (monthStr: string) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[parseInt(month) - 1]} de ${year}`;
};

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export default function RelatoriosIAView() {
  const { state, supabase, dispatch } = useAppContext();
  const { addToast } = useToast();
  const [tab, setTab] = useState('timeline');
  const [isLoading, setIsLoading] = useState(true);
  const [generatingIA, setGeneratingIA] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [projsRes, fatRes, alocsRes, coopsRes, fbRes, ferRes] = await Promise.all([
        supabase.from('projetos').select('id, nome, status, cliente_id, clientes(nome)').order('nome'),
        supabase.from('faturamentos').select('mes_referencia, projeto_id, status, valor_realizado').order('mes_referencia'),
        supabase.from('alocacoes').select('percentual, cooperado_id'),
        supabase.from('cooperados').select('*').order('nome_completo'),
        supabase.from('feedbacks').select('*').order('data_feedback', { ascending: false }),
        supabase.from('ferias').select('*, cooperados(nome_completo, funcao)').order('data_inicio', { ascending: true })
      ]);

      setData({
        projetos: projsRes.data || [],
        faturamentos: fatRes.data || [],
        alocacoes: alocsRes.data || [],
        cooperados: coopsRes.data || [],
        feedbacks: fbRes.data || [],
        ferias: ferRes.data || []
      });
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      addToast("Erro ao sincronizar dados dos relatórios.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addToast]);

  const [data, setData] = useState({
    projetos: [] as any[],
    faturamentos: [] as any[],
    alocacoes: [] as any[],
    cooperados: [] as any[],
    feedbacks: [] as any[],
    ferias: [] as any[]
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ganttData = useMemo(() => {
    if (data.faturamentos.length === 0) return { months: [], rows: [] };
    const uniqueMonths = Array.from(new Set(data.faturamentos.map(f => f.mes_referencia).filter(Boolean))).sort();
    
    const rows = data.projetos.map(proj => {
      const projFaturamentos = data.faturamentos.filter(f => f.projeto_id === proj.id);
      const activity = uniqueMonths.map(m => {
        const fat = projFaturamentos.find(f => f.mes_referencia === m);
        return {
          planned: !!fat,
          realized: fat?.status === 'Pago' || (Number(fat?.valor_realizado) > 0)
        };
      });
      
      return {
        id: proj.id,
        nome: proj.nome,
        cliente: proj.clientes?.nome || 'Sem Cliente',
        status: proj.status,
        activity
      };
    });

    return { months: uniqueMonths, rows };
  }, [data]);

  const generateAISuggestions = async () => {
    setGeneratingIA(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const activeCooperados = data.cooperados.filter(c => c.status === 'Ativo');
      const superallocated = activeCooperados.map(c => {
        const total = data.alocacoes
          .filter(a => a.cooperado_id === c.id)
          .reduce((s, a) => s + (Number(a.percentual) || 0), 0);
        return { ...c, totalAloc: total };
      }).filter(c => c.totalAloc > 100);

      const prompt = `Analise os dados operacionais da Accelera:
        - Profissionais Ativos: ${activeCooperados.length}
        - Projetos Ativos: ${data.projetos.length}
        - Superalocados: ${superallocated.length}
        
        Forneça uma análise estratégica curta em 3 pontos:
        1. Carga de trabalho.
        2. Riscos de Burnout/Atraso.
        3. Dica de rentabilidade.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiSuggestions(response.text || "Sem insights disponíveis.");
    } catch (error) {
      addToast("Erro ao conectar com a IA.", "error");
    } finally {
      setGeneratingIA(false);
    }
  };

  if (isLoading) return <div className="p-10 space-y-10"><Skeleton className="h-40 w-full rounded-[3rem]" /><Skeleton className="h-96 w-full rounded-[3rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] flex items-center justify-center text-indigo-600 shadow-xl border border-indigo-100 dark:border-indigo-800/50">
             <BarChart3 className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Relatórios</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-1">Consolidação e Inteligência de Dados</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 rounded-[1.5rem] shadow-xl transition-all">
            <RefreshCcw className="h-5 w-5" />
          </button>
          <button className="flex items-center px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] shadow-xl font-black uppercase text-[11px] tracking-widest transition-all">
            <Download className="h-4 w-4 mr-2" /> Exportar
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[
          {id:'timeline', label:'Cronograma de Execução', icon:Clock}, 
          {id:'capacidade', label:'Capacidade de Equipe', icon:PieChart},
          {id:'ferias', label:'Férias & Disponibilidade', icon:Calendar},
          {id:'insights', label:'Insights Estratégicos (IA)', icon:Sparkles}, 
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)} 
            className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <t.icon className="h-4 w-4 mr-2"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 min-h-[500px] animate-fade-in relative overflow-hidden">
        {tab === 'timeline' && <TimelineReport data={ganttData} />}
        {tab === 'capacidade' && <CapacityReport data={data} onUpdate={fetchData} />}
        {tab === 'ferias' && <FeriasTab data={data} />}
        {tab === 'insights' && (
          <div className="space-y-12">
            <HealthIndexReport data={data} />
            <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
            <AIInsightsTab 
              suggestions={aiSuggestions} 
              loading={generatingIA} 
              onGenerate={generateAISuggestions} 
              data={data}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineReport({ data }: { data: any }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-6">Execução Mensal por Projeto</h3>
      <div className="overflow-x-auto no-scrollbar rounded-[2rem] border border-gray-100 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50">
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-900 px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase border-r min-w-[280px]">Projeto</th>
              {data.months.map((m: any) => <th key={m} className="px-4 py-6 text-center text-[10px] font-black text-gray-500 uppercase min-w-[100px]">{formatMonthYear(m)}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.rows.map((row: any) => (
              <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-8 py-6 border-r">
                   <p className="font-black text-gray-900 dark:text-white text-base tracking-tight truncate">{row.nome}</p>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">{row.cliente}</p>
                </td>
                {row.activity.map((status: any, idx: number) => (
                  <td key={idx} className="p-3">
                    <div className={`h-10 w-full rounded-xl transition-all duration-500 ${status.realized ? 'bg-indigo-600 shadow-lg' : status.planned ? 'border-2 border-dashed border-indigo-200 bg-indigo-50/30' : 'bg-gray-50 dark:bg-gray-900/20'}`}></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CapacityReport({ data, onUpdate }: { data: any, onUpdate: () => void }) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();

  const handleTogglePrincipal = async (cooperado: any) => {
    try {
      const { error } = await supabase
        .from('cooperados')
        .update({ is_principal: !cooperado.is_principal, user_id: state.userId })
        .eq('id', cooperado.id);
      
      if (error) throw error;
      addToast(cooperado.is_principal ? "Profissional removido dos principais" : "Profissional marcado como Principal");
      onUpdate();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const activeCooperados = useMemo(() => {
    return data.cooperados
      .filter((c: any) => c.status === 'Ativo')
      .sort((a: any, b: any) => {
        if (a.is_principal && !b.is_principal) return -1;
        if (!a.is_principal && b.is_principal) return 1;
        return a.nome_completo.localeCompare(b.nome_completo);
      });
  }, [data.cooperados]);

  return (
    <div className="space-y-10 animate-fade-in">
       <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Taxa de Ocupação da Equipe (Ativos)</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeCooperados.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400 italic font-bold">Nenhum profissional ativo localizado.</div>
          ) : activeCooperados.map((c: any) => {
            const total = data.alocacoes.filter((a: any) => a.cooperado_id === c.id).reduce((s: any, a: any) => s + (Number(a.percentual) || 0), 0);
            const isDanger = total > 100;
            return (
              <div key={c.id} className={`p-8 rounded-[2.5rem] border transition-all relative overflow-hidden group hover:shadow-2xl ${c.is_principal ? 'bg-white dark:bg-gray-800 border-amber-200 ring-2 ring-amber-400/20' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 shadow-inner'}`}>
                
                <button 
                  onClick={() => handleTogglePrincipal(c)}
                  className={`absolute top-6 right-6 p-2 rounded-xl transition-all z-10 ${c.is_principal ? 'bg-amber-100 text-amber-500 shadow-md' : 'bg-white/50 text-gray-300 hover:text-amber-400 opacity-0 group-hover:opacity-100'}`}
                  title={c.is_principal ? "Remover Principal" : "Marcar como Principal"}
                >
                  <Star className={`h-5 w-5 ${c.is_principal ? 'fill-amber-500' : ''}`} />
                </button>

                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                       <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-tight truncate max-w-[150px]">{c.nome_completo}</p>
                       {c.is_principal && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-md border border-amber-100">Principal</span>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{c.funcao}</p>
                  </div>
                  <div className={`text-3xl font-black ${isDanger ? 'text-rose-600' : 'text-indigo-600'} tracking-tighter`}>{total}%</div>
                </div>
                <div className="h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden p-1 shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-1000 ${isDanger ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min(total, 100)}%` }}></div>
                </div>
              </div>
            );
          })}
       </div>
    </div>
  );
}

function FeriasTab({ data }: { data: any }) {
  const [activeSubTab, setActiveSubTab] = useState<'escala' | 'saldos'>('escala');
  const [filterName, setFilterName] = useState('');
  const [selectedFerias, setSelectedFerias] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const saldosData = useMemo(() => {
    return data.cooperados.map(c => {
      const dataInicio = new Date(c.data_inicio + 'T12:00:00');
      const hoje = new Date();
      let anosCompletos = hoje.getFullYear() - dataInicio.getFullYear();
      const m = hoje.getMonth() - dataInicio.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < dataInicio.getDate())) {
        anosCompletos--;
      }
      const totalDireito = Math.max(0, anosCompletos) * 80;
      const totalUsado = data.ferias
        .filter(f => f.cooperado_id === c.id && (f.status === 'Aprovado' || f.status === 'Aprovada' || f.status === 'Gozada'))
        .reduce((acc, f) => acc + (Number(f.horas) || 0), 0);
      const saldo = totalDireito - totalUsado;
      return {
        ...c,
        totalDireito,
        totalUsado,
        saldo,
        risco: saldo >= 120 ? 'Alto' : saldo >= 80 ? 'Médio' : 'Baixo'
      };
    });
  }, [data.cooperados, data.ferias]);

  const groupedByMonth = useMemo(() => {
    const months: Record<string, any[]> = {};
    const filteredFerias = data.ferias.filter(f => f.cooperados?.nome_completo?.toLowerCase().includes(filterName.toLowerCase()));

    filteredFerias.forEach(f => {
      const monthKey = f.data_inicio.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(f);
    });

    // Ordenação decrescente (mais recente primeiro)
    return Object.keys(months).sort((a, b) => b.localeCompare(a)).map(month => ({
      month,
      items: months[month]
    }));
  }, [data.ferias, filterName]);

  const filteredSaldos = saldosData.filter(s => s.nome_completo?.toLowerCase().includes(filterName.toLowerCase()));

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-2xl">
            <button onClick={() => setActiveSubTab('escala')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'escala' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Calendário</button>
            <button onClick={() => setActiveSubTab('saldos')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSubTab === 'saldos' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Saldos Acumulados</button>
         </div>
         <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input placeholder="Filtrar por nome..." value={filterName} onChange={e => setFilterName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border-none rounded-xl pl-10 py-2.5 text-sm font-bold shadow-inner" />
         </div>
       </div>

       {activeSubTab === 'escala' ? (
         <div className="space-y-10">
           {groupedByMonth.length === 0 ? (
             <div className="py-20 text-center text-gray-400 italic font-bold">Nenhuma escala para o filtro selecionado.</div>
           ) : groupedByMonth.map(group => (
             <div key={group.month} className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                   <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                     {group.month ? formatMonthYear(group.month) : '-'}
                   </h4>
                   <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase">Cooperado</th>
                        <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase">Início</th>
                        <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase">Fim</th>
                        <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase text-center">Horas</th>
                        <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {group.items.map(f => (
                        <tr key={f.id} onClick={() => { setSelectedFerias(f); setIsDetailOpen(true); }} className="hover:bg-blue-50/20 cursor-pointer transition-colors">
                          <td className="px-8 py-5">
                             <p className="font-black text-gray-900 dark:text-white">{f.cooperados?.nome_completo || '-'}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase">{f.cooperados?.funcao || '-'}</p>
                          </td>
                          <td className="px-6 py-5 font-bold text-gray-500">{formatDateBR(f.data_inicio)}</td>
                          <td className="px-6 py-5 font-bold text-gray-500">{formatDateBR(f.data_fim)}</td>
                          <td className="px-6 py-5 font-black text-blue-600 text-center">{(f.horas || 0)}h</td>
                          <td className="px-8 py-5 text-right">
                             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${f.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{f.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           ))}
         </div>
       ) : (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
           <table className="w-full text-left">
             <thead>
               <tr className="bg-gray-50 dark:bg-gray-900/50">
                 <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase">Cooperado</th>
                 <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase text-right">Direito</th>
                 <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase text-right">Utilizado</th>
                 <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase text-right">Saldo Atual</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
               {filteredSaldos.map(s => (
                 <tr key={s.id}>
                   <td className="px-8 py-5">
                      <p className="font-black text-gray-900 dark:text-white">{s.nome_completo || '-'}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{formatDateBR(s.data_inicio)}</p>
                   </td>
                   <td className="px-6 py-5 font-bold text-gray-400 text-right">{(s.totalDireito || 0)}h</td>
                   <td className="px-6 py-5 font-bold text-emerald-600 text-right">{(s.totalUsado || 0)}h</td>
                   <td className={`px-8 py-5 font-black text-right text-xl tracking-tighter ${s.saldo >= 120 ? 'text-rose-600' : s.saldo >= 80 ? 'text-amber-500' : 'text-blue-600'}`}>{(s.saldo || 0)}h</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}

       <FeriasDetalheModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} ferias={selectedFerias} />
    </div>
  );
}

function HealthIndexReport({ data }: { data: any }) {
  const healthScores = useMemo(() => {
    const hoje = new Date();
    const activeCooperados = data.cooperados.filter((c: any) => c.status === 'Ativo');

    return activeCooperados.map((c: any) => {
      let score = 100;
      const reasons: string[] = [];

      // 1. Sobrecarga
      const alocTotal = data.alocacoes
        .filter((a: any) => a.cooperado_id === c.id)
        .reduce((sum: number, a: any) => sum + (Number(a.percentual) || 0), 0);
      
      if (alocTotal > 120) {
        score -= 40;
        reasons.push(`Crítico: Sobrecarga Extrema (${alocTotal}%)`);
      } else if (alocTotal > 100) {
        score -= 20;
        reasons.push(`Atenção: Sobrecarga (${alocTotal}%)`);
      }

      // 2. Férias (Saldo Acumulado)
      const dataInicio = new Date(c.data_inicio + 'T12:00:00');
      let anosCompletos = hoje.getFullYear() - dataInicio.getFullYear();
      if (hoje.getMonth() < dataInicio.getMonth() || (hoje.getMonth() === dataInicio.getMonth() && hoje.getDate() < dataInicio.getDate())) {
        anosCompletos--;
      }
      const totalDireito = Math.max(0, anosCompletos) * 80;
      const totalUsado = data.ferias
        .filter((f: any) => f.cooperado_id === c.id && (f.status === 'Aprovado' || f.status === 'Aprovada' || f.status === 'Gozada'))
        .reduce((acc: number, f: any) => acc + (Number(f.horas) || 0), 0);
      const saldo = totalDireito - totalUsado;

      if (saldo >= 120) {
        score -= 25;
        reasons.push('Crítico: Longo período sem férias (>1.5 ano)');
      } else if (saldo >= 80) {
        score -= 15;
        reasons.push('Atenção: Precisa programar descanso');
      }

      // 3. Feedback Recente
      const lastFeedback = data.feedbacks.find((fb: any) => fb.cooperado_id === c.id);
      if (lastFeedback) {
        const fbDate = new Date(lastFeedback.data_feedback + 'T12:00:00');
        const diffMonths = (hoje.getTime() - fbDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (diffMonths > 12) {
          score -= 20;
          reasons.push('Falta de acompanhamento (>1 ano)');
        } else if (diffMonths > 6) {
          score -= 10;
          reasons.push('Hiato de feedback (>6 meses)');
        }
      } else {
        score -= 25;
        reasons.push('Nunca recebeu feedback oficial');
      }

      return {
        ...c,
        score: Math.max(0, score),
        reasons,
        alocTotal,
        saldoFerias: saldo
      };
    }).sort((a: any, b: any) => a.score - b.score);
  }, [data]);

  const riskCount = healthScores.filter((s: any) => s.score < 60).length;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
             <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
               Índice de Saúde e Retenção <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
             </h3>
             <p className="text-sm text-gray-500 font-medium">People Analytics: Análise de risco de burnout e rotatividade (churn).</p>
          </div>
          {riskCount > 0 && (
             <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span className="text-xs font-black text-rose-600 uppercase tracking-widest">{riskCount} Profissionais em Zona de Risco</span>
             </div>
          )}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {healthScores.map((s: any) => (
            <div key={s.id} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
               <div className={`absolute top-0 left-0 w-2 h-full ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
               
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <p className="font-black text-gray-900 dark:text-white text-lg tracking-tight leading-tight mb-1">{s.nome_completo}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.funcao}</p>
                  </div>
                  <div className={`text-3xl font-black tracking-tighter ${s.score >= 80 ? 'text-emerald-600' : s.score >= 60 ? 'text-amber-500' : 'text-rose-600'}`}>
                    {s.score}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Ocupação: {s.alocTotal}%</span>
                    <span>Saldo Férias: {s.saldoFerias}h</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                     <div 
                      className={`h-full transition-all duration-1000 ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${s.score}%` }}
                     ></div>
                  </div>

                  <div className="pt-4 border-t dark:border-gray-700">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Diagnóstico</p>
                     <div className="flex flex-wrap gap-1.5">
                        {s.reasons.length === 0 ? (
                          <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md">
                            <ShieldCheck className="h-3 w-3" /> Perfil Estável
                          </span>
                        ) : s.reasons.map((r: string, i: number) => (
                          <span key={i} className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${s.score < 60 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {r}
                          </span>
                        ))}
                     </div>
                  </div>
               </div>

               <button className="mt-6 w-full py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                 <MessageSquare className="h-3 w-3" /> Agendar Alinhamento
               </button>
            </div>
          ))}
       </div>
    </div>
  );
}

function AIInsightsTab({ suggestions, loading, onGenerate, data }: any) {
  return (
    <div className="space-y-10 animate-fade-in relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
           <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
             Análise Consultiva <Sparkles className="h-7 w-7 text-indigo-500" />
           </h3>
           <p className="text-sm text-gray-500 font-medium">Relatório estratégico gerado via IA para otimização de recursos.</p>
        </div>
        <button 
          onClick={onGenerate} 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-3 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
          {suggestions ? 'Recalcular Análise' : 'Gerar Novo Relatório'}
        </button>
      </div>

      <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/30 shadow-inner min-h-[300px]">
         {!suggestions && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
               <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-xl"><BrainCircuit className="h-10 w-10 text-indigo-400" /></div>
               <p className="text-gray-400 font-bold text-lg max-w-sm">Clique em "Gerar" para receber uma análise exclusiva sobre sua equipe e projetos.</p>
            </div>
         ) : loading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => <div key={i} className="h-4 bg-indigo-100 dark:bg-gray-800 rounded-full animate-pulse w-full"></div>)}
            </div>
         ) : (
            <div className="prose dark:prose-invert max-w-none">
               <div className="whitespace-pre-wrap font-bold text-gray-700 dark:text-gray-200 leading-relaxed text-lg italic">
                 "{suggestions}"
               </div>
            </div>
         )}
      </div>
    </div>
  );
}
