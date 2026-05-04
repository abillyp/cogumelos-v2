const BASE = '/api'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refreshToken')
}

export function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem('token', token)
  localStorage.setItem('refreshToken', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}



let refreshando = false
let filaRefresh: Array<(token: string) => void> = []

async function renovarToken(): Promise<string> {
  if (refreshando) {
    return new Promise(resolve => filaRefresh.push(resolve))
  }
  refreshando = true
  try {
    const rt = getRefreshToken()
    if (!rt) throw new Error('Sem refresh token')
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    })
    if (!res.ok) throw new Error('Refresh falhou')
    const data = await res.json()
    saveTokens(data.token, data.refreshToken)
    filaRefresh.forEach(cb => cb(data.token))
    filaRefresh = []
    return data.token
  } catch {
    clearTokens()
    window.location.href = '/login'
    throw new Error('Sessão expirada')
  } finally {
    refreshando = false
  }
}

async function req<T>(path: string, options?: RequestInit, retry = true): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  // Trial expirado, assinatura cancelada ou expirada
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
      const novoToken = await renovarToken()
      return req<T>(path, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${novoToken}` },
      }, false)
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
    login:    (body: unknown) => req('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    registro: (body: unknown) => req('/auth/registro', { method: 'POST', body: JSON.stringify(body) }),
    logout:   (refreshToken: string) => fetch(`${BASE}/auth/logout`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }),
    me: () => req('/auth/me'),
    esqueciSenha:    (email: string) => req('/auth/esqueci-senha', { method: 'POST', body: JSON.stringify({ email }) }),
    redefinirSenha:  (token: string, novaSenha: string) => req('/auth/redefinir-senha', { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),
    alterarSenha:    (senhaAtual: string, novaSenha: string) => req('/auth/alterar-senha', { method: 'PATCH', body: JSON.stringify({ senhaAtual, novaSenha }) }),
  },

  admin: {
    usuarios: {
      listar:    ()                           => req('/admin/usuarios'),
      criar:     (body: unknown)              => req('/admin/usuarios', { method: 'POST', body: JSON.stringify(body) }),
      atualizar: (id: string, body: unknown)  => req(`/admin/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      deletar:   (id: string)                 => req(`/admin/usuarios/${id}`, { method: 'DELETE' }),
    },
    tenants: {
      listar:       ()                            => req('/admin/tenants'),
      resumo:       ()                            => req('/admin/tenants/resumo'),
      buscar:       (id: number)                  => req(`/admin/tenants/${id}`),
      atualizar:    (id: number, body: unknown)   => req(`/admin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
      criar:        (body: unknown)               => req('/admin/tenants', { method: 'POST', body: JSON.stringify(body) }),
      estenderTrial:(id: number, dias: number)    => req(`/admin/tenants/${id}/estender-trial`, { method: 'POST', body: JSON.stringify({ dias }) }),
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
      deletar: (id: string) => req(`/experimentos/${id}`, { method: 'DELETE' }),
      resumoDelete: (id: string) => req(`/experimentos/${id}/resumo-delete`),
    monitoramentos: {
      listar: (id: string)                => req(`/experimentos/${id}/monitoramentos`),
      criar:  (id: string, body: unknown) => req(`/experimentos/${id}/monitoramentos`, { method: 'POST', body: JSON.stringify(body) }),
    },
	salvarCustos: (id: string, body: unknown) =>
	  req(`/experimentos/${id}/custos`, {
		method: 'PUT',
		body: JSON.stringify(body),
	  }),	
    colheitas: {
      listar: (id: string)                => req(`/experimentos/${id}/colheitas`),
      criar:  (id: string, body: unknown) => req(`/experimentos/${id}/colheitas`, { method: 'POST', body: JSON.stringify(body) }),
    },
  },
  relatorio: {
    gerar: () => req('/relatorio'),
  },
}
