
import React, { useState, useEffect } from 'react';
import { ImageIcon, Upload, Trash2, Shield, Layout, Palette, Save, CheckCircle, Info, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast, SectionHeader, ActionButton, DetailBox } from '../components/UI';

export default function SettingsView() {
  const { state, dispatch, supabase } = useAppContext();
  const { addToast } = useToast();
  const [logoLarge, setLogoLarge] = useState(state.portalConfig.logoLarge);
  const [logoMini, setLogoMini] = useState(state.portalConfig.logoMini);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLogoLarge(state.portalConfig.logoLarge);
    setLogoMini(state.portalConfig.logoMini);
  }, [state.portalConfig]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'large' | 'mini') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 500) {
        addToast("A imagem deve ter no máximo 500KB.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'large') setLogoLarge(base64);
        else setLogoMini(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // 1. Gravar no Banco de Dados Supabase
      const { error } = await supabase
        .from('portal_config')
        .upsert({ 
          id: 'main', 
          logo_large: logoLarge, 
          logo_mini: logoMini, 
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;

      // 2. Atualizar Estado da Aplicação
      dispatch({ 
        type: 'UPDATE_PORTAL_CONFIG', 
        payload: { 
          logoLarge, 
          logoMini 
        } 
      });

      addToast("Configurações de marca aplicadas com sucesso!");
    } catch (err: any) {
      addToast("Erro ao salvar no banco: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const removeLogo = (type: 'large' | 'mini') => {
    if (type === 'large') setLogoLarge(null);
    else setLogoMini(null);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">Configurações</h2>
          <p className="text-gray-500 font-medium mt-1">Personalize a identidade visual e parâmetros do sistema.</p>
        </div>
        <ActionButton onClick={saveSettings} disabled={isSaving}>
           {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />} 
           {isSaving ? "Gravando..." : "Salvar Alterações"}
        </ActionButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700">
             <SectionHeader title="Identidade Visual (Branding)" icon={Palette} />
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
               {/* Logo Principal */}
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Logo Principal (Sidebar/Header)</label>
                 <div className="relative group">
                   <div className="h-48 w-full bg-gray-50 dark:bg-gray-950/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-300">
                      {logoLarge ? (
                        <>
                          <img src={logoLarge} className="max-h-32 max-w-[80%] object-contain" alt="Preview Large" />
                          <button 
                            onClick={() => removeLogo('large')}
                            className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-6">
                           <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                           <p className="text-xs font-bold text-gray-400 uppercase">Nenhuma logo enviada</p>
                        </div>
                      )}
                   </div>
                   <label className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
                      <Upload className="h-4 w-4" /> Carregar Logo Principal
                      <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'large')} className="hidden" />
                   </label>
                 </div>
               </div>

               {/* Logo Reduzida */}
               <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Logo Reduzida (Mini/Favicon)</label>
                 <div className="relative group">
                   <div className="h-48 w-full bg-gray-50 dark:bg-gray-950/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-300">
                      {logoMini ? (
                        <>
                          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center p-2">
                            <img src={logoMini} className="h-full w-full object-contain" alt="Preview Mini" />
                          </div>
                          <button 
                            onClick={() => removeLogo('mini')}
                            className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-6">
                           <Layout className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                           <p className="text-xs font-bold text-gray-400 uppercase">Apenas ícone</p>
                        </div>
                      )}
                   </div>
                   <label className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-all shadow-sm">
                      <Upload className="h-4 w-4" /> Carregar Mini Logo
                      <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'mini')} className="hidden" />
                   </label>
                 </div>
               </div>
             </div>
           </div>

           <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-700">
              <SectionHeader title="Informações do Sistema" icon={Shield} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <DetailBox label="Versão do Portal" value="2.6.0-persistent" icon={Info} />
                 <DetailBox label="Ambiente" value="Produção (GCP)" icon={CheckCircle} color="text-emerald-600" />
                 <DetailBox label="Última Sincronização" value={new Date().toLocaleDateString()} />
                 <DetailBox label="ID da Instância" value="accelera-portal-main" />
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Dica de Customização</h3>
              <p className="text-sm font-medium opacity-80 leading-relaxed">
                Utilize imagens com fundo transparente (PNG ou SVG) para garantir a melhor aparência tanto no modo claro quanto no modo escuro.
              </p>
              <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3">
                 <CheckCircle className="h-5 w-5 text-indigo-200" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Logo Principal: 400x100px ideal</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
