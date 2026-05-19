// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import type { Monitoramento } from './types'

// ── Monitoramento ─────────────────────────────────────────────────────────────

export interface MonitoramentoState {
  sala: Monitoramento['sala']
  data: string
  temp: string
  umid: string
  obs: string
  blocosPerdidos: string
  erro: string
}

export type MonitoramentoAction =
  | { type: 'SET_SALA';            value: Monitoramento['sala'] }
  | { type: 'SET_DATA';            value: string }
  | { type: 'SET_TEMP';            value: string }
  | { type: 'SET_UMID';            value: string }
  | { type: 'SET_OBS';             value: string }
  | { type: 'SET_BLOCOS_PERDIDOS'; value: string }
  | { type: 'SET_ERRO';            value: string }
  | { type: 'RESET' }

export function monitoramentoInicial(): MonitoramentoState {
  return {
    sala: 'FRUTIFICACAO',
    data: new Date().toISOString().slice(0, 10),
    temp: '', umid: '', obs: '', blocosPerdidos: '', erro: '',
  }
}

export function monitoramentoReducer(
  state: MonitoramentoState,
  action: MonitoramentoAction,
): MonitoramentoState {
  switch (action.type) {
    case 'SET_SALA':            return { ...state, sala: action.value }
    case 'SET_DATA':            return { ...state, data: action.value }
    case 'SET_TEMP':            return { ...state, temp: action.value }
    case 'SET_UMID':            return { ...state, umid: action.value }
    case 'SET_OBS':             return { ...state, obs: action.value }
    case 'SET_BLOCOS_PERDIDOS': return { ...state, blocosPerdidos: action.value }
    case 'SET_ERRO':            return { ...state, erro: action.value }
    // RESET limpa apenas os campos de input, preservando sala e data
    case 'RESET':               return { ...state, temp: '', umid: '', obs: '', blocosPerdidos: '', erro: '' }
    default:                    return state
  }
}

// ── Colheita ──────────────────────────────────────────────────────────────────
export interface ColheitaState {
  data: string
  pesoTotal: string
  notas: string
  erro: string
}

export type ColheitaAction =
  | { type: 'SET_DATA';  value: string }
  | { type: 'SET_PESO';  value: string }
  | { type: 'SET_NOTAS'; value: string }
  | { type: 'SET_ERRO';  value: string }
  | { type: 'RESET' }

export function colheitaInicial(): ColheitaState {
  return {
    data: new Date().toISOString().slice(0, 10),
    pesoTotal: '', notas: '', erro: '',
  }
}

export function colheitaReducer(
  state: ColheitaState,
  action: ColheitaAction,
): ColheitaState {
  switch (action.type) {
    case 'SET_DATA':  return { ...state, data: action.value }
    case 'SET_PESO':  return { ...state, pesoTotal: action.value }
    case 'SET_NOTAS': return { ...state, notas: action.value }
    case 'SET_ERRO':  return { ...state, erro: action.value }
    // RESET limpa apenas os campos de input, preservando a data
    case 'RESET':     return { ...state, pesoTotal: '', notas: '', erro: '' }
    default:          return state
  }
}

// ── Custos ────────────────────────────────────────────────────────────────────
export interface CustosState {
  precoVendaKg: string
  custos: Record<string, string>
  salvando: boolean
  erro: string
}

export type CustosAction =
  | { type: 'SET_PRECO';    value: string }
  | { type: 'SET_CUSTO';    insumoId: string; value: string }
  | { type: 'SET_SALVANDO'; value: boolean }
  | { type: 'SET_ERRO';     value: string }

export function custosInicial(
  precoVendaKg: number | null | undefined,
  lista: Array<{ insumoId: string; custoPorKg?: number | null }>,
): CustosState {
  const custos: Record<string, string> = {}
  lista.forEach(c => { custos[c.insumoId] = c.custoPorKg?.toString() ?? '' })
  return { precoVendaKg: precoVendaKg?.toString() ?? '', custos, salvando: false, erro: '' }
}

export function custosReducer(
  state: CustosState,
  action: CustosAction,
): CustosState {
  switch (action.type) {
    case 'SET_PRECO':    return { ...state, precoVendaKg: action.value }
    case 'SET_CUSTO':    return { ...state, custos: { ...state.custos, [action.insumoId]: action.value } }
    case 'SET_SALVANDO': return { ...state, salvando: action.value }
    case 'SET_ERRO':     return { ...state, erro: action.value }
    default:             return state
  }
}
