// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import type {
  Insumo, Especie, Formulacao, Experimento, Monitoramento, Colheita,
  UsuarioAdmin, AuthResponse, CodigoSugestaoResponse,
  MonitoramentoCreate, ColheitaCreate, CustosUpdate,
} from './types'

const BASE = '/api'

export function toErrorMessage(e: unknown, fallback = 'Erro desconhecido'): string {
  return e instanceof Error ? e.message : fallback
}

function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1] ?? ''
}

export function saveTokens(_token?: string) {}

export function clearTokens() {
  localStorage.removeItem('user')
}

function dispararSessaoExpirada() {
  clearTokens()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('session-expired'))
  }
}

let refreshando = false
let filaRefresh: Array<() => void> = []

async function renovarToken(): Promise<void> {
  if (refreshando) {
    return new Promise<void>(resolve => filaRefresh.push(resolve))
  }
  refreshando = true
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Refresh falhou')
    filaRefresh.forEach(cb => cb())
    filaRefresh = []
  } catch {
    dispararSessaoExpirada()
    throw new Error('Sessão expirada')
  } finally {
    refreshando = false
  }
}

async function req<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const csrfToken = isMutation ? getCsrfToken() : ''

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
    },
    credentials: 'include',
    ...options,
  })

  if (res.status === 402) {
    dispararSessaoExpirada()
    if (typeof window !== 'undefined') window.location.href = '/plano-expirado?tipo=trial_expirado'
    throw new Error('Período de trial encerrado')
  }

  if (res.status === 403) {
    const err403 = await res.json().catch(() => ({ erro: '' })) as { erro: string }
    if (err403.erro?.toLowerCase().includes('cancelada')) {
      dispararSessaoExpirada()
      if (typeof window !== 'undefined') window.location.href = '/plano-expirado?tipo=cancelado'
      throw new Error('Assinatura cancelada')
    }
  }

  if (res.status === 401 && retry) {
    try {
      await renovarToken()
      return req<T>(path, options, false)
    } catch { throw new Error('Sessão expirada') }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ erro: 'Erro desconhecido' }))
    throw new Error(err.erro || 'Erro na requisição')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  auth: {
    login:           (body: unknown)                        => req<AuthResponse>('/auth/login',       { method: 'POST', body: JSON.stringify(body) }),
    registro:        (body: unknown)                        => req<AuthResponse>('/auth/registro',    { method: 'POST', body: JSON.stringify(body) }),
    logout: () => fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).then(() => clearTokens()),
    me:              ()                                     => req<AuthResponse>('/auth/me'),
    esqueciSenha:    (email: string)                        => req<void>('/auth/esqueci-senha',       { method: 'POST', body: JSON.stringify({ email }) }),
    redefinirSenha:  (token: string, novaSenha: string)     => req<void>('/auth/redefinir-senha',     { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),
    alterarSenha:    (senhaAtual: string, novaSenha: string) => req<void>('/auth/alterar-senha',       { method: 'PATCH', body: JSON.stringify({ senhaAtual, novaSenha }) }),
    atualizarPerfil: (nome: string)                         => req<AuthResponse>('/auth/me',          { method: 'PATCH', body: JSON.stringify({ nome }) }),
    meusDados:       ()                                     => req<AuthResponse>('/auth/meus-dados'),
    encerrarConta:   ()                                     => req<void>('/admin/minha-conta',        { method: 'DELETE' }),
  },

  admin: {
    usuarios: {
      listar:    ()                           => req<UsuarioAdmin[]>('/admin/usuarios'),
      criar:     (body: unknown)              => req<UsuarioAdmin>('/admin/usuarios',         { method: 'POST',  body: JSON.stringify(body) }),
      atualizar: (id: string, body: unknown)  => req<UsuarioAdmin>(`/admin/usuarios/${id}`,   { method: 'PATCH', body: JSON.stringify(body) }),
      deletar:   (id: string)                 => req<void>(`/admin/usuarios/${id}`,           { method: 'DELETE' }),
    },
    tenants: {
      listar:         ()                                    => req<unknown[]>('/admin/tenants'),
      resumo:         ()                                    => req<unknown>('/admin/tenants/resumo'),
      buscar:         (id: number)                          => req<unknown>(`/admin/tenants/${id}`),
      atualizar:      (id: number, body: unknown)           => req<unknown>(`/admin/tenants/${id}`,                    { method: 'PATCH', body: JSON.stringify(body) }),
      criar:          (body: unknown)                       => req<unknown>('/admin/tenants',                           { method: 'POST',  body: JSON.stringify(body) }),
      estenderTrial:  (id: number, dias: number)            => req<void>(`/admin/tenants/${id}/estender-trial`,         { method: 'POST',  body: JSON.stringify({ dias }) }),
      deletar:        (id: number)                          => req<void>(`/admin/tenants/${id}`,                        { method: 'DELETE' }),
      listarUsuarios: (id: number)                          => req<UsuarioAdmin[]>(`/admin/tenants/${id}/usuarios`),
      removerUsuario: (tenantId: number, usuarioId: string) => req<void>(`/admin/tenants/${tenantId}/usuarios/${usuarioId}`, { method: 'DELETE' }),
    },
  },

  insumos: {
    listar:     ()                           => req<Insumo[]>('/insumos'),
    categorias: ()                           => req<string[]>('/insumos/categorias'),
    criar:      (body: unknown)              => req<Insumo>('/insumos',       { method: 'POST', body: JSON.stringify(body) }),
    atualizar:  (id: string, body: unknown)  => req<Insumo>(`/insumos/${id}`, { method: 'PUT',  body: JSON.stringify(body) }),
    deletar:    (id: string)                 => req<void>(`/insumos/${id}`,   { method: 'DELETE' }),
  },
  especies: {
    listar: () => req<Especie[]>('/especies'),
  },
  formulacoes: {
    listar:          ()                                    => req<Formulacao[]>('/formulacoes'),
    buscar:          (id: string)                          => req<Formulacao>(`/formulacoes/${id}`),
    criar:           (body: unknown)                       => req<Formulacao>('/formulacoes',                  { method: 'POST',  body: JSON.stringify(body) }),
    atualizarStatus: (id: string, status: Formulacao['status']) => req<Formulacao>(`/formulacoes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deletar:         (id: string)                          => req<void>(`/formulacoes/${id}`,                  { method: 'DELETE' }),
    emUso:           (id: string)                          => req<boolean>(`/formulacoes/${id}/em-uso`),
    atualizar:       (id: string, body: unknown)           => req<Formulacao>(`/formulacoes/${id}`,            { method: 'PUT',   body: JSON.stringify(body) }),
  },
  experimentos: {
    listar:         ()               => req<Experimento[]>('/experimentos'),
    buscar:         (id: string)     => req<Experimento>(`/experimentos/${id}`),
    codigoSugestao: ()               => req<CodigoSugestaoResponse>('/experimentos/codigo-sugestao'),
    criar:          (body: unknown)  => req<Experimento>('/experimentos',                { method: 'POST',  body: JSON.stringify(body) }),
    avancar: (id: string, body?: { proximoStatus: string }) =>
      req<Experimento>(`/experimentos/${id}/avancar`,                                   { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    deletar:      (id: string) => req<void>(`/experimentos/${id}`,                      { method: 'DELETE' }),
    resumoDelete: (id: string) => req<unknown>(`/experimentos/${id}/resumo-delete`),
    monitoramentos: {
      listar: (id: string)                            => req<Monitoramento[]>(`/experimentos/${id}/monitoramentos`),
      criar:  (id: string, body: MonitoramentoCreate) => req<Monitoramento>(`/experimentos/${id}/monitoramentos`, { method: 'POST', body: JSON.stringify(body) }),
      deletar: (experimentoId: string, monitoramentoId: string) => req<void>(`/experimentos/${experimentoId}/monitoramentos/${monitoramentoId}`, { method: 'DELETE' }),
    },
    salvarCustos: (id: string, body: CustosUpdate) =>
      req<Experimento>(`/experimentos/${id}/custos`,                                    { method: 'PUT', body: JSON.stringify(body) }),
    colheitas: {
      listar: (id: string)                        => req<Colheita[]>(`/experimentos/${id}/colheitas`),
      criar:  (id: string, body: ColheitaCreate)  => req<Colheita>(`/experimentos/${id}/colheitas`, { method: 'POST', body: JSON.stringify(body) }),
    },
  },
  relatorio: {
    gerar: () => req<unknown>('/relatorio'),
  },
}
