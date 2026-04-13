
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { List, LayoutGrid, Plus, Edit, Trash2, Monitor, Search, ArrowRight, Laptop, User, Info, Calendar, Clock, Shield, Settings, Cpu, HardDrive, Smartphone, Link, History, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { EquipamentoFormModal, ConfirmDeleteModal, EquipamentoVinculoModal, EquipamentoLogModal } from '../components/Modals';
import { sanitizePayload, displayValue } from '../utils/helpers';

export default function EquipamentosView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipamento, setEditingEquipamento] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [equipamentoToDelete, setEquipamentoToDelete] = useState<any>(null);
  const [isVinculoModalOpen, setIsVinculoModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eqRes, coopRes] = await Promise.all([
        supabase.from('equipamentos').select('id, nome, fabricante, processador, placa_video, memoria, caracteristicas, cooperado_id, status, data_entrega, user_id, created_at, updated_at, codigo_equipamento, cooperados(nome_completo)').order('nome'),
        supabase.from('cooperados').select('id, nome_completo').order('nome_completo')
      ]);
      
      if (eqRes.error) throw eqRes.error;
      if (coopRes.error) throw coopRes.error;
      
      setEquipamentos(eqRes.data || []);
      setCooperados(coopRes.data || []);
    } catch (error: any) {
      addToast(`Erro ao carregar dados: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return equipamentos.filter(e => {
      const s = filters.search.toLowerCase();
      const nomeMatch = e.nome?.toLowerCase().includes(s);
      const fabricanteMatch = e.fabricante?.toLowerCase().includes(s);
      const processadorMatch = e.processador?.toLowerCase().includes(s);
      const cooperadoMatch = e.cooperados?.nome_completo?.toLowerCase().includes(s);
      
      return (nomeMatch || fabricanteMatch || processadorMatch || cooperadoMatch) && (filters.status === '' || e.status === filters.status);
    });
  }, [equipamentos, filters]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSave = async (d: any) => {
    try {
      const payload = {
        ...sanitizePayload({
          nome: d.nome,
          fabricante: d.fabricante,
          processador: d.processador,
          placa_video: d.placa_video,
          memoria: d.memoria,
          caracteristicas: d.caracteristicas,
          status: d.status,
          codigo_equipamento: d.codigoEquipamento
        }),
        user_id: state.userId
      };

      if (editingEquipamento) {
        const { error } = await supabase.from('equipamentos').update(payload).eq('id', editingEquipamento.id);
        if (error) throw error;
        addToast("Equipamento atualizado com sucesso!");
      } else {
        const { error } = await supabase.from('equipamentos').insert([payload]);
        if (error) throw error;
        addToast("Equipamento cadastrado com sucesso!");
      }
      
      setIsModalOpen(false);
      setEditingEquipamento(null);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleVinculo = async (d: any) => {
    try {
      const isDevolucao = d.tipo === 'Devolução';
      
      // 1. Atualizar o equipamento
      const { error: eqError } = await supabase.from('equipamentos').update({
        cooperado_id: isDevolucao ? null : d.cooperadoId,
        status: isDevolucao ? 'Disponível' : 'Em uso',
        data_entrega: isDevolucao ? null : d.dataInicio
      }).eq('id', selectedEquipamento.id);

      if (eqError) throw eqError;

      // 2. Criar o log no histórico
      const { error: logError } = await supabase.from('historico_equipamentos').insert([{
        equipamento_id: selectedEquipamento.id,
        cooperado_id: d.cooperadoId,
        data_inicio: d.dataInicio,
        responsavel: d.responsavel,
        tipo: d.tipo,
        observacao: d.observacao
      }]);

      if (logError) throw logError;

      addToast(`Equipamento ${isDevolucao ? 'devolvido' : 'entregue'} com sucesso!`);
      setIsVinculoModalOpen(false);
      setSelectedEquipamento(null);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const fetchLogs = async (equipamentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('historico_equipamentos')
        .select('*, cooperados(nome_completo)')
        .eq('equipamento_id', equipamentoId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLogs(data || []);
      setIsLogModalOpen(true);
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleDelete = async () => {
    if (!equipamentoToDelete) return;
    try {
      const { error } = await supabase.from('equipamentos').delete().eq('id', equipamentoToDelete.id);
      if (error) throw error;
      addToast("Equipamento removido!");
      setIsDeleteModalOpen(false);
      setEquipamentoToDelete(null);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Equipamentos</h2>
          <p className="text-gray-500 font-medium mt-1">Gestão de notebooks e ativos da empresa.</p>
        </div>
        <button onClick={() => { setEditingEquipamento(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all">
          <Plus className="h-5 w-5 mr-2 inline stroke-[3px]"/> Novo Equipamento
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-3 rounded-[1.5rem] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input placeholder="Buscar por nome, marca ou cooperado..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="form-input pl-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none py-2.5 font-semibold text-sm" />
           </div>
           <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="form-select md:w-48 rounded-xl border-none bg-gray-50 dark:bg-gray-900 font-black text-[10px] uppercase text-gray-500">
              <option value="">Status: Todos</option>
              <option value="Em uso">Em uso</option>
              <option value="Disponível">Disponível</option>
              <option value="Manutenção">Manutenção</option>
           </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
           <Laptop className="h-12 w-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 font-bold">Nenhum equipamento encontrado.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="w-full text-left table-zebrado">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Equipamento</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Código</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fabricante</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Processador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cooperado</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.map(e => (
                <tr 
                  key={e.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-900/40 cursor-pointer transition-colors group"
                  onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheEquipamento', id: e.id } })}
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 font-black text-xs">
                        <Laptop className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm block">{e.nome}</span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{e.memoria || '-'} RAM</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-500 uppercase">{displayValue(e.codigo_equipamento)}</td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-500 uppercase">{displayValue(e.fabricante)}</td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-500 uppercase">{displayValue(e.processador)}</td>
                  <td className="px-8 py-4">
                    {e.cooperados ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 text-[10px] font-black">
                          {e.cooperados.nome_completo.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{e.cooperados.nome_completo}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Disponível</span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-center">
                    <span className={`px-2 py-1 text-[9px] font-black rounded uppercase border ${
                      e.status === 'Em uso' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      e.status === 'Disponível' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedEquipamento(e); setIsVinculoModalOpen(true); }} 
                        className={`p-2 rounded-lg transition-all ${e.cooperado_id ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                        title={e.cooperado_id ? "Registrar Devolução" : "Registrar Entrega"}
                      >
                        {e.cooperado_id ? <LogOut className="h-4 w-4"/> : <Link className="h-4 w-4"/>}
                      </button>
                      <button onClick={() => fetchLogs(e.id)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Ver Histórico"><History className="h-4 w-4"/></button>
                      <button onClick={() => { setEditingEquipamento(e); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar"><Edit className="h-4 w-4"/></button>
                      <button onClick={() => { setEquipamentoToDelete(e); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Excluir"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="p-4 border-t dark:border-gray-700">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <EquipamentoFormModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingEquipamento(null); }} 
          onSave={handleSave}
          initialData={editingEquipamento}
        />
      )}

      {isVinculoModalOpen && (
        <EquipamentoVinculoModal 
          isOpen={isVinculoModalOpen} 
          onClose={() => { setIsVinculoModalOpen(false); setSelectedEquipamento(null); }} 
          onSave={handleVinculo}
          equipamento={selectedEquipamento}
          cooperados={cooperados}
        />
      )}

      {isLogModalOpen && (
        <EquipamentoLogModal 
          isOpen={isLogModalOpen} 
          onClose={() => setIsLogModalOpen(false)} 
          logs={logs}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          onConfirm={handleDelete}
          title="Remover Equipamento"
          message={`Tem certeza que deseja remover o equipamento "${equipamentoToDelete?.nome}"?`}
        />
      )}
    </div>
  );
}

export function EquipamentoDetalheView({ equipamentoId }: { equipamentoId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [equipamento, setEquipamento] = useState<any>(null);
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState('dados');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVinculoModalOpen, setIsVinculoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eqRes, coopRes, logRes] = await Promise.all([
        supabase.from('equipamentos').select('*, cooperados(nome_completo)').eq('id', equipamentoId).single(),
        supabase.from('cooperados').select('id, nome_completo').order('nome_completo'),
        supabase.from('historico_equipamentos').select('*, cooperados(nome_completo)').eq('equipamento_id', equipamentoId).order('created_at', { ascending: false })
      ]);

      if (eqRes.error) throw eqRes.error;
      setEquipamento(eqRes.data);
      setCooperados(coopRes.data || []);
      setLogs(logRes.data || []);
    } catch (error: any) {
      addToast(`Erro ao carregar dados: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [equipamentoId, supabase, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (d: any) => {
    try {
      const payload = {
        ...sanitizePayload({
          nome: d.nome,
          fabricante: d.fabricante,
          processador: d.processador,
          placa_video: d.placa_video,
          memoria: d.memoria,
          caracteristicas: d.caracteristicas,
          status: d.status,
          codigo_equipamento: d.codigoEquipamento
        }),
        user_id: state.userId
      };

      const { error } = await supabase.from('equipamentos').update(payload).eq('id', equipamentoId);
      if (error) throw error;
      
      addToast("Equipamento atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleVinculo = async (d: any) => {
    try {
      const isDevolucao = d.tipo === 'Devolução';
      
      const { error: eqError } = await supabase.from('equipamentos').update({
        cooperado_id: isDevolucao ? null : d.cooperadoId,
        status: isDevolucao ? 'Disponível' : 'Em uso',
        data_entrega: isDevolucao ? null : d.dataInicio
      }).eq('id', equipamentoId);

      if (eqError) throw eqError;

      const { error: logError } = await supabase.from('historico_equipamentos').insert([{
        equipamento_id: equipamentoId,
        cooperado_id: d.cooperadoId,
        data_inicio: d.dataInicio,
        responsavel: d.responsavel,
        tipo: d.tipo,
        observacao: d.observacao
      }]);

      if (logError) throw logError;

      addToast(`Equipamento ${isDevolucao ? 'devolvido' : 'entregue'} com sucesso!`);
      setIsVinculoModalOpen(false);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('equipamentos').delete().eq('id', equipamentoId);
      if (error) throw error;
      addToast("Equipamento removido!");
      dispatch({ type: 'NAVIGATE', payload: { view: 'equipamentos' } });
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>;
  if (!equipamento) return <div className="p-8 text-center">Equipamento não encontrado.</div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl flex items-center justify-center text-indigo-600 font-black text-3xl">
            <Laptop className="h-12 w-12" />
          </div>
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'equipamentos' } })} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all group">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px] group-hover:-translate-x-1 transition-transform"/> Voltar
            </button>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{equipamento.nome}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-2 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full w-fit">
              {equipamento.codigo_equipamento ? `${equipamento.codigo_equipamento} | ` : ''}{equipamento.fabricante}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsVinculoModalOpen(true)} 
            className={`flex items-center px-6 py-4 rounded-[1.5rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all border ${
              equipamento.cooperado_id 
                ? 'bg-white dark:bg-gray-800 border-amber-200 dark:border-amber-900/30 text-amber-600 hover:bg-amber-50' 
                : 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {equipamento.cooperado_id ? <LogOut className="h-5 w-5 mr-2" /> : <Link className="h-5 w-5 mr-2" />}
            {equipamento.cooperado_id ? 'Devolução' : 'Entrega'}
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center px-6 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 rounded-[1.5rem] hover:bg-blue-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"><Edit className="h-5 w-5 mr-2" /> Editar</button>
          <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center px-6 py-4 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 rounded-[1.5rem] hover:bg-rose-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"><Trash2 className="h-5 w-5 mr-2" /> Excluir</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[
          {id:'dados', label:'Informações Técnicas', icon:Info}, 
          {id:'historico', label:'Histórico de Uso', icon:History},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4 mr-2"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-700 min-h-[400px] animate-fade-in">
        {tab === 'dados' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Especificações</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Código" value={equipamento.codigo_equipamento} />
                <DetailItem label="Fabricante" value={equipamento.fabricante} />
                <DetailItem label="Processador" value={equipamento.processador} />
                <DetailItem label="Placa de Vídeo" value={equipamento.placa_video} />
                <DetailItem label="Memória RAM" value={equipamento.memoria} />
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Outras Características</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">{equipamento.caracteristicas || 'Nenhuma característica adicional informada.'}</p>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Status Atual</h3>
              <div className="p-8 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  equipamento.status === 'Em uso' ? 'bg-blue-100 text-blue-600' : 
                  equipamento.status === 'Disponível' ? 'bg-emerald-100 text-emerald-600' : 
                  'bg-amber-100 text-amber-600'
                }`}>
                  {equipamento.status === 'Em uso' ? <User className="h-8 w-8" /> : <Monitor className="h-8 w-8" />}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border mb-4 ${
                  equipamento.status === 'Em uso' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                  equipamento.status === 'Disponível' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {equipamento.status}
                </span>
                {equipamento.cooperados ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vinculado a</p>
                    <p className="text-lg font-black text-gray-900 dark:text-white">{equipamento.cooperados.nome_completo}</p>
                    <p className="text-xs font-bold text-gray-500">Desde {equipamento.data_entrega ? new Date(equipamento.data_entrega).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                ) : (
                  <p className="text-gray-400 font-bold italic">Equipamento disponível para alocação.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'historico' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Log de Movimentações</h3>
            {logs.length === 0 ? (
              <div className="p-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-800">
                <History className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold">Nenhum registro de movimentação encontrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        log.tipo === 'Entrega' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {log.tipo === 'Entrega' ? <Link className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            log.tipo === 'Entrega' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>{log.tipo}</span>
                          <span className="text-xs font-black text-gray-900 dark:text-white">{log.cooperados?.nome_completo || 'N/A'}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{log.observacao || 'Sem observações.'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{new Date(log.data_inicio).toLocaleDateString('pt-BR')}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Resp: {log.responsavel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <EquipamentoFormModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleSave}
          initialData={equipamento}
        />
      )}

      {isVinculoModalOpen && (
        <EquipamentoVinculoModal 
          isOpen={isVinculoModalOpen} 
          onClose={() => setIsVinculoModalOpen(false)} 
          onSave={handleVinculo}
          equipamento={equipamento}
          cooperados={cooperados}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          onConfirm={handleDelete}
          title="Remover Equipamento"
          message={`Tem certeza que deseja remover o equipamento "${equipamento.nome}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{value || '-'}</p>
    </div>
  );
}
