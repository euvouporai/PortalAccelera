
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, UserPlus, Shield, Key, Mail, RefreshCcw, X, Edit } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, Skeleton, Pagination } from '../components/UI';
import { ConfirmDeleteModal } from '../components/Modals';

export default function UsuariosView() {
  const { state, supabase } = useAppContext();
  const { addToast } = useToast();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmação de deleção
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('usuarios_acesso')
      .select('*')
      .order('nome');
    
    if (error) addToast("Erro ao carregar usuários", "error");
    else setUsuarios(data || []);
    setIsLoading(false);
  }, [supabase, addToast]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const totalPages = Math.ceil(usuarios.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    return usuarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [usuarios, currentPage]);

  const handleSubmitUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: any = {
      nome: fd.get('nome'),
      login: fd.get('login'),
      senha: fd.get('senha'),
      role: fd.get('role') || 'Editor',
      user_id: state.userId
    };

    if (editingUser) {
      const { error } = await supabase
        .from('usuarios_acesso')
        .update(payload)
        .eq('id', editingUser.id);
      
      if (error) addToast(error.message, "error");
      else {
        addToast("Usuário atualizado com sucesso!");
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsuarios();
      }
    } else {
      // Novo usuário sempre marcado como primeiro acesso
      payload.primeiro_acesso = true;
      const { error } = await supabase.from('usuarios_acesso').insert([payload]);
      if (error) addToast(error.message, "error");
      else {
        addToast("Usuário cadastrado com sucesso!");
        setIsModalOpen(false);
        fetchUsuarios();
      }
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleDeleteTrigger = (id: string) => {
    setDeletingUserId(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;
    try {
      const { error } = await supabase.from('usuarios_acesso').delete().eq('id', deletingUserId);
      if (error) throw error;
      addToast("Usuário removido");
      fetchUsuarios();
    } catch (err) {
      addToast("Erro ao excluir", "error");
    } finally {
      setIsConfirmDeleteOpen(false);
      setDeletingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Acessos</h2>
          <p className="text-sm text-gray-500">Controle quem pode acessar o Portal Accelera</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center shadow-lg transition-all"
        >
          <UserPlus className="h-5 w-5 mr-2"/> Novo Usuário
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Login</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Nível</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8"><Skeleton className="h-10 w-full rounded-lg"/></td></tr>
              ) : paginatedData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">Nenhum usuário secundário cadastrado.</td></tr>
              ) : paginatedData.map(u => (
                <tr key={u.id} className="even:bg-gray-50/50 dark:even:bg-gray-700/30 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-3 group-hover:scale-110 transition-transform">
                        {u.nome.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-medium">{u.login}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(u); }}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit className="h-5 w-5"/>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTrigger(u.id); }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Remover"
                    >
                      <Trash2 className="h-5 w-5"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={usuarios.length} 
          itemsPerPage={itemsPerPage} 
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-8 animate-fade-in border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" /> {editingUser ? 'Editar Acesso' : 'Novo Acesso'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6"/></button>
            </div>
            <form onSubmit={handleSubmitUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome Completo</label>
                <div className="relative">
                  <input name="nome" defaultValue={editingUser?.nome} required className="form-input pl-10" placeholder="Ex: João Silva" />
                  <UserPlus className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Login / Usuário</label>
                <div className="relative">
                  <input name="login" defaultValue={editingUser?.login} required className="form-input pl-10" placeholder="joao.acesso" />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nível de Acesso</label>
                <select name="role" defaultValue={editingUser?.role || 'Editor'} className="form-select font-bold">
                  <option value="Administrador">Administrador</option>
                  <option value="Editor">Editor</option>
                  <option value="Visualizador">Visualizador</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Senha {editingUser ? '(deixe como está se não for mudar)' : ''}</label>
                <div className="relative">
                  <input name="senha" type="password" defaultValue={editingUser?.senha} required className="form-input pl-10" placeholder="••••••••" />
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all">
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isConfirmDeleteOpen && (
        <ConfirmDeleteModal 
          isOpen={isConfirmDeleteOpen} 
          onClose={() => setIsConfirmDeleteOpen(false)} 
          onConfirm={confirmDelete}
          title="Remover Acesso"
          message="Tem certeza que deseja remover permanentemente o acesso deste usuário ao portal?"
        />
      )}
    </div>
  );
}
