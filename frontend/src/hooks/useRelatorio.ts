// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { useEffect, useMemo, useState } from 'react'
import { api, toErrorMessage } from '@/lib/api'
import type { Experimento, DiasPorFase, ColheitaMensalItem } from '@/lib/types'

// Alias para legibilidade nos cálculos do relatório
export type Exp = Experimento

export function calcEB(e: Exp): number | null {
  if (e.status !== 'CONCLUIDO') return null
  const colhido = e.financeiro?.totalColhidoKg
  if (!colhido || colhido === 0) return null
  const pesoTotal = (e.insumos ?? []).reduce((s, i) => s + i.pesoKg, 0)
  if (!pesoTotal) return null
  const eb = (colhido / pesoTotal) * 100
  return Math.min(Math.max(eb, 0), 200)
}

interface RelatorioResumo {
  totalExperimentos: number; concluidos: number; emAndamento: number
  totalColhidoKg: number | null; receitaTotal: number | null
  custoTotal: number | null; margemMediaPct: number | null
}

interface RelatorioResponse {
  totalExperimentos?: number; concluidos?: number; emAndamento?: number
  totalColhidoKg?: number | null; receitaTotal?: number | null
  custoTotal?: number | null; margemMediaPct?: number | null
  detalhes?: Exp[]
  colheitasMensais?: ColheitaMensalItem[]
}

const RESUMO_VAZIO: RelatorioResumo = {
  totalExperimentos: 0, concluidos: 0, emAndamento: 0,
  totalColhidoKg: null, receitaTotal: null, custoTotal: null, margemMediaPct: null,
}

export function useRelatorio() {
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState('')
  const [resumo, setResumo]       = useState<RelatorioResumo>(RESUMO_VAZIO)
  const [exps, setExps]           = useState<Exp[]>([])
  const [colheitasMensaisRaw, setColheitasMensaisRaw] = useState<ColheitaMensalItem[]>([])
  const [filtroEsp, setFiltroEsp] = useState('Todas')
  const [filtroSt, setFiltroSt]   = useState('Todos')

  useEffect(() => {
    api.relatorio.gerar()
      .then((v: unknown) => {
        const d = v as RelatorioResponse
        setResumo({
          totalExperimentos: d.totalExperimentos ?? 0,
          concluidos:        d.concluidos        ?? 0,
          emAndamento:       d.emAndamento       ?? 0,
          totalColhidoKg:    d.totalColhidoKg    ?? null,
          receitaTotal:      d.receitaTotal      ?? null,
          custoTotal:        d.custoTotal        ?? null,
          margemMediaPct:    d.margemMediaPct     ?? null,
        })
        setExps(d.detalhes ?? [])
        setColheitasMensaisRaw(d.colheitasMensais ?? [])
      })
      .catch((e: unknown) => setErro(toErrorMessage(e, 'Erro ao carregar relatório')))
      .finally(() => setLoading(false))
  }, [])

  const concluidos = useMemo(() => exps.filter(e => e.status === 'CONCLUIDO'), [exps])
  const ativos     = useMemo(() => exps.filter(e => e.status !== 'CONCLUIDO'), [exps])

  const ebMedia = useMemo(() => {
    const v = concluidos.map(calcEB).filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }, [concluidos])

  const custoPorKgMedio = useMemo(() => {
    const v = concluidos.map(e => e.financeiro?.custoPorKgProduzido).filter((x): x is number => x != null && x > 0)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
  }, [concluidos])

  const pontoEquilibrio = useMemo(() => {
    const precos = ativos.map(e => e.precoVendaKg).filter((x): x is number => x != null && x > 0)
    const custos = ativos.map(e => e.financeiro?.custoTotalSubstrato).filter((x): x is number => x != null && x > 0)
    if (!precos.length || !custos.length) return null
    return (custos.reduce((a, b) => a + b, 0) / custos.length) / (precos.reduce((a, b) => a + b, 0) / precos.length)
  }, [ativos])

  const diasCiclo = useMemo(() => {
    const vals = concluidos
      .map(e => e.diasPorFase?.total)
      .filter((x): x is number => x != null && x > 0)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }, [concluidos])

  const diasFases = useMemo(() => {
    const soma = (key: keyof DiasPorFase) => {
      const vals = concluidos
        .map(e => e.diasPorFase?.[key])
        .filter((x): x is number => x != null && x > 0)
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
    }
    return [
      { label: 'Inoculação',   dias: soma('inoculacao') },
      { label: 'Amadurec.',    dias: soma('amadurecimento') },
      { label: 'Frutificação', dias: soma('frutificacao') },
    ]
  }, [concluidos])

  const topForm = useMemo(() => {
    const map = new Map<string, { nome: string; especie: string; cn: number | null; ebs: number[]; custos: number[]; margs: number[]; total: number }>()
    for (const e of exps) {
      const k = e.formulacaoId || e.formulacaoNome
      if (!map.has(k)) map.set(k, { nome: e.formulacaoNome, especie: e.especieNome, cn: e.cnTotal, ebs: [], custos: [], margs: [], total: 0 })
      const item = map.get(k)!
      item.total++
      const eb = calcEB(e); if (eb != null) item.ebs.push(eb)
      if (e.financeiro?.custoTotalSubstrato != null) item.custos.push(e.financeiro.custoTotalSubstrato)
      if (e.financeiro?.margemPct != null) item.margs.push(e.financeiro.margemPct)
    }
    return Array.from(map.entries()).map(([id, v]) => ({
      id, nome: v.nome, especie: v.especie, cn: v.cn, totalLotes: v.total,
      ebMedia:     v.ebs.length    ? v.ebs.reduce((a, b)    => a + b, 0) / v.ebs.length    : null,
      custoMedio:  v.custos.length ? v.custos.reduce((a, b) => a + b, 0) / v.custos.length : null,
      margemMedia: v.margs.length  ? v.margs.reduce((a, b)  => a + b, 0) / v.margs.length  : null,
    })).sort((a, b) => (b.ebMedia ?? 0) - (a.ebMedia ?? 0)).slice(0, 5)
  }, [exps])

  const consumoInsumos = useMemo(() => {
    const map = new Map<string, { nome: string; kg: number }>()
    for (const e of exps) for (const i of (e.insumos ?? [])) {
      if (!map.has(i.insumoId)) map.set(i.insumoId, { nome: i.nome, kg: 0 })
      map.get(i.insumoId)!.kg += i.pesoKg
    }
    return Array.from(map.values()).sort((a, b) => b.kg - a.kg).slice(0, 6)
  }, [exps])

  const colheitaMensal = useMemo(() => {
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const sorted = [...colheitasMensaisRaw]
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)
    return {
      labels: sorted.map(i => MESES[parseInt(i.mes.split('-')[1]) - 1]),
      data:   sorted.map(i => +i.totalKg.toFixed(1)),
    }
  }, [colheitasMensaisRaw])

  const projecao = useMemo(() => {
    const recEsp  = ativos.reduce((s, e) => s + (e.pesoBlocoKg ?? 1.2) * e.totalBlocos * ((ebMedia ?? 60) / 100) * (e.precoVendaKg ?? 0), 0)
    const custoAt = ativos.reduce((s, e) => s + (e.financeiro?.custoTotalSubstrato ?? 0), 0)
    return { recEsp, custoAt, margemProj: recEsp > 0 ? ((recEsp - custoAt) / recEsp) * 100 : null }
  }, [ativos, ebMedia])

  const alertas = useMemo(() => {
    const lista: { bg: string; color: string; dot: string; text: string }[] = []
    for (const e of ativos.slice(0, 2)) lista.push({ bg: '#FAEEDA', color: '#633806', dot: '#BA7517', text: `${e.codigo} em andamento — monitore regularmente` })
    if (topForm[0]) lista.push({ bg: '#EEEDFE', color: '#3C3489', dot: '#534AB7', text: `${topForm[0].nome} tem melhor EB — considere replicar` })
    const bestMes = colheitaMensal.labels[colheitaMensal.data.indexOf(Math.max(...colheitaMensal.data, 0))]
    if (bestMes && Math.max(...colheitaMensal.data, 0) > 0) lista.push({ bg: '#E1F5EE', color: '#085041', dot: '#0F6E56', text: `${bestMes} foi o melhor mês em colheita` })
    return lista.slice(0, 4)
  }, [ativos, topForm, colheitaMensal])

  const filtrados = useMemo(
    () => exps.filter(e => (filtroEsp === 'Todas' || e.especieNome === filtroEsp) && (filtroSt === 'Todos' || e.status === filtroSt)),
    [exps, filtroEsp, filtroSt]
  )
  const especiesLista = useMemo(() => ['Todas', ...Array.from(new Set(exps.map(e => e.especieNome)))], [exps])
  const statusesLista = useMemo(() => ['Todos', ...Array.from(new Set(exps.map(e => e.status)))],     [exps])

  function exportarCSV() {
    const h = ['Código','Formulação','Espécie','Status','Custo','Colheita (kg)','Receita','Margem %','EB %']
    const STATUS_PT: Record<string, string> = { PREPARACAO: 'Preparo', INOCULADO: 'Inoculado', AMADURECIMENTO: 'Amadurec.', FRUTIFICACAO: 'Frutific.', CONCLUIDO: 'Concluído' }
    const l = filtrados.map(e => [
      e.codigo, e.formulacaoNome, e.especieNome, STATUS_PT[e.status] ?? e.status,
      e.financeiro?.custoTotalSubstrato?.toFixed(2) ?? '',
      e.financeiro?.totalColhidoKg?.toFixed(1) ?? '',
      e.financeiro?.receitaTotal?.toFixed(2) ?? '',
      e.financeiro?.margemPct?.toFixed(1) ?? '',
      calcEB(e)?.toFixed(1) ?? '',
    ].join(';'))
    const blob = new Blob(['\uFEFF' + [h.join(';'), ...l].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return {
    loading, erro,
    resumo, exps,
    concluidos, ativos,
    ebMedia, custoPorKgMedio, pontoEquilibrio, diasCiclo,
    diasFases, topForm, consumoInsumos, colheitaMensal, projecao, alertas,
    filtrados, especiesLista, statusesLista,
    filtroEsp, setFiltroEsp, filtroSt, setFiltroSt,
    exportarCSV,
  }
}
