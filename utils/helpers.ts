
export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

/**
 * Converte um número ou string numérica para o formato BRL 1.234,56
 * Mantém a vírgula para centavos e pontos para milhares.
 */
export const formatCurrencyBRL = (value: number | string) => {
  if (value === undefined || value === null) return '';
  
  let stringValue = '';
  if (typeof value === 'number') {
    // Se for número vindo do banco, multiplicamos por 100 para tratar como centavos na máscara
    stringValue = Math.round(value * 100).toString();
  } else {
    // Se for string vindo do input, removemos tudo que não é dígito
    stringValue = value.replace(/\D/g, '');
  }
  
  if (!stringValue || stringValue === '0') return '0,00';
  
  const totalCents = parseInt(stringValue, 10);
  const formattedValue = (totalCents / 100).toFixed(2);
  const [int, dec] = formattedValue.split('.');
  const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return `${formattedInt},${dec}`;
};

/**
 * Converte a string formatada (1.234,56) de volta para o número (1234.56)
 */
export const parseCurrencyBRL = (value: string): number => {
  if (!value) return 0;
  // Remove pontos de milhar e substitui a vírgula decimal por ponto
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

/**
 * Converte strings vazias em null para salvar no banco de dados de forma limpa.
 */
export const sanitizePayload = (obj: any) => {
  const sanitized = { ...obj };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '') {
      sanitized[key] = null;
    }
  });
  return sanitized;
};

/**
 * Garante que valores nulos ou indefinidos sejam exibidos como "-"
 */
export const displayValue = (value: any, fallback: string = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};
