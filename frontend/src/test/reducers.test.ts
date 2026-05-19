// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { describe, it, expect } from 'vitest'
import {
  monitoramentoInicial, monitoramentoReducer,
  colheitaInicial, colheitaReducer,
  custosInicial, custosReducer,
  type MonitoramentoState,
  type ColheitaState,
} from '@/lib/reducers'

// ── monitoramentoReducer ───────────────────────────────────────────────────────
describe('monitoramentoReducer', () => {
  it('retorna estado inicial correto', () => {
    const s = monitoramentoInicial()
    expect(s.sala).toBe('FRUTIFICACAO')
    expect(s.temp).toBe('')
    expect(s.umid).toBe('')
    expect(s.obs).toBe('')
    expect(s.blocosPerdidos).toBe('')
    expect(s.erro).toBe('')
  })

  it('SET_SALA atualiza sala', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_SALA', value: 'AMADURECIMENTO' })
    expect(s.sala).toBe('AMADURECIMENTO')
  })

  it('SET_DATA atualiza data', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_DATA', value: '2026-01-15' })
    expect(s.data).toBe('2026-01-15')
  })

  it('SET_TEMP atualiza temperatura', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_TEMP', value: '22.5' })
    expect(s.temp).toBe('22.5')
  })

  it('SET_UMID atualiza umidade', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_UMID', value: '85' })
    expect(s.umid).toBe('85')
  })

  it('SET_OBS atualiza observação', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_OBS', value: 'Tudo ok' })
    expect(s.obs).toBe('Tudo ok')
  })

  it('SET_BLOCOS_PERDIDOS atualiza blocos perdidos', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_BLOCOS_PERDIDOS', value: '3' })
    expect(s.blocosPerdidos).toBe('3')
  })

  it('SET_ERRO atualiza erro', () => {
    const s = monitoramentoReducer(monitoramentoInicial(), { type: 'SET_ERRO', value: 'Falhou' })
    expect(s.erro).toBe('Falhou')
  })

  it('RESET limpa campos de input mas preserva sala e data', () => {
    const preenchido: MonitoramentoState = {
      sala: 'DESCANSO', data: '2026-05-10',
      temp: '24', umid: '90', obs: 'obs', blocosPerdidos: '2', erro: 'erro',
    }
    const s = monitoramentoReducer(preenchido, { type: 'RESET' })
    expect(s.sala).toBe('DESCANSO')    // preservado
    expect(s.data).toBe('2026-05-10') // preservado
    expect(s.temp).toBe('')
    expect(s.umid).toBe('')
    expect(s.obs).toBe('')
    expect(s.blocosPerdidos).toBe('')
    expect(s.erro).toBe('')
  })

  it('retorna o mesmo estado para action desconhecida', () => {
    const inicial = monitoramentoInicial()
    // @ts-expect-error — testando caso inválido
    const s = monitoramentoReducer(inicial, { type: 'INVALIDO' })
    expect(s).toBe(inicial)
  })
})

// ── colheitaReducer ────────────────────────────────────────────────────────────
describe('colheitaReducer', () => {
  it('retorna estado inicial correto', () => {
    const s = colheitaInicial()
    expect(s.pesoTotal).toBe('')
    expect(s.notas).toBe('')
    expect(s.erro).toBe('')
  })

  it('SET_DATA atualiza data', () => {
    const s = colheitaReducer(colheitaInicial(), { type: 'SET_DATA', value: '2026-03-20' })
    expect(s.data).toBe('2026-03-20')
  })

  it('SET_PESO atualiza peso total', () => {
    const s = colheitaReducer(colheitaInicial(), { type: 'SET_PESO', value: '28.4' })
    expect(s.pesoTotal).toBe('28.4')
  })

  it('SET_NOTAS atualiza notas', () => {
    const s = colheitaReducer(colheitaInicial(), { type: 'SET_NOTAS', value: 'Boa colheita' })
    expect(s.notas).toBe('Boa colheita')
  })

  it('SET_ERRO atualiza erro', () => {
    const s = colheitaReducer(colheitaInicial(), { type: 'SET_ERRO', value: 'Erro API' })
    expect(s.erro).toBe('Erro API')
  })

  it('RESET limpa campos de input mas preserva data', () => {
    const preenchido: ColheitaState = { data: '2026-04-01', pesoTotal: '15', notas: 'ok', erro: 'e' }
    const s = colheitaReducer(preenchido, { type: 'RESET' })
    expect(s.data).toBe('2026-04-01') // preservado
    expect(s.pesoTotal).toBe('')
    expect(s.notas).toBe('')
    expect(s.erro).toBe('')
  })

  it('retorna o mesmo estado para action desconhecida', () => {
    const inicial = colheitaInicial()
    // @ts-expect-error — testando caso inválido
    const s = colheitaReducer(inicial, { type: 'INVALIDO' })
    expect(s).toBe(inicial)
  })
})

// ── custosReducer ─────────────────────────────────────────────────────────────
describe('custosReducer', () => {
  it('custosInicial sem argumentos retorna estado vazio', () => {
    const s = custosInicial(null, [])
    expect(s.precoVendaKg).toBe('')
    expect(s.custos).toEqual({})
    expect(s.salvando).toBe(false)
    expect(s.erro).toBe('')
  })

  it('custosInicial popula precoVendaKg e custos da lista', () => {
    const s = custosInicial(35.5, [
      { insumoId: 'a1', custoPorKg: 12.5 },
      { insumoId: 'b2', custoPorKg: null },
    ])
    expect(s.precoVendaKg).toBe('35.5')
    expect(s.custos['a1']).toBe('12.5')
    expect(s.custos['b2']).toBe('')
  })

  it('SET_PRECO atualiza preço de venda', () => {
    const inicial = custosInicial(null, [])
    const s = custosReducer(inicial, { type: 'SET_PRECO', value: '40' })
    expect(s.precoVendaKg).toBe('40')
  })

  it('SET_CUSTO atualiza custo de insumo específico sem afetar outros', () => {
    const inicial = custosInicial(null, [
      { insumoId: 'a1', custoPorKg: 10 },
      { insumoId: 'b2', custoPorKg: 20 },
    ])
    const s = custosReducer(inicial, { type: 'SET_CUSTO', insumoId: 'a1', value: '15' })
    expect(s.custos['a1']).toBe('15')
    expect(s.custos['b2']).toBe('20')  // não alterado
  })

  it('SET_SALVANDO atualiza flag de salvando', () => {
    const inicial = custosInicial(null, [])
    const s1 = custosReducer(inicial, { type: 'SET_SALVANDO', value: true })
    expect(s1.salvando).toBe(true)
    const s2 = custosReducer(s1, { type: 'SET_SALVANDO', value: false })
    expect(s2.salvando).toBe(false)
  })

  it('SET_ERRO atualiza mensagem de erro', () => {
    const inicial = custosInicial(null, [])
    const s = custosReducer(inicial, { type: 'SET_ERRO', value: 'Falha ao salvar' })
    expect(s.erro).toBe('Falha ao salvar')
  })

  it('retorna o mesmo estado para action desconhecida', () => {
    const inicial = custosInicial(null, [])
    // @ts-expect-error — testando caso inválido
    const s = custosReducer(inicial, { type: 'INVALIDO' })
    expect(s).toBe(inicial)
  })
})
