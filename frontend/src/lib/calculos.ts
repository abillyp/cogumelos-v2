// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

import { Insumo } from './types'

export interface LinhaCalculo {
  insumoId: string
  pesoRealKg: number | string
  umidadePct: number | string
}

export interface ResultadoCalculo {
  cnTotal: number | null
  phMedio: number | null
  totalPeso: number
  contribs: { id: string; nome: string; cKg: number }[]
  totalC: number
  totalPesoSeco: number
  totalPesoUmido: number
}

export function toNum(v: number | string): number {
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : n
}

export function calcular(linhas: LinhaCalculo[], insumos: Insumo[]): ResultadoCalculo {
  let totalC = 0, totalN = 0, totalPeso = 0, somaPh = 0, countPh = 0
  let totalPesoSeco = 0, totalPesoUmido = 0
  const contribs: { id: string; nome: string; cKg: number }[] = []

  for (const l of linhas) {
    const ins = insumos.find(i => i.id === l.insumoId)
    const peso = toNum(l.pesoRealKg)
    const umid = toNum(l.umidadePct)
    if (!ins || !peso) { contribs.push({ id: l.insumoId, nome: '—', cKg: 0 }); continue }
    const ps  = peso * (1 - umid / 100)
    const pu  = peso - ps
    const mo  = ps * ins.moPct
    const cKg = mo * ins.carbonoPct
    const nKg = mo * ins.nitrogenioPct
    totalC    += cKg; totalN += nKg; totalPeso += peso
    totalPesoSeco  += ps
    totalPesoUmido += pu
    if (ins.ph !== null) { somaPh += ins.ph; countPh++ }
    contribs.push({ id: l.insumoId, nome: ins.nome, cKg })
  }

  return {
    cnTotal:  totalN > 0 ? totalC / totalN : null,
    phMedio:  countPh > 0 ? somaPh / countPh : null,
    totalPeso, contribs, totalC, totalPesoSeco, totalPesoUmido,
  }
}

export function calcularAgua(
  totalPesoSeco: number,
  totalPeso: number,
  umidadeDesejada: number,
): number | null {
  if (umidadeDesejada <= 0 || umidadeDesejada >= 100) return null
  const agua = (100 * totalPesoSeco + totalPeso * (umidadeDesejada - 100)) / (100 - umidadeDesejada)
  return agua < 0 ? 0 : agua
}

// ─── Utilitários de data ──────────────────────────────────────────────────────

/** Dias restantes até `data` (negativo = já expirou) */
export function diasRestantes(data: string | null | undefined): number | null {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / 86_400_000)
}

/** Dias entre duas datas ISO (positivo = b é depois de a) */
export function diasEntre(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

// ─── Status ───────────────────────────────────────────────────────────────────

export const STATUS_ORDER = [
  'PREPARACAO', 'INOCULADO', 'AMADURECIMENTO', 'FRUTIFICACAO', 'DESCANSO', 'CONCLUIDO',
]

export function statusOrderIndex(s: string): number {
  return STATUS_ORDER.indexOf(s)
}

export function proximaFaseSimples(status: string): string {
  const mapa: Record<string, string> = {
    PREPARACAO:     'INOCULADO',
    INOCULADO:      'AMADURECIMENTO',
    AMADURECIMENTO: 'FRUTIFICACAO',
  }
  return mapa[status] ?? 'FRUTIFICACAO'
}
