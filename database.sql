
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
