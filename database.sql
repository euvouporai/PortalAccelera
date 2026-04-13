
-- Adicionar novas colunas à tabela de cooperados
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='rg') THEN
        ALTER TABLE public.cooperados ADD COLUMN rg text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='data_nascimento') THEN
        ALTER TABLE public.cooperados ADD COLUMN data_nascimento date;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='ponto_referencia') THEN
        ALTER TABLE public.cooperados ADD COLUMN ponto_referencia text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='lgpd_aceite') THEN
        ALTER TABLE public.cooperados ADD COLUMN lgpd_aceite boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='nda_assinado') THEN
        ALTER TABLE public.cooperados ADD COLUMN nda_assinado boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cooperados' AND column_name='email_accelera') THEN
        ALTER TABLE public.cooperados ADD COLUMN email_accelera text;
    END IF;
END $$;

-- Criar tabela de equipamentos
CREATE TABLE IF NOT EXISTS public.equipamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL, -- Nome do Equipamento
    fabricante text,
    processador text,
    placa_video text,
    memoria text,
    caracteristicas text,
    cooperado_id uuid REFERENCES public.cooperados(id) ON DELETE SET NULL,
    status text DEFAULT 'Disponível',
    data_entrega date,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='equipamentos' AND column_name='codigo_equipamento') THEN
        ALTER TABLE public.equipamentos ADD COLUMN codigo_equipamento text;
    END IF;
END $$;

-- Tabela de histórico/log de vínculos de equipamentos
CREATE TABLE IF NOT EXISTS public.historico_equipamentos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE,
    cooperado_id uuid REFERENCES public.cooperados(id) ON DELETE SET NULL,
    data_inicio date NOT NULL,
    data_fim date,
    responsavel text,
    tipo text DEFAULT 'Entrega', -- Entrega ou Devolução
    observacao text,
    created_at timestamp with time zone DEFAULT now()
);

-- Adicionar colunas necessárias para o novo fluxo de faturamento
DO $$ 
BEGIN 
    -- Coluna para a Etapa 2 (Confirmação)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faturamentos' AND column_name='data_pedido') THEN
        ALTER TABLE public.faturamentos ADD COLUMN data_pedido date;
    END IF;

    -- Coluna para a Etapa 3 (Valor da Nota)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='faturamentos' AND column_name='valor_nota') THEN
        ALTER TABLE public.faturamentos ADD COLUMN valor_nota numeric(15,2);
    END IF;
END $$;

-- Atualizar status legados de 'Pago' para 'Faturado'
UPDATE public.faturamentos SET status = 'Faturado' WHERE status = 'Pago';

NOTIFY pgrst, 'reload schema';
