// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, toErrorMessage } from '@/lib/api'
import type { Experimento, Formulacao, Monitoramento, Colheita, MonitoramentoCreate, ColheitaCreate, CustosUpdate } from '@/lib/types'

// ── Tipo exportado para uso em NovoExpForm ───────────────────────────────────
export interface NovoExpData {
  formulacaoId: string
  codigo: string
  dataPreparo: string
  totalBlocos: number
  pesoBlocoKg: number
}

// ── Reducer do detalhe ───────────────────────────────────────────────────────
// Agrupa atomicamente: experimento selecionado, monitoramentos, colheitas,
// aba ativa e paginação — elimina os 6 useState fragmentados anteriores e
// garante que nunca existe estado "fantasma" de um experimento já fechado.
type AbaDetalhe = 'monitor' | 'colheitas' | 'custos'

type DetalheState =
  | { aberto: false }
  | {
      aberto: true
      exp: Experimento
      monitoramentos: Monitoramento[]
      colheitas: Colheita[]
      aba: AbaDetalhe
      verTodos: boolean
    }

type DetalheAction =
  | { type: 'ABRIR'; exp: Experimento; monitoramentos: Monitoramento[]; colheitas: Colheita[] }
  | { type: 'FECHAR' }
  | { type: 'SET_ABA'; aba: AbaDetalhe }
  | { type: 'SET_VER_TODOS'; value: boolean }
  | { type: 'SET_EXP'; exp: Experimento }
  | { type: 'SET_MONITORAMENTOS'; monitoramentos: Monitoramento[] }
  | { type: 'SET_COLHEITAS'; colheitas: Colheita[] }

function detalheReducer(state: DetalheState, action: DetalheAction): DetalheState {
  switch (action.type) {
    case 'ABRIR':
      return { aberto: true, exp: action.exp, monitoramentos: action.monitoramentos, colheitas: action.colheitas, aba: 'monitor', verTodos: false }
    case 'FECHAR':
      return { aberto: false }
    case 'SET_ABA':
      return state.aberto ? { ...state, aba: action.aba } : state
    case 'SET_VER_TODOS':
      return state.aberto ? { ...state, verTodos: action.value } : state
    case 'SET_EXP':
      return state.aberto ? { ...state, exp: action.exp } : state
    case 'SET_MONITORAMENTOS':
      return state.aberto ? { ...state, monitoramentos: action.monitoramentos } : state
    case 'SET_COLHEITAS':
      return state.aberto ? { ...state, colheitas: action.colheitas } : state
    default:
      return state
  }
}

export function useExperimentos() {
  const searchParams = useSearchParams()

  const [experimentos, setExperimentos]     = useState<Experimento[]>([])
  const [formulacoes, setFormulacoes]       = useState<Formulacao[]>([])
  const [showNovoExp, setShowNovoExp] = useState(false)
  const [erroPage, setErroPage]             = useState('')

  // Estado do detalhe: atômico via reducer
  const [detalhe, dispatchDetalhe] = useReducer(detalheReducer, { aberto: false })

  // Valores derivados — mantém a mesma API pública do hook
  const selected        = detalhe.aberto ? detalhe.exp            : null
  const monitoramentos  = detalhe.aberto ? detalhe.monitoramentos : []
  const colheitas       = detalhe.aberto ? detalhe.colheitas      : []
  const modalAberto     = detalhe.aberto
  const abaDetalhe      = detalhe.aberto ? detalhe.aba            : ('monitor' as AbaDetalhe)
  const verTodosMonitor = detalhe.aberto ? detalhe.verTodos       : false

  const setModalAberto     = useCallback((open: boolean) => { if (!open) dispatchDetalhe({ type: 'FECHAR' }) }, [])
  const setAbaDetalhe      = useCallback((aba: AbaDetalhe) => dispatchDetalhe({ type: 'SET_ABA', aba }), [])
  const setVerTodosMonitor = useCallback((v: boolean) => dispatchDetalhe({ type: 'SET_VER_TODOS', value: v }), [])

  const carregarBase = useCallback(async () => {
    try {
      const [expsRes, formsRes] = await Promise.allSettled([
        api.experimentos.listar(),
        api.formulacoes.listar(),
      ])
      if (expsRes.status  === 'fulfilled') setExperimentos(expsRes.value)
      else setErroPage('Não foi possível carregar os experimentos. Verifique sua conexão.')
      if (formsRes.status === 'fulfilled') setFormulacoes(formsRes.value)
    } catch (e: unknown) { setErroPage(toErrorMessage(e, 'Erro ao carregar dados.')) }
  }, [])

  const abrirDetalhe = useCallback(async (e: Experimento) => {
    setErroPage('')
    try {
      const [m, c] = await Promise.all([
        api.experimentos.monitoramentos.listar(e.id),
        api.experimentos.colheitas.listar(e.id),
      ])
      dispatchDetalhe({ type: 'ABRIR', exp: e, monitoramentos: m, colheitas: c })
    } catch (err: unknown) {
      setErroPage(toErrorMessage(err, 'Não foi possível abrir o experimento.'))
    }
  }, [])

  useEffect(() => { carregarBase() }, [carregarBase])

  useEffect(() => {
    const expCodigo = searchParams.get('exp')
    if (!expCodigo || experimentos.length === 0) return
    const found = experimentos.find(e => e.codigo === expCodigo)
    if (found) abrirDetalhe(found)
  }, [experimentos, searchParams, abrirDetalhe])

  const fecharModal = useCallback(() => { dispatchDetalhe({ type: 'FECHAR' }) }, [])

  // criar recebe os dados como parâmetro — validação e loading ficam em
  // NovoExpForm, único consumidor do formulário de criação.
  const criar = useCallback(async (data: NovoExpData) => {
    await api.experimentos.criar(data)
    const exps = await api.experimentos.listar()
    setExperimentos(exps)
  }, [])

  const avancar = useCallback(async (proximoStatus?: string) => {
    if (!detalhe.aberto) return
    const expId = detalhe.exp.id
    try {
      await api.experimentos.avancar(expId, proximoStatus ? { proximoStatus } : undefined)
      const exps = await api.experimentos.listar()
      setExperimentos(exps)
      const upd = exps.find(e => e.id === expId)
      if (upd) await abrirDetalhe(upd)
    } catch (err: unknown) {
      setErroPage(toErrorMessage(err, 'Não foi possível avançar a fase.'))
    }
  }, [detalhe, abrirDetalhe])

  const salvarMon = useCallback(async (data: MonitoramentoCreate) => {
    if (!detalhe.aberto) return
    const expId = detalhe.exp.id
    await api.experimentos.monitoramentos.criar(expId, data)
    const [m, exps] = await Promise.all([
      api.experimentos.monitoramentos.listar(expId),
      api.experimentos.listar(),
    ])
    dispatchDetalhe({ type: 'SET_MONITORAMENTOS', monitoramentos: m })
    setExperimentos(exps)
    const upd = exps.find(e => e.id === expId)
    if (upd) dispatchDetalhe({ type: 'SET_EXP', exp: upd })
  }, [detalhe])

  const salvarColheita = useCallback(async (data: ColheitaCreate) => {
    if (!detalhe.aberto) return
    const expId = detalhe.exp.id
    await api.experimentos.colheitas.criar(expId, data)
    const c = await api.experimentos.colheitas.listar(expId)
    dispatchDetalhe({ type: 'SET_COLHEITAS', colheitas: c })
  }, [detalhe])

  const salvarCustos = useCallback(async (data: CustosUpdate) => {
    if (!detalhe.aberto) return
    const expId = detalhe.exp.id
    await api.experimentos.salvarCustos(expId, data)
    await carregarBase()
    const exps = await api.experimentos.listar()
    const upd = exps.find(e => e.id === expId)
    if (upd) await abrirDetalhe(upd)
  }, [detalhe, carregarBase, abrirDetalhe])

  const deletar = useCallback(async () => {
    if (!detalhe.aberto) return
    const expId = detalhe.exp.id
    try {
      await api.experimentos.deletar(expId)
      const exps = await api.experimentos.listar()
      setExperimentos(exps)
      dispatchDetalhe({ type: 'FECHAR' })
    } catch (err: unknown) {
      setErroPage(toErrorMessage(err, 'Não foi possível deletar o experimento.'))
    }
  }, [detalhe])

  const { ativos, totalColhido, receitaTotal, margemMedia } = useMemo(() => {
    const ativos       = experimentos.filter(e => e.status !== 'CONCLUIDO').length
    const totalColhido = experimentos.reduce((s, e) => s + (e.financeiro?.totalColhidoKg ?? 0), 0)
    const receitaTotal = experimentos.reduce((s, e) => s + (e.financeiro?.receitaTotal ?? 0), 0)
    const margens      = experimentos.filter(e => e.financeiro?.margemPct != null)
    const margemMedia  = margens.length ? margens.reduce((s, e) => s + (e.financeiro!.margemPct!), 0) / margens.length : null
    return { ativos, totalColhido, receitaTotal, margemMedia }
  }, [experimentos])

  return {
    experimentos, formulacoes, selected,
    monitoramentos, colheitas,
    modalAberto, setModalAberto,
    abaDetalhe, setAbaDetalhe,
    showNovoExp, setShowNovoExp,
    verTodosMonitor, setVerTodosMonitor,
    erroPage, setErroPage,
    ativos, totalColhido, receitaTotal, margemMedia,
    carregarBase, abrirDetalhe, fecharModal,
    criar, avancar, salvarMon, salvarColheita, salvarCustos, deletar,
  }
}
