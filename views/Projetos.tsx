import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, ChevronLeft, Save, Settings, Users, UserPlus, List, LayoutGrid, Search, Briefcase, Calendar, ArrowRight, RefreshCcw, UserCheck, Edit, CheckCircle2, User, PieChart, DollarSign, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { ProjetoFormModal, AlocacaoFormModal, ConfirmDeleteModal } from '../components/Modals';
import { sanitizePayload, displayValue } from '../utils/helpers';

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export function ProjetosView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [projetos, setProjetos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // OTIMIZAÇÃO: Seleção de colunas específicas e remoção do logo_data do JOIN principal
      const [projsRes, clisRes] = await Promise.all([
        supabase.from('projetos').select('id, nome, cliente_id, data_inicio, data_fim, status, registrado_por, clientes(nome)'),
        supabase.from('clientes').select('id, nome, logo_data')
      ]);
      
      if (projsRes.data) setProjetos(projsRes.data);
      if (clisRes.data) setClientes(clisRes.data);
    } catch (e) {
      console.error("Erro ao carregar projetos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('projetos-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Mapeamento de logos em memória para evitar tráfego repetitivo
  const clientLogos = useMemo(() => {
    const map: Record<string, string> = {};
    clientes.forEach(c => { if (c.logo_data) map[c.id] = c.logo_data; });
    return map;
  }, [clientes]);

  // Reset paginação ao filtrar
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filteredProjetos = useMemo(() => {
    return projetos.filter(p => 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projetos, searchTerm]);

  const totalPages = Math.ceil(filteredProjetos.length / itemsPerPage);
  const paginatedData = filteredProjetos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async (data: any) => {
    try {
      const payload = sanitizePayload({
        nome: String(data.nome || '').trim(),
        cliente_id: data.clienteId,
        data_inicio: data.dataInicio || null,
        data_fim: data.dataFim || null,
        status: 'Ativo',
        user_id: state.userId,
        registrado_por: state.userName || 'Sistema'
      });
      const { error } = await supabase.from('projetos').insert([payload]);
      if (error) throw error;
      addToast('Projeto criado!');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Concluído': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Pausado': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">Projetos</h2>
          <p className="text-gray-500 font-medium mt-1">Gestão de entregas e cronogramas</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-white dark:bg-gray-800 p-1.5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex">
            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-5 w-5"/></button>
            <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-2xl transition-all ${viewMode === 'card' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-5 w-5"/></button>
          </div>
          <button onClick={fetchData} className="p-4 bg-white dark:bg-gray-800 rounded-[1.8rem] shadow-sm border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-blue-600 transition-all active:scale-95">
             <RefreshCcw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-[1.8rem] shadow-xl shadow-blue-500/20 flex items-center font-black uppercase tracking-widest text-[11px] transition-all active:scale-95">
            <Plus className="h-5 w-5 mr-2 stroke-[3px]"/> Novo Projeto
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-[2rem] shadow-xl border border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 relative w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input 
             placeholder="Pesquisar por projeto ou cliente..." 
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
             className="form-input rounded-[1.5rem] bg-gray-50 dark:bg-gray-900 border-none pl-12 py-4 font-semibold text-sm w-full shadow-inner" 
           />
         </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map(i=><Skeleton key={i} className="h-52 rounded-[2.5rem]"/>)}
        </div>
      ) : paginatedData.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-gray-700 shadow-2xl">
          <Briefcase className="h-16 w-16 text-gray-200 mx-auto mb-6" />
          <p className="text-gray-400 font-bold italic text-lg">Nenhum projeto encontrado.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logo</th>
                  <th className="px-6 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Projeto</th>
                  <th className="px-6 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Data</th>
                  <th className="px-6 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-10 py-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                {paginatedData.map(p => {
                  const logo = clientLogos[p.cliente_id];
                  return (
                    <tr key={p.id} onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheProjeto', id: p.id, label: p.nome } })} className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center">
                          {logo ? (
                            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800 overflow-hidden shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                              <img src={logo} alt={p.clientes?.nome} className="w-full h-full object-contain p-0.5" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-700 shrink-0">
                              <User className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div>
                            <p className="font-black text-gray-900 dark:text-white text-lg tracking-tighter leading-tight">{p.nome}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              Por: {p.registrado_por || 'Sistema'}
                            </p>
                          </div>
                      </td>
                      <td className="px-6 py-6 text-center text-xs font-bold text-gray-400">
                        {formatDateBR(p.data_inicio)} — {formatDateBR(p.data_fim)}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="inline-flex p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40 transition-all active:scale-95">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedData.map(p => {
            const logo = clientLogos[p.cliente_id];
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-8 cursor-pointer hover:shadow-blue-500/10 hover:-translate-y-2 transition-all border border-gray-50 dark:border-gray-700 group relative flex flex-col h-full" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheProjeto', id: p.id, label: p.nome } })}>
                <div className="flex justify-between items-start mb-8">
                  {logo ? (
                    <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-[1.5rem] flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-inner group-hover:shadow-lg transition-all duration-500 overflow-hidden">
                      <img src={logo} alt={p.clientes?.nome} className="w-full h-full object-contain p-2" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-16 h-16 bg-emerald-50 dark:bg-emerald-900/40 rounded-[1.5rem] text-emerald-600 dark:text-emerald-300 font-black text-2xl shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                      {p.nome.charAt(0)}
                    </div>
                  )}
                  <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase border tracking-widest ${getStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <div className="mb-8">
                  <h3 className="font-black text-gray-900 dark:text-white text-2xl tracking-tighter leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1">{p.nome}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {p.clientes?.nome || 'Sem cliente'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-auto p-5 bg-gray-50 dark:bg-gray-900/40 rounded-[1.8rem] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-all">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Prazo</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="font-black text-gray-700 dark:text-gray-300 text-xs">{formatDateBR(p.data_inicio)} — {formatDateBR(p.data_fim)}</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-emerald-600 group-hover:scale-110 transition-transform">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
        totalItems={filteredProjetos.length} 
        itemsPerPage={itemsPerPage} 
      />

      {isModalOpen && <ProjetoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} clientes={clientes} />}
    </div>
  );
}

export function ProjetoDetalheView({ projetoId }: { projetoId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [projeto, setProjeto] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);

  const fetchProjeto = async () => {
    const { data } = await supabase
      .from('projetos')
      .select('*, clientes(nome, logo_data)')
      .eq('id', projetoId)
      .single();
    if (data) setProjeto(data);
  };

  useEffect(() => {
    if (projetoId) fetchProjeto();
    supabase.from('clientes').select('id, nome').then(res => setClientes(res.data || []));
  }, [projetoId]);

  const handleDelete = async () => {
    const { error } = await supabase.from('projetos').delete().eq('id', projetoId);
    if (error) {
      addToast("Erro ao excluir: " + error.message, "error");
    } else {
      addToast("Projeto excluído!");
      dispatch({ type: 'NAVIGATE', payload: { view: 'projetos' } });
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      const payload = sanitizePayload({
        nome: String(data.nome || '').trim(),
        cliente_id: data.clienteId,
        data_inicio: data.dataInicio || null,
        data_fim: data.dataFim || null,
        status: 'Ativo', // Mantém ativo ao editar
        user_id: state.userId
      });
      const { error } = await supabase.from('projetos').update(payload).eq('id', projetoId);
      if (error) throw error;
      addToast('Projeto atualizado!');
      setIsEdit(false);
      fetchProjeto();
    } catch (err: any) {
      addToast(`Erro ao atualizar: ${err.message}`, 'error');
    }
  };

  if (!projeto) return <div className="p-8"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           {projeto.clientes?.logo_data ? (
             <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden flex items-center justify-center p-2">
                <img src={projeto.clientes.logo_data} alt={projeto.clientes.nome} className="w-full h-full object-contain" />
             </div>
           ) : (
             <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
                <Briefcase className="h-10 w-10" />
             </div>
           )}
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'projetos' } })} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all group">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px] group-hover:-translate-x-1 transition-transform"/> Voltar
            </button>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{projeto.nome}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-2 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full w-fit">
              Cliente: {displayValue(projeto.clientes?.nome)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsEdit(true)} className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 rounded-[1.5rem] hover:bg-blue-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">
            <Edit className="h-5 w-5 mr-2" /> Editar
          </button>
          <button onClick={() => setIsConfirmDelete(true)} className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 rounded-[1.5rem] hover:bg-rose-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95">
            <Trash2 className="h-5 w-5 mr-2" /> Excluir
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
           {[
             {id:'dados', label:'Dados do Projeto', icon:Briefcase}, 
             {id:'equipe', label:'Equipe Alocada', icon:Users},
           ].map(t => (
             <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
               <t.icon className="h-4 w-4 mr-2"/>{t.label}
             </button>
           ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-700 min-h-[600px] animate-fade-in relative overflow-hidden">
        {activeTab === 'dados' && <TabDadosProjetoVisual projeto={projeto} />}
        {activeTab === 'equipe' && <TabAlocacoesVisual projetoId={projetoId} />}
      </div>

      {isEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 border border-white/10">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Editar Projeto</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleUpdate({
                nome: fd.get('nome'),
                clienteId: fd.get('clienteId'),
                dataInicio: fd.get('dataInicio'),
                dataFim: fd.get('dataFim')
              });
            }} className="space-y-6">
              <div className="w-full">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Projeto</label>
                <input name="nome" defaultValue={projeto.nome} className="form-input w-full rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner" required />
              </div>
              <div className="w-full">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Cliente</label>
                <select name="clienteId" defaultValue={projeto.cliente_id} className="form-select w-full rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner" required>
                  {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="w-full"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Início</label><input type="date" name="dataInicio" defaultValue={projeto.data_inicio} className="form-input w-full rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner" /></div>
                 <div className="w-full"><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Previsão Fim</label><input type="date" name="dataFim" defaultValue={projeto.data_fim} className="form-input w-full rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner" /></div>
              </div>
              <div className="pt-4 flex gap-4">
                 <button type="button" onClick={() => setIsEdit(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded-xl uppercase text-xs">Cancelar</button>
                 <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl uppercase text-xs shadow-lg shadow-blue-500/20">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmDelete && (
        <ConfirmDeleteModal 
          isOpen={isConfirmDelete} 
          onClose={() => setIsConfirmDelete(false)} 
          onConfirm={handleDelete} 
          title="Excluir Projeto" 
          message="Tem certeza que deseja remover este projeto? Todas as alocações serão removidas." 
        />
      )}
    </div>
  );
}

function TabDadosProjetoVisual({ projeto }: any) {
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-8 mt-12 first:mt-0">
      <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{title}</h3>
    </div>
  );
  
  const DetailBox = ({ label, value, icon: Icon }: any) => (
    <div className="p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-inner group hover:border-blue-200 transition-all h-full">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-3 w-3 text-gray-400" />}
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block ml-1">{label}</span>
      </div>
      <span className="font-black text-gray-900 dark:text-white text-base tracking-tight leading-tight block truncate" title={displayValue(value)}>{displayValue(value)}</span>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-2">
      <SectionHeader title="Informações do Projeto" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailBox label="NOME DO PROJETO" value={projeto.nome} icon={Briefcase} />
        <DetailBox label="CLIENTE" value={projeto.clientes?.nome} icon={User} />
        <DetailBox label="STATUS" value={projeto.status} icon={CheckCircle2} />
      </div>
      
      <SectionHeader title="Cronograma" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailBox label="DATA INÍCIO" value={formatDateBR(projeto.data_inicio)} icon={Calendar} />
        <DetailBox label="PREVISÃO TÉRMINO" value={formatDateBR(projeto.data_fim)} icon={Calendar} />
        <DetailBox label="REGISTRADO POR" value={projeto.registrado_por || 'Sistema'} icon={UserCheck} />
      </div>
    </div>
  );
}

function TabAlocacoesVisual({ projetoId }: any) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [alocacoes, setAlocacoes] = useState<any[]>([]);
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAloc, setEditingAloc] = useState<any>(null);

  const fetchAlocacoes = useCallback(async () => {
    const { data } = await supabase
      .from('alocacoes')
      .select('*, cooperados(nome_completo, funcao)')
      .eq('projeto_id', projetoId);
    if (data) setAlocacoes(data);
  }, [projetoId, supabase]);

  useEffect(() => {
    // Carrega cooperados ordenados alfabeticamente
    supabase.from('cooperados').select('id, nome_completo, funcao, status').order('nome_completo').then(res => {
      if (res.data) setCooperados(res.data);
    });
    fetchAlocacoes();
  }, [fetchAlocacoes]);

  const handleSaveAloc = async (data: any) => {
    try {
      const payload = sanitizePayload({
        projeto_id: projetoId,
        cooperado_id: data.cooperadoId,
        percentual: Number(data.percentual),
        valor_hora: Number(data.valorHora),
        horas_mensais: data.horasMensais ? Number(data.horasMensais) : null,
        data_inicio: data.dataInicio || null,
        data_fim: data.dataFim || null,
        user_id: state.userId,
        registrado_por: state.userName || 'Sistema'
      });
      
      if (editingAloc) {
        const { error } = await supabase.from('alocacoes').update(payload).eq('id', editingAloc.id);
        if (error) throw error;
        addToast("Alocação atualizada!");
      } else {
        const { error } = await supabase.from('alocacoes').insert([payload]);
        if (error) throw error;
        addToast("Cooperado alocado!");
      }

      setIsModalOpen(false);
      setEditingAloc(null);
      fetchAlocacoes();
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  const removeAlocacao = async (id: string) => {
    await supabase.from('alocacoes').delete().eq('id', id);
    fetchAlocacoes();
    addToast("Alocação removida");
  };

  const handleEdit = (a: any) => {
    setEditingAloc(a);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-2xl font-black text-gray-900 tracking-tighter">Equipe Alocada</h4>
        <button 
          onClick={() => { setEditingAloc(null); setIsModalOpen(true); }}
          className="px-10 py-5 bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[1.8rem] shadow-2xl active:scale-95 transition-all flex items-center"
        >
          <UserPlus className="h-6 w-6 mr-3 stroke-[4px]" /> Alocar Integrante
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cooperado</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Período</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Taxa/h</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Horas/mês</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">% Aloc</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {alocacoes.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-gray-400 italic font-medium">Nenhum cooperado alocado neste projeto.</td></tr>
            ) : alocacoes.map(a => {
               const hrs = Number(a.horas_mensais || 0);
               return (
                <tr key={a.id} className="even:bg-gray-50/50 dark:even:bg-white/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 group transition-colors cursor-pointer">
                  <td className="px-10 py-8">
                    <div className="font-black text-gray-800 dark:text-white text-lg">{a.cooperados?.nome_completo}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{displayValue(a.cooperados?.funcao)}</div>
                  </td>
                  <td className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400 font-bold text-center">
                    {formatDateBR(a.data_inicio)} — {formatDateBR(a.data_fim)}
                  </td>
                  <td className="px-6 py-8 text-right font-black text-gray-700 dark:text-gray-300">
                    R$ {Number(a.valor_hora || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </td>
                  <td className="px-6 py-8 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-lg text-gray-900 dark:text-white">
                        {hrs.toFixed(1)}h
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-right">
                    <span className="font-black text-2xl text-blue-600 dark:text-blue-400 tracking-tighter">{a.percentual}%</span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(a); }} 
                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-blue-400 hover:text-blue-600 transition-all shadow-sm"
                        title="Editar Alocação"
                      >
                        <Edit className="h-5 w-5"/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeAlocacao(a.id); }} 
                        className="text-red-300 hover:text-red-500 transition-all p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm opacity-60 hover:opacity-100"
                        title="Remover Alocação"
                      >
                        <Trash2 className="h-5 w-5"/>
                      </button>
                    </div>
                  </td>
                </tr>
               );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <AlocacaoFormModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingAloc(null); }} 
          onSave={handleSaveAloc} 
          cooperados={cooperados}
          item={editingAloc ? {
            cooperado_id: editingAloc.cooperado_id,
            percentual: editingAloc.percentual,
            valor_hora: editingAloc.valor_hora,
            horas_mensais: editingAloc.horas_mensais,
            data_inicio: editingAloc.data_inicio,
            data_fim: editingAloc.data_fim
          } : undefined}
        />
      )}
    </div>
  );
}
