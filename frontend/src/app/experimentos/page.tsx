// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useEffect, useState, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import { api } from '@/lib/api'
import { Experimento, Formulacao, Monitoramento, Colheita } from '@/lib/types'
import { MiniChart, StatCard } from '@/components/Components'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  PREPARACAO: 'Preparo', INOCULADO: 'Inoculado', AMADURECIMENTO: 'Amadurec.',
  FRUTIFICACAO: 'Frutificação', DESCANSO: 'Descanso', CONCLUIDO: 'Concluído',
}
const STATUS_EMOJI: Record<string, string> = {
  PREPARACAO: '🌾', INOCULADO: '🧪', AMADURECIMENTO: '🍄',
  FRUTIFICACAO: '🌱', DESCANSO: '💤', CONCLUIDO: '✅',
}
const STATUS_STYLE: Record<string, { bg: string; badge: string; badgeText: string }> = {
  PREPARACAO:     { bg: 'linear-gradient(135deg,#F1EFE8,#E5E3D8)', badge: '#888',    badgeText: '#fff' },
  INOCULADO:      { bg: 'linear-gradient(135deg,#EEEDFE,#D5D2FB)', badge: '#534AB7', badgeText: '#fff' },
  AMADURECIMENTO: { bg: 'linear-gradient(135deg,#E3FFF0,#C7F7DF)', badge: '#00A550', badgeText: '#fff' },
  FRUTIFICACAO:   { bg: 'linear-gradient(135deg,#E3F0FF,#C7E0FF)', badge: '#1F6FEB', badgeText: '#fff' },
  DESCANSO:       { bg: 'linear-gradient(135deg,#FAEEDA,#FAC775)', badge: '#BA7517', badgeText: '#fff' },
  CONCLUIDO:      { bg: 'linear-gradient(135deg,#EAF3DE,#D5EBBE)', badge: '#27500A', badgeText: '#fff' },
}

function statusOrderIndex(s: string) {
  return ['PREPARACAO', 'INOCULADO', 'AMADURECIMENTO', 'FRUTIFICACAO', 'DESCANSO', 'CONCLUIDO'].indexOf(s)
}
function proximaFaseSimples(status: string): string {
  return ({ PREPARACAO: 'INOCULADO', INOCULADO: 'AMADURECIMENTO', AMADURECIMENTO: 'FRUTIFICACAO' } as any)[status] ?? 'FRUTIFICACAO'
}

// ─── DateInput ────────────────────────────────────────────────────────────────
function DateInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input type="text" readOnly className={className}
        value={validSelected ? format(validSelected, 'dd/MM/yyyy') : ''}
        placeholder="DD/MM/AAAA" style={{ cursor: 'pointer' }}
        onMouseDown={(e) => { e.stopPropagation(); setOpen(o => !o) }} />
      {open && (
        <div style={{ position: 'fixed', zIndex: 99999, background: '#fff', border: '1px solid #EBEBEB', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)', padding: '8px' }}
          ref={(el) => {
            if (el && ref.current) {
              const input = ref.current.querySelector('input')
              if (input) {
                const rect = input.getBoundingClientRect()
                const spaceBelow = window.innerHeight - rect.bottom
                const elHeight = el.offsetHeight || 320
                el.style.top = spaceBelow < elHeight ? `${rect.top - elHeight - 4}px` : `${rect.bottom + 4}px`
                el.style.left = `${rect.left}px`
              }
            }
          }}
          onMouseDown={e => e.stopPropagation()}>
          <DayPicker mode="single" selected={validSelected}
            onSelect={(day) => { if (day) { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) } }}
            locale={ptBR}
            styles={{ caption: { color: '#111' }, day_selected: { background: '#534AB7', color: '#fff' }, day_today: { color: '#534AB7', fontWeight: 700 } }} />
        </div>
      )}
    </div>
  )
}

// ─── Barra dinâmica ───────────────────────────────────────────────────────────
function BarraDinamica({ exp }: { exp: Experimento }) {
  const { status, cicloAtual } = exp
  const corMap: Record<string, { bg: string; text: string }> = {
    PREPARACAO:     { bg: '#3C3489', text: '#EEEDFE' },
    INOCULADO:      { bg: '#534AB7', text: '#EEEDFE' },
    AMADURECIMENTO: { bg: '#AFA9EC', text: '#26215C' },
    FRUTIFICACAO:   { bg: '#1D9E75', text: '#E1F5EE' },
    DESCANSO:       { bg: '#EF9F27', text: '#412402' },
    CONCLUIDO:      { bg: '#3B6D11', text: '#EAF3DE' },
    PENDENTE:       { bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)' },
  }
  const fases: { label: string; key: string; ativo: boolean }[] = [
    { label: 'Preparo', key: 'PREPARACAO', ativo: true },
    { label: 'Inoc.',   key: 'INOCULADO',  ativo: statusOrderIndex(status) >= statusOrderIndex('INOCULADO') },
    { label: 'Amad.',   key: 'AMADURECIMENTO', ativo: statusOrderIndex(status) >= statusOrderIndex('AMADURECIMENTO') },
  ]
  for (let i = 1; i <= cicloAtual; i++) {
    fases.push({ label: `Frutic. ${i}`, key: 'FRUTIFICACAO', ativo: true })
    if (i < cicloAtual || status === 'DESCANSO') fases.push({ label: `Desc. ${i}`, key: 'DESCANSO', ativo: true })
  }
  if (status === 'CONCLUIDO') fases.push({ label: 'Fim', key: 'CONCLUIDO', ativo: true })
  else fases.push({ label: 'Próxima →', key: 'PENDENTE', ativo: false })
  return (
    <div style={{ display: 'flex', overflow: 'hidden', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', marginBottom: 14 }}>
      {fases.map((f, i) => {
        const cor = corMap[f.key]
        return (
          <div key={i} style={{ flex: 1, padding: '7px 4px', textAlign: 'center', background: f.ativo ? cor.bg : 'var(--color-background-secondary)', borderLeft: i > 0 ? '0.5px solid rgba(0,0,0,0.08)' : 'none' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: f.ativo ? cor.text : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{f.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal avançar fase ───────────────────────────────────────────────────────
function ModalAvancarFase({ exp, onConfirmar, onFechar }: { exp: Experimento; onConfirmar: (p?: string) => void; onFechar: () => void }) {
  const emFrut = exp.status === 'FRUTIFICACAO'
  const emDesc = exp.status === 'DESCANSO'
  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 4 }}>Avançar fase</p>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
          Fase atual: <strong style={{ color: '#111' }}>{STATUS_LABEL[exp.status]}{(emFrut || emDesc) ? ` — ciclo ${exp.cicloAtual}` : ''}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {emFrut && <>
            <div onClick={() => onConfirmar('DESCANSO')} style={{ border: '0.5px solid #5DCAA5', borderRadius: 12, padding: 14, background: '#E1F5EE', cursor: 'pointer' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#085041', margin: '0 0 4px' }}>Descanso</p>
              <p style={{ fontSize: 12, color: '#0F6E56', margin: 0 }}>Pausa o ciclo e retorna para frutificação depois</p>
            </div>
            <div onClick={() => onConfirmar('CONCLUIDO')} style={{ border: '0.5px solid #F09595', borderRadius: 12, padding: 14, background: '#FCEBEB', cursor: 'pointer' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#791F1F', margin: '0 0 4px' }}>Encerrar experimento</p>
              <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>Finaliza o experimento neste ciclo</p>
            </div>
          </>}
          {emDesc && (
            <div onClick={() => onConfirmar('FRUTIFICACAO')} style={{ border: '0.5px solid #5DCAA5', borderRadius: 12, padding: 14, background: '#E1F5EE', cursor: 'pointer' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#085041', margin: '0 0 4px' }}>Frutificação — ciclo {exp.cicloAtual + 1}</p>
              <p style={{ fontSize: 12, color: '#0F6E56', margin: 0 }}>Inicia um novo ciclo de frutificação</p>
            </div>
          )}
          {!emFrut && !emDesc && (
            <div onClick={() => onConfirmar()} style={{ border: '0.5px solid #AFA9EC', borderRadius: 12, padding: 14, background: '#EEEDFE', cursor: 'pointer' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3C3489', margin: '0 0 4px' }}>Avançar para {STATUS_LABEL[proximaFaseSimples(exp.status)]}</p>
              <p style={{ fontSize: 12, color: '#534AB7', margin: 0 }}>Confirma o avanço para a próxima fase</p>
            </div>
          )}
        </div>
        <button onClick={onFechar} style={{ marginTop: 14, width: '100%', background: 'none', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '10px', fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── ExpCard ──────────────────────────────────────────────────────────────────
function ExpCard({ e, onAbrir }: { e: Experimento; onAbrir: (e: Experimento) => void }) {
  const st = STATUS_STYLE[e.status] ?? STATUS_STYLE.PREPARACAO
  const perdidos = e.blocosPerdidos ?? 0
  const ativos = e.totalBlocos - perdidos
  return (
    <div onClick={() => onAbrir(e)} style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ height: 80, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: 32 }}>{STATUS_EMOJI[e.status]}</span>
        <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: st.badge, color: st.badgeText }}>
          {STATUS_LABEL[e.status]}{e.status === 'FRUTIFICACAO' ? ` ${e.cicloAtual}` : ''}
        </span>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>{e.codigo}</p>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{e.especieNome} · {e.formulacaoNome}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: '#0F6E56', fontWeight: 700 }}>{ativos} blocos ativos</span>
          {perdidos > 0 && <span style={{ fontSize: 11, color: '#A32D2D' }}>−{perdidos} perdidos</span>}
        </div>
        {e.financeiro?.receitaTotal != null && e.financeiro.receitaTotal > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>R$ {e.financeiro.receitaTotal.toFixed(0)}</span>
        )}
      </div>
    </div>
  )
}

// ─── DetalheContent (fora do pai para evitar perda de foco) ──────────────────
interface DetalheProps {
  selected: Experimento
  monitoramentos: Monitoramento[]
  colheitas: Colheita[]
  abaDetalhe: 'monitor' | 'colheitas' | 'custos'
  setAbaDetalhe: (a: 'monitor' | 'colheitas' | 'custos') => void
  verTodosMonitor: boolean
  setVerTodosMonitor: (v: boolean) => void
  isAdmin: boolean
  onAvancar: () => void
  onSalvarMon: (data: any) => Promise<void>
  onSalvarColheita: (data: any) => Promise<void>
  onSalvarCustos: (data: any) => Promise<void>
}

function DetalheContent({
  selected, monitoramentos, colheitas,
  abaDetalhe, setAbaDetalhe,
  verTodosMonitor, setVerTodosMonitor,
  isAdmin, onAvancar, onSalvarMon, onSalvarColheita, onSalvarCustos,
}: DetalheProps) {
  const emFrut = selected.status === 'FRUTIFICACAO'
  const emDesc = selected.status === 'DESCANSO'
  const perdidos = selected.blocosPerdidos ?? 0
  const ativos = selected.totalBlocos - perdidos

  // estados locais dos formulários — não causam re-render do pai
  const [sala, setSala]               = useState('FRUTIFICACAO')
  const [dataM, setDataM]             = useState(new Date().toISOString().slice(0, 10))
  const [temp, setTemp]               = useState('')
  const [umid, setUmid]               = useState('')
  const [obs, setObs]                 = useState('')
  const [blocosPerdidosInput, setBlocosPerdidosInput] = useState('')
  const [erroMon, setErroMon]         = useState('')
  const [dataC, setDataC]             = useState(new Date().toISOString().slice(0, 10))
  const [pesoTotal, setPesoTotal]     = useState('')
  const [notasC, setNotasC]           = useState('')
  const [erroCol, setErroCol]         = useState('')
  const [precoVendaKg, setPrecoVendaKg] = useState(selected.precoVendaKg?.toString() ?? '')
  const [custos, setCustos]           = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    selected.custos?.forEach((c: any) => { m[c.insumoId] = c.custoPorKg?.toString() ?? '' })
    return m
  })
  const [salvandoCustos, setSalvandoCustos] = useState(false)
  const [erroCustos, setErroCustos]   = useState('')

  const tempsChart   = monitoramentos.slice(0, 7).reverse().map(m => m.temperatura ?? 0)
  const umidsChart   = monitoramentos.slice(0, 7).reverse().map(m => m.umidade ?? 0)
  const monitorsVis  = verTodosMonitor ? monitoramentos : monitoramentos.slice(0, 5)
  const totalColhExp = colheitas.reduce((s, c) => s + c.pesoTotalKg, 0)
  const blocosRestantes = ativos - (parseInt(blocosPerdidosInput) || 0)

  async function salvarMon() {
    setErroMon('')
    try {
      await onSalvarMon({
        sala, data: dataM,
        temperatura:    temp ? parseFloat(temp) : null,
        umidade:        umid ? parseFloat(umid) : null,
        observacao:     obs || null,
        blocosPerdidos: blocosPerdidosInput ? parseInt(blocosPerdidosInput) : null,
      })
      setObs(''); setTemp(''); setUmid(''); setBlocosPerdidosInput('')
    } catch (e: any) { setErroMon(e.message) }
  }

  async function salvarColheita() {
    if (!pesoTotal) return; setErroCol('')
    try {
      await onSalvarColheita({ data: dataC, pesoTotalKg: parseFloat(pesoTotal), notas: notasC || null })
      setPesoTotal(''); setNotasC('')
    } catch (e: any) { setErroCol(e.message) }
  }

  async function salvarCustos() {
    setSalvandoCustos(true); setErroCustos('')
    try {
      await onSalvarCustos({
        precoVendaKg: precoVendaKg ? parseFloat(precoVendaKg) : null,
        custos: Object.entries(custos).filter(([, v]) => v !== '').map(([insumoId, v]) => ({ insumoId, custoPorKg: parseFloat(v) })),
      })
    } catch (e: any) { setErroCustos(e.message) }
    finally { setSalvandoCustos(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{selected.codigo}</h2>
            <p style={{ fontSize: 13, color: '#888' }}>
              {selected.especieNome} · {selected.formulacaoNome}
              {isAdmin && ` · por ${selected.usuarioNome}`}
            </p>
          </div>
          {selected.status !== 'CONCLUIDO' && (
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={onAvancar}>Avançar →</button>
          )}
        </div>
        <BarraDinamica exp={selected} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 10 }}>
          <div>
            <p style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em' }}>Preparo</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{selected.dataPreparo}</p>
          </div>
          <div>
            <p style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em' }}>Fase</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>
              {STATUS_LABEL[selected.status]}{(emFrut || emDesc) ? ` ${selected.cicloAtual}` : ''}
            </p>
          </div>
          <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '8px 10px', border: '0.5px solid #5DCAA5' }}>
            <p style={{ fontSize: 10, color: '#0F6E56', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 2px' }}>Blocos ativos</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#085041', margin: 0 }}>
              {ativos}<span style={{ fontSize: 11, fontWeight: 400, color: '#0F6E56' }}> de {selected.totalBlocos}</span>
            </p>
          </div>
          <div style={{ background: perdidos > 0 ? '#FCEBEB' : 'var(--color-background-secondary)', borderRadius: 8, padding: '8px 10px', border: perdidos > 0 ? '0.5px solid #F09595' : 'none' }}>
            <p style={{ fontSize: 10, color: perdidos > 0 ? '#A32D2D' : '#bbb', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 2px' }}>Perdidos</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: perdidos > 0 ? '#791F1F' : '#bbb', margin: 0 }}>{perdidos}</p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="tabs-bar">
        {(['monitor', 'colheitas', 'custos'] as const).map(a => (
          <button key={a}
            className={`tab-btn ${abaDetalhe === a ? 'active' : ''}`}
            onClick={() => { if (a === 'colheitas' && !emFrut) return; setAbaDetalhe(a) }}
            style={{ opacity: a === 'colheitas' && !emFrut ? 0.4 : 1, cursor: a === 'colheitas' && !emFrut ? 'not-allowed' : 'pointer' }}
            title={a === 'colheitas' && !emFrut ? 'Disponível apenas na fase de frutificação' : ''}>
            {a === 'monitor' ? 'Monitoramento' : a === 'colheitas' ? `Colheitas ${!emFrut ? '🔒' : ''}` : 'Custos'}
          </button>
        ))}
      </div>

      {abaDetalhe === 'colheitas' && !emFrut && (
        <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 13, color: '#633806', margin: 0 }}>Colheitas estão disponíveis apenas durante a fase de frutificação.</p>
        </div>
      )}

      {/* Aba Monitoramento */}
      {abaDetalhe === 'monitor' && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Registrar monitoramento</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label className="label">Data</label><DateInput className="input text-sm" value={dataM} onChange={setDataM} /></div>
            <div><label className="label">Sala</label>
              <select className="input text-sm" value={sala} onChange={e => setSala(e.target.value)}>
                <option value="AMADURECIMENTO">Amadurecimento</option>
                <option value="FRUTIFICACAO">Frutificação</option>
                <option value="DESCANSO">Descanso</option>
              </select>
            </div>
            <div><label className="label">Temp (°C)</label>
              <input type="number" step={0.1} className="input text-sm" value={temp} onChange={e => setTemp(e.target.value)} placeholder="22" />
            </div>
            <div><label className="label">Umidade (%)</label>
              <input type="number" className="input text-sm" value={umid} onChange={e => setUmid(e.target.value)} placeholder="85" />
            </div>
          </div>
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#A32D2D', display: 'block', marginBottom: 6, fontWeight: 500 }}>Perda de blocos neste monitoramento</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="number" min={0} max={ativos} placeholder="0"
                className="input text-sm" style={{ width: 80 }}
                value={blocosPerdidosInput} onChange={e => setBlocosPerdidosInput(e.target.value)} />
              <span style={{ fontSize: 12, color: '#A32D2D' }}>
                blocos perdidos → restam <strong style={{ color: '#791F1F' }}>{blocosRestantes}</strong> de {selected.totalBlocos}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input text-sm" style={{ flex: 1 }} value={obs} onChange={e => setObs(e.target.value)} placeholder="Observação (opcional)..." />
            <button className="btn-primary" onClick={salvarMon}>Salvar</button>
          </div>
          {erroMon && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{erroMon}</p>}
          {monitoramentos.length > 0 && (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <MiniChart data={tempsChart} color="var(--purple)" label={`Temp °C — ${monitoramentos[0]?.temperatura ?? '—'}°C`} />
                <MiniChart data={umidsChart} color="var(--teal-m)" label={`Umidade % — ${monitoramentos[0]?.umidade ?? '—'}%`} />
              </div>
              <div className="table-wrap">
                <table className="tbl" style={{ minWidth: 380 }}>
                  <thead><tr><th>Data</th><th>Sala</th><th>Temp</th><th>Umidade</th><th>Perdas</th><th>Obs</th></tr></thead>
                  <tbody>
                    {monitorsVis.map(m => (
                      <tr key={m.id}>
                        <td>{m.data}</td>
                        <td style={{ color: '#888' }}>{m.sala === 'AMADURECIMENTO' ? 'Amad.' : m.sala === 'DESCANSO' ? 'Desc.' : 'Frut.'}</td>
                        <td>{m.temperatura ?? '—'}°C</td>
                        <td>{m.umidade ?? '—'}%</td>
                        <td style={{ color: (m.blocosPerdidos ?? 0) > 0 ? '#A32D2D' : '#bbb', fontWeight: (m.blocosPerdidos ?? 0) > 0 ? 700 : 400 }}>
                          {(m.blocosPerdidos ?? 0) > 0 ? `−${m.blocosPerdidos}` : '—'}
                        </td>
                        <td style={{ color: '#888' }}>{m.observacao ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {monitoramentos.length > 5 && (
                <button onClick={() => setVerTodosMonitor(!verTodosMonitor)}
                  style={{ fontSize: 12, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                  {verTodosMonitor ? 'Ver menos' : `Ver todos (${monitoramentos.length})`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Aba Colheitas */}
      {abaDetalhe === 'colheitas' && emFrut && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Registrar colheita — ciclo {selected.cicloAtual}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label className="label">Data</label><DateInput className="input text-sm" value={dataC} onChange={setDataC} /></div>
            <div><label className="label">Peso total (kg)</label>
              <input type="number" step={0.1} className="input text-sm" value={pesoTotal} onChange={e => setPesoTotal(e.target.value)} placeholder="28.4" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input text-sm" style={{ flex: 1 }} value={notasC} onChange={e => setNotasC(e.target.value)} placeholder="Notas (opcional)..." />
            <button className="btn-primary" onClick={salvarColheita}>Salvar</button>
          </div>
          {erroCol && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{erroCol}</p>}
          {colheitas.length > 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Total colhido', value: `${totalColhExp.toFixed(1)} kg`, color: 'var(--teal)' },
                  { label: 'Colheitas',     value: String(colheitas.length) },
                  { label: 'Média',         value: `${(totalColhExp / colheitas.length).toFixed(1)} kg` },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#F7F6F3', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: color ?? '#111' }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="table-wrap">
                <table className="tbl" style={{ minWidth: 280 }}>
                  <thead><tr><th>Data</th><th>Total</th><th>Média/bloco</th><th>Notas</th></tr></thead>
                  <tbody>
                    {colheitas.map(c => (
                      <tr key={c.id}>
                        <td>{c.data}</td>
                        <td style={{ fontWeight: 700 }}>{c.pesoTotalKg} kg</td>
                        <td style={{ color: 'var(--teal)' }}>{c.mediaPorBlocoKg?.toFixed(3)} kg</td>
                        <td style={{ color: '#888' }}>{c.notas ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Aba Custos */}
      {abaDetalhe === 'custos' && (
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Custos e venda</h3>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Preço de venda (R$/kg)</label>
            <input type="number" step={0.01} className="input text-sm" value={precoVendaKg}
              onChange={e => setPrecoVendaKg(e.target.value)} placeholder="35.00" />
          </div>
          {(selected.insumos ?? []).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {(selected.insumos ?? []).map((i: any) => (
                <div key={i.insumoId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#333' }}>{i.nome} <span style={{ color: '#bbb' }}>— {i.pesoKg} kg</span></span>
                  <input type="number" step={0.01} placeholder="R$/kg" className="input text-xs" style={{ width: 90 }}
                    value={custos[i.insumoId] ?? ''} onChange={e => setCustos(prev => ({ ...prev, [i.insumoId]: e.target.value }))} />
                </div>
              ))}
            </div>
          )}
          {selected.financeiro && (
            <div style={{ background: '#F7F6F3', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Resumo financeiro</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Custo substrato', value: `R$ ${selected.financeiro.custoTotalSubstrato?.toFixed(2) ?? '—'}` },
                  { label: 'Custo/bloco',     value: `R$ ${selected.financeiro.custoPorBloco?.toFixed(2) ?? '—'}` },
                  { label: 'Receita total',   value: `R$ ${selected.financeiro.receitaTotal?.toFixed(2) ?? '—'}`, color: 'var(--teal)' },
                  { label: 'Margem',          value: `${selected.financeiro.margemPct?.toFixed(1) ?? '—'}%`, color: (selected.financeiro.margemPct ?? 0) >= 0 ? 'var(--teal)' : 'var(--red)' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, color: '#bbb' }}>{label}</p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: color ?? '#111' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {erroCustos && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{erroCustos}</p>}
          <button className="btn-primary" onClick={salvarCustos} disabled={salvandoCustos} style={{ width: '100%' }}>
            {salvandoCustos ? 'Salvando...' : 'Salvar custos'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── NovoExpForm (fora do pai) ────────────────────────────────────────────────
interface NovoExpFormProps {
  formulacoes: Formulacao[]
  formulacaoId: string; setFormulacaoId: (v: string) => void
  codigo: string; setCodigo: (v: string) => void
  dataPreparo: string; setDataPreparo: (v: string) => void
  totalBlocos: number; setTotalBlocos: (v: number) => void
  pesoBlocoKg: number; setPesoBlocoKg: (v: number) => void
  criando: boolean; erroCreate: string
  onCriar: () => void
  onCancelar: () => void
}

function NovoExpForm({ formulacoes, formulacaoId, setFormulacaoId, codigo, setCodigo, dataPreparo, setDataPreparo, totalBlocos, setTotalBlocos, pesoBlocoKg, setPesoBlocoKg, criando, erroCreate, onCriar, onCancelar }: NovoExpFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {formulacoes.length === 0 ? (
        <div style={{ background: 'var(--purple-l)', borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-d)', marginBottom: 6 }}>Crie uma formulação primeiro</p>
          <a href="/calculadora" className="btn-primary" style={{ fontSize: 12, textDecoration: 'none' }}>Ir para a Calculadora →</a>
        </div>
      ) : (
        <>
          <div><label className="label">Formulação</label>
            <select className="input" value={formulacaoId} onChange={e => setFormulacaoId(e.target.value)}>
              {formulacoes.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.especieNome}</option>)}
            </select>
          </div>
          <div><label className="label">Código</label>
            <input className="input" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="EXP-2026-001" />
          </div>
          <div><label className="label">Data de preparo</label><DateInput className="input" value={dataPreparo} onChange={setDataPreparo} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label className="label">Blocos</label>
              <input type="number" className="input" value={totalBlocos} onChange={e => setTotalBlocos(parseInt(e.target.value))} />
            </div>
            <div><label className="label">Kg/bloco</label>
              <input type="number" step={0.1} className="input" value={pesoBlocoKg} onChange={e => setPesoBlocoKg(parseFloat(e.target.value))} />
            </div>
          </div>
          {erroCreate && <p style={{ fontSize: 12, color: 'var(--red)' }}>{erroCreate}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn" style={{ flex: 1 }} onClick={onCancelar}>Cancelar</button>
            <button className="btn-primary" style={{ flex: 2 }} onClick={onCriar} disabled={criando}>{criando ? 'Criando...' : 'Criar experimento'}</button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function ExperimentosPage() { return <ProtectedRoute><Experimentos /></ProtectedRoute> }

function Experimentos() {
  const { isAdmin } = useAuth()
  const [experimentos, setExperimentos] = useState<Experimento[]>([])
  const [formulacoes, setFormulacoes]   = useState<Formulacao[]>([])
  const [selected, setSelected]         = useState<Experimento | null>(null)
  const [monitoramentos, setMonitoramentos] = useState<Monitoramento[]>([])
  const [colheitas, setColheitas]           = useState<Colheita[]>([])
  const [modalAberto, setModalAberto]       = useState(false)
  const [modalAvancar, setModalAvancar]     = useState(false)
  const [abaDetalhe, setAbaDetalhe]         = useState<'monitor' | 'colheitas' | 'custos'>('monitor')
  const [showNovoExp, setShowNovoExp]       = useState(false)
  const [verTodosMonitor, setVerTodosMonitor] = useState(false)
  const [formulacaoId, setFormulacaoId] = useState('')
  const [codigo, setCodigo]             = useState('')
  const [dataPreparo, setDataPreparo]   = useState('')
  const [totalBlocos, setTotalBlocos]   = useState(40)
  const [pesoBlocoKg, setPesoBlocoKg]   = useState(1.2)
  const [criando, setCriando]           = useState(false)
  const [erroCreate, setErroCreate]     = useState('')

  async function carregarBase() {
    try {
      const [expsRes, formsRes, sugRes] = await Promise.allSettled([
        api.experimentos.listar() as Promise<any>,
        api.formulacoes.listar()  as Promise<any>,
        api.experimentos.codigoSugestao() as Promise<any>,
      ])
      if (expsRes.status  === 'fulfilled') setExperimentos(expsRes.value)
      if (formsRes.status === 'fulfilled') { setFormulacoes(formsRes.value); if (formsRes.value[0]) setFormulacaoId(formsRes.value[0].id) }
      if (sugRes.status   === 'fulfilled') setCodigo(sugRes.value.codigo)
    } catch (e) { console.error(e) }
  }

  useEffect(() => { carregarBase() }, [])

  async function abrirDetalhe(e: Experimento) {
    setSelected(e); setAbaDetalhe('monitor'); setVerTodosMonitor(false)
    const [m, c] = await Promise.all([
      api.experimentos.monitoramentos.listar(e.id) as any,
      api.experimentos.colheitas.listar(e.id)      as any,
    ])
    setMonitoramentos(m); setColheitas(c); setModalAberto(true)
  }

  function fecharModal() { setModalAberto(false); setSelected(null) }

  async function criar() {
    if (!formulacaoId || !codigo || !dataPreparo) { setErroCreate('Preencha todos os campos.'); return }
    setCriando(true); setErroCreate('')
    try {
      await api.experimentos.criar({ formulacaoId, codigo, dataPreparo, totalBlocos, pesoBlocoKg })
      const d: any = await api.experimentos.listar(); setExperimentos(d)
      setDataPreparo(''); setShowNovoExp(false)
      const s: any = await api.experimentos.codigoSugestao(); setCodigo(s.codigo)
    } catch (e: any) { setErroCreate(e.message) }
    finally { setCriando(false) }
  }

  async function avancar(proximoStatus?: string) {
    if (!selected) return
    setModalAvancar(false)
    await api.experimentos.avancar(selected.id, proximoStatus ? { proximoStatus } : undefined)
    const d: any = await api.experimentos.listar(); setExperimentos(d)
    const upd = d.find((e: Experimento) => e.id === selected.id)
    if (upd) await abrirDetalhe(upd)
  }

  async function salvarMon(data: any) {
    if (!selected) return
    await api.experimentos.monitoramentos.criar(selected.id, data)
    const [m, exps]: any = await Promise.all([
      api.experimentos.monitoramentos.listar(selected.id),
      api.experimentos.listar(),
    ])
    setMonitoramentos(m); setExperimentos(exps)
    const upd = exps.find((e: Experimento) => e.id === selected.id)
    if (upd) setSelected(upd)
  }

  async function salvarColheita(data: any) {
    if (!selected) return
    await api.experimentos.colheitas.criar(selected.id, data)
    const c: any = await api.experimentos.colheitas.listar(selected.id)
    setColheitas(c)
  }

  async function salvarCustos(data: any) {
    if (!selected) return
    await api.experimentos.salvarCustos(selected.id, data)
    await carregarBase()
    const d: any = await api.experimentos.listar()
    const upd = d.find((e: Experimento) => e.id === selected.id)
    if (upd) await abrirDetalhe(upd)
  }

  const ativos       = experimentos.filter(e => e.status !== 'CONCLUIDO').length
  const totalColhido = experimentos.reduce((s, e) => s + (e.financeiro?.totalColhidoKg ?? 0), 0)
  const receitaTotal = experimentos.reduce((s, e) => s + (e.financeiro?.receitaTotal ?? 0), 0)
  const margens      = experimentos.filter(e => e.financeiro?.margemPct != null)
  const margemMedia  = margens.length ? margens.reduce((s, e) => s + (e.financeiro!.margemPct!), 0) / margens.length : null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 2 }}>Seus experimentos</h1>
          <p style={{ fontSize: 14, color: '#888' }}>{experimentos.length} lotes · {ativos} em andamento</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNovoExp(true)}>+ Novo lote</button>
      </div>

      {experimentos.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '60px 0', color: '#bbb', fontSize: 14 }}>Nenhum experimento ainda. Crie o primeiro lote!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {experimentos.map(e => <ExpCard key={e.id} e={e} onAbrir={abrirDetalhe} />)}
        </div>
      )}

      {experimentos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          <StatCard value={String(experimentos.length)} label="Experimentos" />
          <StatCard value={`${totalColhido.toFixed(1)} kg`} label="Colhidos" color="var(--teal)" />
          <StatCard value={receitaTotal > 0 ? `R$ ${(receitaTotal / 1000).toFixed(1)}k` : '—'} label="Receita" color="var(--teal)" />
          <StatCard value={margemMedia != null ? `${margemMedia.toFixed(0)}%` : '—'} label="Margem média" />
        </div>
      )}

      {/* Modal novo experimento */}
      {showNovoExp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNovoExp(false) }}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 16px 32px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            className="sm:rounded-[20px] sm:max-w-[440px] sm:mx-auto" onClick={e => e.stopPropagation()}>
            <div className="sm:hidden" style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Novo experimento</h2>
            <NovoExpForm
              formulacoes={formulacoes}
              formulacaoId={formulacaoId} setFormulacaoId={setFormulacaoId}
              codigo={codigo} setCodigo={setCodigo}
              dataPreparo={dataPreparo} setDataPreparo={setDataPreparo}
              totalBlocos={totalBlocos} setTotalBlocos={setTotalBlocos}
              pesoBlocoKg={pesoBlocoKg} setPesoBlocoKg={setPesoBlocoKg}
              criando={criando} erroCreate={erroCreate}
              onCriar={criar} onCancelar={() => setShowNovoExp(false)}
            />
          </div>
        </div>
      )}

      {/* Modal detalhe */}
      {modalAberto && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}
          className="sm:items-center sm:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) fecharModal() }}>
          <div style={{ background: '#F7F6F3', borderRadius: '20px 20px 0 0', width: '100%', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 16px 32px' }}
            className="sm:rounded-[20px] sm:max-w-[680px] sm:mx-auto sm:max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div className="sm:hidden" style={{ width: 36, height: 4, borderRadius: 2, background: '#D0D0D0', flex: 1, margin: '0 auto' }} />
              <button onClick={fecharModal} style={{ marginLeft: 'auto', background: '#F0F0F0', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
            </div>
            <DetalheContent
              key={selected.id}
              selected={selected}
              monitoramentos={monitoramentos}
              colheitas={colheitas}
              abaDetalhe={abaDetalhe}
              setAbaDetalhe={setAbaDetalhe}
              verTodosMonitor={verTodosMonitor}
              setVerTodosMonitor={setVerTodosMonitor}
              isAdmin={isAdmin}
              onAvancar={() => setModalAvancar(true)}
              onSalvarMon={salvarMon}
              onSalvarColheita={salvarColheita}
              onSalvarCustos={salvarCustos}
            />
          </div>
        </div>
      )}

      {/* Modal avançar fase */}
      {modalAvancar && selected && (
        <ModalAvancarFase exp={selected} onConfirmar={avancar} onFechar={() => setModalAvancar(false)} />
      )}
    </div>
  )
}
