// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

const BASE = '/api'

// access token e refresh token estão em HttpOnly cookies — não há nada sensível no localStorage
export function saveTokens(_token?: string) {
  // no-op: tokens gerenciados por HttpOnly cookies pelo backend
}

export function clearTokens() {
  localStorage.removeItem('user')
  // accessToken e refreshToken são limpos pelo backend via Set-Cookie maxAge=0 no /logout
}

let refreshando = false
let filaRefresh: Array<(token: string) => void> = []

async function renovarToken(): Promise<void> {
  if (refreshando) {
    return new Promise(resolve => filaRefresh.push(resolve as any))
  }
  refreshando = true
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // envia refreshToken cookie e recebe novo accessToken cookie
    })
    if (!res.ok) throw new Error('Refresh falhou')
    filaRefresh.forEach(cb => cb(''))
    filaRefresh = []
  } catch {
    clearTokens()
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  } finally {
    refreshando = false
  }
}

async function req<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // envia accessToken cookie automaticamente
    ...options,
  })

  if (res.status === 402) {
    clearTokens()
    if (typeof window !== 'undefined') window.location.href = '/plano-expirado?tipo=trial_expirado'
    throw new Error('Período de trial encerrado')
  }

  if (res.status === 403) {
    const err403 = await res.json().catch(() => ({ erro: '' })) as { erro: string }
    if (err403.erro?.toLowerCase().includes('cancelada')) {
      clearTokens()
      if (typeof window !== 'undefined') window.location.href = '/plano-expirado?tipo=cancelado'
      throw new Error('Assinatura cancelada')
    }
  }

  if (res.status === 401 && retry) {
    try {
      await renovarToken()
      return req<T>(path, options, false) // repete com o novo accessToken cookie
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
    login:   (body: unknown) => req<any>('/auth/login',   { method: 'POST', body: JSON.stringify(body) }),
    registro: (body: unknown) => req<any>('/auth/registro', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    }).then(() => clearTokens()),
    me: () => req('/auth/me'),
    esqueciSenha:   (email: string) => req('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
    redefinirSenha: (token: string, novaSenha: string) => req('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),
    alterarSenha:   (senhaAtual: string, novaSenha: string) => req('/auth/alterar-senha', { method: 'PATCH', body: JSON.stringify({ senhaAtual, novaSenha }) }),
    atualizarPerfil: (nome: string) => req('/auth/me', { method: 'PATCH', body: JSON.stringify({ nome }) }),
    meusDados:      () => req('/auth/meus-dados'),
    encerrarConta:  () => req('/admin/minha-conta', { method: 'DELETE' }),
  },

  admin: {
    usuarios: {
      listar:    ()                           => req('/admin/usuarios'),
      criar:     (body: unknown)              => req('/admin/usuarios', { method: 'POST', body: JSON.stringify(body) }),
      atualizar: (id: string, body: unknown)  => req(`/admin/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      deletar:   (id: string)                 => req(`/admin/usuarios/${id}`, { method: 'DELETE' }),
    },
    tenants: {
      listar:         ()                                    => req('/admin/tenants'),
      resumo:         ()                                    => req('/admin/tenants/resumo'),
      buscar:         (id: number)                          => req(`/admin/tenants/${id}`),
      atualizar:      (id: number, body: unknown)           => req(`/admin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      criar:          (body: unknown)                       => req('/admin/tenants', { method: 'POST', body: JSON.stringify(body) }),
      estenderTrial:  (id: number, dias: number)            => req(`/admin/tenants/${id}/estender-trial`, { method: 'POST', body: JSON.stringify({ dias }) }),
      deletar:        (id: number)                          => req(`/admin/tenants/${id}`, { method: 'DELETE' }),
      listarUsuarios: (id: number)                          => req(`/admin/tenants/${id}/usuarios`),
      removerUsuario: (tenantId: number, usuarioId: string) => req(`/admin/tenants/${tenantId}/usuarios/${usuarioId}`, { method: 'DELETE' }),
    },
  },

  insumos: {
    listar:     ()                           => req('/insumos'),
    categorias: ()                           => req('/insumos/categorias'),
    criar:      (body: unknown)              => req('/insumos', { method: 'POST', body: JSON.stringify(body) }),
    atualizar:  (id: string, body: unknown)  => req(`/insumos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    deletar:    (id: string)                 => req(`/insumos/${id}`, { method: 'DELETE' }),
  },
  especies: {
    listar: () => req('/especies'),
  },
  formulacoes: {
    listar:          ()                            => req('/formulacoes'),
    buscar:          (id: string)                  => req(`/formulacoes/${id}`),
    criar:           (body: unknown)               => req('/formulacoes', { method: 'POST', body: JSON.stringify(body) }),
    atualizarStatus: (id: string, status: string)  => req(`/formulacoes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    deletar:         (id: string)                  => req(`/formulacoes/${id}`, { method: 'DELETE' }),
    emUso:           (id: string)                  => req(`/formulacoes/${id}/em-uso`),
    atualizar:       (id: string, body: unknown)   => req(`/formulacoes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  experimentos: {
    listar:         ()               => req('/experimentos'),
    buscar:         (id: string)     => req(`/experimentos/${id}`),
    codigoSugestao: ()               => req('/experimentos/codigo-sugestao'),
    criar:          (body: unknown)  => req('/experimentos', { method: 'POST', body: JSON.stringify(body) }),
    avancar: (id: string, body?: { proximoStatus: string }) =>
      req(`/experimentos/${id}/avancar`, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    deletar:      (id: string) => req(`/experimentos/${id}`, { method: 'DELETE' }),
    resumoDelete: (id: string) => req(`/experimentos/${id}/resumo-delete`),
    monitoramentos: {
      listar: (id: string)                => req(`/experimentos/${id}/monitoramentos`),
      criar:  (id: string, body: unknown) => req(`/experimentos/${id}/monitoramentos`, { method: 'POST', body: JSON.stringify(body) }),
    },
    salvarCustos: (id: string, body: unknown) =>
      req(`/experimentos/${id}/custos`, { method: 'PUT', body: JSON.stringify(body) }),
    colheitas: {
      listar: (id: string)                => req(`/experimentos/${id}/colheitas`),
      criar:  (id: string, body: unknown) => req(`/experimentos/${id}/colheitas`, { method: 'POST', body: JSON.stringify(body) }),
    },
  },
  relatorio: {
    gerar: () => req('/relatorio'),
  },
}