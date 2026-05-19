// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { api, toErrorMessage } from '@/lib/api'
import type { Insumo } from '@/lib/types'

export interface InsumoForm {
  nome: string; moPct: string; carbonoPct: string
  nitrogenioPct: string; ph: string; categoria: string
}

const FORM_VAZIO: InsumoForm = {
  nome: '', moPct: '', carbonoPct: '', nitrogenioPct: '', ph: '', categoria: '',
}

// ── Reducer do modal ──────────────────────────────────────────────────────────
// Agrupa atomicamente os 6 estados que mudam juntos em abrirNovo/abrirEditar:
// modal, editando, form, novaCategoria, novaCtg, erro.
type ModalState =
  | { aberto: false }
  | { aberto: true; editando: Insumo | null; form: InsumoForm; novaCategoria: boolean; novaCtg: string; erro: string }

type ModalAction =
  | { type: 'ABRIR_NOVO';   form: InsumoForm }
  | { type: 'ABRIR_EDITAR'; insumo: Insumo; form: InsumoForm }
  | { type: 'FECHAR' }
  | { type: 'SET_FORM';           form: InsumoForm }
  | { type: 'SET_NOVA_CATEGORIA'; value: boolean }
  | { type: 'SET_NOVA_CTG';       value: string }
  | { type: 'SET_ERRO';           erro: string }

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'ABRIR_NOVO':
      return { aberto: true, editando: null, form: action.form, novaCategoria: false, novaCtg: '', erro: '' }
    case 'ABRIR_EDITAR':
      return { aberto: true, editando: action.insumo, form: action.form, novaCategoria: false, novaCtg: '', erro: '' }
    case 'FECHAR':
      return { aberto: false }
    case 'SET_FORM':
      return state.aberto ? { ...state, form: action.form } : state
    case 'SET_NOVA_CATEGORIA':
      return state.aberto ? { ...state, novaCategoria: action.value } : state
    case 'SET_NOVA_CTG':
      return state.aberto ? { ...state, novaCtg: action.value } : state
    case 'SET_ERRO':
      return state.aberto ? { ...state, erro: action.erro } : state
    default:
      return state
  }
}

export function useInsumos() {
  const [insumos, setInsumos]       = useState<Insumo[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [filtro, setFiltro]         = useState('Todos')
  const [busca, setBusca]           = useState('')
  const [salvando, setSalvando]     = useState(false)
  const [erroPage, setErroPage]     = useState('')
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null)
  const [erroDeletar, setErroDeletar]             = useState('')

  // Estado do modal: atômico via reducer
  const [modalState, dispatch] = useReducer(modalReducer, { aberto: false })

  // Valores derivados — mesma API pública de antes
  const modal         = modalState.aberto
  const editando      = modalState.aberto ? modalState.editando      : null
  const form          = modalState.aberto ? modalState.form          : FORM_VAZIO
  const novaCategoria = modalState.aberto ? modalState.novaCategoria : false
  const novaCtg       = modalState.aberto ? modalState.novaCtg       : ''
  // Quando modal fechado expõe erros de carregamento; quando aberto expõe erros de salvar
  const erro          = modalState.aberto ? modalState.erro          : erroPage

  // Setters compatíveis com o uso atual da página
  const setModal          = useCallback((open: boolean) => { if (!open) dispatch({ type: 'FECHAR' }) }, [])
  const setNovaCategoria  = useCallback((v: boolean)   => dispatch({ type: 'SET_NOVA_CATEGORIA', value: v }), [])
  const setNovaCtg        = useCallback((s: string)    => dispatch({ type: 'SET_NOVA_CTG', value: s }), [])
  const setErro           = useCallback((s: string)    => dispatch({ type: 'SET_ERRO', erro: s }), [])
  const setForm           = useCallback((updater: React.SetStateAction<InsumoForm>) => {
    if (!modalState.aberto) return
    const newForm = typeof updater === 'function' ? updater(modalState.form) : updater
    dispatch({ type: 'SET_FORM', form: newForm })
  }, [modalState])

  async function carregar() {
    try {
      const [ins, cats] = await Promise.all([api.insumos.listar(), api.insumos.categorias()])
      setInsumos(ins); setCategorias(cats)
    } catch (e: unknown) { setErroPage(toErrorMessage(e, 'Erro ao carregar insumos.')) }
  }

  useEffect(() => { carregar() }, [])

  // abrirNovo/abrirEditar: 6 estados atualizados atomicamente em um único dispatch
  function abrirNovo() {
    dispatch({ type: 'ABRIR_NOVO', form: { ...FORM_VAZIO, categoria: categorias[0] ?? '' } })
  }

  function abrirEditar(i: Insumo) {
    dispatch({
      type: 'ABRIR_EDITAR',
      insumo: i,
      form: {
        nome: i.nome, moPct: String(i.moPct), carbonoPct: String(i.carbonoPct),
        nitrogenioPct: String(i.nitrogenioPct),
        ph: i.ph ? String(i.ph) : '',
        categoria: i.categoria ?? '',
      },
    })
  }

  async function salvar() {
    if (!modalState.aberto) return
    const { editando: ed, form: f, novaCategoria: novaCtgFlag, novaCtg: novaCtgVal } = modalState
    setSalvando(true); dispatch({ type: 'SET_ERRO', erro: '' })
    try {
      const categoriaFinal = novaCtgFlag ? novaCtgVal : f.categoria
      const body = {
        nome: f.nome,
        moPct: parseFloat(f.moPct), carbonoPct: parseFloat(f.carbonoPct),
        nitrogenioPct: parseFloat(f.nitrogenioPct),
        ph: f.ph ? parseFloat(f.ph) : null,
        categoria: categoriaFinal || null,
      }
      if (ed) await api.insumos.atualizar(ed.id, body)
      else    await api.insumos.criar(body)
      await carregar(); dispatch({ type: 'FECHAR' })
    } catch (e: unknown) { dispatch({ type: 'SET_ERRO', erro: toErrorMessage(e) }) }
    finally { setSalvando(false) }
  }

  async function deletar(id: string) {
    setErroDeletar('')
    try {
      await api.insumos.deletar(id)
      setInsumos(ins => ins.filter(i => i.id !== id))
      setConfirmandoDelete(null)
    } catch (e: unknown) {
      setErroDeletar(toErrorMessage(e, 'Erro ao remover.'))
      setConfirmandoDelete(null)
    }
  }

  const todasCats = ['Todos', ...categorias]
  const filtrados = insumos
    .filter(i => filtro === 'Todos' || i.categoria === filtro)
    .filter(i => !busca || i.nome.toLowerCase().includes(busca.toLowerCase()))

  return {
    insumos, categorias, todasCats, filtrados,
    filtro, setFiltro, busca, setBusca,
    modal, setModal, editando,
    novaCategoria, setNovaCategoria, form, setForm, novaCtg, setNovaCtg,
    salvando, erro, setErro,
    confirmandoDelete, setConfirmandoDelete, erroDeletar, setErroDeletar,
    abrirNovo, abrirEditar, salvar, deletar,
  }
}
