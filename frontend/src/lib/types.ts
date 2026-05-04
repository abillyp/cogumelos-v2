// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

export interface Insumo {
  id: string
  nome: string
  moPct: number
  carbonoPct: number
  nitrogenioPct: number
  cnRatio: number
  ph: number | null
  categoria: string | null
}

export interface Especie {
  id: string
  nome: string
  cnMin: number
  cnMax: number
  notas: string | null
}

export interface FormulacaoInsumoResponse {
  id: string
  insumoId: string
  insumoNome: string
  pesoRealKg: number
  umidadePct: number
  pesoSecoKg: number
  moKg: number
  cKg: number
  nKg: number
}

export interface Formulacao {
  id: string
  nome: string
  usuarioId: string
  usuarioNome: string
  especieId: string
  especieNome: string
  cnTotal: number | null
  phMedio: number | null
  criadoEm: string
  status: 'RASCUNHO' | 'ATIVA' | 'ARQUIVADA'
  cnDentroFaixa: boolean
  insumos: FormulacaoInsumoResponse[]
  umidadeDesejada: number | null
  pesoBlocoKg: number | null
  totalBlocos: number | null
}


export interface CustoInsumoResponse {
  insumoId: string
  insumoNome: string
  custoPorKg: number
  pesoRealKg: number
  custoTotal: number
}

export interface FinanceiroResponse {
  custoTotalSubstrato: number
  custoPorBloco: number
  custoPorKgProduzido: number
  totalColhidoKg: number
  receitaTotal: number
  margemReais: number
  margemPct: number
}

export interface ExperimentoInsumo {
  insumoId: string
  nome: string
  pesoKg: number
}


export interface Experimento {
  id: string
  codigo: string
  usuarioId: string
  usuarioNome: string
  formulacaoId: string
  formulacaoNome: string
  especieNome: string
  dataPreparo: string
  dataInoculacao: string | null
  amadurecimentoInicio: string | null
  amadurecimentoFim: string | null
  frutificacaoInicio: string | null
  frutificacaoFim: string | null
  totalBlocos: number
  pesoBlocoKg: number | null
  precoVendaKg?: number | null
  status: 'PREPARACAO' | 'INOCULADO' | 'AMADURECIMENTO' | 'FRUTIFICACAO' | 'DESCANSO' | 'CONCLUIDO'
  blocosPerdidos: number
  cicloAtual: number
  blocosAtivos: number
  cnTotal: number | null
  custos?: CustoInsumoResponse[]
  insumos?: ExperimentoInsumo[]
  financeiro?: FinanceiroResponse
}

export interface Monitoramento {
  id: string
  sala: 'AMADURECIMENTO' | 'FRUTIFICACAO' | 'DESCANSO'
  data: string
  temperatura: number | null
  umidade: number | null
  observacao: string | null
  blocosPerdidos: number | null
}

export interface Colheita {
  id: string
  data: string
  pesoTotalKg: number
  mediaPorBlocoKg: number | null
  notas: string | null
}

export interface UsuarioAdmin {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  criadoEm: string
}

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: 'ADMIN' | 'ADMIN_TENANT' | 'PRODUTOR'
  loginType: 'GOOGLE' | 'EMAIL'
}