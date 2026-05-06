// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveTokens, clearTokens } from '@/lib/api'

describe('api — saveTokens / clearTokens', () => {
  beforeEach(() => localStorage.clear())

  it('saveTokens deve persistir apenas o token de acesso no localStorage', () => {
    // ✅ refreshToken não vai mais para o localStorage — está no HttpOnly cookie
    saveTokens('access-123')
    expect(localStorage.getItem('token')).toBe('access-123')
    expect(localStorage.getItem('refreshToken')).toBeNull()
  })

  it('clearTokens deve remover token e user do localStorage', () => {
    localStorage.setItem('token', 'abc')
    localStorage.setItem('user', JSON.stringify({ id: '1' }))
    // ✅ refreshToken não está mais no localStorage — não precisa verificar

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
    // ✅ saveTokens agora recebe só o token de acesso
    saveTokens('meu-token')

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
    // ✅ saveTokens agora recebe só o token de acesso
    saveTokens('token-expirado')

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })   // 401 na primeira
      .mockResolvedValueOnce({                                                       // renovação via cookie
        ok: true, status: 200,
        json: async () => ({ token: 'novo-token' }), // ✅ refreshToken não vem mais no body
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => [] })       // retry

    vi.stubGlobal('fetch', mockFetch)
    vi.resetModules()

    const { api, saveTokens: st } = await import('@/lib/api')
    st('token-expirado') // ✅ só token de acesso

    await api.experimentos.listar()
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})