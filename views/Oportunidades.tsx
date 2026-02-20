
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Plus, Search, RefreshCcw, Target, Building, Edit, Trash2, Calendar, 
  DollarSign, ArrowRight, List, Info, ChevronRight, AlertTriangle, 
  Clock, Mail, MessageSquare, Kanban, CheckCircle2, XCircle, Send, 
  User, History, TrendingUp, Sparkles, Filter, LayoutGrid, CheckSquare, 
  UserCheck, MapPin, Briefcase, Wallet, Users, ChevronDown, UserPlus, InfoIcon, Star,
  Triangle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { OportunidadeFormModal, ConfirmDeleteModal, OportunidadeContatoFormModal } from '../components/Modals';
import { formatCurrencyBRL, displayValue } from '../utils/helpers';

const FASES_CRM = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'];
const ANOS_FILTRO = ['2024', '2025', '2026', '2027'];

export default function OportunidadesView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  
  if (state.view === 'detalheOportunidade' && state.selectedId) {
    return <OportunidadeDetalheView oportunidadeId={state.selectedId} />;
  }

  const [oportunidades, setOportunidades] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'kanban' | 'list' | 'pyramid'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [opRes, cliRes] = await Promise.all([
        supabase.from('oportunidades').select('*, clientes(nome, logo_data)').order('created_at', { ascending: false }),
        supabase.from('clientes').select('id, nome, logo_data')
      ]);
      if (opRes.error) throw opRes.error;
      setOportunidades(opRes.data || []);
      setClientes(cliRes.data || []);
    } catch (e: any) {
      addToast("Erro ao carregar dados: " + e.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = op.titulo.toLowerCase().includes(searchStr) || 
        (op.clientes?.nome || op.nome_prospect || '').toLowerCase().includes(searchStr);
      
      const opYear = new Date(op.created_at).getFullYear().toString();
      const matchesYear = selectedYear === "" || opYear === selectedYear;

      return matchesSearch && matchesYear;
    });
  }, [oportunidades, searchTerm, selectedYear]);

  const totalValorPipeline = useMemo(() => {
    return filteredOportunidades.reduce((acc, curr) => acc + (Number(curr.valor_estimado) || 0), 0);
  }, [filteredOportunidades]);

  const handleSave = async (data: any) => {
    try {
      const payload = {
        titulo: data.titulo,
        cliente_id: data.clienteId || null,
        nome_prospect: data.nomeProspect,
        valor_estimado: data.valorEstimado,
        fase: data.fase,
        descricao: data.descricao,
        data_fechamento_estimada: data.dataFechamentoEstimada || null,
        user_id: state.userId,
        registrado_por: state.userName
      };

      const { data: opData, error } = await supabase.from('oportunidades').insert([payload]).select('id').single();
      if (error) throw error;
      
      addToast("Nova oportunidade criada com sucesso!");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast("Erro ao salvar: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Pipeline Comercial</h2>
          <p className="text-sm text-gray-500 mt-2 font-medium">Gestão inteligente de negociações.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-1 items-center gap-4">
            <SummarySmall icon={Target} label="Total de Oportunidades" value={filteredOportunidades.length} color="blue" />
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-700 hidden sm:block"></div>
            <SummarySmall icon={DollarSign} label="Pipeline Total" value={`R$ ${totalValorPipeline.toLocaleString('pt-BR')}`} color="indigo" />
          </div>

          <div className="flex gap-2 h-fit">
            <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex">
              <button onClick={() => setViewType('kanban')} className={`p-2.5 rounded-xl transition-all ${viewType === 'kanban' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Kanban"><Kanban className="h-5 w-5" /></button>
              <button onClick={() => setViewType('pyramid')} className={`p-2.5 rounded-xl transition-all ${viewType === 'pyramid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Pirâmide Comercial"><Triangle className="h-5 w-5" /></button>
              <button onClick={() => setViewType('list')} className={`p-2.5 rounded-xl transition-all ${viewType === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`} title="Lista"><List className="h-5 w-5" /></button>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-xl active:scale-95 transition-all"><Plus className="h-5 w-5 mr-2 inline stroke-[3px]" /> Nova</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded-[2rem] shadow-sm border dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            placeholder="Pesquisar por título, cliente ou prospect..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="form-input pl-12 rounded-[1.5rem] border-none bg-gray-50 dark:bg-gray-900/50 py-4 font-semibold text-sm shadow-inner" 
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-2xl">
           <Filter className="h-4 w-4 text-gray-400 ml-3" />
           <select 
             value={selectedYear} 
             onChange={e => setSelectedYear(e.target.value)}
             className="bg-transparent border-none py-2 px-3 font-black text-[10px] uppercase tracking-widest focus:ring-0 text-gray-500 cursor-pointer"
           >
              <option value="">Todos os Anos</option>
              {ANOS_FILTRO.map(ano => <option key={ano} value={ano}>Ano: {ano}</option>)}
           </select>
        </div>
        <button onClick={fetchData} className="p-4 text-gray-400 hover:text-indigo-500 transition-colors"><RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} /></button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /><Skeleton className="h-64 rounded-3xl" /></div>
      ) : viewType === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
          {FASES_CRM.map(fase => (
            <KanbanColumn 
              key={fase} 
              fase={fase} 
              items={filteredOportunidades.filter(op => op.fase === fase)} 
              onClick={item => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheOportunidade', id: item.id, label: item.titulo } })}
            />
          ))}
        </div>
      ) : viewType === 'pyramid' ? (
        <div className="py-10 animate-grow">
           <PipelinePyramid data={filteredOportunidades} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
          <table className="min-w-full table-zebrado">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Título / Oportunidade</th>
                <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Fase Comercial</th>
                <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Vlr. Estimado</th>
                <th className="px-10 py-7 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOportunidades.length === 0 ? (
                <tr><td colSpan={4} className="p-24 text-center text-gray-400 font-bold italic">Nenhuma negociação localizada.</td></tr>
              ) : filteredOportunidades.map(op => (
                <tr key={op.id} onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheOportunidade', id: op.id, label: op.titulo } })} className="group transition-all">
                  <td className="px-10 py-6">
                    <p className="font-black text-gray-900 dark:text-white text-lg tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">{op.titulo}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1.5">
                      <Building className="h-3 w-3" /> {op.clientes?.nome || op.nome_prospect || 'Sem Prospect'}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <span className="px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase border border-indigo-100 dark:border-indigo-800 shadow-sm">{op.fase}</span>
                  </td>
                  <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white text-base tracking-tighter">
                    R$ {op.valor_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all inline-flex shadow-sm">
                      <ArrowRight className="h-4 w-4 stroke-[3px]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && <OportunidadeFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clientes={clientes} />}
    </div>
  );
}

function PipelinePyramid({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    return FASES_CRM.map((fase, index) => {
      const items = data.filter(op => op.fase === fase);
      const valor = items.reduce((acc, curr) => acc + (Number(curr.valor_estimado) || 0), 0);
      return { fase, count: items.length, valor, index };
    });
  }, [data]);

  const maxVal = Math.max(...stats.map(s => s.count), 1);

  return (
    <div className="flex flex-col items-center space-y-2 max-w-4xl mx-auto">
      {stats.map((s, i) => {
        // Lógica de largura da pirâmide: as primeiras fases são mais largas
        const widthPercent = 100 - (i * 12);
        const opacity = 1 - (i * 0.1);
        
        return (
          <div 
            key={s.fase} 
            className="relative flex items-center justify-center group transition-all duration-500 hover:scale-[1.02]"
            style={{ width: `${widthPercent}%`, minWidth: '300px' }}
          >
            {/* Camada da Pirâmide com Clip Path para efeito trapezoidal */}
            <div 
              className="h-28 flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-2xl border border-white/20"
              style={{
                backgroundColor: `rgba(79, 70, 229, ${opacity})`,
                clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
                width: '100%'
              }}
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
               
               <div className="relative z-10 text-center px-4">
                 <h4 className="text-white font-black uppercase text-[11px] tracking-[0.2em] mb-1">{s.fase}</h4>
                 <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-white text-3xl font-black tracking-tighter leading-none">{s.count}</span>
                       <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-1">Cards</span>
                    </div>
                    <div className="w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col items-start">
                       <span className="text-white text-lg font-black tracking-tight leading-none">R$ {s.valor.toLocaleString('pt-BR')}</span>
                       <span className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-1">Valor Estimado</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        );
      })}
      
      {/* Base da Pirâmide lúdica */}
      <div className="w-20 h-2 bg-indigo-900/20 rounded-full blur-md mt-4"></div>
      
      <div className="mt-12 p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/30 max-w-2xl text-center">
         <Sparkles className="h-6 w-6 text-indigo-500 mx-auto mb-4" />
         <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300 tracking-tight leading-relaxed">
           A Pirâmide Comercial ajuda a identificar gargalos. <br/>
           Idealmente, sua base superior (Prospecção) deve ser larga o suficiente para alimentar as fases de fechamento.
         </p>
      </div>
    </div>
  );
}

function SummarySmall({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3">
       <div className={`p-2 rounded-xl bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600`}><Icon className="h-4 w-4" /></div>
       <div className="flex flex-col">
         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</span>
         <span className="text-sm font-black text-gray-900 dark:text-white leading-none mt-0.5">{value}</span>
       </div>
    </div>
  );
}

function OportunidadeDetalheView({ oportunidadeId }: { oportunidadeId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [op, setOp] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dados'); 
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [opRes, histRes, cliRes] = await Promise.all([
        supabase.from('oportunidades').select('*, clientes(nome, logo_data)').eq('id', oportunidadeId).single(),
        supabase.from('oportunidades_historico').select('*').eq('oportunidade_id', oportunidadeId).order('data_alteracao', { ascending: false }),
        supabase.from('clientes').select('id, nome')
      ]);
      if (opRes.error) throw opRes.error;
      setOp(opRes.data);
      setHistory(histRes.data || []);
      setClientes(cliRes.data || []);
    } catch (e: any) {
      addToast("Ocorreu um erro ao buscar os detalhes.", "error");
    } finally {
      setLoading(false);
    }
  }, [oportunidadeId, supabase, addToast]);

  useEffect(() => { fetchDetails(); }, [fetchDetails]);

  const handleUpdate = async (data: any) => {
    try {
      const changedFields: any[] = [];
      if (data.fase !== op.fase) {
        changedFields.push({ 
          oportunidade_id: oportunidadeId, 
          usuario: state.userName, 
          campo: 'Alteração de Fase', 
          valor_antigo: op.fase, 
          valor_novo: data.fase 
        });
      }

      const { error } = await supabase.from('oportunidades').update({
        titulo: data.titulo,
        cliente_id: data.clienteId || null,
        nome_prospect: data.nomeProspect,
        valor_estimado: data.valorEstimado,
        fase: data.fase,
        descricao: data.descricao,
        data_fechamento_estimada: data.dataFechamentoEstimada || null
      }).eq('id', oportunidadeId);

      if (error) throw error;
      if (changedFields.length > 0) await supabase.from('oportunidades_historico').insert(changedFields);

      addToast("Negociação atualizada!");
      setIsEditModalOpen(false);
      fetchDetails();
    } catch (e: any) {
      addToast("Erro ao atualizar: " + e.message, "error");
    }
  };

  if (loading || !op) return <div className="p-10"><Skeleton className="h-96 rounded-[3rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2.2rem] flex items-center justify-center text-indigo-600 shadow-xl border border-indigo-100 dark:border-indigo-800 transition-transform hover:rotate-3">
             <Target className="h-10 w-10" />
          </div>
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'oportunidades' } })} className="flex items-center text-indigo-600 hover:text-indigo-800 mb-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all group">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px] group-hover:-translate-x-1 transition-transform"/> Voltar para Pipeline
            </button>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{op.titulo}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-1 flex items-center gap-2">
              <Building className="h-3 w-3" /> {op.clientes?.nome || op.nome_prospect || 'Prospect Isolado'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)} 
            className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600 rounded-[1.5rem] hover:bg-indigo-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"
          >
            <Edit className="h-5 w-5 mr-2" /> Editar Dados
          </button>
          <button 
            onClick={() => setIsDeleteOpen(true)} 
            className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 rounded-[1.5rem] hover:bg-rose-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"
          >
            <Trash2 className="h-5 w-5 mr-2" /> Excluir
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[
          {id:'dados', label:'Dados da Oportunidade', icon:Wallet}, 
          {id:'contato', label:'Contatos e Pessoas', icon:Users},
          {id:'historico', label:'Linha do Tempo', icon:History},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4 mr-3"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700 min-h-[500px] animate-fade-in relative overflow-hidden">
        {tab === 'dados' && <TabOportunidadeDados op={op} />}
        {tab === 'contato' && <TabOportunidadeContatos oportunidadeId={oportunidadeId} />}
        {tab === 'historico' && <TabOportunidadeHistorico history={history} />}
      </div>

      {isEditModalOpen && (
        <OportunidadeFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleUpdate} 
          clientes={clientes} 
          item={op} 
        />
      )}
      
      {isDeleteOpen && (
        <ConfirmDeleteModal 
          isOpen={isDeleteOpen} 
          onClose={() => setIsDeleteOpen(false)} 
          onConfirm={async () => { await supabase.from('oportunidades').delete().eq('id', oportunidadeId); addToast("Removida."); dispatch({ type: 'NAVIGATE', payload: { view: 'oportunidades' } }); }} 
          title="Remover Oportunidade" 
          message="Isso apagará permanentemente esta negociação e todo seu histórico." 
        />
      )}
    </div>
  );
}

function DetailBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-7 bg-gray-50/50 dark:bg-gray-900/30 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-inner group transition-all h-full hover:border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">{label}</span>
      </div>
      <p className={`text-2xl font-black tracking-tight leading-none ${color || 'text-gray-900 dark:text-white'}`}>{value || '-'}</p>
    </div>
  );
}

function TabOportunidadeDados({ op }: { op: any }) {
  return (
    <div className="animate-fade-in space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <DetailBox label="Valor Estimado" value={formatCurrencyBRL(op.valor_estimado)} icon={DollarSign} color="text-indigo-600" />
         <DetailBox label="Estágio da Venda" value={op.fase} icon={TrendingUp} />
         <DetailBox label="Fechamento Estimado" value={op.data_fechamento_estimada ? new Date(op.data_fechamento_estimada + 'T12:00:00').toLocaleDateString() : 'Não definido'} icon={Calendar} />
         <DetailBox label="Data de Criação" value={new Date(op.created_at).toLocaleDateString()} icon={Clock} />
         <DetailBox label="Proprietário" value={op.registrado_por || 'Sistema'} icon={UserCheck} />
      </div>
      <div className="bg-gray-50 dark:bg-gray-950/50 p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
         <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Objetivos e Escopo</h4>
         <p className="font-bold text-gray-900 dark:text-white text-lg leading-relaxed">{op.descricao || 'Nenhuma descrição detalhada fornecida.'}</p>
      </div>
    </div>
  );
}

function TabOportunidadeContatos({ oportunidadeId }: { oportunidadeId: string }) {
  const { supabase } = useAppContext();
  const { addToast } = useToast();
  const [contatos, setContatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('oportunidades_contatos')
        .select('*')
        .eq('oportunidade_id', oportunidadeId)
        .order('is_principal', { ascending: false })
        .order('nome');
      if (error) throw error;
      setContatos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [oportunidadeId, supabase]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSaveContact = async (formData: any) => {
    try {
      if (formData.is_principal) {
        await supabase
          .from('oportunidades_contatos')
          .update({ is_principal: false })
          .eq('oportunidade_id', oportunidadeId);
      }

      if (editingContact) {
        const { error } = await supabase.from('oportunidades_contatos').update(formData).eq('id', editingContact.id);
        if (error) throw error;
        addToast("Contato atualizado!");
      } else {
        const { error } = await supabase.from('oportunidades_contatos').insert([{ ...formData, oportunidade_id: oportunidadeId }]);
        if (error) throw error;
        addToast("Contato adicionado!");
      }
      setIsModalOpen(false);
      setEditingContact(null);
      fetchContacts();
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const removeContact = async (id: string) => {
    if(!confirm("Remover este contato?")) return;
    await supabase.from('oportunidades_contatos').delete().eq('id', id);
    fetchContacts();
    addToast("Contato removido.");
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Pessoas de Contato</h4>
        <button 
          onClick={() => { setEditingContact(null); setIsModalOpen(true); }}
          className="px-10 py-5 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[1.8rem] shadow-2xl active:scale-95 transition-all flex items-center"
        >
          <UserPlus className="h-6 w-6 mr-3 stroke-[4px]" /> Adicionar Contato
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Responsável</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tipo</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notas e Observações</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center"><Skeleton className="h-10 w-3/4 mx-auto" /></td></tr>
            ) : contatos.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic font-medium">Nenhum contato vinculado à esta negociação.</td></tr>
            ) : contatos.map(c => (
              <tr key={c.id} className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 group transition-colors cursor-pointer">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${c.is_principal ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-white dark:bg-gray-800 text-indigo-600'}`}>
                      {c.is_principal ? <Star className="h-5 w-5 fill-amber-500" /> : <User className="h-5 w-5" />}
                    </div>
                    <span className="font-black text-gray-800 dark:text-white text-lg">{c.nome}</span>
                  </div>
                </td>
                <td className="px-6 py-8">
                   <span className="font-bold text-indigo-500">{c.email || '-'}</span>
                </td>
                <td className="px-6 py-8 text-center">
                   {c.is_principal ? (
                     <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase rounded-lg border border-amber-100">Principal</span>
                   ) : (
                     <span className="text-[9px] font-bold text-gray-400 uppercase">Secundário</span>
                   )}
                </td>
                <td className="px-6 py-8">
                   <p className="text-gray-500 dark:text-gray-400 font-medium italic text-sm line-clamp-2" title={c.nota}>
                     {c.nota ? `"${c.nota}"` : '-'}
                   </p>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setEditingContact(c); setIsModalOpen(true); }} 
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-blue-400 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <Edit className="h-5 w-5"/>
                    </button>
                    <button 
                      onClick={() => removeContact(c.id)} 
                      className="text-red-300 hover:text-red-500 transition-all p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm opacity-60 hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5"/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <OportunidadeContatoFormModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingContact(null); }} 
          onSave={handleSaveContact} 
          item={editingContact}
        />
      )}
    </div>
  );
}

function TabOportunidadeHistorico({ history }: { history: any[] }) {
  return (
    <div className="animate-fade-in space-y-10">
      <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-4">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl"><History className="h-7 w-7 text-indigo-600" /></div>
        Linha do Tempo
      </h3>
      {history.length === 0 ? (
        <div className="py-24 text-center bg-gray-50/50 dark:bg-gray-950/30 rounded-[3rem] border border-dashed border-gray-200 dark:border-gray-800">
           <MessageSquare className="h-16 w-16 text-gray-200 mx-auto mb-6" />
           <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Sem registros de histórico até o momento.</p>
        </div>
      ) : (
        <div className="relative pl-10 border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-6 space-y-10 pb-4">
          {history.map(log => (
            <div key={log.id} className="relative">
              <div className="absolute -left-[51px] top-0 w-6 h-6 rounded-full bg-indigo-600 border-[6px] border-white dark:border-gray-800 shadow-lg"></div>
              <div className="bg-gray-50 dark:bg-gray-900/40 p-8 rounded-[2.2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-indigo-200 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase text-indigo-600 border border-indigo-50 shadow-sm">{log.campo}</span>
                    <span className="text-[11px] font-bold text-gray-400 italic">{new Date(log.data_alteracao).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                     <User className="h-3 w-3 text-gray-400" />
                     <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Por <span className="text-gray-900 dark:text-white">{log.usuario}</span></span>
                  </div>
                </div>
                {log.campo === 'Alteração de Fase' ? (
                  <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                     <div className="flex-1 text-center py-2 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl line-through text-gray-400 font-bold text-sm uppercase">{log.valor_antigo}</div>
                     <ArrowRight className="h-5 w-5 text-indigo-600 stroke-[3px]" />
                     <div className="flex-1 text-center py-2 px-4 bg-indigo-600 rounded-xl text-white font-black text-sm uppercase shadow-lg shadow-indigo-600/30">{log.valor_novo}</div>
                  </div>
                ) : (
                  <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                    <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic text-lg whitespace-pre-wrap">"{log.valor_novo}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ fase, items, onClick }: any) {
  const faseColors: any = { 'Prospecção': 'border-blue-100 bg-blue-50/20', 'Qualificação': 'border-indigo-100 bg-indigo-50/20', 'Proposta': 'border-amber-100 bg-amber-50/20', 'Negociação': 'border-violet-100 bg-violet-50/20', 'Ganho': 'border-emerald-100 bg-emerald-50/20', 'Perdido': 'border-rose-100 bg-rose-50/20' };
  const totalValue = items.reduce((acc: number, curr: any) => acc + (Number(curr.valor_estimado) || 0), 0);
  return (
    <div className="flex-shrink-0 w-[320px] snap-start flex flex-col gap-5">
      <div className={`p-5 rounded-[2rem] border-2 ${faseColors[fase] || 'border-gray-100'} shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{fase}</h3>
          <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-[10px] font-black border dark:border-gray-700 shadow-sm">{items.length}</span>
        </div>
        <p className="text-[11px] font-bold text-gray-400">Total: <span className="text-gray-900 dark:text-white font-black">R$ {totalValue.toLocaleString('pt-BR')}</span></p>
      </div>
      <div className="flex-1 space-y-5">
        {items.map((item: any) => (
          <KanbanCard key={item.id} item={item} onClick={() => onClick(item)} />
        ))}
        {items.length === 0 && <div className="py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] text-gray-300 font-black uppercase text-[10px] tracking-widest opacity-50">Vazio</div>}
      </div>
    </div>
  );
}

function KanbanCard({ item, onClick }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.2rem] shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer relative overflow-hidden" onClick={onClick}>
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xl"><ArrowRight className="h-4 w-4 stroke-[3px]" /></div></div>
      <h4 className="font-black text-gray-900 dark:text-white text-base tracking-tight leading-tight mb-5 group-hover:text-indigo-600 transition-colors">{item.titulo}</h4>
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0"><Building className="h-3.5 w-3.5 text-gray-400" /></div><span className="text-[11px] font-black text-gray-600 dark:text-gray-300 truncate uppercase tracking-tight">{item.clientes?.nome || item.nome_prospect || 'Sem Prospect'}</span></div>
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center shrink-0"><DollarSign className="h-3.5 w-3.5 text-indigo-500" /></div><span className="text-sm font-black text-gray-900 dark:text-white tracking-tighter">R$ {item.valor_estimado?.toLocaleString('pt-BR')}</span></div>
      </div>
      <div className="pt-4 border-t dark:border-gray-700 flex justify-between items-center">
         <div className="flex gap-2">
            <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-md" title="Negociação ativa"><Target className="h-3.5 w-3.5 text-blue-500" /></div>
            {item.interacao_detalhes && <div className="p-1 bg-blue-50 dark:bg-blue-900/30 rounded-md" title="Possui histórico de conversa"><MessageSquare className="h-3.5 w-3.5 text-blue-500" /></div>}
         </div>
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
