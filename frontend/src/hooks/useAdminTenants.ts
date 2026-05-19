// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api, toErrorMessage } from '@/lib/api'

export interface TenantAdmin {
  id: number; nome: string; email: string
  plano: string; status: string
  trialExpira: string | null; assinaturaExpira: string | null
  criadoEm: string
  usuarioAdminNome: string; usuarioAdminEmail: string
  adminRole: string | null
  totalExperimentos: number; totalUsuarios: number
}

export interface Resumo {
  total: number; emTrial: number; ativos: number
  expirados: number; expira3dias: number
}

export interface UsuarioTenant {
  id: string; nome: string; email: string; role: string
}

const FORM_EDICAO_VAZIO = { nome: '', plano: 'BASICO', status: 'TRIAL', trialExpira: '', assinaturaExpira: '' }
const FORM_NOVO_VAZIO   = { nome: '', email: '', adminNome: '', adminEmail: '', adminSenha: '', plano: 'BASICO' }

type FormEdicao = typeof FORM_EDICAO_VAZIO

// ── Reducer do modal de edição ───────────────────────────────────────────────
// Agrupa atomicamente os 6 estados que mudam juntos em abrirEditar:
// editando, form, erro, confirmDelete, confirmNome, abertura do modal.
type ModalEdicaoState =
  | { aberto: false }
  | { aberto: true; tenant: TenantAdmin; form: FormEdicao; erro: string; confirmando: boolean; confirmNome: string }

type ModalEdicaoAction =
  | { type: 'ABRIR'; tenant: TenantAdmin; form: FormEdicao }
  | { type: 'FECHAR' }
  | { type: 'SET_FORM'; form: FormEdicao }
  | { type: 'SET_ERRO'; erro: string }
  | { type: 'ABRIR_CONFIRM' }
  | { type: 'FECHAR_CONFIRM' }
  | { type: 'SET_CONFIRM_NOME'; nome: string }

function modalEdicaoReducer(state: ModalEdicaoState, action: ModalEdicaoAction): ModalEdicaoState {
  switch (action.type) {
    case 'ABRIR':
      return { aberto: true, tenant: action.tenant, form: action.form, erro: '', confirmando: false, confirmNome: '' }
    case 'FECHAR':
      return { aberto: false }
    case 'SET_FORM':
      return state.aberto ? { ...state, form: action.form } : state
    case 'SET_ERRO':
      return state.aberto ? { ...state, erro: action.erro } : state
    case 'ABRIR_CONFIRM':
      return state.aberto ? { ...state, confirmando: true, confirmNome: '' } : state
    case 'FECHAR_CONFIRM':
      return state.aberto ? { ...state, confirmando: false, confirmNome: '' } : state
    case 'SET_CONFIRM_NOME':
      return state.aberto ? { ...state, confirmNome: action.nome } : state
    default:
      return state
  }
}

export function useAdminTenants() {
  const { isAdmin } = useAuth()
  const router = useRouter()

  const [tenants, setTenants]               = useState<TenantAdmin[]>([])
  const [resumo, setResumo]                 = useState<Resumo>({ total: 0, emTrial: 0, ativos: 0, expirados: 0, expira3dias: 0 })
  const [loading, setLoading]               = useState(true)
  const [busca, setBusca]                   = useState('')
  const [filtroStatus, setFiltroStatus]     = useState('TODOS')
  const [showNovo, setShowNovo]             = useState(false)
  const [salvando, setSalvando]             = useState(false)
  const [excluindo, setExcluindo]           = useState(false)
  const [erroPage, setErroPage]             = useState('')
  const [erroNovo, setErroNovo]             = useState('')
  const [showUsuarios, setShowUsuarios]     = useState(false)
  const [tenantUsuarios, setTenantUsuarios] = useState<TenantAdmin | null>(null)
  const [usuarios, setUsuarios]             = useState<UsuarioTenant[]>([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [removendo, setRemovendo]           = useState<string | null>(null)
  const [erroUsuarios, setErroUsuarios]     = useState('')
  const [formNovo, setFormNovo]             = useState(FORM_NOVO_VAZIO)

  // Estado do modal de edição: atômico via reducer
  const [modalEdicao, dispatchModal] = useReducer(modalEdicaoReducer, { aberto: false })

  // Valores derivados — mesma API pública de antes
  const editando          = modalEdicao.aberto ? modalEdicao.tenant      : null
  const showModal         = modalEdicao.aberto
  const formEdicao        = modalEdicao.aberto ? modalEdicao.form        : FORM_EDICAO_VAZIO
  const erro              = modalEdicao.aberto ? modalEdicao.erro        : ''
  const showConfirmDelete = modalEdicao.aberto ? modalEdicao.confirmando : false
  const confirmNome       = modalEdicao.aberto ? modalEdicao.confirmNome : ''

  // Setters compatíveis com o uso atual da página
  const setShowModal         = useCallback((open: boolean) => { if (!open) dispatchModal({ type: 'FECHAR' }) }, [])
  const setErro              = useCallback((e: string) => dispatchModal({ type: 'SET_ERRO', erro: e }), [])
  const setShowConfirmDelete = useCallback((v: boolean) => dispatchModal(v ? { type: 'ABRIR_CONFIRM' } : { type: 'FECHAR_CONFIRM' }), [])
  const setConfirmNome       = useCallback((s: string) => dispatchModal({ type: 'SET_CONFIRM_NOME', nome: s }), [])
  const setFormEdicao        = useCallback((updater: React.SetStateAction<FormEdicao>) => {
    if (!modalEdicao.aberto) return
    const newForm = typeof updater === 'function' ? updater(modalEdicao.form) : updater
    dispatchModal({ type: 'SET_FORM', form: newForm })
  }, [modalEdicao])

  const carregar = useCallback(async () => {
    try {
      const [ts, rs] = await Promise.all([
        api.admin.tenants.listar(),
        api.admin.tenants.resumo(),
      ])
      setTenants(ts as TenantAdmin[])
      setResumo(rs as Resumo)
    } catch (e: unknown) {
      setErroPage(toErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) { router.push('/'); return }
    carregar()
  }, [isAdmin, carregar, router])

  // abrirEditar: 6 estados atualizados atomicamente em um único dispatch
  function abrirEditar(t: TenantAdmin) {
    dispatchModal({
      type: 'ABRIR',
      tenant: t,
      form: {
        nome: t.nome, plano: t.plano, status: t.status,
        trialExpira: t.trialExpira?.slice(0, 10) ?? '',
        assinaturaExpira: t.assinaturaExpira?.slice(0, 10) ?? '',
      },
    })
  }

  async function abrirUsuarios(t: TenantAdmin) {
    setTenantUsuarios(t)
    setUsuarios([])
    setErroUsuarios('')
    setShowUsuarios(true)
    setLoadingUsuarios(true)
    try {
      const data = await api.admin.tenants.listarUsuarios(t.id) as UsuarioTenant[]
      setUsuarios(data)
    } catch (e: unknown) {
      setErroUsuarios(toErrorMessage(e, 'Erro ao carregar usuários.'))
    } finally {
      setLoadingUsuarios(false)
    }
  }

  async function removerUsuario(usuarioId: string) {
    if (!tenantUsuarios) return
    setRemovendo(usuarioId)
    try {
      await api.admin.tenants.removerUsuario(tenantUsuarios.id, usuarioId)
      setUsuarios(prev => prev.filter(u => u.id !== usuarioId))
      setTenants(prev => prev.map(t =>
        t.id === tenantUsuarios.id ? { ...t, totalUsuarios: t.totalUsuarios - 1 } : t
      ))
    } catch (e: unknown) {
      setErroUsuarios(toErrorMessage(e, 'Erro ao remover usuário.'))
    } finally {
      setRemovendo(null)
    }
  }

  async function excluirTenant() {
    if (!modalEdicao.aberto) return
    setExcluindo(true)
    try {
      await api.admin.tenants.deletar(modalEdicao.tenant.id)
      dispatchModal({ type: 'FECHAR' })
      await carregar()
    } catch (e: unknown) {
      dispatchModal({ type: 'SET_ERRO', erro: toErrorMessage(e) })
    } finally {
      setExcluindo(false)
    }
  }

  async function salvar() {
    if (!modalEdicao.aberto) return
    const { tenant, form } = modalEdicao
    setSalvando(true)
    dispatchModal({ type: 'SET_ERRO', erro: '' })
    try {
      await api.admin.tenants.atualizar(tenant.id, {
        nome: form.nome, plano: form.plano, status: form.status,
        trialExpira: form.trialExpira || null,
        assinaturaExpira: form.assinaturaExpira || null,
      })
      await carregar()
      dispatchModal({ type: 'FECHAR' })
    } catch (e: unknown) {
      dispatchModal({ type: 'SET_ERRO', erro: toErrorMessage(e) })
    } finally {
      setSalvando(false)
    }
  }

  async function estenderTrial(id: number) {
    try {
      await api.admin.tenants.estenderTrial(id, 14)
      await carregar()
    } catch (e: unknown) {
      setErroPage(toErrorMessage(e, 'Erro ao estender trial.'))
    }
  }

  async function criarTenant() {
    setSalvando(true); setErroNovo('')
    try {
      await api.admin.tenants.criar({
        nome: formNovo.nome, email: formNovo.email,
        nomeAdmin: formNovo.adminNome, emailAdmin: formNovo.adminEmail,
        senhaAdmin: formNovo.adminSenha, plano: formNovo.plano,
      })
      await carregar()
      setShowNovo(false)
      setFormNovo(FORM_NOVO_VAZIO)
    } catch (e: unknown) {
      setErroNovo(toErrorMessage(e))
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = useMemo(() => tenants.filter(t => {
    const termo = busca.toLowerCase()
    const matchBusca = !busca
      || t.nome.toLowerCase().includes(termo)
      || t.email.toLowerCase().includes(termo)
      || t.usuarioAdminEmail.toLowerCase().includes(termo)
    const matchStatus = filtroStatus === 'TODOS' || t.status === filtroStatus
    return matchBusca && matchStatus
  }), [tenants, busca, filtroStatus])

  return {
    isAdmin,
    tenants, resumo, loading,
    busca, setBusca,
    filtroStatus, setFiltroStatus,
    editando,
    showModal, setShowModal,
    showNovo, setShowNovo,
    salvando,
    erro, setErro,
    erroNovo, setErroNovo,
    showConfirmDelete, setShowConfirmDelete,
    confirmNome, setConfirmNome,
    excluindo,
    erroPage, setErroPage,
    showUsuarios, setShowUsuarios,
    tenantUsuarios,
    usuarios,
    loadingUsuarios,
    removendo,
    erroUsuarios,
    formEdicao, setFormEdicao,
    formNovo, setFormNovo,
    filtrados,
    abrirEditar, abrirUsuarios, removerUsuario,
    excluirTenant, salvar, estenderTrial, criarTenant,
  }
}
