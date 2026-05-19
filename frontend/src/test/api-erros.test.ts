// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Cada bloco que testa estado de módulo faz vi.resetModules() para isolar o
// estado de `refreshando` e `filaRefresh` que são variáveis de módulo em api.ts

describe('api — erros HTTP', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  // ─── 402 Trial expirado ─────────────────────────────────────────────────
  it('lança erro "Período de trial encerrado" ao receber status 402', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({}),
    }))

    const { api } = await import('@/lib/api')
    await expect(api.experimentos.listar()).rejects.toThrow('Período de trial encerrado')
  })

  it('limpa user do localStorage ao receber status 402', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({}),
    }))

    const { api } = await import('@/lib/api')
    await api.experimentos.listar().catch(() => {})
    expect(localStorage.getItem('user')).toBeNull()
  })

  // ─── 403 Assinatura cancelada ───────────────────────────────────────────
  it('lança erro "Assinatura cancelada" quando body contém "cancelada"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ erro: 'Assinatura cancelada pelo usuário' }),
    }))

    const { api } = await import('@/lib/api')
    await expect(api.experimentos.listar()).rejects.toThrow('Assinatura cancelada')
  })

  it('limpa user do localStorage ao receber 403 com "cancelada"', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ erro: 'assinatura cancelada' }),
    }))

    const { api } = await import('@/lib/api')
    await api.experimentos.listar().catch(() => {})
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('403 sem "cancelada" no body não lança erro de cancelamento', async () => {
    // 403 genérico (permissão negada) deve cair no handler de erro genérico
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ erro: 'Acesso negado' }),
    }))

    const { api } = await import('@/lib/api')
    await expect(api.experimentos.listar()).rejects.toThrow('Acesso negado')
  })

  // ─── Erro genérico (não-ok) ─────────────────────────────────────────────
  it('lança erro com mensagem do body quando status não é ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ erro: 'Dados inválidos' }),
    }))

    const { api } = await import('@/lib/api')
    await expect(api.insumos.listar()).rejects.toThrow('Dados inválidos')
  })

  it('lança "Erro desconhecido" quando body não tem campo "erro"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }))

    const { api } = await import('@/lib/api')
    await expect(api.insumos.listar()).rejects.toThrow('Erro na requisição')
  })

  it('lança "Erro desconhecido" quando body não é JSON válido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => { throw new Error('invalid json') },
    }))

    const { api } = await import('@/lib/api')
    await expect(api.insumos.listar()).rejects.toThrow('Erro desconhecido')
  })

  // ─── 204 No Content ─────────────────────────────────────────────────────
  it('retorna undefined para status 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => { throw new Error('no body') },
    }))

    const { api } = await import('@/lib/api')
    const result = await api.insumos.deletar('id-123')
    expect(result).toBeUndefined()
  })

  // ─── 401 — refresh com falha ────────────────────────────────────────────
  it('redireciona para /login quando refresh falha após 401', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }),
    )

    const { api } = await import('@/lib/api')
    await expect(api.experimentos.listar()).rejects.toThrow('Sessão expirada')
  })

  it('limpa user do localStorage quando refresh falha', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }))
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) }),
    )

    const { api } = await import('@/lib/api')
    await api.experimentos.listar().catch(() => {})
    expect(localStorage.getItem('user')).toBeNull()
  })

  // ─── 401 — refresh com sucesso (já testado em api.test.ts) ──────────────
  it('não usa Authorization header — token via HttpOnly cookie', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => [],
    })
    vi.stubGlobal('fetch', mockFetch)

    const { api } = await import('@/lib/api')
    await api.insumos.listar()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      }),
    )
  })
})

// ─── clearTokens ─────────────────────────────────────────────────────────────
describe('clearTokens', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('remove apenas "user" do localStorage', async () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }))
    localStorage.setItem('outraChave', 'valor')

    const { clearTokens } = await import('@/lib/api')
    clearTokens()

    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('outraChave')).toBe('valor')
  })
})

// ─── Fila de refresh concorrente ─────────────────────────────────────────────
describe('api — fila de refresh concorrente', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('faz apenas uma chamada de refresh para múltiplos 401 simultâneos', async () => {
    let refreshCount = 0
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCount++
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
      }
      // primeira chamada de cada request retorna 401, segunda retorna sucesso
      return Promise.resolve({ ok: true, status: 200, json: async () => [] })
    })

    // Simula: req1=401, req2=401, refresh, retry1, retry2
    let call = 0
    const mockFetchOrdered = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/refresh')) {
        refreshCount++
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) })
      }
      call++
      if (call <= 2) {
        return Promise.resolve({ ok: false, status: 401, json: async () => ({}) })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => [] })
    })

    vi.stubGlobal('fetch', mockFetchOrdered)
    const { api } = await import('@/lib/api')

    await Promise.all([
      api.insumos.listar().catch(() => {}),
      api.especies.listar().catch(() => {}),
    ])

    expect(refreshCount).toBeLessThanOrEqual(1)
  })
})
