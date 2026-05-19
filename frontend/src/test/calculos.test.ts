// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { describe, it, expect } from 'vitest'
import {
  toNum,
  calcular,
  calcularAgua,
  statusOrderIndex,
  proximaFaseSimples,
} from '@/lib/calculos'
import { Insumo } from '@/lib/types'

// ─── Insumo de referência para os testes ─────────────────────────────────────
// moPct=0.8, carbonoPct=0.4, nitrogenioPct=0.005 → C/N teórico = 80
const INSUMO_BASE: Insumo = {
  id: 'ins-1',
  nome: 'Palha de Arroz',
  moPct: 0.8,
  carbonoPct: 0.4,
  nitrogenioPct: 0.005,
  cnRatio: 80,
  ph: 7.0,
  categoria: 'Cereal',
}

// ─── toNum ───────────────────────────────────────────────────────────────────
describe('toNum', () => {
  it('converte string numérica corretamente', () => {
    expect(toNum('10.5')).toBe(10.5)
    expect(toNum('0')).toBe(0)
    expect(toNum('42')).toBe(42)
  })

  it('retorna 0 para string vazia ou não-numérica', () => {
    expect(toNum('')).toBe(0)
    expect(toNum('abc')).toBe(0)
    expect(toNum('0.')).toBe(0)
  })

  it('retorna o próprio número quando recebe number', () => {
    expect(toNum(5)).toBe(5)
    expect(toNum(0)).toBe(0)
    expect(toNum(3.14)).toBeCloseTo(3.14)
  })
})

// ─── calcular ────────────────────────────────────────────────────────────────
describe('calcular — relação C/N', () => {
  it('calcula C/N corretamente para um insumo com 20% umidade', () => {
    // ps = 10 * (1 - 0.20) = 8 kg
    // mo = 8 * 0.8 = 6.4 kg
    // cKg = 6.4 * 0.4 = 2.56 kg  |  nKg = 6.4 * 0.005 = 0.032 kg
    // C/N = 2.56 / 0.032 = 80
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 10, umidadePct: 20 }],
      [INSUMO_BASE],
    )
    expect(result.cnTotal).toBeCloseTo(80, 1)
  })

  it('retorna cnTotal null quando não há nitrogênio (nitrogenioPct=0)', () => {
    const insumoSemN: Insumo = { ...INSUMO_BASE, nitrogenioPct: 0 }
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 10, umidadePct: 0 }],
      [insumoSemN],
    )
    expect(result.cnTotal).toBeNull()
  })

  it('retorna cnTotal null para lista vazia', () => {
    const result = calcular([], [INSUMO_BASE])
    expect(result.cnTotal).toBeNull()
    expect(result.totalPeso).toBe(0)
  })

  it('combina dois insumos e calcula C/N resultante', () => {
    const ins1: Insumo = { ...INSUMO_BASE, id: 'ins-1' }
    const ins2: Insumo = { ...INSUMO_BASE, id: 'ins-2', carbonoPct: 0.2, nitrogenioPct: 0.01 }
    const result = calcular(
      [
        { insumoId: 'ins-1', pesoRealKg: 5, umidadePct: 0 },
        { insumoId: 'ins-2', pesoRealKg: 5, umidadePct: 0 },
      ],
      [ins1, ins2],
    )
    expect(result.cnTotal).not.toBeNull()
    expect(result.totalPeso).toBe(10)
    expect(result.contribs).toHaveLength(2)
  })

  it('ignora linhas sem insumo selecionado (insumoId vazio)', () => {
    const result = calcular(
      [{ insumoId: '', pesoRealKg: 10, umidadePct: 20 }],
      [INSUMO_BASE],
    )
    expect(result.cnTotal).toBeNull()
    expect(result.totalPeso).toBe(0)
  })

  it('ignora linhas com peso zero', () => {
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 0, umidadePct: 20 }],
      [INSUMO_BASE],
    )
    expect(result.totalPeso).toBe(0)
    expect(result.cnTotal).toBeNull()
  })

  it('aceita pesoRealKg e umidadePct como strings numéricas', () => {
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: '10', umidadePct: '20' }],
      [INSUMO_BASE],
    )
    expect(result.totalPeso).toBe(10)
    expect(result.cnTotal).toBeCloseTo(80, 1)
  })
})

describe('calcular — peso seco e úmido', () => {
  it('calcula peso seco corretamente com 50% umidade', () => {
    // ps = 10 * (1 - 0.5) = 5 kg  |  pu = 5 kg
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 10, umidadePct: 50 }],
      [INSUMO_BASE],
    )
    expect(result.totalPesoSeco).toBeCloseTo(5, 5)
    expect(result.totalPesoUmido).toBeCloseTo(5, 5)
  })

  it('peso seco = peso total quando umidade = 0%', () => {
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 8, umidadePct: 0 }],
      [INSUMO_BASE],
    )
    expect(result.totalPesoSeco).toBeCloseTo(8, 5)
    expect(result.totalPesoUmido).toBeCloseTo(0, 5)
  })

  it('soma peso total de múltiplas linhas', () => {
    const result = calcular(
      [
        { insumoId: 'ins-1', pesoRealKg: 3, umidadePct: 0 },
        { insumoId: 'ins-1', pesoRealKg: 7, umidadePct: 0 },
      ],
      [INSUMO_BASE],
    )
    expect(result.totalPeso).toBe(10)
  })
})

describe('calcular — pH', () => {
  it('calcula pH médio de dois insumos', () => {
    const ins1: Insumo = { ...INSUMO_BASE, id: 'ins-1', ph: 6.0 }
    const ins2: Insumo = { ...INSUMO_BASE, id: 'ins-2', ph: 8.0 }
    const result = calcular(
      [
        { insumoId: 'ins-1', pesoRealKg: 5, umidadePct: 0 },
        { insumoId: 'ins-2', pesoRealKg: 5, umidadePct: 0 },
      ],
      [ins1, ins2],
    )
    expect(result.phMedio).toBeCloseTo(7.0, 1)
  })

  it('retorna phMedio null quando nenhum insumo tem pH definido', () => {
    const insumoSemPh: Insumo = { ...INSUMO_BASE, ph: null }
    const result = calcular(
      [{ insumoId: 'ins-1', pesoRealKg: 10, umidadePct: 0 }],
      [insumoSemPh],
    )
    expect(result.phMedio).toBeNull()
  })

  it('ignora insumos sem pH no cálculo do pH médio', () => {
    const ins1: Insumo = { ...INSUMO_BASE, id: 'ins-1', ph: 6.0 }
    const ins2: Insumo = { ...INSUMO_BASE, id: 'ins-2', ph: null }
    const result = calcular(
      [
        { insumoId: 'ins-1', pesoRealKg: 5, umidadePct: 0 },
        { insumoId: 'ins-2', pesoRealKg: 5, umidadePct: 0 },
      ],
      [ins1, ins2],
    )
    expect(result.phMedio).toBeCloseTo(6.0, 1)
  })
})

describe('calcular — contribuições', () => {
  it('calcula contribuição de carbono de cada insumo', () => {
    const ins1: Insumo = { ...INSUMO_BASE, id: 'ins-1', carbonoPct: 0.4 }
    const ins2: Insumo = { ...INSUMO_BASE, id: 'ins-2', carbonoPct: 0.2 }
    const result = calcular(
      [
        { insumoId: 'ins-1', pesoRealKg: 10, umidadePct: 0 },
        { insumoId: 'ins-2', pesoRealKg: 10, umidadePct: 0 },
      ],
      [ins1, ins2],
    )
    const contrib1 = result.contribs.find(c => c.id === 'ins-1')!
    const contrib2 = result.contribs.find(c => c.id === 'ins-2')!
    expect(contrib1.cKg).toBeGreaterThan(contrib2.cKg)
  })

  it('insumo não encontrado recebe cKg=0 e nome="—"', () => {
    const result = calcular(
      [{ insumoId: 'nao-existe', pesoRealKg: 10, umidadePct: 0 }],
      [INSUMO_BASE],
    )
    expect(result.contribs[0].cKg).toBe(0)
    expect(result.contribs[0].nome).toBe('—')
  })
})

// ─── calcularAgua ─────────────────────────────────────────────────────────────
describe('calcularAgua', () => {
  it('calcula água necessária para atingir 65% de umidade partindo de substrato seco', () => {
    // pesoSeco=10, totalPeso=10 (0% umidade), desejada=65%
    // agua = (100*10 + 10*(65-100)) / (100-65) = (1000-350)/35 ≈ 18.571
    const result = calcularAgua(10, 10, 65)
    expect(result).toBeCloseTo(18.571, 2)
  })

  it('retorna null para umidade desejada = 0', () => {
    expect(calcularAgua(8, 10, 0)).toBeNull()
  })

  it('retorna null para umidade desejada = 100', () => {
    expect(calcularAgua(8, 10, 100)).toBeNull()
  })

  it('retorna null para umidade desejada negativa', () => {
    expect(calcularAgua(8, 10, -5)).toBeNull()
  })

  it('retorna 0 quando substrato já está acima da umidade desejada', () => {
    // pesoSeco=1, totalPeso=10 → umidade atual ≈ 90%, desejada=65%
    const result = calcularAgua(1, 10, 65)
    expect(result).toBe(0)
  })

  it('retorna null para umidade desejada > 100', () => {
    expect(calcularAgua(8, 10, 101)).toBeNull()
  })
})

// ─── statusOrderIndex ─────────────────────────────────────────────────────────
describe('statusOrderIndex', () => {
  it('retorna índice correto para cada status do fluxo', () => {
    expect(statusOrderIndex('PREPARACAO')).toBe(0)
    expect(statusOrderIndex('INOCULADO')).toBe(1)
    expect(statusOrderIndex('AMADURECIMENTO')).toBe(2)
    expect(statusOrderIndex('FRUTIFICACAO')).toBe(3)
    expect(statusOrderIndex('DESCANSO')).toBe(4)
    expect(statusOrderIndex('CONCLUIDO')).toBe(5)
  })

  it('retorna -1 para status desconhecido', () => {
    expect(statusOrderIndex('INVALIDO')).toBe(-1)
    expect(statusOrderIndex('')).toBe(-1)
  })

  it('mantém PREPARACAO antes de CONCLUIDO na ordenação', () => {
    expect(statusOrderIndex('PREPARACAO')).toBeLessThan(statusOrderIndex('CONCLUIDO'))
  })
})

// ─── proximaFaseSimples ───────────────────────────────────────────────────────
describe('proximaFaseSimples', () => {
  it('PREPARACAO → INOCULADO', () => {
    expect(proximaFaseSimples('PREPARACAO')).toBe('INOCULADO')
  })

  it('INOCULADO → AMADURECIMENTO', () => {
    expect(proximaFaseSimples('INOCULADO')).toBe('AMADURECIMENTO')
  })

  it('AMADURECIMENTO → FRUTIFICACAO', () => {
    expect(proximaFaseSimples('AMADURECIMENTO')).toBe('FRUTIFICACAO')
  })

  it('retorna FRUTIFICACAO como fallback para fases sem mapeamento', () => {
    expect(proximaFaseSimples('FRUTIFICACAO')).toBe('FRUTIFICACAO')
    expect(proximaFaseSimples('DESCANSO')).toBe('FRUTIFICACAO')
    expect(proximaFaseSimples('CONCLUIDO')).toBe('FRUTIFICACAO')
    expect(proximaFaseSimples('DESCONHECIDO')).toBe('FRUTIFICACAO')
  })
})
