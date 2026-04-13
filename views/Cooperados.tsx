
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { List, LayoutGrid, Plus, Edit, Trash2, User, PieChart, MessageSquare, Sun, ArrowRight, Search, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, CheckCircle2, AlertCircle, Phone, MapPin, Coins, Calendar, UserCheck, Briefcase, Clock, Building, TrendingUp, History, Info, Star, Wallet, Award, Plane, Mail, HeartPulse, ShieldCheck, FileSignature, Laptop } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { CooperadoFormModal, ConfirmDeleteModal, FeriasFormModal, RemuneracaoFormModal, FeedbackFormModal, FeriasDetalheModal } from '../components/Modals';
import { sanitizePayload, displayValue } from '../utils/helpers';

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatCurrencySafe = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(Number(val))) return '0,00';
  return Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const calculateTenure = (startDate: string) => {
  if (!startDate) return '-';
  const start = new Date(startDate + 'T12:00:00');
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years === 0) return `${months} meses`;
  return `${years}a ${months}m`;
};

export function CooperadosView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [cooperados, setCooperados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: 'Ativo' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cooperados')
        .select('id, nome_completo, funcao, email, status, data_inicio, cidade, uf')
        .order('nome_completo');
      
      if (error) {
        console.error("[Cooperados] Erro ao buscar dados:", error);
        throw error;
      }
      
      setCooperados(data || []);
    } catch (error: any) {
      addToast(`Erro ao carregar lista: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [filters]);

  const filtered = useMemo(() => {
    return cooperados.filter(c => {
      const s = filters.search.toLowerCase();
      const nomeMatch = c.nome_completo?.toLowerCase().includes(s);
      const funcaoMatch = c.funcao?.toLowerCase().includes(s);
      const cidadeMatch = c.cidade?.toLowerCase().includes(s);
      
      return (nomeMatch || funcaoMatch || cidadeMatch) && (filters.status === '' || c.status === filters.status);
    });
  }, [cooperados, filters]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSaveNew = async (d: any) => {
    try {
      const payload = {
        ...sanitizePayload({
          nome_completo: d.nomeCompleto,
          funcao: d.funcao,
          email: d.email,
          telefone: d.telefone,
          cpf: d.cpf,
          status: d.status,
          data_inicio: d.dataInicio,
          endereco: d.endereco,
          bairro: d.bairro,
          cidade: d.cidade,
          uf: d.uf,
          cep: d.cep,
          contato_emergencia: d.contatoEmergencia,
          rg: d.rg,
          data_nascimento: d.dataNascimento,
          ponto_referencia: d.pontoReferencia,
          lgpd_aceite: d.lgpdAceite,
          nda_assinado: d.ndaAssinado,
          email_accelera: d.emailAccelera
        }),
        user_id: state.userId
      };
      const { error } = await supabase.from('cooperados').insert([payload]);
      if (error) throw error;
      addToast("Novo profissional cadastrado!");
      setIsModalOpen(false);
      fetchData();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Cooperados</h2>
          <p className="text-gray-500 font-medium mt-1">Gestão de talentos e disponibilidade.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-5 w-5"/></button>
            <button onClick={() => setViewMode('card')} className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="h-5 w-5"/></button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all"><Plus className="h-5 w-5 mr-2 inline stroke-[3px]"/> Novo</button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 p-3 rounded-[1.5rem] shadow-sm border border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input placeholder="Buscar por nome, função ou cidade..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="form-input pl-11 rounded-xl bg-gray-50 dark:bg-gray-900 border-none py-2.5 font-semibold text-sm" />
           </div>
           <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="form-select md:w-48 rounded-xl border-none bg-gray-50 dark:bg-gray-900 font-black text-[10px] uppercase text-gray-500">
              <option value="">Status: Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
           </select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-20 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
           <User className="h-12 w-12 text-gray-200 mx-auto mb-4" />
           <p className="text-gray-400 font-bold">Nenhum profissional encontrado.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="w-full text-left table-zebrado">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Função</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Localização</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Início</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.map(c => (
                <tr key={c.id} onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheCooperado', id: c.id, label: c.nome_completo } })}>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 font-black text-xs">{c.nome_completo.charAt(0)}</div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{c.nome_completo}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-xs font-medium text-gray-500 uppercase">{displayValue(c.funcao)}</td>
                  <td className="px-8 py-4 text-center text-[10px] font-bold text-gray-400 uppercase">
                    {c.cidade ? `${c.cidade}${c.uf ? ` - ${c.uf}` : ''}` : '-'}
                  </td>
                  <td className="px-8 py-4 text-center text-xs font-bold text-gray-400">{formatDateBR(c.data_inicio)}</td>
                  <td className="px-8 py-4 text-right"><ArrowRight className="h-4 w-4 text-gray-300 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedData.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm p-6 border border-gray-50 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer" onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'detalheCooperado', id: c.id, label: c.nome_completo } })}>
               <div className="flex justify-between items-start mb-4">
                 <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 font-black text-xl">{c.nome_completo.charAt(0)}</div>
                 <span className={`px-2 py-1 text-[9px] font-black rounded uppercase border ${c.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>{c.status}</span>
               </div>
               <h3 className="font-black text-gray-900 dark:text-white text-lg tracking-tighter leading-tight truncate">{c.nome_completo}</h3>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate">{c.funcao}</p>
               <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center gap-1.5 text-gray-400">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase">{c.cidade ? `${c.cidade} - ${c.uf}` : 'Local não informado'}</span>
               </div>
            </div>
          ))}
        </div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={itemsPerPage} />
      {isModalOpen && <CooperadoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveNew} />}
    </div>
  );
}

export function CooperadoDetalheView({ cooperadoId }: { cooperadoId: string }) {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [cooperado, setCooperado] = useState<any>(null);
  const [tab, setTab] = useState('dados');
  const [isEdit, setIsEdit] = useState(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const fetchCooperado = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('cooperados').select('*').eq('id', cooperadoId).single();
      if (error) throw error;
      setCooperado(data);
    } catch (err: any) {
      addToast(`Erro ao carregar perfil: ${err.message}`, 'error');
    }
  }, [cooperadoId, supabase, addToast]);

  useEffect(() => {
    if (cooperadoId) fetchCooperado();
  }, [cooperadoId, fetchCooperado]);

  if (!cooperado) return <div className="p-8"><Skeleton className="h-96 w-full rounded-[2.5rem]" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-xl flex items-center justify-center text-blue-600 font-black text-3xl">{cooperado.nome_completo.charAt(0)}</div>
          <div>
            <button onClick={() => dispatch({ type: 'NAVIGATE', payload: { view: 'cooperados' } })} className="flex items-center text-blue-600 hover:text-blue-800 mb-2 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all group">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180 stroke-[3px] group-hover:-translate-x-1 transition-transform"/> Voltar
            </button>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">{cooperado.nome_completo}</h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[11px] mt-2 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full w-fit">{cooperado.funcao}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsEdit(true)} className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 rounded-[1.5rem] hover:bg-blue-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"><Edit className="h-5 w-5 mr-2" /> Editar</button>
          <button onClick={() => setIsConfirmDelete(true)} className="flex items-center px-8 py-4 bg-white dark:bg-gray-800 border border-rose-200 dark:border-rose-900/30 text-rose-600 rounded-[1.5rem] hover:bg-rose-50 transition-all font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95"><Trash2 className="h-5 w-5 mr-2" /> Excluir</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-2 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 inline-flex flex-wrap gap-1">
        {[
          {id:'dados', label:'Dados Pessoais', icon:User}, 
          {id:'alocacoes', label:'Projetos/Alocações', icon:Briefcase},
          {id:'ferias', label:'Férias/Afastamentos', icon:Calendar},
          {id:'remuneracao', label:'Remuneração', icon:Coins}, 
          {id:'feedback', label:'Feedbacks', icon:MessageSquare},
          {id:'equipamentos', label:'Equipamentos', icon:Laptop},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center px-8 py-4 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
            <t.icon className="h-4 w-4 mr-2"/>{t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-2xl border border-gray-50 dark:border-gray-700 min-h-[600px] animate-fade-in">
        {tab === 'dados' && <TabDadosCooperado cooperado={cooperado} />}
        {tab === 'alocacoes' && <TabAlocacoesCooperado cooperadoId={cooperadoId} />}
        {tab === 'ferias' && <TabFeriasCooperado cooperado={cooperado} />}
        {tab === 'remuneracao' && <TabRemuneracaoCooperado cooperado={cooperado} />}
        {tab === 'feedback' && <TabFeedbackCooperado cooperadoId={cooperadoId} />}
        {tab === 'equipamentos' && <TabEquipamentosCooperado cooperadoId={cooperadoId} />}
      </div>

      {isEdit && (
        <CooperadoFormModal isOpen={isEdit} onClose={() => setIsEdit(false)} onSave={async (d: any) => {
            const payload = {
              ...sanitizePayload({
                nome_completo: d.nomeCompleto,
                funcao: d.funcao,
                email: d.email,
                telefone: d.telefone,
                cpf: d.cpf,
                status: d.status,
                data_inicio: d.dataInicio,
                endereco: d.endereco,
                bairro: d.bairro,
                cidade: d.cidade,
                uf: d.uf,
                cep: d.cep,
                contato_emergencia: d.contatoEmergencia,
                rg: d.rg,
                data_nascimento: d.dataNascimento,
                ponto_referencia: d.pontoReferencia,
                lgpd_aceite: d.lgpdAceite,
                nda_assinado: d.ndaAssinado,
                email_accelera: d.emailAccelera
              }),
              user_id: state.userId
            };
            const { error } = await supabase.from('cooperados').update(payload).eq('id', cooperadoId);
            if (!error) {
              setIsEdit(false);
              fetchCooperado();
              addToast("Dados do cooperado atualizados!");
            } else {
              addToast(error.message, "error");
            }
        }} cooperado={{
          nomeCompleto: cooperado.nome_completo,
          funcao: cooperado.funcao,
          email: cooperado.email,
          telefone: cooperado.telefone,
          cpf: cooperado.cpf,
          status: cooperado.status,
          dataInicio: cooperado.data_inicio || '',
          endereco: cooperado.endereco,
          bairro: cooperado.bairro,
          cidade: cooperado.cidade,
          uf: cooperado.uf,
          cep: cooperado.cep,
          contatoEmergencia: cooperado.contato_emergencia,
          rg: cooperado.rg,
          dataNascimento: cooperado.data_nascimento || '',
          pontoReferencia: cooperado.ponto_referencia,
          lgpdAceite: cooperado.lgpd_aceite,
          ndaAssinado: cooperado.nda_assinado,
          emailAccelera: cooperado.email_accelera
        }} />
      )}

      {isConfirmDelete && <ConfirmDeleteModal isOpen={isConfirmDelete} onClose={() => setIsConfirmDelete(false)} onConfirm={async () => {
          await supabase.from('cooperados').delete().eq('id', cooperadoId);
          dispatch({ type: 'NAVIGATE', payload: { view: 'cooperados' } });
      }} title="Excluir Profissional" message="Tem certeza que deseja remover este cooperado do sistema?" />}
    </div>
  );
}

function TabDadosCooperado({ cooperado }: any) {
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
      <span className="font-black text-gray-900 dark:text-white text-base tracking-tight leading-tight block" title={displayValue(value)}>{displayValue(value)}</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <SectionHeader title="Informações Pessoais" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2"><DetailBox label="NOME COMPLETO" value={cooperado.nome_completo} icon={User} /></div>
        <DetailBox label="FUNÇÃO / CARGO" value={cooperado.funcao} icon={UserCheck} />
        <DetailBox label="STATUS" value={cooperado.status} icon={CheckCircle} />
        
        <DetailBox label="E-MAIL" value={cooperado.email} icon={Mail} />
        <DetailBox label="TELEFONE / WHATSAPP" value={cooperado.telefone} icon={Phone} />
        <DetailBox label="CPF" value={cooperado.cpf} />
        <DetailBox label="RG" value={cooperado.rg} />
        <DetailBox label="DATA NASCIMENTO" value={formatDateBR(cooperado.data_nascimento)} icon={Calendar} />
        <DetailBox label="DATA INÍCIO" value={formatDateBR(cooperado.data_inicio)} icon={Calendar} />
      </div>

      <SectionHeader title="Endereço Completo" />
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2"><DetailBox label="LOGRADOURO / RUA" value={cooperado.endereco} icon={MapPin} /></div>
        <DetailBox label="BAIRRO" value={cooperado.bairro} />
        <DetailBox label="CIDADE" value={cooperado.cidade} />
        <DetailBox label="ESTADO (UF)" value={cooperado.uf} />
        <DetailBox label="CEP" value={cooperado.cep} />
        <div className="md:col-span-3"><DetailBox label="PONTO DE REFERÊNCIA" value={cooperado.ponto_referencia} /></div>
      </div>

      <SectionHeader title="Segurança e Emergência" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <DetailBox label="CONTATO DE EMERGÊNCIA" value={cooperado.contato_emergencia} icon={HeartPulse} />
        </div>
      </div>

      <SectionHeader title="Termos e Conformidade" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-inner">
          <div className={`p-2 rounded-lg ${cooperado.lgpd_aceite ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">TERMO LGPD</p>
            <p className="font-black text-gray-900 dark:text-white text-base">{cooperado.lgpd_aceite ? 'ACEITO' : 'NÃO ACEITO'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 shadow-inner">
          <div className={`p-2 rounded-lg ${cooperado.nda_assinado ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
            <FileSignature className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">NDA</p>
            <p className="font-black text-gray-900 dark:text-white text-base">{cooperado.nda_assinado ? 'ASSINADO' : 'NÃO ASSINADO'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabAlocacoesCooperado({ cooperadoId }: { cooperadoId: string }) {
  const { supabase } = useAppContext();
  const [alocacoes, setAlocacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlocacoes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('alocacoes').select('*, projetos(nome, clientes(nome))').eq('cooperado_id', cooperadoId);
    setAlocacoes(data || []);
    setLoading(false);
  }, [cooperadoId, supabase]);

  useEffect(() => { fetchAlocacoes(); }, [fetchAlocacoes]);

  return (
    <div className="space-y-8 animate-fade-in">
      <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Projetos e Alocações</h3>
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Projeto / Cliente</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Período</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Taxa/h</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">% Aloc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {alocacoes.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-gray-400 italic">Sem alocações registradas.</td></tr>
            ) : alocacoes.map(a => (
              <tr key={a.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><Briefcase className="h-5 w-5" /></div>
                    <div>
                      <p className="font-black text-gray-800 dark:text-white text-lg">{a.projetos?.nome}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{a.projetos?.clientes?.nome || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-8 text-sm text-gray-500 font-bold text-center">{formatDateBR(a.data_inicio)} — {formatDateBR(a.data_fim)}</td>
                <td className="px-6 py-8 text-right font-black text-gray-700 dark:text-gray-300">R$ {formatCurrencySafe(a.valor_hora)}</td>
                <td className="px-10 py-8 text-right"><span className="font-black text-2xl text-blue-600 dark:text-blue-400 tracking-tighter">{a.percentual}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabFeriasCooperado({ cooperado }: { cooperado: any }) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [ferias, setFerias] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingFerias, setEditingFerias] = useState<any>(null);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [feriasToDelete, setFeriasToDelete] = useState<string | null>(null);

  const fetchFerias = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('ferias').select('*').eq('cooperado_id', cooperado.id).order('data_inicio', { ascending: false });
    if (data) setFerias(data);
    setLoading(false);
  }, [cooperado.id, supabase]);

  useEffect(() => { fetchFerias(); }, [fetchFerias]);

  const summary = useMemo(() => {
    const dataInicio = new Date(cooperado.data_inicio + 'T12:00:00');
    const hoje = new Date();
    let anosCompletos = hoje.getFullYear() - dataInicio.getFullYear();
    const m = hoje.getMonth() - dataInicio.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dataInicio.getDate())) {
      anosCompletos--;
    }
    
    const totalDireito = Math.max(0, anosCompletos) * 80;
    const totalUsado = ferias
      .filter(f => f.status === 'Aprovado' || f.status === 'Aprovada' || f.status === 'Gozada')
      .reduce((acc, f) => acc + (Number(f.horas) || 0), 0);
    const saldoFerias = totalDireito - totalUsado;

    return {
      direito: totalDireito,
      saldo: saldoFerias
    };
  }, [ferias, cooperado.data_inicio]);

  const handleSaveFerias = async (d: any) => {
    try {
      const payload = { 
        ...sanitizePayload(d), 
        cooperado_id: cooperado.id,
        user_id: state.userId
      };
      if (editingFerias) {
        const { error } = await supabase.from('ferias').update(payload).eq('id', editingFerias.id);
        if (error) throw error;
        addToast("Atualizado!");
      } else {
        const { error } = await supabase.from('ferias').insert([payload]);
        if (error) throw error;
        addToast("Solicitação enviada!");
      }
      setIsModalOpen(false);
      setEditingFerias(null);
      fetchFerias();
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const handleDeleteFerias = async () => {
    if (!feriasToDelete) return;
    try {
      const { error } = await supabase.from('ferias').delete().eq('id', feriasToDelete);
      if (error) throw error;
      addToast("Excluído com sucesso!");
      fetchFerias();
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setIsConfirmDelete(false);
      setFeriasToDelete(null);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard icon={Plane} label="Direito de Férias Acumulado" value={`${summary.direito}h`} color="indigo" description="Total acumulado desde o início (+80h/ano)" />
        <SummaryCard icon={Coins} label="Saldo Disponível" value={`${summary.saldo}h`} color={summary.saldo < 0 ? 'rose' : 'blue'} description="Disponível para utilização" />
      </div>

      <div className="flex justify-between items-center pt-6">
        <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Histórico de Solicitações</h4>
        <button onClick={() => { setEditingFerias(null); setIsModalOpen(true); }} className="px-8 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all flex items-center gap-2"><Plus className="h-4 w-4" /> Solicitar Período</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Início</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fim</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Horas</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Observação</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {ferias.map(f => {
              const status = f.status || 'Pendente';
              const isAprovado = status.toLowerCase() === 'aprovado' || status.toLowerCase() === 'aprovada' || status.toLowerCase() === 'gozada';
              
              return (
                <tr key={f.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="px-10 py-6 font-bold text-gray-700 dark:text-gray-300">{formatDateBR(f.data_inicio)}</td>
                  <td className="px-10 py-6 font-bold text-gray-700 dark:text-gray-300">{formatDateBR(f.data_fim)}</td>
                  <td className="px-6 py-6 text-center font-black text-blue-600">{f.horas}h</td>
                  <td className="px-10 py-6">
                     <p className="text-sm text-gray-500 italic max-w-xs truncate" title={f.observacao}>{f.observacao || '-'}</p>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border tracking-widest ${isAprovado ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingFerias(f); setIsModalOpen(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-blue-400 hover:text-blue-600 transition-all shadow-sm"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => { setFeriasToDelete(f.id); setIsConfirmDelete(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ferias.length === 0 && <tr><td colSpan={6} className="py-20 text-center text-gray-400 italic">Sem solicitações.</td></tr>}
          </tbody>
        </table>
      </div>
      {isModalOpen && <FeriasFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingFerias(null); }} onSave={handleSaveFerias} item={editingFerias} />}
      {isConfirmDelete && <ConfirmDeleteModal isOpen={isConfirmDelete} onClose={() => setIsConfirmDelete(false)} onConfirm={handleDeleteFerias} title="Excluir Férias" message="Tem certeza que deseja remover este registro de férias?" />}
    </div>
  );
}

function TabRemuneracaoCooperado({ cooperado }: { cooperado: any }) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [remuneracoes, setRemuneracoes] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fetchRem = useCallback(async () => {
    const { data, error } = await supabase
      .from('remuneracoes_historico')
      .select('*')
      .eq('cooperado_id', cooperado.id)
      .order('vigencia', { ascending: false });
    
    if (error) console.error(error);
    else setRemuneracoes(data || []);
  }, [cooperado.id, supabase]);

  useEffect(() => { fetchRem(); }, [fetchRem]);

  const summary = useMemo(() => {
    if (remuneracoes.length === 0) return { emissao: '-', inicial: '0,00', atual: '0,00', tempo: calculateTenure(cooperado.data_inicio) };
    
    const atual = remuneracoes[0];
    const inicial = remuneracoes[remuneracoes.length - 1];
    
    const getVal = (item: any) => item.valor_fixo || item.valor_hora || 0;

    return {
      emissao: formatDateBR(atual.vigencia),
      inicial: formatCurrencySafe(getVal(inicial)),
      atual: formatCurrencySafe(getVal(atual)),
      tempo: calculateTenure(cooperado.data_inicio)
    };
  }, [remuneracoes, cooperado.data_inicio]);

  const handleSave = async (d: any) => {
    try {
      const payload = {
        cooperado_id: cooperado.id,
        vigencia: d.dataVigencia,
        valor_hora: d.valorHora ? Number(d.valorHora) : null,
        valor_fixo: d.valorFixo ? Number(d.valorFixo) : null,
        observacao: d.observacao || null,
        user_id: state.userId
      };

      const { error } = editingItem 
        ? await supabase.from('remuneracoes_historico').update(payload).eq('id', editingItem.id)
        : await supabase.from('remuneracoes_historico').insert([payload]);

      if (error) throw error;

      setIsModalOpen(false);
      setEditingItem(null);
      fetchRem();
      addToast("Salvo!");
    } catch (e: any) { addToast(e.message, "error"); }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard icon={Award} label="Última Vigência" value={summary.emissao} color="blue" description="Data do último ajuste registrado" />
        <SummaryCard icon={TrendingUp} label="Salário Atual" value={`R$ ${summary.atual}`} color="emerald" description="Valor vigente hoje" />
        <SummaryCard icon={Clock} label="Tempo de Casa" value={summary.tempo} color="rose" description="Período desde a contratação" />
      </div>

      <div className="flex justify-between items-center pt-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl"><Coins className="h-6 w-6 text-emerald-600" /></div>
          <div>
            <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Histórico de Reajustes</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evolução contratual</p>
          </div>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-10 py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-2"><Plus className="h-5 w-5 stroke-[3px]" /> Novo Reajuste</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vigência</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Valor</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Observação</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {remuneracoes.map(r => (
              <tr key={r.id} className="hover:bg-emerald-50/10 transition-colors group">
                <td className="px-10 py-6 font-black text-gray-700 dark:text-gray-300">{formatDateBR(r.vigencia)}</td>
                <td className="px-6 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${r.valor_hora ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{r.valor_hora ? 'Valor Hora' : 'Fixo'}</span></td>
                <td className="px-6 py-6 text-right font-black text-gray-900 dark:text-white text-lg tracking-tighter">R$ {formatCurrencySafe(r.valor_fixo || r.valor_hora)}</td>
                <td className="px-10 py-6">
                   <p className="text-sm text-gray-500 italic max-w-xs truncate" title={r.observacao}>{r.observacao || '-'}</p>
                </td>
                <td className="px-10 py-6 text-right">
                   <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingItem(r); setIsModalOpen(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-blue-400 hover:text-blue-600 transition-all shadow-sm"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => { setItemToDelete(r.id); setIsConfirmDelete(true); }} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-rose-300 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                   </div>
                </td>
              </tr>
            ))}
            {remuneracoes.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">Sem registros.</td></tr>}
          </tbody>
        </table>
      </div>

      {isModalOpen && <RemuneracaoFormModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null); }} onSave={handleSave} item={editingItem} />}
      {isConfirmDelete && <ConfirmDeleteModal isOpen={isConfirmDelete} onClose={() => setIsConfirmDelete(false)} onConfirm={async () => { await supabase.from('remuneracoes_historico').delete().eq('id', itemToDelete); fetchRem(); setIsConfirmDelete(false); }} title="Excluir Remuneração" message="Deseja remover este registro?" />}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, description }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };
  return (
    <div className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-xl group">
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}><Icon className="h-7 w-7" /></div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{value}</p>
      <p className="text-[10px] font-bold text-gray-500 mt-2 opacity-70">{description}</p>
    </div>
  );
}

function TabFeedbackCooperado({ cooperadoId }: { cooperadoId: string }) {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const fetchFB = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('cooperado_id', cooperadoId)
        .order('data_feedback', { ascending: false });
      
      if (error) throw error;
      setFeedbacks(data || []);
    } catch (err: any) {
      console.error("[Feedback] Erro ao buscar:", err);
      addToast("Erro ao carregar feedbacks.", "error");
    } finally {
      setLoading(false);
    }
  }, [cooperadoId, supabase, addToast]);

  useEffect(() => { fetchFB(); }, [fetchFB]);

  const handleSaveFeedback = async (d: any) => {
    try {
      const payload = { 
        ...sanitizePayload(d), 
        cooperado_id: cooperadoId,
        registrado_por: state.userName || 'Sistema',
        user_id: state.userId
      };

      if (editingFeedback) {
        const { error } = await supabase.from('feedbacks').update(payload).eq('id', editingFeedback.id);
        if (error) throw error;
        addToast("Feedback atualizado!");
      } else {
        const { error } = await supabase.from('feedbacks').insert([payload]);
        if (error) throw error;
        addToast("Feedback registrado!");
      }
      
      setIsModalOpen(false);
      setEditingFeedback(null);
      fetchFB();
    } catch (e: any) {
      console.error("[Feedback] Erro ao salvar:", e);
      addToast(e.message || "Erro ao salvar feedback", "error");
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    try {
      const { error } = await supabase.from('feedbacks').delete().eq('id', feedbackToDelete);
      if (error) throw error;
      addToast("Removido com sucesso!");
      fetchFB();
    } catch (e: any) {
      addToast(e.message || "Erro ao excluir", "error");
    } finally {
      setIsConfirmDelete(false);
      setFeedbackToDelete(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">Histórico de Feedbacks</h4>
          <p className="text-sm text-gray-500 font-medium">Acompanhamento de desempenho e pautas tratadas.</p>
        </div>
        <button 
          onClick={() => { setEditingFeedback(null); setIsModalOpen(true); }} 
          className="px-10 py-5 bg-blue-600 text-white rounded-[1.8rem] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5 stroke-[3px]" /> Novo Feedback
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pauta / Assunto</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Conteúdo</th>
              <th className="px-8 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrado Por</th>
              <th className="px-10 py-7 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center"><Skeleton className="h-10 w-3/4 mx-auto rounded-lg" /></td></tr>
            ) : feedbacks.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-gray-400 italic">Sem feedbacks registrados.</td></tr>
            ) : feedbacks.map(f => (
              <tr key={f.id} className="hover:bg-blue-50/20 transition-colors group">
                <td className="px-10 py-6 font-bold text-gray-500 whitespace-nowrap">{formatDateBR(f.data_feedback)}</td>
                <td className="px-10 py-6">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded-lg border border-blue-100 dark:border-blue-800">{f.pauta}</span>
                </td>
                <td className="px-10 py-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic line-clamp-2" title={f.conteudo}>
                    "{f.conteudo}"
                  </p>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[8px] font-black">{f.registrado_por?.charAt(0)}</div>
                    <span className="text-[10px] font-black text-gray-400 uppercase">{f.registrado_por || 'Sistema'}</span>
                  </div>
                </td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => { setEditingFeedback(f); setIsModalOpen(true); }} 
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-blue-400 hover:text-blue-600 transition-all shadow-sm"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => { setFeedbackToDelete(f.id); setIsConfirmDelete(true); }} 
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-rose-300 hover:text-rose-600 transition-all shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <FeedbackFormModal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); setEditingFeedback(null); }} 
          onSave={handleSaveFeedback} 
          item={editingFeedback} 
        />
      )}

      {isConfirmDelete && (
        <ConfirmDeleteModal 
          isOpen={isConfirmDelete} 
          onClose={() => setIsConfirmDelete(false)} 
          onConfirm={handleDeleteFeedback} 
          title="Excluir Feedback" 
          message="Tem certeza que deseja remover este registro de feedback? Esta ação não pode ser desfeita." 
        />
      )}
    </div>
  );
}

function TabEquipamentosCooperado({ cooperadoId }: { cooperadoId: string }) {
  const { supabase } = useAppContext();
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEquipamentos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('equipamentos').select('*').eq('cooperado_id', cooperadoId).order('nome');
    setEquipamentos(data || []);
    setLoading(false);
  }, [cooperadoId, supabase]);

  useEffect(() => { fetchEquipamentos(); }, [fetchEquipamentos]);

  if (loading) return <Skeleton className="h-40 w-full rounded-3xl" />;

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">Equipamentos Vinculados</h3>
      </div>

      {equipamentos.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] p-12 text-center border border-dashed border-gray-200 dark:border-gray-800">
          <Laptop className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum equipamento vinculado a este profissional.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {equipamentos.map(e => (
            <div key={e.id} className="p-6 bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                  <Laptop className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 dark:text-white tracking-tight">{e.nome}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{e.fabricante}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Processador</p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{e.processador || '-'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Memória</p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">{e.memoria || '-'}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Características</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-pre-wrap">{e.caracteristicas || 'Nenhuma característica informada.'}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entrega: {e.data_entrega ? formatDateBR(e.data_entrega) : '-'}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase border ${
                    e.status === 'Em uso' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {e.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
