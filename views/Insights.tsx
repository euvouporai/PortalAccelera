
import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Zap, TrendingUp, Users, BrainCircuit, Loader2, Info, ArrowRight, Target, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext.tsx';
import { GoogleGenAI } from "@google/genai";

export default function InsightsIAView() {
  const { state, supabase } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [generatingIA, setGeneratingIA] = useState(false);
  const [data, setData] = useState({
    cooperados: [] as any[],
    alocacoes: [] as any[],
    projetos: [] as any[],
    feedbacks: [] as any[]
  });
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coops, alocs, projs, fbs] = await Promise.all([
        supabase.from('cooperados').select('*'),
        supabase.from('alocacoes').select('*, cooperados(nome_completo), projetos(nome)'),
        supabase.from('projetos').select('*'),
        supabase.from('feedbacks').select('*')
      ]);

      setData({
        cooperados: coops.data || [],
        alocacoes: alocs.data || [],
        projetos: projs.data || [],
        feedbacks: fbs.data || []
      });
    } catch (err) {
      console.error("Erro ao carregar dados para Insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [state.userId, supabase]);

  const superallocated = data.cooperados.map(c => {
    const total = data.alocacoes
      .filter(a => a.cooperado_id === c.id)
      .reduce((s, a) => s + (Number(a.percentual) || 0), 0);
    return { ...c, totalAloc: total };
  }).filter(c => c.totalAloc > 100);

  const averageAloc = data.cooperados.length > 0 
    ? (data.alocacoes.reduce((s, a) => s + (Number(a.percentual) || 0), 0) / data.cooperados.length).toFixed(1)
    : 0;

  const generateAISuggestions = async () => {
    setGeneratingIA(true);
    try {
      // Fix: Adhering to coding guidelines for GoogleGenAI initialization
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const statsSummary = {
        totalCoop: data.cooperados.length,
        totalProj: data.projetos.length,
        superallocatedCount: superallocated.length,
        criticalNames: superallocated.map(s => s.nome_completo).join(', '),
        underallocated: data.cooperados.map(c => {
          const total = data.alocacoes.filter(a => a.cooperado_id === c.id).reduce((s, a) => s + (Number(a.percentual) || 0), 0);
          return total < 50 ? c.nome_completo : null;
        }).filter(Boolean).join(', ')
      };

      const prompt = `Como um consultor de RH e eficiência operacional especialista em tecnologia, analise estes dados do Portal Accelera:
        - Equipe: ${statsSummary.totalCoop} pessoas.
        - Projetos Ativos: ${statsSummary.totalProj}.
        - Superalocados (>100%): ${statsSummary.superallocatedCount} (${statsSummary.criticalNames}).
        - Com Baixa Alocação (<50%): ${statsSummary.underallocated}.
        
        Forneça uma análise estratégica em 3 pontos:
        1. Sugestão imediata para equilibrar a carga de trabalho.
        2. Alerta de risco de burnout ou atraso em projetos.
        3. Uma "Dica de Ouro" para aumentar a rentabilidade da cooperativa com base nesses números.
        
        Seja direto, use um tom profissional e formate em parágrafos curtos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiSuggestions(response.text || "A IA não conseguiu processar uma resposta agora.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiSuggestions("Houve um problema ao conectar com o motor de IA. Verifique se a chave de API está configurada.");
    } finally {
      setGeneratingIA(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="relative">
          <BrainCircuit className="h-16 w-16 text-blue-500 animate-pulse" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
        </div>
        <p className="mt-6 font-bold tracking-tight">Sincronizando Neurônios de Dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">Módulo Experimental</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white flex items-center tracking-tighter">
            Insights de IA <Sparkles className="h-8 w-8 ml-3 text-indigo-500" />
          </h2>
          <p className="text-gray-500 font-medium max-w-md">Análise preditiva baseada no Gemini para otimização de recursos e saúde operacional.</p>
        </div>
        <button 
          onClick={generateAISuggestions}
          disabled={generatingIA}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
        >
          {generatingIA ? <Loader2 className="h-5 w-5 animate-spin" /> : <BrainCircuit className="h-5 w-5" />}
          {aiSuggestions ? 'Recalcular Insights' : 'Gerar Análise Estratégica'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Target} label="Saúde Operacional" value={`${Math.max(0, 100 - (superallocated.length * 12))}%`} color="indigo" />
        <MetricCard icon={Users} label="Ocupação Média" value={`${averageAloc}%`} color="blue" />
        <MetricCard icon={AlertTriangle} label="Pessoas em Risco" value={superallocated.length} color="rose" />
        <MetricCard icon={ShieldCheck} label="Projetos Estáveis" value={data.projetos.length} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/10 rounded-[2.5rem] p-10 border border-indigo-100 dark:border-indigo-800/20 shadow-xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Sugestões do Consultor IA</h3>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Powered by Google Gemini</p>
            </div>
          </div>

          {!aiSuggestions && !generatingIA ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-gray-600">
                <Sparkles className="h-10 w-10 text-indigo-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm leading-relaxed text-lg">
                Seus dados estão prontos. Clique no botão acima para receber insights exclusivos da nossa IA.
              </p>
            </div>
          ) : generatingIA ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-indigo-100 dark:bg-gray-700 rounded-full animate-pulse w-full"></div>
                  <div className="h-4 bg-indigo-50 dark:bg-gray-700 rounded-full animate-pulse w-5/6 delay-75"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="p-8 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md rounded-3xl border border-white dark:border-gray-700 shadow-inner leading-relaxed text-gray-700 dark:text-gray-200 font-medium whitespace-pre-wrap text-lg">
                {aiSuggestions}
              </div>
              <div className="mt-6 flex items-center text-xs font-bold text-gray-400 uppercase tracking-tighter">
                <Info className="h-4 w-4 mr-2" /> 
                Esta análise utiliza processamento de linguagem natural e deve ser validada por um gestor humano.
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Deteção de Risco
          </h3>

          <div className="space-y-6">
            {superallocated.length === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-800/20 text-center">
                <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                <p className="font-black text-emerald-800 dark:text-emerald-400 text-lg leading-tight mb-2">Segurança Máxima</p>
                <p className="text-emerald-600 dark:text-emerald-500 text-sm font-medium">Nenhum profissional está com sobrecarga de trabalho detectada.</p>
              </div>
            ) : (
              superallocated.map(c => (
                <div key={c.id} className="p-6 border border-rose-100 dark:border-rose-900/30 rounded-3xl bg-rose-50/20 dark:bg-rose-900/5 hover:bg-rose-50/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-black text-gray-900 dark:text-white text-lg block leading-none">{c.nome_completo}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.funcao}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-600">{c.totalAloc}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-rose-100 dark:bg-rose-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 animate-[grow_1.5s_ease-out]" style={{ width: '100%' }}></div>
                  </div>
                  <p className="mt-3 text-[11px] font-bold text-rose-400 uppercase flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Priorizar remanejamento
                  </p>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/20">
             <div className="flex items-center gap-3 mb-2 text-blue-700 dark:text-blue-400">
               <Zap className="h-5 w-5" />
               <span className="font-bold">Capacidade Livre</span>
             </div>
             <p className="text-xs text-blue-600 dark:text-blue-500 font-medium leading-relaxed">
               O sistema identificou profissionais com alocação abaixo de 40% que podem absorver tarefas dos superalocados.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30",
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30",
    rose: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30",
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1 group">
      <div className={`p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110 ${colors[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    </div>
  );
}
