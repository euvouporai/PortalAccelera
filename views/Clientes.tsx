
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, RefreshCcw, Search, List, LayoutGrid, Building, ArrowRight, Briefcase, DollarSign, FileText, Info, FileSignature, Calendar, Wallet, UserCheck, History } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination, SectionHeader, DetailBox, ActionButton, Badge } from '../components/UI';
import { ClienteFormModal, ConfirmDeleteModal, ContratoFormModal, AditivoFormModal } from '../components/Modals';
import { displayValue, sanitizePayload } from '../utils/helpers';

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export function ClientesView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [clientes, setClientes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchClientes = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('clientes').select('*').order('nome');
    setClientes(data || []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const filtered = useMemo(() => clientes.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase())), [clientes, searchTerm]);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Clientes</h2>
          <p className="text-gray-500 font-medium mt-1">Gestão de parceiros comerciais.</p>
        </div>
        <ActionButton onClick={() => setIsModalOpen(true)}><Plus className="h-5 w-5 mr-2 stroke-[3px]"/> Novo Cliente</ActionButton>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded-[2rem] shadow-xl border border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 relative w-full">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
           <input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-[1.5rem] pl-12 py-4 font-semibold text-sm shadow-inner focus:ring-2 focus:ring-blue-500/20" />
         </div>
      </div>

      {isLoading ? <Skeleton className="h-64 rounded-[2.5rem]" /> : (
        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in">
          <table className="w-full text-left table-zebrado">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b">
              <tr>
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa</th>
                <th className="px-10 py-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.map(c => (
                <tr key={c.id} onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheCliente', id: c.id, label: c.nome } })} className="cursor-pointer group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-inner group-hover:scale-110 transition-transform overflow-hidden">
                        {c.logo_data ? <img src={c.logo_data} className="w-full h-full object-contain p-1" /> : <Building className="text-blue-600 h-5 w-5" />}
                      </div>
                      <span className="font-black text-gray-900 dark:text-white text-lg tracking-tighter">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right"><ArrowRight className="h-5 w-5 text-gray-300 ml-auto group-hover:text-blue-600 transition-colors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={Math.ceil(filtered.length / itemsPerPage)} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />

      {isModalOpen && <ClienteFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={async (d:any) => { await supabase.from('clientes').insert([{ ...d, user_id: state.userId }]); setIsModalOpen(false); fetchClientes(); addToast("Cliente criado!"); }} />}
    </div>
  );
}

export function ClienteDetalheView({ clienteId }: { clienteId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [cliente, setCliente] = useState<any>(null);
  const [tab, setTab] = useState('dados');
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [projetos, setProjetos] = useState<any[]>([]);

  const fetchCliente = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).single();
    if (data) {
      setCliente(data);
      const projs = await supabase.from('projetos').select('*').eq('cliente_id', clienteId);
      setProjetos(projs.data || []);
    }
  }, [clienteId, supabase]);

  useEffect(() => { if (clienteId) fetchCliente(); }, [clienteId, fetchCliente]);

  if (!cliente) return <div className="p-8"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl flex items-center justify-center p-3 overflow-hidden">
             {cliente.logo_data ? <img src={cliente.logo_data} className="w-full h-full object-contain" /> : <Building className="h-10 w-10 text-blue-600" />}
          </div>
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'clientes' } })} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-black text-[10px] uppercase tracking-widest transition-all">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px]"/> Voltar
            </button>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{cliente.nome}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-2 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full w-fit">Parceiro Accelera</p>
          </div>
        </div>
        <div className="flex gap-3">
          <ActionButton variant="secondary" onClick={() => setIsEdit(true)}><Edit className="h-5 w-5 mr-2" /> Editar</ActionButton>
          <ActionButton variant="danger" onClick={() => setIsConfirmDelete(true)}><Trash2 className="h-5 w-5 mr-2" /> Excluir</ActionButton>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[
          {id:'dados', label:'Dados', icon:Building}, 
          {id:'projetos', label:'Projetos', icon:Briefcase},
          {id:'contratos', label:'Contratos', icon:FileSignature}
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-400 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4 mr-2"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-700 min-h-[500px] animate-fade-in">
        {tab === 'dados' && (
          <div className="space-y-12">
            <SectionHeader title="Informações Gerais" icon={Info} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2"><DetailBox label="RAZÃO SOCIAL / NOME" value={cliente.nome} icon={Building} /></div>
              <DetailBox label="ID DO SISTEMA" value={cliente.id} icon={FileText} />
            </div>
          </div>
        )}
        {tab === 'projetos' && (
          <div className="space-y-10">
            <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Projetos Ativos</h4>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-100 dark:bg-gray-900/50 border-b"><th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Projeto</th><th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Início</th><th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projetos.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-10 py-8 font-black text-blue-600 text-xl">{p.nome}</td>
                      <td className="px-10 py-8 text-gray-500 font-bold">{formatDateBR(p.data_inicio)}</td>
                      <td className="px-10 py-8 text-right"><Badge status={p.status}>{p.status}</Badge></td>
                    </tr>
                  ))}
                  {projetos.length === 0 && <tr><td colSpan={3} className="py-20 text-center text-gray-400 italic">Sem projetos vinculados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === 'contratos' && <TabContratosCliente clienteId={clienteId} />}
      </div>

      {isEdit && <ClienteFormModal isOpen={isEdit} onClose={() => setIsEdit(false)} onSave={async (d:any) => { await supabase.from('clientes').update({ ...d, user_id: state.userId }).eq('id', clienteId); setIsEdit(false); fetchCliente(); addToast("Atualizado!"); }} item={cliente} />}
      {isConfirmDelete && <ConfirmDeleteModal isOpen={isConfirmDelete} onClose={() => setIsConfirmDelete(false)} onConfirm={async () => { await supabase.from('clientes').delete().eq('id', clienteId); dispatch({type:'NAVIGATE', payload:{view:'clientes'}}); addToast("Removido."); }} title="Excluir Cliente" message="Tem certeza?" />}
    </div>
  );
}

function TabContratosCliente({ clienteId }: { clienteId: string }) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);
  const [isAditivoModalOpen, setIsAditivoModalOpen] = useState(false);
  const [selectedContratoId, setSelectedContratoId] = useState<string | null>(null);
  const [editingContrato, setEditingContrato] = useState<any>(null);

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contratos')
        .select('*, contratos_aditivos(*)')
        .eq('cliente_id', clienteId)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      setContratos(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [clienteId, supabase]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  const handleSaveContrato = async (formData: any) => {
    try {
      const payload = {
        ...sanitizePayload(formData),
        cliente_id: clienteId,
        registrado_por: state.userName,
        user_id: state.userId
      };

      if (editingContrato) {
        await supabase.from('contratos').update(payload).eq('id', editingContrato.id);
        addToast("Contrato atualizado!");
      } else {
        await supabase.from('contratos').insert([payload]);
        addToast("Contrato registrado!");
      }
      setIsContratoModalOpen(false);
      setEditingContrato(null);
      fetchContratos();
    } catch (e: any) { addToast(e.message, "error"); }
  };

  const handleSaveAditivo = async (formData: any) => {
    try {
      const payload = {
        ...sanitizePayload(formData),
        contrato_id: selectedContratoId,
        registrado_por: state.userName,
        user_id: state.userId
      };
      await supabase.from('contratos_aditivos').insert([payload]);
      addToast("Aditivo registrado com sucesso!");
      setIsAditivoModalOpen(false);
      fetchContratos();
    } catch (e: any) { addToast(e.message, "error"); }
  };

  const calculateContractStats = (c: any) => {
    const aditivos = c.contratos_aditivos || [];
    const valorAdicional = aditivos.reduce((acc: number, curr: any) => acc + (Number(curr.valor_adicional) || 0), 0);
    const valorTotal = Number(c.valor_inicial) + valorAdicional;
    
    // Pega a última data de aditivo se houver
    const datasFim = aditivos.map((a: any) => a.nova_data_fim).filter(Boolean);
    const vigenciaFim = datasFim.length > 0 ? datasFim.sort().reverse()[0] : c.data_fim;

    return { valorTotal, vigenciaFim };
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Gestão de Contratos</h4>
        <button 
          onClick={() => { setEditingContrato(null); setIsContratoModalOpen(true); }}
          className="px-10 py-5 bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest rounded-[1.8rem] shadow-2xl active:scale-95 transition-all flex items-center"
        >
          <Plus className="h-6 w-6 mr-3 stroke-[4px]" /> Novo Contrato
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-[2.5rem]" />
      ) : contratos.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[3rem] text-gray-400 font-bold italic">Nenhum contrato localizado para este cliente.</div>
      ) : (
        <div className="space-y-8">
          {contratos.map(c => {
            const stats = calculateContractStats(c);
            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md relative overflow-hidden group">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                   <div className="lg:col-span-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600"><FileSignature className="h-6 w-6" /></div>
                        <div>
                          <h5 className="font-black text-xl text-gray-900 dark:text-white tracking-tighter">{c.descricao}</h5>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contrato Principal</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4">
                         <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex-1 min-w-[150px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Valor Total Acumulado</span>
                            <span className="text-xl font-black text-blue-600 tracking-tighter">R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                         </div>
                         <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex-1 min-w-[150px]">
                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Vigência Atual</span>
                            <span className="text-sm font-black text-gray-700 dark:text-gray-300">{formatDateBR(c.data_inicio)} — {formatDateBR(stats.vigenciaFim)}</span>
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-2">
                      <div className="flex justify-between items-center mb-4">
                        <h6 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><History className="h-3 w-3" /> Histórico de Aditivos</h6>
                        <button 
                          onClick={() => { setSelectedContratoId(c.id); setIsAditivoModalOpen(true); }}
                          className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                        >
                          + Adicionar Aditivo
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 max-h-40 overflow-y-auto no-scrollbar p-4 space-y-3">
                         {c.contratos_aditivos?.length > 0 ? c.contratos_aditivos.map((a: any) => (
                           <div key={a.id} className="flex justify-between items-start text-xs border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                             <div>
                               <p className="font-black text-gray-700 dark:text-gray-300">{a.descricao}</p>
                               <p className="text-[10px] text-gray-400">{formatDateBR(a.created_at?.split('T')[0])} • {a.tipo}</p>
                             </div>
                             {a.valor_adicional > 0 && <span className="font-black text-emerald-600">+ R$ {Number(a.valor_adicional).toLocaleString('pt-BR')}</span>}
                           </div>
                         )) : (
                           <p className="text-center py-4 text-[10px] font-bold text-gray-400 uppercase">Sem aditivos registrados.</p>
                         )}
                      </div>
                   </div>
                </div>

                <div className="absolute bottom-4 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => { setEditingContrato(c); setIsContratoModalOpen(true); }} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-blue-400 hover:text-blue-600"><Edit className="h-4 w-4"/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isContratoModalOpen && <ContratoFormModal isOpen={isContratoModalOpen} onClose={() => setIsContratoModalOpen(false)} onSave={handleSaveContrato} item={editingContrato} />}
      {isAditivoModalOpen && <AditivoFormModal isOpen={isAditivoModalOpen} onClose={() => setIsAditivoModalOpen(false)} onSave={handleSaveAditivo} />}
    </div>
  );
}
