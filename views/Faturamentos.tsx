
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Search, RefreshCcw, FileDown, ReceiptText, Building, Briefcase, Edit, Trash2, TrendingUp, CheckCircle2, Calendar, DollarSign, Users, ArrowUp, ArrowDown, ArrowUpDown, BarChart3, List, Info, ChevronLeft, ChevronRight, AlertTriangle, Clock, ArrowRight, Wallet, UserCheck, Percent, UserPlus, History, User as UserIcon, CreditCard, Send, CheckSquare, ClipboardCheck, Columns, Kanban } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { FaturamentoFormModal, ConfirmDeleteModal, AlocacaoFormModal } from '../components/Modals';
import { sanitizePayload } from '../utils/helpers';

const formatMonth = (monthStr: string) => {
  if (!monthStr || typeof monthStr !== 'string') return '-';
  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;
  const [year, month] = parts;
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const monthIdx = parseInt(month, 10) - 1;
  const shortYear = year.substring(2);
  return `${monthNames[monthIdx]}/${shortYear}`;
};

const formatDateBRShort = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year.substring(2)}`;
};

const formatCurrency = (val: number | string) => {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num as number) || num === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num as number);
};

const formatCompactCurrency = (val: number) => {
  if (val === 0) return 'R$ 0';
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
  return `R$ ${val.toFixed(0)}`;
};

const getMonthsInRange = (start: string, end: string) => {
  if (!start || !end) return [];
  const months = [];
  try {
    let current = new Date(start + '-01T12:00:00');
    const last = new Date(end + '-01T12:00:00');
    if (isNaN(current.getTime()) || isNaN(last.getTime())) return [];
    let safety = 0;
    while (current <= last && safety < 120) {
      months.push(current.toISOString().substring(0, 7));
      current.setMonth(current.getMonth() + 1);
      safety++;
    }
  } catch (e) { return []; }
  return months;
};

const BILLING_STATUSES = [
  'Previsto',
  'Pendente',
  'Validado com Cliente',
  'Solicitação Enviada',
  'Nota Enviada',
  'Faturado'
];

export default function FaturamentosView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [faturamentos, setFaturamentos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<{message: string, isTimeout: boolean} | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'mes_referencia', direction: 'desc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [fatRes, cliRes, projRes] = await Promise.all([
        supabase
          .from('faturamentos')
          .select(`
            id, valor, valor_realizado, valor_nota, status, mes_referencia, 
            descricao, data_envio, data_pedido, data_nota, observacao,
            cliente_id, projeto_id,
            clientes(nome), 
            projetos(nome)
          `)
          .order('mes_referencia', { ascending: false })
          .limit(1000),
        supabase.from('clientes').select('id, nome, logo_data'),
        supabase.from('projetos').select('id, nome, cliente_id')
      ]);

      if (fatRes.error) throw fatRes.error;
      setFaturamentos(fatRes.data || []);
      setClientes(cliRes.data || []);
      setProjetos(projRes.data || []);
    } catch (e: any) {
      const isTimeout = e.code === '57014' || e.message?.includes('timeout') || e.message?.includes('Fetch');
      setFetchError({ 
        message: isTimeout ? "O servidor demorou muito para responder. Tente reduzir o filtro de data." : (e.message || "Erro ao conectar."), 
        isTimeout 
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [state.billingFilters]);

  const clientLogos = useMemo(() => {
    const map: Record<string, string> = {};
    clientes.forEach(c => { if (c.logo_data) map[c.id] = c.logo_data; });
    return map;
  }, [clientes]);

  const processed = useMemo(() => {
    const { query, status, mes, mesFim, viewType } = state.billingFilters;
    const searchLower = query.toLowerCase();
    const data = faturamentos.filter(f => {
      const nomeCliente = f.clientes?.nome?.toLowerCase() || '';
      const nomeProjeto = f.projetos?.nome?.toLowerCase() || '';
      const desc = f.descricao?.toLowerCase() || '';
      const matchQuery = !query || nomeCliente.includes(searchLower) || nomeProjeto.includes(searchLower) || desc.includes(searchLower);
      const matchStatus = !status || f.status === status;
      if (viewType === 'analytics') return matchQuery && matchStatus;
      const matchMesInicio = !mes || f.mes_referencia >= mes;
      const matchMesFim = !mesFim || f.mes_referencia <= mesFim;
      return matchQuery && matchStatus && matchMesInicio && matchMesFim;
    });

    return [...data].sort((a, b) => {
      const getVal = (obj: any, path: string) => path.split('.').reduce((acc, p) => acc?.[p], obj);
      const valA = getVal(a, sortConfig.key) ?? '';
      const valB = getVal(b, sortConfig.key) ?? '';
      if (valA === valB) return 0;
      const res = (valA < valB) ? -1 : 1;
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [faturamentos, state.billingFilters, sortConfig]);

  const summaryStats = useMemo(() => {
    let planejado = 0;
    let faturado = 0;
    let saldoEsperado = 0;
    processed.forEach(f => {
      const vPrevisto = Number(f.valor) || 0;
      const vRealizado = Number(f.valor_realizado) || 0;
      planejado += vPrevisto;
      if (f.status === 'Faturado') {
        faturado += (vRealizado || vPrevisto);
      } else {
        saldoEsperado += vPrevisto;
      }
    });
    return { planejado, faturado, saldoEsperado };
  }, [processed]);

  const totalPages = Math.ceil(processed.length / itemsPerPage);
  const paginatedData = processed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (payload: Partial<typeof state.billingFilters>) => {
    dispatch({ type: 'UPDATE_BILLING_FILTERS', payload });
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        const payload = sanitizePayload({
          cliente_id: data.clienteId,
          projeto_id: data.projetoId,
          valor: data.valor,
          valor_realizado: data.valorRealizado,
          status: data.status,
          mes_referencia: data.mesReferencia,
          descricao: data.descricao,
          data_envio: data.dataEnvio,
          data_pedido: data.dataPedido,
          data_nota: data.dataNota,
          observacao: data.observacao
        });
        const { error } = await supabase.from('faturamentos').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else if (data.mode === 'batch') {
        const months = getMonthsInRange(data.mesReferencia, data.mesFinal);
        const batchPayload = months.map(m => sanitizePayload({
          cliente_id: data.clienteId, projeto_id: data.projetoId, valor: data.valor, valor_realizado: 0, status: 'Previsto', mes_referencia: m, descricao: data.descricao, user_id: state.userId
        }));
        const { data: insertedFats, error: insertError } = await supabase.from('faturamentos').insert(batchPayload).select('id');
        if (insertError) throw insertError;

        if (data.projetoId && insertedFats) {
          const { data: projAlocs } = await supabase.from('alocacoes').select('*').eq('projeto_id', data.projetoId);
          if (projAlocs && projAlocs.length > 0) {
            const allAlocs = insertedFats.flatMap(fat => 
              projAlocs.map(a => ({
                faturamento_id: fat.id,
                cooperado_id: a.cooperado_id,
                percentual: a.percentual,
                valor_hora: a.valor_hora,
                horas_mensais: a.horas_mensais,
                registrado_por: state.userName || 'Sistema'
              }))
            );
            await supabase.from('faturamentos_alocacoes').insert(allAlocs);
          }
        }
      } else {
        const payload = sanitizePayload({
          cliente_id: data.clienteId, projeto_id: data.projetoId, valor: data.valor, valor_realizado: data.valorRealizado, status: data.status, mes_referencia: data.mesReferencia, data_envio: data.dataEnvio, data_pedido: data.dataPedido, descricao: data.descricao, data_nota: data.dataNota, observacao: data.observacao, user_id: state.userId
        });
        const { data: insertedFats, error: insertError } = await supabase.from('faturamentos').insert([payload]).select('id');
        if (insertError) throw insertError;

        if (data.projetoId && insertedFats?.[0]) {
          const { data: projAlocs } = await supabase.from('alocacoes').select('*').eq('projeto_id', data.projetoId);
          if (projAlocs && projAlocs.length > 0) {
            const alocPayload = projAlocs.map(a => ({
              faturamento_id: insertedFats[0].id,
              cooperado_id: a.cooperado_id,
              percentual: a.percentual,
              valor_hora: a.valor_hora,
              horas_mensais: a.horas_mensais,
              registrado_por: state.userName || 'Sistema'
            }));
            await supabase.from('faturamentos_alocacoes').insert(alocPayload);
          }
        }
      }
      fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
      addToast("Salvo com sucesso!");
    } catch (err: any) {
      addToast("Erro ao salvar: " + err.message, "error");
    }
  };

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 text-center animate-fade-in">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 text-rose-500 shadow-inner">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-black dark:text-white">Ops! Erro de Conexão</h3>
        <p className="text-gray-500 mt-3 font-medium max-w-sm">{fetchError.message}</p>
        <button onClick={fetchData} className="mt-8 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10 w-full max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Faturamento</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Gestão financeira de receitas e cronograma comercial.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex mr-2">
            <button onClick={() => handleFilterChange({ viewType: 'list' })} className={`p-2 rounded-lg transition-all ${state.billingFilters.viewType === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Ver em Lista"><List className="h-5 w-5" /></button>
            <button onClick={() => handleFilterChange({ viewType: 'kanban' })} className={`p-2 rounded-lg transition-all ${state.billingFilters.viewType === 'kanban' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Ver Kanban"><Kanban className="h-5 w-5" /></button>
            <button onClick={() => handleFilterChange({ viewType: 'analytics' })} className={`p-2 rounded-lg transition-all ${state.billingFilters.viewType === 'analytics' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Timeline Geral"><BarChart3 className="h-5 w-5" /></button>
          </div>
          <button className="px-6 py-2.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl font-black uppercase text-[11px] tracking-widest text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 flex items-center gap-2">
            <FileDown className="h-4 w-4" /> Exportar
          </button>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-lg active:scale-95 transition-all flex items-center gap-2"><Plus className="h-4 w-4 stroke-[3px]" /> Novo Registro</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCardSimple label="Valor Planejado (Total)" value={summaryStats.planejado} icon={TrendingUp} color="blue" />
        <SummaryCardSimple label="Valor Faturado" value={summaryStats.faturado} icon={ReceiptText} color="emerald" />
        <SummaryCardSimple label="Faturamento Esperado" value={summaryStats.saldoEsperado} icon={Clock} color="indigo" highlight />
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-[1.5rem] shadow-sm border dark:border-gray-700 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[250px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="Pesquisar por cliente, projeto, descrição..." value={state.billingFilters.query} onChange={e => handleFilterChange({ query: e.target.value })} className="form-input pl-11 rounded-xl border-none bg-gray-50 dark:bg-gray-900/50 py-2.5 font-medium" />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl">
           <div className="flex items-center gap-2 px-3">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">De</label>
             <input type="month" value={state.billingFilters.mes} onChange={e => handleFilterChange({ mes: e.target.value })} className="bg-transparent border-none p-0 font-bold text-xs focus:ring-0 text-gray-700 dark:text-gray-200" />
           </div>
           <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
           <div className="flex items-center gap-2 px-3">
             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Até</label>
             <input type="month" value={state.billingFilters.mesFim} onChange={e => handleFilterChange({ mesFim: e.target.value })} className="bg-transparent border-none p-0 font-bold text-xs focus:ring-0 text-gray-700 dark:text-gray-200" />
           </div>
        </div>
        <select value={state.billingFilters.status} onChange={e => handleFilterChange({ status: e.target.value })} className="form-select w-48 rounded-xl border-none bg-gray-50 dark:bg-gray-900/50 font-black text-[10px] uppercase text-gray-500">
           <option value="">Todos os Status</option>
           {BILLING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchData} className="p-2.5 text-gray-400 hover:text-blue-500"><RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
      </div>

      {state.billingFilters.viewType === 'analytics' ? (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-[2.5rem] p-4 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <BillingTimelineGraph data={processed} filter={state.billingFilters} logos={clientLogos} />
        </div>
      ) : state.billingFilters.viewType === 'kanban' ? (
        <KanbanView data={processed} onEdit={handleEditItem} />
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="overflow-x-auto no-scrollbar">
              <table className="min-w-full table-zebrado">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Cliente</th>
                    <SortHeader label="Projeto" skey="projetos.nome" cfg={sortConfig} set={setSortConfig} />
                    <SortHeader label="Vlr. Previsto" skey="valor" align="right" cfg={sortConfig} set={setSortConfig} />
                    <SortHeader label="Vlr. Realizado" skey="valor_realizado" align="right" cfg={sortConfig} set={setSortConfig} />
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Envio</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Conf.</th>
                    <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Nota</th>
                    <SortHeader label="Mês Ref." skey="mes_referencia" align="center" cfg={sortConfig} set={setSortConfig} />
                    <SortHeader label="Status" skey="status" align="center" cfg={sortConfig} set={setSortConfig} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {isLoading && faturamentos.length === 0 ? (
                    <tr><td colSpan={9} className="p-12"><Skeleton className="h-12 w-full rounded-xl" /></td></tr>
                  ) : paginatedData.length === 0 ? (
                    <tr><td colSpan={9} className="p-20 text-center text-gray-400 font-bold italic">Nenhum registro encontrado.</td></tr>
                  ) : paginatedData.map(f => {
                    const logo = clientLogos[f.cliente_id];
                    return (
                      <tr key={f.id} onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheFaturamento', id: f.id, label: `${f.clientes?.nome} - ${formatMonth(f.mes_referencia)}` } })} className="transition-colors group">
                        <td className="px-6 py-6">
                          {logo ? (
                            <img src={logo} className="h-14 w-auto object-contain grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                          ) : (
                            <Building className="h-10 w-10 text-gray-300" />
                          )}
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-2">
                             <Briefcase className="h-3 w-3 text-blue-300" />
                             <span className="font-black text-gray-900 dark:text-white text-sm truncate max-w-[120px] block leading-tight">{f.projetos?.nome || '-'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white whitespace-nowrap text-sm">{formatCurrency(f.valor)}</td>
                        <td className="px-6 py-6 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-sm">
                           {f.valor_realizado > 0 ? formatCurrency(f.valor_realizado) : <span className="text-gray-300 font-bold italic text-[10px] uppercase">-</span>}
                        </td>
                        <td className="px-4 py-6 text-center text-[10px] font-bold text-gray-400 uppercase">{formatDateBRShort(f.data_envio)}</td>
                        <td className="px-4 py-6 text-center text-[10px] font-bold text-gray-400 uppercase">{formatDateBRShort(f.data_pedido)}</td>
                        <td className="px-4 py-6 text-center text-[10px] font-bold text-gray-400 uppercase">{formatDateBRShort(f.data_nota)}</td>
                        <td className="px-6 py-6 text-center font-bold text-gray-400 text-xs whitespace-nowrap uppercase">{formatMonth(f.mes_referencia)}</td>
                        <td className="px-6 py-6 text-center"><BadgeSmall status={f.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={processed.length} itemsPerPage={itemsPerPage} />
        </div>
      )}

      {isModalOpen && <FaturamentoFormModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        onSave={handleSave} 
        clientes={clientes} 
        projetos={projetos} 
        item={editingItem} 
      />}
    </div>
  );
}

function SummaryCardSimple({ label, value, icon: Icon, color, highlight = false }: any) {
  const colors: any = { blue: "text-blue-500", emerald: "text-emerald-500", indigo: "text-indigo-600" };
  if (highlight) {
    return (
      <div className="bg-[#0b1b36] p-8 rounded-[2rem] shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
           <Icon className="h-16 w-16 text-white" />
        </div>
        <div className="flex items-center gap-2 mb-4">
           <div className="p-2 bg-white/10 rounded-lg"><Icon className="h-4 w-4 text-white" /></div>
           <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{label}</p>
        </div>
        <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(value)}</p>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg group">
      <div className="flex items-center gap-2 mb-4">
         <Icon className={`h-4 w-4 ${colors[color]}`} />
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{formatCurrency(value)}</p>
    </div>
  );
}

const KanbanView: React.FC<{ data: any[], onEdit: (item: any) => void }> = ({ data, onEdit }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={scrollRef} className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
      {BILLING_STATUSES.map(status => (
        <KanbanColumn 
          key={status} 
          status={status} 
          items={data.filter(f => f.status === status)} 
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

const KanbanColumn: React.FC<{ status: string, items: any[], onEdit: (item: any) => void }> = ({ status, items, onEdit }) => {
  const statusColors: any = { 'Previsto': 'border-gray-200 bg-gray-50/50', 'Pendente': 'border-rose-200 bg-rose-50/30', 'Validado com Cliente': 'border-amber-200 bg-amber-50/30', 'Solicitação Enviada': 'border-indigo-200 bg-indigo-50/30', 'Nota Enviada': 'border-blue-200 bg-blue-50/30', 'Faturado': 'border-emerald-200 bg-emerald-50/30' };
  const statusIcons: any = { 'Previsto': Calendar, 'Pendente': Clock, 'Validado com Cliente': ClipboardCheck, 'Solicitação Enviada': Send, 'Nota Enviada': ReceiptText, 'Faturado': CheckCircle2 };
  const Icon = statusIcons[status] || Info;
  const totalValue = useMemo(() => items.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0), [items]);
  return (
    <div className="flex-shrink-0 w-[320px] snap-start flex flex-col gap-4">
      <div className={`p-4 rounded-[1.5rem] border-2 ${statusColors[status] || 'border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{status}</h3>
           </div>
           <span className="bg-white dark:bg-gray-800 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-sm border dark:border-gray-700">{items.length}</span>
        </div>
        <p className="text-sm font-black text-gray-400 tracking-tighter">{formatCurrency(totalValue)}</p>
      </div>
      <div className="flex-1 space-y-4">
        {items.map(item => (
          <KanbanCard key={item.id} item={item} onEdit={onEdit} />
        ))}
        {items.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] text-gray-300 font-black uppercase text-[9px] tracking-widest">Vazio</div>
        )}
      </div>
    </div>
  );
}

const KanbanCard: React.FC<{ item: any, onEdit: (item: any) => void }> = ({ item, onEdit }) => {
  const logo = item.clientes?.logo_data;
  const valor = Number(item.valor) || 0;
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer relative overflow-hidden" onClick={() => onEdit(item)}>
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg shadow-xl"><Edit className="h-4 w-4" /></div></div>
      <div className="flex items-center gap-3 mb-4">
        {logo ? (
          <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-inner shrink-0 p-0.5">
            <img src={logo} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 shrink-0 rounded-xl">
             <Building className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <div className="truncate">
           <h4 className="font-black text-gray-900 dark:text-white text-sm tracking-tight truncate leading-tight">{item.projetos?.nome || '-'}</h4>
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">{item.clientes?.nome}</p>
        </div>
      </div>
      <div className="space-y-3">
         <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Referência</span>
            <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">{formatMonth(item.mes_referencia)}</span>
         </div>
         <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Montante</p>
              <p className="text-base font-black text-blue-600 dark:text-blue-400 tracking-tighter">{formatCurrency(valor)}</p>
            </div>
         </div>
      </div>
      <div className="mt-4 pt-3 border-t dark:border-gray-700">
        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Alterar Status</label>
        <select className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-[10px] font-black text-blue-500 py-1.5 focus:ring-0 cursor-pointer" value={item.status} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onEdit({ ...item, status: e.target.value }); }}>
          {BILLING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

export function FaturamentoDetalheView({ faturamentoId }: { faturamentoId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [faturamento, setFaturamento] = useState<any>(null);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tab, setTab] = useState('dados');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const fetchFaturamento = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faturamentos')
        .select('*, clientes(nome, logo_data), projetos(id, nome, status)')
        .eq('id', faturamentoId)
        .single();
      if (error) throw error;
      setFaturamento(data);

      const [projRes, cliRes] = await Promise.all([
        supabase.from('projetos').select('id, nome, cliente_id'),
        supabase.from('clientes').select('id, nome')
      ]);
      setProjetos(projRes.data || []);
      setClientes(cliRes.data || []);
    } catch (err: any) {
      addToast("Erro ao carregar detalhes: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [faturamentoId, supabase, addToast]);

  useEffect(() => { if (faturamentoId) fetchFaturamento(); }, [faturamentoId, fetchFaturamento]);

  const handleUpdate = async (data: any) => {
    try {
      const old = faturamento;
      const changedFields = [];
      const fieldsToWatch = [
        { key: 'cliente_id', label: 'Cliente', format: (id: any) => clientes.find(c => c.id === id)?.nome || id },
        { key: 'projeto_id', label: 'Projeto', format: (id: any) => projetos.find(p => p.id === id)?.nome || id },
        { key: 'valor', label: 'Valor Previsto', format: formatCurrency },
        { key: 'valor_realizado', label: 'Valor Faturado', format: formatCurrency },
        { key: 'status', label: 'Status' },
        { key: 'mes_referencia', label: 'Mês de Referência', format: formatMonth },
        { key: 'data_envio', label: 'Data de Envio' },
        { key: 'data_pedido', label: 'Confirmação Pedido' },
        { key: 'data_nota', label: 'Data da Nota' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'observacao', label: 'Observação' }
      ];

      fieldsToWatch.forEach(field => {
        const newVal = data[field.key === 'cliente_id' ? 'clienteId' : field.key === 'projeto_id' ? 'projetoId' : field.key === 'valor_realizado' ? 'valorRealizado' : field.key === 'mes_referencia' ? 'mesReferencia' : field.key === 'data_nota' ? 'dataNota' : field.key === 'data_envio' ? 'dataEnvio' : field.key === 'data_pedido' ? 'dataPedido' : field.key];
        const oldVal = old[field.key];
        if (newVal != oldVal && (newVal !== '' || oldVal !== null)) {
          changedFields.push({
            faturamento_id: faturamentoId,
            campo: field.label,
            valor_antigo: field.format ? field.format(oldVal) : String(oldVal || '-'),
            valor_novo: field.format ? field.format(newVal) : String(newVal || '-'),
            usuario: state.userName || 'Sistema'
          });
        }
      });

      const payload = sanitizePayload({
        cliente_id: data.clienteId,
        projeto_id: data.projetoId,
        valor: data.valor,
        valor_realizado: data.valorRealizado,
        status: data.status,
        mes_referencia: data.mesReferencia,
        descricao: data.descricao,
        data_envio: data.dataEnvio,
        data_pedido: data.dataPedido,
        data_nota: data.dataNota,
        observacao: data.observacao
      });

      const { error } = await supabase.from('faturamentos').update(payload).eq('id', faturamentoId);
      if (error) throw error;
      if (changedFields.length > 0) await supabase.from('faturamentos_historico').insert(changedFields);
      addToast("Faturamento atualizado!");
      setIsEditModalOpen(false);
      fetchFaturamento();
    } catch (err: any) { addToast(`Erro ao atualizar: ${err.message}`, "error"); }
  };

  if (isLoading || !faturamento) return <div className="p-10"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-xl border border-blue-100 dark:border-blue-800"><ReceiptText className="h-10 w-10" /></div>
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'faturamentos' } })} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all group">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px] group-hover:-translate-x-1 transition-transform"/> Voltar
            </button>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{faturamento.clientes?.nome}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-1 flex items-center gap-2">
              <Calendar className="h-3 w-3" /> Ref: {formatMonth(faturamento.mes_referencia)} — {faturamento.projetos?.nome || 'Faturamento Direto'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"><Edit className="h-4 w-4 mr-2" /> Editar</button>
          <button onClick={() => setIsConfirmDeleteOpen(true)} className="flex items-center px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"><Trash2 className="h-4 w-4 mr-2" /> Excluir</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[ {id:'dados', label:'Dados do Faturamento', icon:DollarSign}, {id:'alocacao', label:'Alocação e Custos Reais', icon:Users}, {id:'historico', label:'Log de Alterações', icon:History} ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4 mr-2"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 min-h-[500px] animate-fade-in relative overflow-hidden">
        {tab === 'dados' ? <TabDadosFaturamento faturamento={faturamento} /> : tab === 'alocacao' ? <TabAlocacaoFaturamento faturamento={faturamento} refreshDetail={fetchFaturamento} /> : <TabHistoricoFaturamento faturamentoId={faturamentoId} />}
      </div>

      {isEditModalOpen && <FaturamentoFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdate} clientes={clientes} projetos={projetos} item={faturamento} />}
      {isConfirmDeleteOpen && <ConfirmDeleteModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={async () => { await supabase.from('faturamentos').delete().eq('id', faturamentoId); addToast("Removido."); dispatch({ type: 'NAVIGATE', payload: { view: 'faturamentos' } }); }} title="Excluir Faturamento" message="Tem certeza?" />}
    </div>
  );
}

function TabDadosFaturamento({ faturamento }: any) {
  return (
    <div className="animate-fade-in space-y-12">
      {/* HEADER DE PLANEJAMENTO */}
      <div className="bg-white dark:bg-gray-900/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Calendar className="h-4 w-4" /> Planejamento Inicial
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DetailBox label="Valor Previsto Contratual" value={formatCurrency(faturamento.valor)} icon={Wallet} color="text-blue-600" />
          <DetailBox label="Mês Referência" value={formatMonth(faturamento.mes_referencia)} icon={Calendar} />
          <DetailBox label="Status do Fluxo" value={faturamento.status} icon={Info} />
        </div>
      </div>

      {/* ESTEIRA DE ETAPAS (STEPPER) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Etapa 1: Envio */}
        <div className="flex flex-col h-full">
           <div className="bg-indigo-600 rounded-t-[2.5rem] px-8 py-3 shadow-lg relative z-10">
              <h5 className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <Send className="h-3 w-3" /> 1. Validação & Envio
              </h5>
           </div>
           <div className="flex-1 p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-b-[2.5rem] border-x-2 border-b-2 border-indigo-100 dark:border-indigo-800/40 shadow-inner space-y-6">
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Vlr. Faturado (Enviado)</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                  {faturamento.valor_realizado ? formatCurrency(faturamento.valor_realizado) : '-'}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Data de Envio</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {faturamento.data_envio ? new Date(faturamento.data_envio + 'T12:00:00').toLocaleDateString() : 'Aguardando'}
                </p>
              </div>
           </div>
        </div>

        {/* Etapa 2: Confirmação */}
        <div className="flex flex-col h-full">
           <div className="bg-amber-500 rounded-t-[2.5rem] px-8 py-3 shadow-lg relative z-10">
              <h5 className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <CheckSquare className="h-3 w-3" /> 2. Confirmação do Pedido
              </h5>
           </div>
           <div className="flex-1 p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-b-[2.5rem] border-x-2 border-b-2 border-amber-100 dark:border-amber-800/40 shadow-inner space-y-6">
              <div>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-2">Data da Confirmação</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tighter">
                  {faturamento.data_pedido ? new Date(faturamento.data_pedido + 'T12:00:00').toLocaleDateString() : 'Pendente'}
                </p>
              </div>
              <div className="flex items-center gap-2 py-3 px-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-amber-100 dark:border-amber-800/50 opacity-60">
                 <Info className="h-4 w-4 text-amber-500" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Autorização de faturamento</span>
              </div>
           </div>
        </div>

        {/* Etapa 3: Nota */}
        <div className="flex flex-col h-full">
           <div className="bg-blue-600 rounded-t-[2.5rem] px-8 py-3 shadow-lg relative z-10">
              <h5 className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <ReceiptText className="h-3 w-3" /> 3. Faturamento (Nota)
              </h5>
           </div>
           <div className="flex-1 p-8 bg-blue-50/50 dark:bg-blue-900/10 rounded-b-[2.5rem] border-x-2 border-b-2 border-blue-100 dark:border-blue-800/40 shadow-inner space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2">Data da Nota Fiscal</span>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {faturamento.data_nota ? new Date(faturamento.data_nota + 'T12:00:00').toLocaleDateString() : 'Pendente'}
                  </p>
                </div>
              </div>
              {faturamento.status === 'Faturado' && (
                <div className="flex items-center gap-2 py-3 px-4 bg-emerald-600 rounded-2xl text-white shadow-xl animate-fade-in">
                   <CheckCircle2 className="h-5 w-5" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Processo Faturado</span>
                </div>
              )}
           </div>
        </div>

      </div>
      
      <div className="p-8 bg-gray-50 dark:bg-gray-950/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Notas e Observações Internas</h4>
        <p className="font-bold text-gray-900 dark:text-white leading-relaxed mb-4">{faturamento.descricao || 'Nenhuma descrição detalhada.'}</p>
        <p className="text-sm text-gray-500 italic">{faturamento.observacao || 'Nenhuma observação interna registrada.'}</p>
      </div>
    </div>
  );
}

function TabAlocacaoFaturamento({ faturamento, refreshDetail }: any) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [alocacoes, setAlocacoes] = useState<any[]>([]);
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlocModalOpen, setIsAlocModalOpen] = useState(false);
  const [editingAloc, setEditingAloc] = useState<any>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [alocIdToDelete, setAlocIdToDelete] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const coopsRes = await supabase.from('cooperados').select('id, nome_completo, funcao, status').order('nome_completo');
      if (coopsRes.data) setCooperados(coopsRes.data);
      const { data: fatAlocs } = await supabase.from('faturamentos_alocacoes').select('*, cooperados(id, nome_completo, funcao)').eq('faturamento_id', faturamento.id);
      if (fatAlocs) {
        setAlocacoes(fatAlocs.map(a => ({ ...a, totalCusto: Number(a.horas_mensais || 0) * Number(a.valor_hora || 0) })));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [faturamento, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveAloc = async (data: any) => {
    try {
      const payload = { faturamento_id: faturamento.id, cooperado_id: data.cooperadoId, percentual: Number(data.percentual || 100), valor_hora: Number(data.valorHora), horas_mensais: Number(data.horasMensais || 0), registrado_por: state.userName };
      if (editingAloc) {
        const { error } = await supabase.from('faturamentos_alocacoes').update(payload).eq('id', editingAloc.id);
        if (error) throw error;
      } else {
        const { error = null } = await supabase.from('faturamentos_alocacoes').insert([payload]);
        if (error) throw error;
      }
      setIsAlocModalOpen(false);
      setEditingAloc(null);
      await fetchData();
      addToast("Custos operacionais atualizados!");
    } catch (err: any) { addToast(`Erro ao salvar alocação: ${err.message}`, "error"); }
  };

  const handleDeleteAloc = async () => {
    if (!alocIdToDelete) return;
    try {
      const { error } = await supabase.from('faturamentos_alocacoes').delete().eq('id', alocIdToDelete);
      if (error) throw error;
      await fetchData();
      addToast("Alocação removida!");
    } catch (err: any) { addToast(err.message, "error"); } finally { setIsConfirmDeleteOpen(false); setAlocIdToDelete(null); }
  };

  const totalCusto = useMemo(() => alocacoes.reduce((acc, curr) => acc + (Number(curr.totalCusto) || 0), 0), [alocacoes]);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Custos Reais Operacionais</h3>
          <p className="text-sm text-gray-500 font-medium">Estes dados são exclusivos deste faturamento e baseados em horas e taxa por profissional.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setEditingAloc(null); setIsAlocModalOpen(true); }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><UserPlus className="h-4 w-4" /> Nova Alocação</button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissional</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Horas</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Taxa/h</th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Custo</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {alocacoes.length === 0 ? ( <tr><td colSpan={5} className="px-8 py-12 text-center text-gray-400 italic">Sem custos alocados.</td></tr> ) : alocacoes.map(a => (
              <tr key={a.id} className="hover:bg-blue-50/20 group transition-colors">
                <td className="px-8 py-6"><p className="font-black text-gray-800 dark:text-white text-base leading-none">{a.cooperados?.nome_completo}</p><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{a.cooperados?.funcao}</p></td>
                <td className="px-6 py-6 text-center"><span className="font-black text-blue-600">{Number(a.horas_mensais || 0).toFixed(1)}h</span></td>
                <td className="px-6 py-6 text-right font-bold text-gray-500">{formatCurrency(a.valor_hora || 0)}</td>
                <td className="px-8 py-6 text-right font-black text-gray-900 dark:text-white">{formatCurrency(a.totalCusto || 0)}</td>
                <td className="px-6 py-6 text-right opacity-0 group-hover:opacity-100 transition-opacity"><div className="flex gap-2 justify-end"><button onClick={() => { setEditingAloc(a); setIsAlocModalOpen(true); }} className="p-2 text-blue-400 hover:text-blue-600"><Edit className="h-4 w-4"/></button><button onClick={() => { setAlocIdToDelete(a.id); setIsConfirmDeleteOpen(true); }} className="p-2 text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4"/></button></div></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-950/50 border-t">
            <tr><td colSpan={3} className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase">Custo Operacional Total</td><td className="px-8 py-6 text-right font-black text-rose-600 text-2xl tracking-tighter">{formatCurrency(totalCusto)}</td><td></td></tr>
          </tfoot>
        </table>
      </div>
      {isAlocModalOpen && <AlocacaoFormModal isOpen={isAlocModalOpen} onClose={() => setIsAlocModalOpen(false)} onSave={handleSaveAloc} cooperados={cooperados} hideDates={true} item={editingAloc ? { cooperado_id: editingAloc.cooperado_id, percentual: editingAloc.percentual, valor_hora: editingAloc.valor_hora, horas_mensais: editingAloc.horas_mensais } : undefined} />}
      {isConfirmDeleteOpen && <ConfirmDeleteModal isOpen={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} onConfirm={handleDeleteAloc} title="Remover Custo" message="Tem certeza que deseja remover esta alocação de custo deste faturamento?" />}
    </div>
  );
}

function TabHistoricoFaturamento({ faturamentoId }: { faturamentoId: string }) {
  const { supabase } = useAppContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from('faturamentos_historico').select('*').eq('faturamento_id', faturamentoId).order('data_alteracao', { ascending: false }).then(res => { setLogs(res.data || []); setLoading(false); }); }, [faturamentoId, supabase]);
  if (loading) return <Skeleton className="h-64 w-full rounded-3xl" />;
  return (
    <div className="animate-fade-in space-y-10">
      <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Histórico de Auditoria</h3>
      {logs.length === 0 ? ( <div className="py-20 text-center bg-gray-50 dark:bg-gray-950/40 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800"> <History className="h-12 w-12 text-gray-200 mx-auto mb-4" /> <p className="text-gray-400 font-bold italic">Nenhuma alteração registrada.</p> </div> ) : (
        <div className="relative pl-8 border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-8">
          {logs.map(log => (
            <div key={log.id} className="relative">
              <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-gray-900 shadow-sm"></div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest">{log.campo}</p>
                  <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded-md border dark:border-gray-700"> {new Date(log.data_alteracao).toLocaleString('pt-BR')} </span>
                </div>
                <h4 className="text-gray-900 dark:text-white font-bold mb-2">Alterado por <span className="text-blue-500">{log.usuario}</span></h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-xs text-gray-500 line-through truncate">{log.valor_antigo || '-'}</div>
                  <div className="text-xs font-black text-blue-600 truncate">{log.valor_novo || '-'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-inner">
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        <Icon className="h-3 w-3" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-black tracking-tight ${color || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function BadgeSmall({ status }: { status: string }) {
  const colors: any = { Faturado: "bg-emerald-50 text-emerald-600 border-emerald-100", "Nota Enviada": "bg-blue-50 text-blue-600 border-blue-100", "Solicitação Enviada": "bg-indigo-50 text-indigo-600 border-indigo-100", "Validado com Cliente": "bg-amber-50 text-amber-600 border-amber-100", "Pendente": "bg-rose-50 text-rose-600 border-rose-100", "Previsto": "bg-gray-50 text-gray-400 border-gray-200", default: "bg-gray-50 text-gray-400 border-gray-100" };
  return <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-tight ${colors[status] || colors.default}`}>{status}</span>;
}

function SortHeader({ label, skey, align = 'left', cfg, set }: any) {
  const isSelected = cfg.key === skey;
  return (
    <th onClick={() => set({ key: skey, direction: isSelected && cfg.direction === 'asc' ? 'desc' : 'asc' })} className={`px-4 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}> {label} {isSelected ? (cfg.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />} </div>
    </th>
  );
}

function BillingTimelineGraph({ data, filter, logos }: { data: any[], filter: any, logos: Record<string, string> }) {
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const scrollRef = useRef<HTMLDivElement>(null);
  const months = useMemo(() => getMonthsInRange(filter.mes, filter.mesFim), [filter.mes, filter.mesFim]);
  const projects = useMemo(() => {
    const grouped: Record<string, any> = {};
    data.forEach(f => {
      const key = f.projeto_id || 'unassigned';
      if (!grouped[key]) grouped[key] = { id: key, nome: f.projetos?.nome || 'Direto', cliente: f.clientes?.nome || '-', logo: logos[f.cliente_id], billings: {} };
      const val = Number(f.valor_realizado) || Number(f.valor) || 0;
      if (val > 0) grouped[key].billings[f.mes_referencia] = (grouped[key].billings[f.mes_referencia] || 0) + val;
    });
    return Object.values(grouped).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
  }, [data, logos]);
  if (months.length === 0) return <div className="p-20 text-center font-bold text-gray-400">Intervalo inválido.</div>;
  return (
    <div className="relative overflow-x-auto no-scrollbar rounded-[1.5rem] bg-gray-50/50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800" ref={scrollRef}>
      <table className="min-w-full border-collapse table-fixed table-zebrado">
        <thead>
          <tr className="bg-gray-900 dark:bg-black text-white">
            <th className="sticky left-0 z-20 bg-gray-900 dark:bg-black p-4 text-left text-[10px] font-black uppercase w-[250px] border-r border-white/10">Projeto / Cliente</th>
            {months.map(m => <th key={m} className={`p-4 min-w-[120px] text-center text-[10px] font-black text-gray-500 uppercase border-l border-white/5 ${m === currentMonthStr ? 'bg-orange-600' : ''}`}>{formatMonth(m)}</th>)}
          </tr>
        </thead>
        <tbody>
          {projects.map((p: any) => (
            <tr key={p.id} className="group transition-colors">
              <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 group-even:bg-gray-50 dark:group-even:bg-gray-800 p-4 border-r border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3"> 
                  {p.logo ? (
                    <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 shadow-sm">
                      <img src={p.logo} className="p-0.5 object-contain h-full w-full" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 rounded-lg">
                      <Building className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                  <div className="truncate">
                    <p className="font-black text-xs text-gray-900 dark:text-white leading-tight truncate">{p.nome}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{p.cliente}</p>
                  </div> 
                </div>
              </td>
              {months.map(m => { const val = p.billings[m]; return <td key={m} className={`p-1 border-l border-gray-100 dark:border-white/5 ${m === currentMonthStr ? 'bg-orange-500/5' : ''}`}>{val && <div className="h-10 w-full rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] shadow-lg">{formatCompactCurrency(val)}</div>}</td>; })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
