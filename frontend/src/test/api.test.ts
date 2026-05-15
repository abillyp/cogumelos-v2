// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTokens, clearTokens } from '@/lib/api'

describe('api — saveTokens / clearTokens', () => {
  beforeEach(() => localStorage.clear())

  it('saveTokens não deve persistir nada no localStorage — tokens são gerenciados por HttpOnly cookies', () => {
    saveTokens('access-123')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('clearTokens deve remover apenas user do localStorage — token nunca foi gravado', () => {
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    clearTokens()

    expect(localStorage.getItem('user')).toBeNull()
    // token e refreshToken nunca estão no localStorage — gerenciados por HttpOnly cookies
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })
})

describe('api — requisições HTTP', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  it('deve enviar requisição com credentials:include e sem Authorization header — token está em HttpOnly cookie', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    })
    vi.stubGlobal('fetch', mockFetch)

    const { api } = await import('@/lib/api')
    await api.experimentos.listar()

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    )
  })

  it('deve tentar renovar token ao receber 401 — refresh via cookie e retry da requisição original', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })  // 401 na primeira
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })   // /auth/refresh — seta novo cookie
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })     // retry da requisição original

    vi.stubGlobal('fetch', mockFetch)
    vi.resetModules()

    const { api } = await import('@/lib/api')
    await api.experimentos.listar()

    expect(mockFetch).toHaveBeenCalledTimes(3)
    // segunda chamada deve ser para o endpoint de refresh
    expect(mockFetch.mock.calls[1][0]).toContain('/auth/refresh')
  })
})