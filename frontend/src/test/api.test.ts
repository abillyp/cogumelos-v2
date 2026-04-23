// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: contato@cogumelos.app

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTokens, clearTokens } from '@/lib/api'

describe('api — saveTokens / clearTokens', () => {
  beforeEach(() => localStorage.clear())

  it('saveTokens deve persistir token e refreshToken no localStorage', () => {
    saveTokens('access-123', 'refresh-456')
    expect(localStorage.getItem('token')).toBe('access-123')
    expect(localStorage.getItem('refreshToken')).toBe('refresh-456')
  })

  it('clearTokens deve remover todos os dados de autenticação', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('refreshToken', 'def')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))

    clearTokens()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refreshToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('api — requisições HTTP', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  it('deve adicionar Authorization header quando token existe', async () => {
    saveTokens('meu-token', 'refresh')

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
        headers: expect.objectContaining({
          Authorization: 'Bearer meu-token',
        }),
      })
    )
  })

  it('deve tentar renovar token ao receber 401', async () => {
    saveTokens('token-expirado', 'refresh-valido')

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })   // 401 na primeira
      .mockResolvedValueOnce({                                                       // renovação
        ok: true, status: 200,
        json: async () => ({ token: 'novo-token', refreshToken: 'novo-refresh' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })       // retry

    vi.stubGlobal('fetch', mockFetch)
    vi.resetModules()

    const { api, saveTokens: st } = await import('@/lib/api')
    st('token-expirado', 'refresh-valido')

    await api.experimentos.listar()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})
