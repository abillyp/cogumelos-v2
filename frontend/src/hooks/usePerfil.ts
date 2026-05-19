// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useCallback, useReducer, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { api, toErrorMessage } from '@/lib/api'

// ── Reducer do sub-fluxo "editar nome" ───────────────────────────────────────
// Agrupa atomicamente os 5 estados que mudam juntos em salvarNome:
// nomeEditando, novoNome, nomeErro, nomeSucesso, nomeLoading.
type NomeState =
  | { editando: false }
  | { editando: true; nome: string; erro: string; loading: boolean; sucesso: boolean }

type NomeAction =
  | { type: 'ABRIR';       nome: string }
  | { type: 'FECHAR' }
  | { type: 'SET_NOME';    nome: string }
  | { type: 'SET_ERRO';    erro: string }
  | { type: 'SALVAR_START' }
  | { type: 'SALVAR_OK' }
  | { type: 'SALVAR_ERRO'; erro: string }
  | { type: 'LIMPAR_SUCESSO' }

function nomeReducer(state: NomeState, action: NomeAction): NomeState {
  switch (action.type) {
    case 'ABRIR':        return { editando: true, nome: action.nome, erro: '', loading: false, sucesso: false }
    case 'FECHAR':       return { editando: false }
    case 'SET_NOME':     return state.editando ? { ...state, nome: action.nome }    : state
    case 'SET_ERRO':     return state.editando ? { ...state, erro: action.erro }    : state
    case 'SALVAR_START': return state.editando ? { ...state, loading: true, erro: '' } : state
    case 'SALVAR_OK':    return state.editando ? { ...state, loading: false, sucesso: true } : state
    case 'SALVAR_ERRO':  return state.editando ? { ...state, loading: false, erro: action.erro } : state
    case 'LIMPAR_SUCESSO': return state.editando ? { ...state, sucesso: false, editando: false } as NomeState : state
    default:             return state
  }
}

// ── usePerfil (Perfil principal) ──────────────────────────────────────────────
export function usePerfil() {
  const { user, logout, isAdmin, login } = useAuth()

  const [nomeState, dispatchNome] = useReducer(nomeReducer, { editando: false })
  const [exportando, setExportando]               = useState(false)
  const [confirmandoEncerrar, setConfirmandoEncerrar] = useState(false)
  const [encerrando, setEncerrando]               = useState(false)
  const [encerrarErro, setEncerrarErro]           = useState('')

  // Valores derivados — mesma API pública de antes
  const nomeEditando = nomeState.editando
  const novoNome     = nomeState.editando ? nomeState.nome    : ''
  const nomeErro     = nomeState.editando ? nomeState.erro    : ''
  const nomeSucesso  = nomeState.editando ? nomeState.sucesso : false
  const nomeLoading  = nomeState.editando ? nomeState.loading : false

  // Setters compatíveis com uso atual da página
  const setNomeEditando = useCallback((v: boolean) => dispatchNome(v ? { type: 'ABRIR', nome: '' } : { type: 'FECHAR' }), [])
  const setNovoNome     = useCallback((s: string)  => dispatchNome({ type: 'SET_NOME', nome: s }), [])
  const setNomeErro     = useCallback((s: string)  => dispatchNome({ type: 'SET_ERRO', erro: s }), [])

  // Abre edição de nome atomicamente (substitui setNovoNome + setNomeEditando no botão da página)
  const abrirNomeEdit = useCallback((nome: string) => dispatchNome({ type: 'ABRIR', nome }), [])

  async function salvarNome() {
    if (!nomeState.editando) return
    const nome = nomeState.nome
    if (!nome.trim()) { dispatchNome({ type: 'SET_ERRO', erro: 'Nome não pode ser vazio.' }); return }
    dispatchNome({ type: 'SALVAR_START' })
    try {
      const data = await api.auth.atualizarPerfil(nome.trim())
      login('', { ...user!, nome: data.nome })
      dispatchNome({ type: 'SALVAR_OK' })
      setTimeout(() => dispatchNome({ type: 'LIMPAR_SUCESSO' }), 1500)
    } catch (e: unknown) {
      dispatchNome({ type: 'SALVAR_ERRO', erro: toErrorMessage(e, 'Erro ao salvar.') })
    }
  }

  async function exportarDados() {
    setExportando(true)
    try {
      const data = await api.auth.meusDados()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `meus-dados-cogumelos-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      alert(toErrorMessage(e, 'Erro ao exportar dados.'))
    } finally {
      setExportando(false)
    }
  }

  async function encerrarConta() {
    setEncerrarErro('')
    setEncerrando(true)
    try {
      await api.auth.encerrarConta()
      logout()
    } catch (e: unknown) {
      setEncerrarErro(toErrorMessage(e, 'Erro ao encerrar conta.'))
      setEncerrando(false)
    }
  }

  return {
    user, logout, isAdmin,
    nomeEditando, setNomeEditando, abrirNomeEdit,
    novoNome, setNovoNome,
    nomeErro, setNomeErro,
    nomeSucesso,
    nomeLoading,
    exportando,
    confirmandoEncerrar, setConfirmandoEncerrar,
    encerrando,
    encerrarErro, setEncerrarErro,
    salvarNome, exportarDados, encerrarConta,
  }
}

// ── useAlterarSenha ───────────────────────────────────────────────────────────
export function useAlterarSenha() {
  const [aberto, setAberto]         = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha]   = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [erro, setErro]             = useState('')
  const [sucesso, setSucesso]       = useState(false)
  const [loading, setLoading]       = useState(false)

  async function handleSubmit() {
    setErro('')
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (novaSenha.length < 8) { setErro('Mínimo 8 caracteres.'); return }
    setLoading(true)
    try {
      await api.auth.alterarSenha(senhaAtual, novaSenha)
      setSucesso(true)
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
      setTimeout(() => { setSucesso(false); setAberto(false) }, 2000)
    } catch (e: unknown) {
      setErro(toErrorMessage(e, 'Erro ao alterar senha.'))
    } finally {
      setLoading(false)
    }
  }

  return {
    aberto, setAberto,
    senhaAtual, setSenhaAtual,
    novaSenha, setNovaSenha,
    confirmar, setConfirmar,
    erro, sucesso, loading,
    handleSubmit,
  }
}
