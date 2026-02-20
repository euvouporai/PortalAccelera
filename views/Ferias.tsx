
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Search, Filter, RefreshCcw, User, Clock, UserCheck, PieChart, List, LayoutGrid, FileSpreadsheet, AlertCircle, CheckCircle2, TrendingUp, History, Download, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { FeriasDetalheModal } from '../components/Modals';

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export default function FeriasGestaoView() {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'escala' | 'saldos'>('escala');
  const [escalaViewMode, setEscalaViewMode] = useState<'list' | 'card'>('list');
  const [ferias, setFerias] = useState<any[]>([]);
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ nome: '', status: '', dataInicio: '', dataFim: '' });
  
  // Paginação Escala
  const [currentPageEscala, setCurrentPageEscala] = useState(1);
  // Paginação Saldos
  const [currentPageSaldos, setCurrentPageSaldos] = useState(1);
  const itemsPerPage = 10;

  // Detalhe
  const [selectedFerias, setSelectedFerias] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const [feriasRes, coopsRes] = await Promise.all([
        supabase.from('ferias').select('*, cooperados(nome_completo, funcao)').order('data_inicio', { ascending: true }),
        supabase.from('cooperados').select('*').order('nome_completo')
      ]);
      
      if (feriasRes.error) throw feriasRes.error;
      if (coopsRes.error) throw coopsRes.error;

      setFerias(feriasRes.data || []);
      setCooperados(coopsRes.data || []);
    } catch (error: any) {
      addToast(`Erro ao carregar dados: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset paginação ao filtrar
  useEffect(() => {
    setCurrentPageEscala(1);
    setCurrentPageSaldos(1);
  }, [filter]);

  // Processamento de Saldos (Lógica Anual: +80h por aniversário)
  const saldosData = useMemo(() => {
    return cooperados.map(c => {
      const dataInicio = new Date(c.data_inicio + 'T12:00:00');
      const hoje = new Date();
      
      // Cálculo de anos completos
      let anosCompletos = hoje.getFullYear() - dataInicio.getFullYear();
      const m = hoje.getMonth() - dataInicio.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < dataInicio.getDate())) {
        anosCompletos--;
      }
      
      const totalDireito = Math.max(0, anosCompletos) * 80;
      
      const totalUsado = ferias
        .filter(f => f.cooperado_id === c.id && (f.status === 'Aprovado' || f.status === 'Aprovada' || f.status === 'Gozada'))
        .reduce((acc, f) => acc + (Number(f.horas) || 0), 0);
      
      const planejado = ferias
        .filter(f => f.cooperado_id === c.id && (f.status === 'Planejada' || f.status === 'Solicitada' || f.status === 'Solicitado'))
        .reduce((acc, f) => acc + (Number(f.horas) || 0), 0);

      const saldo = totalDireito - totalUsado;
      
      return {
        ...c,
        totalDireito,
        totalUsado,
        planejado,
        saldo,
        risco: saldo >= 120 ? 'Alto' : saldo >= 80 ? 'Médio' : 'Baixo'
      };
    });
  }, [cooperados, ferias]);

  const escalaFiltrada = useMemo(() => {
    return ferias.filter(f => {
      const matchNome = (f.cooperados?.nome_completo?.toLowerCase() || '').includes(filter.nome.toLowerCase());
      const matchStatus = filter.status === '' || f.status === filter.status;
      const matchInicio = filter.dataInicio === '' || f.data_inicio >= `${filter.dataInicio}-01`;
      const matchFim = filter.dataFim === '' || f.data_fim <= `${filter.dataFim}-31`;
      return matchNome && matchStatus && matchInicio && matchFim;
    });
  }, [ferias, filter]);

  const saldosFiltrados = useMemo(() => {
    return saldosData.filter(s => 
      (s.nome_completo?.toLowerCase() || '').includes(filter.nome.toLowerCase())
    );
  }, [saldosData, filter]);

  // Slices paginados
  const paginatedEscala = escalaFiltrada.slice((currentPageEscala - 1) * itemsPerPage, currentPageEscala * itemsPerPage);
  const totalPagesEscala = Math.ceil(escalaFiltrada.length / itemsPerPage);

  const paginatedSaldos = saldosFiltrados.slice((currentPageSaldos - 1) * itemsPerPage, currentPageSaldos * itemsPerPage);
  const totalPagesSaldos = Math.ceil(saldosFiltrados.length / itemsPerPage);

  const metrics = useMemo(() => {
    return {
      emGozo: ferias.filter(f => {
        const hoje = new Date().toISOString().split('T')[0];
        return (f.status === 'Aprovada' || f.status === 'Aprovado') && hoje >= f.data_inicio && hoje <= f.data_fim;
      }).length,
      alertasSaldo: saldosData.filter(s => s.saldo >= 80).length,
      solicitacoesPendentes: ferias.filter(f => f.status === 'Solicitada' || f.status === 'Solicitado').length
    };
  }, [ferias, saldosData]);

  const handleOpenDetail = (f: any) => {
    setSelectedFerias(f);
    setIsDetailOpen(true);
  };

  const clearDateFilters = () => {
    setFilter({ ...filter, dataInicio: '', dataFim: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header e Indicadores */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Gestão de Férias</h2>
          <p className="text-sm text-gray-500 font-medium">Controle de disponibilidades (Acúmulo de +80h por aniversário)</p>
        </div>
        <div className="flex gap-2">
           <button onClick={fetchData} className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 transition-all shadow-sm">
             <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
           <button className="flex items-center gap-2 px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">
             <Download className="h-4 w-4" /> Exportar Relatório
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricSmall icon={TrendingUp} label="Cooperados em férias" value={metrics.emGozo} color="blue" />
        <MetricSmall icon={AlertCircle} label="Saldos Acumulados (>80h)" value={metrics.alertasSaldo} color="rose" />
        <MetricSmall icon={Clock} label="Solicitações Pendentes" value={metrics.solicitacoesPendentes} color="amber" />
      </div>

      {/* Navegação e Filtros */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-2xl w-full xl:w-auto h-fit">
          <button 
            onClick={() => setActiveTab('escala')}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'escala' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Calendar className="h-4 w-4" /> Escala Global
          </button>
          <button 
            onClick={() => setActiveTab('saldos')}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'saldos' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <PieChart className="h-4 w-4" /> Banco de Saldos
          </button>
        </div>

        <div className="flex flex-1 flex-wrap gap-4 w-full xl:w-auto items-end">
          <div className="flex-1 min-w-[200px] space-y-1.5">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Cooperado</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                placeholder="Buscar por nome..." 
                value={filter.nome}
                onChange={(e) => setFilter({...filter, nome: e.target.value})}
                className="form-input pl-11 rounded-2xl border-none bg-gray-50 dark:bg-gray-900/50 w-full font-medium h-12" 
              />
            </div>
          </div>

          {activeTab === 'escala' && (
            <>
              <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Início (Mesiano)</label>
                <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent focus-within:border-blue-500/30 transition-all h-12 flex items-center px-4">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                  <input 
                    type="month" 
                    value={filter.dataInicio}
                    onChange={(e) => setFilter({...filter, dataInicio: e.target.value})}
                    className="bg-transparent border-none p-0 text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5 min-w-[140px]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Término (Mesiano)</label>
                <div className="relative bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent focus-within:border-blue-500/30 transition-all h-12 flex items-center px-4">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 shrink-0" />
                  <input 
                    type="month" 
                    value={filter.dataFim}
                    onChange={(e) => setFilter({...filter, dataFim: e.target.value})}
                    className="bg-transparent border-none p-0 text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-0 w-full"
                  />
                  {(filter.dataInicio || filter.dataFim) && (
                    <button onClick={clearDateFilters} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-rose-500 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 min-w-[130px]">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Status</label>
                <select 
                  value={filter.status}
                  onChange={(e) => setFilter({...filter, status: e.target.value})}
                  className="form-select h-12 rounded-2xl border-none bg-gray-50 dark:bg-gray-900/50 font-black text-[10px] uppercase tracking-widest text-gray-500 shadow-sm"
                >
                  <option value="">Todos</option>
                  <option value="Planejada">Planejada</option>
                  <option value="Solicitado">Solicitado</option>
                  <option value="Aprovado">Aprovado</option>
                </select>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl h-12 flex items-center">
                <button onClick={() => setEscalaViewMode('list')} className={`p-2 rounded-lg transition-all ${escalaViewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-400'}`} title="Ver em Lista"><List className="h-4 w-4" /></button>
                <button onClick={() => setEscalaViewMode('card')} className={`p-2 rounded-lg transition-all ${escalaViewMode === 'card' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-400'}`} title="Ver em Cards"><LayoutGrid className="h-4 w-4" /></button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)}
        </div>
      ) : activeTab === 'escala' ? (
        <div className="space-y-4">
          {escalaViewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEscala.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-700">
                  <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold">Nenhum afastamento registrado para este período/filtro.</p>
                </div>
              ) : (
                paginatedEscala.map(f => <FeriasCard key={f.id} f={f} onClick={() => handleOpenDetail(f)} />)
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-900/50">
                      <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Cooperado</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Início</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Término</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Horas</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Alinhamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                    {paginatedEscala.length === 0 ? (
                      <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-400 font-bold italic">Nenhum registro encontrado para este período.</td></tr>
                    ) : paginatedEscala.map(f => (
                      <tr key={f.id} onClick={() => handleOpenDetail(f)} className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center">
                            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center text-blue-600 font-black mr-4 text-xs">
                              {f.cooperados?.nome_completo.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 dark:text-white leading-none text-sm">{f.cooperados?.nome_completo}</p>
                              <p className="text-[9px] text-gray-400 uppercase font-bold mt-1 tracking-tight">{f.cooperados?.funcao}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300 text-sm">{formatDateBR(f.data_inicio)}</td>
                        <td className="px-6 py-5 font-bold text-gray-600 dark:text-gray-300 text-sm">{formatDateBR(f.data_fim)}</td>
                        <td className="px-6 py-5 text-right font-black text-blue-600 dark:text-blue-400 text-sm">{f.horas}h</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            f.status === 'Aprovado' || f.status === 'Aprovada' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          {f.alinhado_cliente ? (
                            <span className="flex items-center justify-end text-[9px] font-black text-emerald-600 uppercase">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Alinhado
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-gray-400 uppercase italic">Pendente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <Pagination 
            currentPage={currentPageEscala} 
            totalPages={totalPagesEscala} 
            onPageChange={setCurrentPageEscala} 
            totalItems={escalaFiltrada.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Cooperado</th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Início Contrato</th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Direito Acumulado</th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Gozado/Aprovado</th>
                    <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Saldo Atual</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-center">Saúde Banco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                  {paginatedSaldos.map(s => (
                    <tr key={s.id} className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer">
                      <td className="px-8 py-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 font-black mr-4 shadow-sm">
                            {s.nome_completo.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white leading-none">{s.nome_completo}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-tight">{s.funcao}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-bold text-gray-500 text-sm">
                        {formatDateBR(s.data_inicio)}
                      </td>
                      <td className="px-6 py-6 text-right font-black text-gray-400">
                        {s.totalDireito}h
                      </td>
                      <td className="px-6 py-6 text-right font-black text-emerald-600">
                        {s.totalUsado}h
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className={`text-xl font-black tracking-tighter ${s.saldo >= 120 ? 'text-rose-600' : s.saldo >= 80 ? 'text-amber-500' : 'text-blue-600'}`}>
                          {s.saldo}h
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                          s.risco === 'Alto' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                          s.risco === 'Médio' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          {s.risco === 'Alto' ? 'Crítico' : s.risco === 'Médio' ? 'Atenção' : 'Saudável'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedSaldos.length === 0 && (
                    <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-400 font-bold italic">Nenhum registro encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <Pagination 
            currentPage={currentPageSaldos} 
            totalPages={totalPagesSaldos} 
            onPageChange={setCurrentPageSaldos} 
            totalItems={saldosFiltrados.length} 
            itemsPerPage={itemsPerPage} 
          />
        </div>
      )}

      {/* Modal de Detalhe */}
      <FeriasDetalheModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        ferias={selectedFerias} 
      />
    </div>
  );
}

function MetricSmall({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30",
    rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30",
    amber: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex items-center group transition-all hover:shadow-md">
      <div className={`p-3 rounded-2xl mr-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function FeriasCard({ f, onClick }: any) {
  const isAprovado = f.status === 'Aprovado' || f.status === 'Aprovada';
  const isGozo = isAprovado && new Date().toISOString().split('T')[0] >= f.data_inicio && new Date().toISOString().split('T')[0] <= f.data_fim;

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border-2 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group cursor-pointer ${isGozo ? 'border-blue-600 shadow-blue-500/10' : 'border-gray-50 dark:border-gray-700'}`}
    >
      {isGozo && (
        <div className="absolute top-0 right-0 px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
          Ativo Agora
        </div>
      )}
      
      <div className="flex items-center mb-6">
        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xl mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
          {f.cooperados?.nome_completo.charAt(0)}
        </div>
        <div>
          <h4 className="font-black text-gray-900 dark:text-white leading-tight text-lg truncate max-w-[160px]">{f.cooperados?.nome_completo}</h4>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{f.cooperados?.funcao}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Calendar className="h-5 w-5 text-blue-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Período</span>
            <span className="text-sm font-black text-gray-700 dark:text-gray-300">
              {formatDateBR(f.data_inicio)} — {formatDateBR(f.data_fim)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{f.horas} horas</span>
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase ${
            isAprovado ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }`}>
            {f.status}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          <UserCheck className="h-3.5 w-3.5 mr-1 text-blue-500" /> {f.registrado_por || 'Sistema'}
        </div>
        {f.alinhado_cliente && (
          <div className="flex items-center text-[10px] font-black text-emerald-500 uppercase tracking-tight">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Alinhado
          </div>
        )}
      </div>
    </div>
  );
}
