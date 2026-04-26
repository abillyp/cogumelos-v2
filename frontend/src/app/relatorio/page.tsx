// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Fin {
  custoTotalSubstrato?: number | null
  custoPorKgProduzido?: number | null
  totalColhidoKg?:      number | null
  receitaTotal?:        number | null
  margemReais?:         number | null
  margemPct?:           number | null
}
interface Exp {
  id: string; codigo: string; formulacaoId: string; formulacaoNome: string
  especieNome: string; usuarioNome: string; dataPreparo: string; status: string
  cnTotal: number | null; pesoBlocoKg: number | null; totalBlocos: number
  precoVendaKg: number | null; financeiro?: Fin | null
  dataInoculacao?: string | null; amadurecimentoInicio?: string | null
  amadurecimentoFim?: string | null; frutificacaoInicio?: string | null
  frutificacaoFim?: string | null
  insumos?: { insumoId: string; nome: string; pesoKg: number }[]
}

const fmt = (v: number | null | undefined, prefix = 'R$ ', dec = 2) =>
  v == null || v === 0 ? '—' : `${prefix}${v.toFixed(dec).replace('.', ',')}`
const pct = (v: number | null | undefined, dec = 1) =>
  v == null ? '—' : `${v.toFixed(dec).replace('.', ',')}%`
const fmtKg = (v: number | null | undefined) =>
  v == null || v === 0 ? '—' : `${v.toFixed(1)} kg`

function diasEntre(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

const STATUS_PT: Record<string, string> = {
  PREPARACAO: 'Preparo', INOCULADO: 'Inoculado',
  AMADURECIMENTO: 'Amadurec.', FRUTIFICACAO: 'Frutific.', CONCLUIDO: 'Concluído',
}
const BADGE: Record<string, { bg: string; color: string }> = {
  PREPARACAO:     { bg: '#FAEEDA', color: '#633806' },
  INOCULADO:      { bg: '#EEEDFE', color: '#3C3489' },
  AMADURECIMENTO: { bg: '#E1F5EE', color: '#085041' },
  FRUTIFICACAO:   { bg: '#E3F0FF', color: '#0C447C' },
  CONCLUIDO:      { bg: '#EAF3DE', color: '#27500A' },
}

function calcEB(e: Exp): number | null {
  if (e.status !== 'CONCLUIDO') return null
  const colhido = e.financeiro?.totalColhidoKg
  if (!colhido || colhido === 0) return null
  const pesoTotal = (e.insumos ?? []).reduce((s, i) => s + i.pesoKg, 0)
  if (!pesoTotal) return null
  const eb = (colhido / pesoTotal) * 100
  return Math.min(Math.max(eb, 0), 200)
}

function useChart(
  ref: React.RefObject<HTMLCanvasElement>,
  type: string, data: any, options: any, deps: any[]
) {
  useEffect(() => {
    if (!ref.current || !(window as any).Chart) return
    const C = (window as any).Chart
    const ex = C.getChart(ref.current)
    if (ex) ex.destroy()
    new C(ref.current, { type, data, options })
  }, deps) // eslint-disable-line
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 14, padding: 14, ...style }}>
      {children}
    </div>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 14, padding: 14 }}>
      <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: color ?? '#111' }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function Alert({ bg, color, dot, text }: { bg: string; color: string; dot: string; text: string }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      <span style={{ color }}>{text}</span>
    </div>
  )
}

export default function RelatorioPage() {
  return <ProtectedRoute><Relatorio /></ProtectedRoute>
}

function Relatorio() {
  const [loading, setLoading]     = useState(true)
  const [erro, setErro]           = useState('')
  const [abaDesk, setAbaDesk]     = useState<'experimentos' | 'formulacoes'>('experimentos')
  const [abaMob, setAbaMob]       = useState<'geral' | 'formulacoes' | 'insumos' | 'alertas'>('geral')
  const [filtroEsp, setFiltroEsp] = useState('Todas')
  const [filtroSt, setFiltroSt]   = useState('Todos')
  const [showFiltros, setShowFiltros] = useState(false)
  const [chartReady, setChartReady] = useState(false)
  const [resumo, setResumo]       = useState({ totalExperimentos: 0, concluidos: 0, emAndamento: 0, totalColhidoKg: null as number | null, receitaTotal: null as number | null, custoTotal: null as number | null, margemMediaPct: null as number | null })
  const [exps, setExps]           = useState<Exp[]>([])

  const cMensalM  = useRef<HTMLCanvasElement>(null)
  const cScatM    = useRef<HTMLCanvasElement>(null)
  const cInsM     = useRef<HTMLCanvasElement>(null)
  const cMensalD  = useRef<HTMLCanvasElement>(null)
  const cScatD    = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if ((window as any).Chart) { setChartReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    script.onload = () => setChartReady(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    api.relatorio.gerar()
      .then((v: unknown) => {
        const d = v as any
        setResumo({ totalExperimentos: d.totalExperimentos ?? 0, concluidos: d.concluidos ?? 0, emAndamento: d.emAndamento ?? 0, totalColhidoKg: d.totalColhidoKg ?? null, receitaTotal: d.receitaTotal ?? null, custoTotal: d.custoTotal ?? null, margemMediaPct: d.margemMediaPct ?? null })
        setExps((d.detalhes ?? []).map((e: any): Exp => ({
          id: e.id, codigo: e.codigo, formulacaoId: e.formulacaoId, formulacaoNome: e.formulacaoNome,
          especieNome: e.especieNome, usuarioNome: e.usuarioNome, dataPreparo: e.dataPreparo, status: e.status,
          cnTotal: e.cnTotal ?? null, pesoBlocoKg: e.pesoBlocoKg ?? null, totalBlocos: e.totalBlocos ?? 0,
          precoVendaKg: e.precoVendaKg ?? null, financeiro: e.financeiro ?? null,
          dataInoculacao: e.dataInoculacao ?? null, amadurecimentoInicio: e.amadurecimentoInicio ?? null,
          amadurecimentoFim: e.amadurecimentoFim ?? null, frutificacaoInicio: e.frutificacaoInicio ?? null,
          frutificacaoFim: e.frutificacaoFim ?? null, insumos: e.insumos ?? [],
        })))
      })
      .catch((e: any) => setErro(e?.message ?? 'Erro'))
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
    const v = concluidos.map(e => diasEntre(e.dataPreparo, e.frutificacaoFim)).filter((x): x is number => x !== null)
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
  }, [concluidos])

  const diasFases = useMemo(() => ([
    { label: 'Inoculação',   vals: concluidos.map(e => diasEntre(e.dataPreparo, e.dataInoculacao)).filter((x): x is number => x !== null && x > 0) },
    { label: 'Amadurec.',    vals: concluidos.map(e => diasEntre(e.dataInoculacao, e.amadurecimentoFim)).filter((x): x is number => x !== null && x > 0) },
    { label: 'Frutificação', vals: concluidos.map(e => diasEntre(e.amadurecimentoInicio, e.frutificacaoFim)).filter((x): x is number => x !== null && x > 0) },
  ].map(f => ({ label: f.label, dias: f.vals.length ? Math.round(f.vals.reduce((a, b) => a + b, 0) / f.vals.length) : null }))), [concluidos])

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
    const m: Record<string, number> = {}
    for (const e of concluidos) {
      const c = e.financeiro?.totalColhidoKg; if (!c || c === 0) continue
      // usa frutificacaoFim como mês de colheita; fallback para dataPreparo
      const mesRef = e.frutificacaoFim ?? e.dataPreparo
      const k = mesRef?.slice(0, 7) ?? ''; if (k) m[k] = (m[k] ?? 0) + c
    }
    const sorted = Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    return { labels: sorted.map(([k]) => MESES[parseInt(k.split('-')[1]) - 1]), data: sorted.map(([, v]) => +v.toFixed(1)) }
  }, [exps])

  const projecao = useMemo(() => {
    const recEsp = ativos.reduce((s, e) => s + (e.pesoBlocoKg ?? 1.2) * e.totalBlocos * ((ebMedia ?? 60) / 100) * (e.precoVendaKg ?? 0), 0)
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

  const filtrados = useMemo(() => exps.filter(e => (filtroEsp === 'Todas' || e.especieNome === filtroEsp) && (filtroSt === 'Todos' || e.status === filtroSt)), [exps, filtroEsp, filtroSt])
  const especies  = useMemo(() => ['Todas', ...Array.from(new Set(exps.map(e => e.especieNome)))], [exps])
  const statuses  = useMemo(() => ['Todos', ...Array.from(new Set(exps.map(e => e.status)))],     [exps])

  function exportarCSV() {
    const h = ['Código','Formulação','Espécie','Status','Custo','Colheita (kg)','Receita','Margem %','EB %']
    const l = filtrados.map(e => [e.codigo, e.formulacaoNome, e.especieNome, STATUS_PT[e.status] ?? e.status, e.financeiro?.custoTotalSubstrato?.toFixed(2) ?? '', e.financeiro?.totalColhidoKg?.toFixed(1) ?? '', e.financeiro?.receitaTotal?.toFixed(2) ?? '', e.financeiro?.margemPct?.toFixed(1) ?? '', calcEB(e)?.toFixed(1) ?? ''].join(';'))
    const blob = new Blob(['\uFEFF' + [h.join(';'), ...l].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href = url; a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const grd = 'rgba(0,0,0,0.05)'; const tx = '#888'
  const colData = { labels: colheitaMensal.labels.length ? colheitaMensal.labels : ['—'], datasets: [{ data: colheitaMensal.data.length ? colheitaMensal.data : [0], backgroundColor: colheitaMensal.data.map((_, i, a) => i === a.length - 1 ? '#534AB7' : '#AFA9EC'), borderRadius: 4, barPercentage: 0.65 }] }
  const colOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: tx, font: { size: 10 } } }, y: { grid: { color: grd }, ticks: { color: tx, font: { size: 10 }, callback: (v: number) => v + 'kg' } } } }
  const insData = { labels: consumoInsumos.map(i => i.nome.split(' ').slice(0, 2).join(' ')), datasets: [{ data: consumoInsumos.map(i => +i.kg.toFixed(1)), backgroundColor: ['#534AB7','#7F77DD','#AFA9EC','#CECBF6','#E8E6FC','#EEEDFE'], borderRadius: 3, barPercentage: 0.7 }] }
  const insOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, indexAxis: 'y' as const, scales: { x: { grid: { color: grd }, ticks: { color: tx, font: { size: 10 }, callback: (v: number) => v + 'kg' } }, y: { grid: { display: false }, ticks: { color: tx, font: { size: 10 } } } } }
  const scatData = { datasets: [{ data: concluidos.filter(e => e.cnTotal != null && calcEB(e) != null).map(e => ({ x: +e.cnTotal!.toFixed(1), y: +calcEB(e)!.toFixed(1) })), backgroundColor: '#534AB7', pointRadius: 5 }] }
  const scatOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: grd }, ticks: { color: tx, font: { size: 10 } }, title: { display: true, text: 'C/N', color: tx, font: { size: 10 } } }, y: { grid: { color: grd }, ticks: { color: tx, font: { size: 10 }, callback: (v: number) => v + '%' }, title: { display: true, text: 'EB %', color: tx, font: { size: 10 } }, min: 0, max: 100 } } }

  useChart(cMensalM, 'bar', colData, colOpts, [colheitaMensal, abaMob, chartReady])
  useChart(cScatM,   'scatter', scatData, scatOpts, [concluidos, abaMob, chartReady])
  useChart(cInsM,    'bar', insData, insOpts, [consumoInsumos, abaMob, chartReady])
  useChart(cMensalD, 'bar', colData, colOpts, [colheitaMensal, chartReady])
  useChart(cScatD,   'scatter', scatData, scatOpts, [concluidos, chartReady])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}><p style={{ fontSize: 14, color: '#bbb' }}>Carregando...</p></div>

  const kpis = [
    { label: 'Efic. biológica', value: pct(ebMedia), sub: 'média dos lotes', color: ebMedia && ebMedia > 50 ? 'var(--teal)' : 'var(--amber)' },
    { label: 'Custo/kg prod.',  value: fmt(custoPorKgMedio), sub: 'lotes concluídos' },
    { label: 'Ponto equilíbrio', value: fmtKg(pontoEquilibrio), sub: 'por lote ativo', color: 'var(--amber)' },
    { label: 'Dias/ciclo', value: diasCiclo ? `${diasCiclo}d` : '—', sub: 'preparo → fim' },
  ]

  return (
    <>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 2 }}>Relatório do produtor</h1>
            <p style={{ fontSize: 14, color: '#888' }}>Produtividade e rentabilidade</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ fontSize: 13, position: 'relative' }} onClick={() => setShowFiltros(true)}>
              Filtrar
              {(filtroEsp !== 'Todas' || filtroSt !== 'Todos') && <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: 'var(--purple)' }} />}
            </button>
            <button className="btn" style={{ fontSize: 13 }} onClick={exportarCSV}>↓ CSV</button>
          </div>
        </div>

        {erro && <div style={{ background: 'var(--red-l)', border: '1px solid #F7C1C1', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{erro}</div>}

        {/* ══ MOBILE ══════════════════════════════════════════════════════════ */}
        <div className="sm:hidden">
          {/* Abas scroll */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
            {(['geral','formulacoes','insumos','alertas'] as const).map(a => (
              <button key={a} onClick={() => setAbaMob(a)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: abaMob === a ? 'var(--purple)' : '#fff', borderColor: abaMob === a ? 'var(--purple)' : '#EBEBEB', color: abaMob === a ? '#fff' : '#555' }}>
                {a === 'geral' ? 'Geral' : a === 'formulacoes' ? 'Formulações' : a === 'insumos' ? 'Insumos' : 'Alertas'}
              </button>
            ))}
          </div>

          {/* Geral */}
          {abaMob === 'geral' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {kpis.map(k => <Kpi key={k.label} {...k} />)}
              </div>
              <Card>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Colheita por mês (kg)</p>
                <div style={{ position: 'relative', height: 120 }}>
                  <canvas ref={cMensalM} role="img" aria-label="Colheita mensal">Dados mensais.</canvas>
                </div>
              </Card>
              <Card>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Projeção — lotes ativos</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {[
                    { label: 'Receita est.', value: fmt(projecao.recEsp > 0 ? projecao.recEsp : null), color: 'var(--teal)' },
                    { label: 'Equilíbrio', value: fmtKg(pontoEquilibrio), color: 'var(--amber)' },
                    { label: 'Margem proj.', value: pct(projecao.margemProj), color: (projecao.margemProj ?? 0) > 0 ? 'var(--teal)' : 'var(--red)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#F7F6F3', borderRadius: 10, padding: 10 }}>
                      <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Formulações */}
          {abaMob === 'formulacoes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Top formulações — eficiência biológica</p>
              <Card>
                {topForm.length === 0 ? <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>Sem dados suficientes.</p>
                : topForm.map((f, i) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topForm.length - 1 ? '0.5px solid #F0F0F0' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#EEEDFE' : i === 1 ? '#E1F5EE' : '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: i === 0 ? '#3C3489' : i === 1 ? '#085041' : '#5F5E5A', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{f.nome}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{f.totalLotes} lote(s) · C/N {f.cn?.toFixed(1) ?? '—'}</p>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: (f.ebMedia ?? 0) > 60 ? 'var(--teal)' : 'var(--amber)' }}>{pct(f.ebMedia, 0)}</p>
                  </div>
                ))}
              </Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Dias médios por fase</p>
              <Card>
                {diasFases.map(({ label, dias }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#888', width: 80, textAlign: 'right' }}>{label}</span>
                    <div style={{ flex: 1, height: 7, background: '#F0F0F0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(((dias ?? 0) / 25) * 100, 100)}%`, background: 'var(--purple)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#888', width: 30, textAlign: 'right' }}>{dias ? `${dias}d` : '—'}</span>
                  </div>
                ))}
              </Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>C/N × eficiência biológica</p>
              <Card>
                <div style={{ position: 'relative', height: 120 }}>
                  <canvas ref={cScatM} role="img" aria-label="Correlação C/N e EB">Scatter plot.</canvas>
                </div>
                <p style={{ fontSize: 10, color: '#bbb', marginTop: 6 }}>EB = kg colhido ÷ kg substrato</p>
              </Card>
            </div>
          )}

          {/* Insumos */}
          {abaMob === 'insumos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Consumo de insumos no período (kg)</p>
              <Card>
                {consumoInsumos.length === 0 ? <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>Sem dados.</p>
                : <div style={{ position: 'relative', height: Math.max(consumoInsumos.length * 38 + 20, 120) }}>
                    <canvas ref={cInsM} role="img" aria-label="Consumo insumos">Dados de insumos.</canvas>
                  </div>}
                <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Total: {consumoInsumos.reduce((s, i) => s + i.kg, 0).toFixed(0)} kg</p>
              </Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Lotes no período</p>
              {filtrados.map(e => {
                const bs = BADGE[e.status] ?? { bg: '#F1EFE8', color: '#5F5E5A' }; const eb = calcEB(e)
                return (
                  <Card key={e.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div><p style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{e.codigo}</p><p style={{ fontSize: 12, color: '#888' }}>{e.formulacaoNome}</p></div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bs.bg, color: bs.color }}>{STATUS_PT[e.status] ?? e.status}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                      {[{ label: 'Custo', value: fmt(e.financeiro?.custoTotalSubstrato) }, { label: 'Receita', value: fmt(e.financeiro?.receitaTotal), color: 'var(--teal)' }, { label: 'EB', value: pct(eb, 0), color: (eb ?? 0) > 60 ? 'var(--teal)' : 'var(--amber)' }].map(({ label, value, color }) => (
                        <div key={label} style={{ background: '#F7F6F3', borderRadius: 8, padding: '7px 10px' }}>
                          <p style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>{label}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: color ?? '#111' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Alertas */}
          {abaMob === 'alertas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>Alertas e insights</p>
              {alertas.length === 0 ? <Card><p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '16px 0' }}>Nenhum alerta.</p></Card>
              : alertas.map((a, i) => <Alert key={i} {...a} />)}
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4 }}>Projeção financeira</p>
              <Card>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Receita esperada', value: fmt(projecao.recEsp > 0 ? projecao.recEsp : null), sub: `se EB ${pct(ebMedia, 0)}`, color: 'var(--teal)' },
                    { label: 'Custo ativos', value: fmt(projecao.custoAt > 0 ? projecao.custoAt : null), sub: 'substrato total' },
                    { label: 'Margem proj.', value: pct(projecao.margemProj), sub: `${ativos.length} lotes`, color: (projecao.margemProj ?? 0) > 0 ? 'var(--teal)' : 'var(--red)' },
                    { label: 'Ponto equil.', value: fmtKg(pontoEquilibrio), sub: 'kg mínimo/lote', color: 'var(--amber)' },
                  ].map(({ label, value, sub, color }) => (
                    <div key={label} style={{ background: '#F7F6F3', borderRadius: 10, padding: 12 }}>
                      <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: color ?? '#111' }}>{value}</p>
                      <p style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>{sub}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* ══ DESKTOP ══════════════════════════════════════════════════════════ */}
        <div className="hidden sm:block">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {kpis.map(k => <Kpi key={k.label} {...k} />)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Colheita acumulada por mês (kg)</p>
              <div style={{ position: 'relative', height: 160 }}>
                <canvas ref={cMensalD} role="img" aria-label="Colheita mensal">Dados mensais.</canvas>
              </div>
            </Card>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Top formulações — efic. biológica</p>
              {topForm.length === 0 ? <p style={{ fontSize: 12, color: '#bbb', padding: '16px 0', textAlign: 'center' }}>Sem dados suficientes.</p>
              : topForm.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < topForm.length - 1 ? '0.5px solid #F0F0F0' : 'none' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: i === 0 ? '#EEEDFE' : i === 1 ? '#E1F5EE' : '#F1EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: i === 0 ? '#3C3489' : i === 1 ? '#085041' : '#5F5E5A', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nome}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>{f.totalLotes} lote(s) · C/N {f.cn?.toFixed(1) ?? '—'}</p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: (f.ebMedia ?? 0) > 60 ? 'var(--teal)' : 'var(--amber)' }}>{pct(f.ebMedia, 0)}</p>
                </div>
              ))}
              <p style={{ fontSize: 10, color: '#bbb', marginTop: 10, paddingTop: 8, borderTop: '0.5px solid #F0F0F0' }}>EB = kg colhido ÷ kg substrato</p>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>C/N × efic. biológica</p>
              <div style={{ position: 'relative', height: 150 }}>
                <canvas ref={cScatD} role="img" aria-label="Correlação C/N e EB">Scatter.</canvas>
              </div>
            </Card>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Dias médios por fase</p>
              {diasFases.map(({ label, dias }) => {
                const mx = Math.max(...diasFases.map(f => f.dias ?? 0), 1)
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{dias ? `${dias}d` : '—'}</span>
                    </div>
                    <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${((dias ?? 0) / mx) * 100}%`, background: 'var(--purple)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </Card>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Consumo de insumos (kg)</p>
              {consumoInsumos.slice(0, 4).map((ins, i) => {
                const mx = consumoInsumos[0]?.kg ?? 1
                return (
                  <div key={ins.nome} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#888', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.nome}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#111' }}>{ins.kg.toFixed(0)} kg</span>
                    </div>
                    <div style={{ height: 6, background: '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(ins.kg / mx) * 100}%`, background: ['#534AB7','#7F77DD','#AFA9EC','#CECBF6'][i], borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Projeção financeira — lotes ativos</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: 'Receita esperada', value: fmt(projecao.recEsp > 0 ? projecao.recEsp : null), sub: `se EB ${pct(ebMedia, 0)}`, color: 'var(--teal)' },
                  { label: 'Equilíbrio', value: fmtKg(pontoEquilibrio), sub: 'kg mínimo/lote', color: 'var(--amber)' },
                  { label: 'Margem proj.', value: pct(projecao.margemProj), sub: `${ativos.length} lotes ativos`, color: (projecao.margemProj ?? 0) > 0 ? 'var(--teal)' : 'var(--red)' },
                ].map(({ label, value, sub, color }) => (
                  <div key={label} style={{ background: '#F7F6F3', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>{label}</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color }}>{value}</p>
                    <p style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{sub}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10 }}>Alertas e insights</p>
              {alertas.length === 0 ? <p style={{ fontSize: 12, color: '#bbb' }}>Nenhum alerta no momento.</p>
              : alertas.map((a, i) => <Alert key={i} {...a} />)}
            </Card>
          </div>

          {/* Tabela */}
          <div className="tabs-bar" style={{ width: 'fit-content', marginBottom: 14 }}>
            {(['experimentos','formulacoes'] as const).map(t => (
              <button key={t} className={`tab-btn ${abaDesk === t ? 'active' : ''}`} style={{ padding: '7px 20px' }} onClick={() => setAbaDesk(t)}>
                {t === 'experimentos' ? 'Por experimento' : 'Por formulação'}
              </button>
            ))}
          </div>

          {abaDesk === 'experimentos' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="tbl" style={{ minWidth: 800 }}>
                  <thead><tr>
                    <th style={{ paddingLeft: 18 }}>Código</th><th>Formulação</th><th>Status</th>
                    <th style={{ textAlign: 'right' }}>Custo</th><th style={{ textAlign: 'right' }}>Colheita</th>
                    <th style={{ textAlign: 'right' }}>Receita</th><th style={{ textAlign: 'right' }}>Margem</th>
                    <th style={{ textAlign: 'right', paddingRight: 18 }}>Efic. Bio.</th>
                  </tr></thead>
                  <tbody>
                    {filtrados.map(e => {
                      const bs = BADGE[e.status] ?? { bg: '#F1EFE8', color: '#5F5E5A' }; const eb = calcEB(e)
                      return (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 700, paddingLeft: 18 }}>{e.codigo}</td>
                          <td style={{ fontSize: 12, color: '#888' }}>{e.formulacaoNome}</td>
                          <td><span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: bs.bg, color: bs.color }}>{STATUS_PT[e.status] ?? e.status}</span></td>
                          <td style={{ textAlign: 'right' }}>{fmt(e.financeiro?.custoTotalSubstrato)}</td>
                          <td style={{ textAlign: 'right' }}>{fmtKg(e.financeiro?.totalColhidoKg)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--teal)', fontWeight: 600 }}>{fmt(e.financeiro?.receitaTotal)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: (e.financeiro?.margemPct ?? 0) > 0 ? 'var(--teal)' : (e.financeiro?.margemPct ?? 0) < 0 ? 'var(--red)' : '#bbb' }}>{e.financeiro?.margemPct != null && e.financeiro.margemPct !== 0 ? pct(e.financeiro.margemPct) : '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, paddingRight: 18, color: (eb ?? 0) > 60 ? 'var(--teal)' : eb != null ? 'var(--amber)' : '#bbb' }}>{pct(eb, 0)}</td>
                        </tr>
                      )
                    })}
                    {filtrados.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#bbb', padding: '32px 0' }}>Nenhum experimento encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {abaDesk === 'formulacoes' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-wrap">
                <table className="tbl" style={{ minWidth: 600 }}>
                  <thead><tr>
                    <th style={{ paddingLeft: 18 }}>Formulação</th><th>Espécie</th>
                    <th style={{ textAlign: 'right' }}>Lotes</th><th style={{ textAlign: 'right' }}>C/N</th>
                    <th style={{ textAlign: 'right' }}>Custo médio</th><th style={{ textAlign: 'right' }}>Margem média</th>
                    <th style={{ textAlign: 'right', paddingRight: 18 }}>EB média</th>
                  </tr></thead>
                  <tbody>
                    {topForm.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700, paddingLeft: 18 }}>{f.nome}</td>
                        <td style={{ fontSize: 12, color: '#888' }}>{f.especie}</td>
                        <td style={{ textAlign: 'right', color: '#888' }}>{f.totalLotes}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--teal)' }}>{f.cn?.toFixed(1) ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>{fmt(f.custoMedio)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: (f.margemMedia ?? 0) >= 0 ? 'var(--teal)' : 'var(--red)' }}>{pct(f.margemMedia)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, paddingRight: 18, color: (f.ebMedia ?? 0) > 60 ? 'var(--teal)' : 'var(--amber)' }}>{pct(f.ebMedia, 0)}</td>
                      </tr>
                    ))}
                    {topForm.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#bbb', padding: '32px 0' }}>Sem dados suficientes.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet filtros */}
      {showFiltros && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          className="sm:items-center sm:p-4" onClick={() => setShowFiltros(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 40px', width: '100%' }}
            className="sm:rounded-[20px] sm:max-w-[400px] sm:mx-auto" onClick={e => e.stopPropagation()}>
            <div className="sm:hidden" style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Filtros</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label className="label">Espécie</label><select className="input" value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>{especies.map(s => <option key={s}>{s}</option>)}</select></div>
              <div><label className="label">Status</label><select className="input" value={filtroSt} onChange={e => setFiltroSt(e.target.value)}>{statuses.map(s => <option key={s} value={s}>{STATUS_PT[s] ?? s}</option>)}</select></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => { setFiltroEsp('Todas'); setFiltroSt('Todos') }}>Limpar</button>
                <button className="btn-primary" style={{ flex: 2 }} onClick={() => setShowFiltros(false)}>Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
