
import React, { useState, useEffect, useRef } from 'react';
import { X, Coins, Calendar, CheckCircle2, AlertTriangle, Trash2, Building, Briefcase, DollarSign, ArrowRight, Clock, User, Users, Info, Sun, FileText, CheckCircle, MapPin, ShieldCheck, Phone, AlertCircle, Upload, ImageIcon as ImageIconIcon, Key, Lock, ShieldAlert, UserPlus, Percent, MessageSquare, ReceiptText, CreditCard, Target, Mail, Wallet, TrendingUp, PlusCircle, Search, ChevronDown, Star, HeartPulse, FileSignature, Send, UserCircle, CheckSquare, Layers } from 'lucide-react';
import { formatCPF, formatPhone, UFS, displayValue, formatCurrencyBRL, parseCurrencyBRL, sanitizePayload } from '../utils/helpers';
import { supabase } from '../services/supabase';
import { useAppContext } from '../context/AppContext';
import { useToast, ActionButton, DetailBox } from './UI';

const formatDateBR = (dateStr: string) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const FormField = ({ label, required, children }: { label: string, required?: boolean, children?: React.ReactNode }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
      {label} {required && <span className="text-rose-500 font-black">*</span>}
    </label>
    {children}
  </div>
);

const ModalBackdrop = ({ children, onClose, alignment = 'center' }: { children?: React.ReactNode, onClose: () => void, alignment?: 'center' | 'top' }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className={`fixed inset-0 z-[999] flex justify-center bg-black/70 backdrop-blur-2xl p-4 animate-grow ${alignment === 'top' ? 'items-start pt-10' : 'items-center'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto no-scrollbar outline-none">
        {children}
      </div>
    </div>
  );
};

// --- MODALS ---

export function CooperadoFormModal({ isOpen, onClose, onSave, cooperado }: any) {
  useEffect(() => {
    console.log('CooperadoFormModal: cooperado prop:', cooperado);
  }, [cooperado]);

  const [formData, setFormData] = useState({
    nomeCompleto: cooperado?.nomeCompleto || '',
    funcao: cooperado?.funcao || '',
    email: cooperado?.email || '',
    telefone: cooperado?.telefone || '',
    cpf: cooperado?.cpf || '',
    status: cooperado?.status || 'Ativo',
    dataInicio: cooperado?.dataInicio || '',
    endereco: cooperado?.endereco || '',
    bairro: cooperado?.bairro || '',
    cidade: cooperado?.cidade || '',
    uf: cooperado?.uf || '',
    cep: cooperado?.cep || '',
    contatoEmergencia: cooperado?.contatoEmergencia || '',
    rg: cooperado?.rg || '',
    dataNascimento: cooperado?.dataNascimento || '',
    pontoReferencia: cooperado?.pontoReferencia || '',
    lgpdAceite: cooperado?.lgpdAceite || false,
    ndaAssinado: cooperado?.ndaAssinado || false,
    emailAccelera: cooperado?.emailAccelera || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose} alignment="top">
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {cooperado ? 'Editar Cadastro' : 'Novo Cooperado'}
        </h3>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-10">
          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <User className="h-4 w-4 text-blue-600" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Informações Pessoais</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Nome Completo" required>
                <input value={formData.nomeCompleto} onChange={e => setFormData({...formData, nomeCompleto: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
              </FormField>
              <FormField label="Função / Cargo" required>
                <input value={formData.funcao} onChange={e => setFormData({...formData, funcao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
              </FormField>
              <FormField label="E-mail" required>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
              </FormField>
              <FormField label="E-mail Accelera">
                <input type="email" value={formData.emailAccelera} onChange={e => setFormData({...formData, emailAccelera: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="Telefone / WhatsApp">
                <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: formatPhone(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="CPF">
                <input value={formData.cpf} onChange={e => setFormData({...formData, cpf: formatCPF(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="RG">
                <input value={formData.rg} onChange={e => setFormData({...formData, rg: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="Data de Nascimento">
                <input type="date" value={formData.dataNascimento} onChange={e => setFormData({...formData, dataNascimento: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="Status" required>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full">
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </FormField>
              <FormField label="Data de Início" required>
                <input type="date" value={formData.dataInicio} onChange={e => setFormData({...formData, dataInicio: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
              </FormField>
            </div>
          </div>

          {/* SEÇÃO 2: ENDEREÇO */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Endereço Residencial</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <FormField label="Logradouro / Rua">
                  <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
                </FormField>
              </div>
              <FormField label="Bairro">
                <input value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="Cidade">
                <input value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="UF">
                <select value={formData.uf} onChange={e => setFormData({...formData, uf: e.target.value})} className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full">
                  <option value="">Selecione...</option>
                  {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </FormField>
              <FormField label="CEP">
                <input value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <div className="md:col-span-3">
                <FormField label="Ponto de Referência">
                  <input value={formData.pontoReferencia} onChange={e => setFormData({...formData, pontoReferencia: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" placeholder="Ex: Próximo ao mercado central" />
                </FormField>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: SEGURANÇA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Segurança e Emergência</h4>
            </div>
            <FormField label="Contato de Emergência (Nome e Telefone)">
              <input value={formData.contatoEmergencia} onChange={e => setFormData({...formData, contatoEmergencia: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" placeholder="Ex: Maria (Esposa) - (11) 99999-9999" />
            </FormField>
          </div>

          {/* SEÇÃO 4: CONFORMIDADE */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Termos e Conformidade</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                <input type="checkbox" checked={formData.lgpdAceite} onChange={e => setFormData({...formData, lgpdAceite: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Termo LGPD Aceito</span>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                <input type="checkbox" checked={formData.ndaAssinado} onChange={e => setFormData({...formData, ndaAssinado: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">NDA Assinado</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Salvar Alterações</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function ClienteFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    nome: item?.nome || '',
    logo_data: item?.logo_data || null
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Cliente' : 'Novo Cliente'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Nome / Razão Social" required>
            <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Salvar Cliente</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function ProjetoFormModal({ isOpen, onClose, onSave, clientes, item }: any) {
  const [formData, setFormData] = useState({
    nome: item?.nome || '',
    clienteId: item?.cliente_id || '',
    dataInicio: item?.data_inicio || '',
    dataFim: item?.data_fim || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Projeto' : 'Novo Projeto'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Nome do Projeto" required>
            <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <FormField label="Cliente" required>
            <select value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})} className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required>
              <option value="">Selecione...</option>
              {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Data Início">
              <input type="date" value={formData.dataInicio} onChange={e => setFormData({...formData, dataInicio: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
            <FormField label="Previsão Fim">
              <input type="date" value={formData.dataFim} onChange={e => setFormData({...formData, dataFim: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
          </div>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Salvar Projeto</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function AlocacaoFormModal({ isOpen, onClose, onSave, cooperados, hideDates, item }: any) {
  const [formData, setFormData] = useState({
    cooperadoId: item?.cooperado_id || '',
    percentual: item?.percentual || 100,
    valorHora: item?.valor_hora || 0,
    horasMensais: item?.horas_mensais || 0,
    dataInicio: item?.data_inicio || '',
    dataFim: item?.data_fim || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Alocação' : 'Alocar Profissional'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Profissional" required>
            <select value={formData.cooperadoId} onChange={e => setFormData({...formData, cooperadoId: e.target.value})} className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required>
              <option value="">Selecione...</option>
              {cooperados.map((c: any) => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="% Alocação" required>
              <input type="number" value={formData.percentual} onChange={e => setFormData({...formData, percentual: Number(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
            <FormField label="Valor/Hora (R$)" required>
              <input type="number" step="0.01" value={formData.valorHora} onChange={e => setFormData({...formData, valorHora: Number(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
          </div>
          {!hideDates && (
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Data Início">
                <input type="date" value={formData.dataInicio} onChange={e => setFormData({...formData, dataInicio: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
              <FormField label="Data Fim">
                <input type="date" value={formData.dataFim} onChange={e => setFormData({...formData, dataFim: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
              </FormField>
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Confirmar Alocação</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function FeriasFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    data_inicio: item?.data_inicio || '',
    data_fim: item?.data_fim || '',
    horas: item?.horas || 80,
    observacao: item?.observacao || '',
    status: item?.status || 'Pendente'
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Período' : 'Solicitar Férias'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Data Início" required>
              <input type="date" value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
            <FormField label="Data Fim" required>
              <input type="date" value={formData.data_fim} onChange={e => setFormData({...formData, data_fim: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
          </div>
          <FormField label="Horas a Deduzir" required>
            <input type="number" value={formData.horas} onChange={e => setFormData({...formData, horas: Number(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <FormField label="Observação">
            <textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full h-24 resize-none" />
          </FormField>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Enviar Solicitação</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function RemuneracaoFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    dataVigencia: item?.vigencia || '',
    valorHora: item?.valor_hora || '',
    valorFixo: item?.valor_fixo || '',
    observacao: item?.observacao || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Registro' : 'Novo Reajuste'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Data de Vigência" required>
            <input type="date" value={formData.dataVigencia} onChange={e => setFormData({...formData, dataVigencia: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Valor Hora (R$)">
              <input type="number" step="0.01" value={formData.valorHora} onChange={e => setFormData({...formData, valorHora: e.target.value, valorFixo: ''})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
            <FormField label="Valor Fixo Mensal (R$)">
              <input type="number" step="0.01" value={formData.valorFixo} onChange={e => setFormData({...formData, valorFixo: e.target.value, valorHora: ''})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
          </div>
          <FormField label="Motivo / Observação">
            <textarea value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full h-24 resize-none" />
          </FormField>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Salvar Registro</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function FeedbackFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    data_feedback: item?.data_feedback || new Date().toISOString().split('T')[0],
    pauta: item?.pauta || '',
    conteudo: item?.conteudo || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Feedback' : 'Novo Registro de Desempenho'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Data da Reunião" required>
            <input type="date" value={formData.data_feedback} onChange={e => setFormData({...formData, data_feedback: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <FormField label="Pauta / Assunto" required>
            <input value={formData.pauta} onChange={e => setFormData({...formData, pauta: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <FormField label="Conteúdo do Feedback" required>
            <textarea value={formData.conteudo} onChange={e => setFormData({...formData, conteudo: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full h-40 resize-none" required />
          </FormField>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Registrar Feedback</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function FeriasDetalheModal({ isOpen, onClose, ferias }: any) {
  if (!isOpen || !ferias) return null;
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Detalhes do Afastamento</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"><X /></button>
        </div>
        <div className="space-y-6">
          <DetailBox label="Cooperado" value={ferias.cooperados?.nome_completo} />
          <div className="grid grid-cols-2 gap-6">
            <DetailBox label="Início" value={formatDateBR(ferias.data_inicio)} />
            <DetailBox label="Fim" value={formatDateBR(ferias.data_fim)} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <DetailBox label="Horas Deduzidas" value={`${ferias.horas}h`} />
            <DetailBox label="Status" value={ferias.status} />
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observações</span>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{ferias.observacao || 'Sem observações.'}"</p>
          </div>
        </div>
        <div className="mt-8">
          <ActionButton onClick={onClose} className="w-full">Fechar Detalhes</ActionButton>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export function ContratoFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    descricao: item?.descricao || '',
    data_inicio: item?.data_inicio || '',
    data_fim: item?.data_fim || '',
    valor_inicial: item?.valor_inicial || 0,
    status: item?.status || 'Ativo'
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Contrato' : 'Novo Contrato'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Descrição do Contrato" required>
            <input value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Data Início" required>
              <input type="date" value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
            <FormField label="Data Fim" required>
              <input type="date" value={formData.data_fim} onChange={e => setFormData({...formData, data_fim: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
            </FormField>
          </div>
          <FormField label="Valor Inicial (R$)" required>
            <input type="number" step="0.01" value={formData.valor_inicial} onChange={e => setFormData({...formData, valor_inicial: Number(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Salvar Contrato</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function AditivoFormModal({ isOpen, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    descricao: '',
    data_fim: '',
    valor_adicional: 0,
    tipo: 'Reajuste Valor'
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">Novo Aditivo</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Tipo de Aditivo" required>
            <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required>
              <option value="Reajuste Valor">Reajuste de Valor</option>
              <option value="Prorrogação">Prorrogação de Prazo</option>
              <option value="Alteração Escopo">Alteração de Escopo</option>
            </select>
          </FormField>
          <FormField label="Descrição" required>
            <input value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required />
          </FormField>
          <div className="grid grid-cols-2 gap-6">
            <FormField label="Nova Data Fim (opcional)">
              <input type="date" value={formData.data_fim} onChange={e => setFormData({...formData, data_fim: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
            <FormField label="Valor Adicional (R$)">
              <input type="number" step="0.01" value={formData.valor_adicional} onChange={e => setFormData({...formData, valor_adicional: Number(e.target.value)})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" />
            </FormField>
          </div>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">Adicionar Aditivo</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function FirstAccessModal() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (senha !== confirmar) {
      addToast("As senhas não coincidem.", "error");
      return;
    }
    try {
      const { error } = await supabase.from('usuarios_acesso').update({ senha, primeiro_acesso: false }).eq('id', state.profileId);
      if (error) throw error;
      addToast("Senha atualizada com sucesso!");
      dispatch({ type: 'PASSWORD_CHANGED' });
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-12 shadow-2xl w-full max-w-md border border-white/10">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600"><Lock className="h-10 w-10" /></div>
        <h3 className="text-3xl font-black text-center text-gray-900 dark:text-white mb-4 tracking-tighter">Primeiro Acesso</h3>
        <p className="text-gray-500 text-center mb-8 font-medium">Para sua segurança, defina uma nova senha de acesso ao portal.</p>
        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <FormField label="Nova Senha" required>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} className="form-input rounded-2xl bg-gray-50 border-none shadow-inner" required />
          </FormField>
          <FormField label="Confirmar Senha" required>
            <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} className="form-input rounded-2xl bg-gray-50 border-none shadow-inner" required />
          </FormField>
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Alterar e Entrar</button>
        </form>
      </div>
    </div>
  );
}

// --- ORIGINAL MODALS ---

export function OportunidadeContatoFormModal({ isOpen, onClose, onSave, item }: any) {
  const [formData, setFormData] = useState({
    nome: item?.nome || '',
    email: item?.email || '',
    nota: item?.nota || '',
    is_principal: item?.is_principal || false
  });
  if (!isOpen) return null;
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <h3 className="text-2xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {item ? 'Editar Contato' : 'Novo Contato da Oportunidade'}
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <FormField label="Nome do Contato" required>
            <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" required placeholder="Ex: Diretor Financeiro" />
          </FormField>
          <FormField label="E-mail de Referência">
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" placeholder="contato@empresa.com" />
          </FormField>
          <FormField label="Observações sobre este contato">
            <textarea value={formData.nota} onChange={e => setFormData({...formData, nota: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-4 font-medium h-24 shadow-inner resize-none w-full" placeholder="Ex: Decisor final, prefere contato via WhatsApp..." />
          </FormField>
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <input type="checkbox" id="is_principal" checked={formData.is_principal} onChange={e => setFormData({...formData, is_principal: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="is_principal" className="text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer flex items-center gap-2">
              <Star className={`h-4 w-4 ${formData.is_principal ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} /> Definir como Contato Principal
            </label>
          </div>
          <div className="flex gap-4 pt-4">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">{item ? 'Salvar Alterações' : 'Adicionar Contato'}</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function OportunidadeFormModal({ isOpen, onClose, onSave, clientes, item }: any) {
  const [formData, setFormData] = useState({
    titulo: item?.titulo || '',
    clienteId: item?.cliente_id || '',
    nomeProspect: item?.nome_prospect || '',
    valorEstimado: formatCurrencyBRL(item?.valor_estimado || 0),
    fase: item?.fase || 'Prospecção',
    statusEmail: item?.status_email || 'Não Enviado',
    descricao: item?.descricao || '',
    dataFechamentoEstimada: item?.data_fechamento_estimada || ''
  });
  if (!isOpen) return null;
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full p-10 border border-white/10 relative overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">{item ? 'Editar Negociação' : 'Nova Oportunidade'}</h3>
          <button onClick={onClose} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><X className="h-6 w-6 text-gray-400"/></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave({...formData, valorEstimado: parseCurrencyBRL(formData.valorEstimado)}); }} className="space-y-6">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 border border-indigo-50">
            <FormField label="Estágio Atual da Negociação (Fase)">
              <select value={formData.fase} onChange={e => setFormData({...formData, fase: e.target.value})} className="w-full bg-white/10 border-2 border-white/20 rounded-2xl py-4 px-6 font-black text-white text-lg uppercase tracking-widest focus:ring-4 focus:ring-white/20 transition-all outline-none" required>
                {['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Ganho', 'Perdido'].map(f => <option key={f} value={f} className="text-gray-900">{f}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Título da Negociação" required><input value={formData.titulo} onChange={e => setFormData({...formData, titulo: e.target.value})} className="form-input rounded-2xl border-none bg-gray-50 dark:bg-gray-900 py-4 shadow-inner font-bold w-full" placeholder="Ex: Expansão Contrato XPTO" required /></FormField>
            <FormField label="Valor Estimado">
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" value={formData.valorEstimado} onChange={e => setFormData({...formData, valorEstimado: formatCurrencyBRL(e.target.value)})} className="form-input pl-11 rounded-2xl border-none bg-gray-50 dark:bg-gray-900 py-4 font-black text-gray-900 dark:text-white w-full" placeholder="0,00" />
              </div>
            </FormField>
          </div>
          <FormField label="Escopo do Projeto">
            <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="form-input rounded-2xl border-none bg-gray-50 dark:bg-gray-900 py-4 shadow-inner h-32 font-bold leading-relaxed resize-none w-full" placeholder="Quais são as necessidades do cliente?" />
          </FormField>
          <div className="pt-6 flex gap-4">
             <ActionButton variant="secondary" className="flex-1" onClick={onClose} type="button">Cancelar</ActionButton>
             <ActionButton variant="primary" className="flex-[2]" type="submit">{item ? 'Salvar Alterações' : 'Criar Oportunidade'}</ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: any) {
  if (!isOpen) return null;
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-12 shadow-2xl border border-white/10 text-center animate-fade-in">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-rose-500 shadow-inner"><Trash2 className="h-12 w-12" /></div>
        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-10 font-medium leading-relaxed max-w-sm mx-auto">{message}</p>
        <div className="flex gap-4">
          <ActionButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton variant="danger" className="flex-[2]" onClick={onConfirm}>Excluir Registro</ActionButton>
        </div>
      </div>
    </ModalBackdrop>
  );
}

export function FaturamentoFormModal({ isOpen, onClose, onSave, clientes, projetos, item }: any) {
  const [formData, setFormData] = useState({
    mode: item ? 'single' : 'single', // Força individual na edição
    clienteId: item?.cliente_id || '',
    projetoId: item?.projeto_id || '',
    valor: item?.valor || 0,
    valorRealizado: item?.valor_realizado || 0,
    status: item?.status || 'Previsto',
    mesReferencia: item?.mes_referencia || '',
    mesFinal: '', // Apenas para modo lote
    dataEnvio: item?.data_envio || '',
    dataPedido: item?.data_pedido || '',
    dataNota: item?.data_nota || '',
    descricao: item?.descricao || '',
    observacao: item?.observacao || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">
            {item ? 'Editar Faturamento' : 'Lançar Faturamento'}
          </h3>
          
          {!item && (
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, mode: 'single'})}
                className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${formData.mode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
              >
                Individual
              </button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, mode: 'batch'})}
                className={`px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${formData.mode === 'batch' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
              >
                Em Lote
              </button>
            </div>
          )}
        </div>
        
        {formData.mode === 'single' && (
          <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-[2.5rem] border-2 border-blue-200 dark:border-blue-700 shadow-inner">
            <FormField label="Status Atual da Cobrança" required>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white dark:bg-gray-900 border-2 border-blue-400 dark:border-blue-500 rounded-2xl py-4 px-6 font-black text-blue-600 dark:text-blue-300 text-base uppercase tracking-widest focus:ring-4 focus:ring-blue-500/20 transition-all outline-none">
                {['Previsto', 'Pendente', 'Validado com Cliente', 'Solicitação Enviada', 'Nota Enviada', 'Faturado'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); onSave(formData); }} className="space-y-8">
          {/* BLOCO 0: INFOS BÁSICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-800">
            <FormField label="Cliente" required>
              <select value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})} className="form-select rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-bold shadow-sm w-full" required>
                <option value="">Selecione...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </FormField>
            
            <FormField label="Projeto Relacionado" required>
              <select value={formData.projetoId} onChange={e => setFormData({...formData, projetoId: e.target.value})} className="form-select rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-bold shadow-sm w-full" required>
                <option value="">Selecione...</option>
                {projetos.filter((p:any) => !formData.clienteId || p.cliente_id === formData.clienteId).map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </FormField>

            <div className={`${formData.mode === 'batch' ? 'md:col-span-1' : 'md:col-span-1'}`}>
              <FormField label={formData.mode === 'batch' ? "Mês Inicial" : "Mês Referência"} required>
                <input type="month" value={formData.mesReferencia} onChange={e => setFormData({...formData, mesReferencia: e.target.value})} className="form-input rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-black uppercase shadow-sm w-full" required />
              </FormField>
            </div>

            {formData.mode === 'batch' && (
              <FormField label="Até o Mês (Final)" required>
                <input type="month" value={formData.mesFinal} onChange={e => setFormData({...formData, mesFinal: e.target.value})} className="form-input rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-black uppercase shadow-sm w-full" required />
              </FormField>
            )}

            <div className="md:col-span-2">
               <FormField label={formData.mode === 'batch' ? "Vlr. Previsto Mensal" : "Vlr. Previsto Contratual"} required>
                <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} className="form-input rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-black text-blue-600 shadow-sm w-full" required />
               </FormField>
            </div>
          </div>

          {formData.mode === 'single' && (
            <div className="space-y-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Fluxo de Execução</p>
              
              {/* ETAPA 1: ENVIO */}
              <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-[2.2rem] border border-indigo-100 dark:border-indigo-800/50 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Etapa 1: Envio</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <FormField label="Vlr. Realizado (Enviado)">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400" />
                        <input type="number" step="0.01" value={formData.valorRealizado} onChange={e => setFormData({...formData, valorRealizado: Number(e.target.value)})} className="form-input pl-9 rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-black text-indigo-600 shadow-sm w-full" />
                      </div>
                    </FormField>
                    <FormField label="Data de Envio">
                      <div className="relative">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400" />
                        <input type="date" value={formData.dataEnvio} onChange={e => setFormData({...formData, dataEnvio: e.target.value})} className="form-input pl-9 rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-bold shadow-sm w-full" />
                      </div>
                    </FormField>
                </div>
              </div>

              {/* ETAPA 2: PEDIDO / CONFIRMAÇÃO */}
              <div className="p-6 bg-amber-50/30 dark:bg-amber-900/10 rounded-[2.2rem] border border-amber-100 dark:border-amber-800/50 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Etapa 2: Confirmação do Pedido</div>
                <FormField label="Data da Confirmação do Pedido">
                  <div className="relative mt-2">
                    <CheckSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                    <input type="date" value={formData.dataPedido} onChange={e => setFormData({...formData, dataPedido: e.target.value})} className="form-input pl-9 rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-bold shadow-sm w-full" />
                  </div>
                </FormField>
              </div>

              {/* ETAPA 3: NOTA */}
              <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 rounded-[2.2rem] border border-blue-100 dark:border-blue-800/50 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Etapa 3: Faturamento (Nota)</div>
                <FormField label="Data da Nota Fiscal">
                  <div className="relative mt-2">
                    <ReceiptText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
                    <input type="date" value={formData.dataNota} onChange={e => setFormData({...formData, dataNota: e.target.value})} className="form-input pl-9 rounded-xl border-none bg-white dark:bg-gray-900 py-3.5 font-bold shadow-sm w-full" />
                  </div>
                </FormField>
              </div>
            </div>
          )}

          <FormField label="Descrição / Observações">
            <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 shadow-inner h-20 font-bold resize-none w-full" placeholder="Ex: Referente à sprint de Janeiro..." />
          </FormField>

          <div className="flex gap-4 pt-6">
            <ActionButton variant="secondary" className="flex-1" onClick={onClose}>Cancelar</ActionButton>
            <ActionButton variant="primary" className="flex-[2]" type="submit">
              {formData.mode === 'batch' ? `Gerar Lote de Faturamentos` : `Salvar Alterações`}
            </ActionButton>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function EquipamentoFormModal({ isOpen, onClose, onSave, initialData }: any) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || '',
    fabricante: initialData?.fabricante || '',
    processador: initialData?.processador || '',
    placa_video: initialData?.placa_video || '',
    memoria: initialData?.memoria || '',
    caracteristicas: initialData?.caracteristicas || '',
    status: initialData?.status || 'Disponível',
    codigoEquipamento: initialData?.codigo_equipamento || ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in max-w-2xl w-full">
        <h3 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          {initialData ? 'Editar Equipamento' : 'Novo Equipamento'}
        </h3>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Equipamento (Modelo)" required>
              <input 
                value={formData.nome} 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: Latitude 3420"
                required 
              />
            </FormField>
            <FormField label="Código do Equipamento">
              <input 
                value={formData.codigoEquipamento} 
                onChange={e => setFormData({...formData, codigoEquipamento: e.target.value.slice(0, 20)})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: EQ-12345678901234567890"
                maxLength={20}
              />
            </FormField>
            <FormField label="Fabricante">
              <input 
                value={formData.fabricante} 
                onChange={e => setFormData({...formData, fabricante: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: Dell, Apple, Lenovo"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Processador">
              <input 
                value={formData.processador} 
                onChange={e => setFormData({...formData, processador: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: i7-1165G7"
              />
            </FormField>
            <FormField label="Placa de Vídeo">
              <input 
                value={formData.placa_video} 
                onChange={e => setFormData({...formData, placa_video: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: Iris Xe"
              />
            </FormField>
            <FormField label="Memória">
              <input 
                value={formData.memoria} 
                onChange={e => setFormData({...formData, memoria: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                placeholder="Ex: 16GB DDR4"
              />
            </FormField>
          </div>

          <FormField label="Outras Características">
            <textarea 
              value={formData.caracteristicas} 
              onChange={e => setFormData({...formData, caracteristicas: e.target.value})} 
              className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full h-24 resize-none" 
              placeholder="SSD, Tela, Teclado, etc."
            />
          </FormField>

          <FormField label="Status">
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value})} 
              className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full"
            >
              <option value="Disponível">Disponível</option>
              <option value="Em uso">Em uso</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Baixado">Baixado</option>
            </select>
          </FormField>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
              Salvar Equipamento
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function EquipamentoVinculoModal({ isOpen, onClose, onSave, equipamento, cooperados }: any) {
  const [formData, setFormData] = useState({
    cooperadoId: equipamento?.cooperado_id || '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: '',
    responsavel: '',
    tipo: equipamento?.cooperado_id ? 'Devolução' : 'Entrega',
    observacao: ''
  });

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in max-w-xl w-full">
        <h3 className="text-3xl font-black mb-2 dark:text-white uppercase tracking-tighter">
          {formData.tipo === 'Entrega' ? 'Registrar Entrega' : 'Registrar Devolução'}
        </h3>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-8">
          Equipamento: <span className="text-blue-600">{equipamento?.nome}</span>
        </p>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormField label="Cooperado" required>
              <select 
                value={formData.cooperadoId} 
                onChange={e => setFormData({...formData, cooperadoId: e.target.value})} 
                className="form-select rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full"
                required
                disabled={formData.tipo === 'Devolução'}
              >
                <option value="">Selecione o Cooperado...</option>
                {cooperados.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome_completo}</option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Data da Ação" required>
                <input 
                  type="date"
                  value={formData.dataInicio} 
                  onChange={e => setFormData({...formData, dataInicio: e.target.value})} 
                  className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                  required
                />
              </FormField>
              <FormField label="Responsável" required>
                <input 
                  value={formData.responsavel} 
                  onChange={e => setFormData({...formData, responsavel: e.target.value})} 
                  className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full" 
                  placeholder="Quem entregou/recebeu?"
                  required
                />
              </FormField>
            </div>

            <FormField label="Observações">
              <textarea 
                value={formData.observacao} 
                onChange={e => setFormData({...formData, observacao: e.target.value})} 
                className="form-input rounded-xl border-none bg-gray-50 dark:bg-gray-900 py-3 font-bold shadow-inner w-full h-24 resize-none" 
                placeholder="Estado do equipamento, acessórios, etc."
              />
            </FormField>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" className={`flex-[2] py-4 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all ${formData.tipo === 'Entrega' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'}`}>
              Confirmar {formData.tipo}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

export function EquipamentoLogModal({ isOpen, onClose, logs }: any) {
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-fade-in max-w-2xl w-full">
        <h3 className="text-3xl font-black mb-8 dark:text-white uppercase tracking-tighter">
          Histórico de Movimentação
        </h3>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              Nenhuma movimentação registrada.
            </div>
          ) : (
            logs.map((log: any) => (
              <div key={log.id} className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.tipo === 'Entrega' ? 'bg-blue-600' : 'bg-amber-600'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.tipo === 'Entrega' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                      {log.tipo}
                    </span>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-2 uppercase tracking-tight">
                      {log.cooperados?.nome_completo || 'N/A'}
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{new Date(log.data_inicio).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsável</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{log.responsavel || '-'}</p>
                  </div>
                </div>

                {log.observacao && (
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Observações</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">"{log.observacao}"</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-8">
          <button onClick={onClose} className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-200 transition-all">Fechar</button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
