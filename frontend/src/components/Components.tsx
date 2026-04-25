// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.palma@organico4you.com.br

'use client'

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({
  label, value, unit, highlight, warn,
}: {
  label: string
  value: string | number
  unit?: string
  highlight?: boolean
  warn?: boolean
}) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p
        className="metric-val"
        style={{ color: highlight ? 'var(--teal)' : warn ? 'var(--amber)' : '#111' }}
      >
        {value}
      </p>
      {unit && <p className="metric-unit">{unit}</p>}
    </div>
  )
}

// ── CnAlert ───────────────────────────────────────────────────────────────────
export function CnAlert({
  cnTotal, cnMin, cnMax, especieNome,
}: {
  cnTotal: number | null
  cnMin: number
  cnMax: number
  especieNome: string
}) {
  if (cnTotal === null) return null
  const ok = cnTotal >= cnMin && cnTotal <= cnMax
  return (
    <div
      className="alert-strip mb-3"
      style={
        ok
          ? { background: 'var(--green-l)', color: 'var(--teal)', border: '1px solid var(--teal-m)' }
          : { background: 'var(--amber-l)', color: 'var(--amber)', border: '1px solid #EF9F27' }
      }
    >
      <span style={{ fontSize: 16 }}>{ok ? '✓' : '⚠'}</span>
      {ok
        ? `C/N ${cnTotal.toFixed(1)} dentro da faixa ideal para ${especieNome} (${cnMin}–${cnMax}).`
        : `C/N ${cnTotal.toFixed(1)} fora da faixa para ${especieNome} (${cnMin}–${cnMax}). Ajuste os insumos.`}
    </div>
  )
}

// ── TimelineBar ───────────────────────────────────────────────────────────────
const STATUS_ORDER = ['PREPARACAO', 'INOCULADO', 'AMADURECIMENTO', 'FRUTIFICACAO', 'CONCLUIDO']
const STATUS_LABELS = ['Preparo', 'Inoc.', 'Amad.', 'Frut.', 'Fim']

export function TimelineBar({ status }: { status: string }) {
  const idx = STATUS_ORDER.indexOf(status)
  return (
    <div>
      <div className="timeline-bar">
        {STATUS_ORDER.map((_, i) => (
          <div
            key={i}
            className={`tl-seg ${i < idx ? 'done' : i === idx ? 'active' : ''}`}
          />
        ))}
      </div>
      <div className="flex justify-between" style={{ fontSize: 9, color: '#aaa', marginTop: 2 }}>
        {STATUS_LABELS.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  )
}

// ── ExperimentoThumb ──────────────────────────────────────────────────────────
const THUMB_COLORS: Record<string, { bg: string; badge: string }> = {
  PREPARACAO:     { bg: 'linear-gradient(135deg,#F1EFE8,#E5E3D8)', badge: '#888' },
  INOCULADO:      { bg: 'linear-gradient(135deg,#EEEDFE,#D5D2FB)', badge: '#534AB7' },
  AMADURECIMENTO: { bg: 'linear-gradient(135deg,#E3FFF0,#C7F7DF)', badge: '#00A550' },
  FRUTIFICACAO:   { bg: 'linear-gradient(135deg,#E3F0FF,#C7E0FF)', badge: '#1F6FEB' },
  CONCLUIDO:      { bg: 'linear-gradient(135deg,#EAF3DE,#D5EBBE)', badge: '#27500A' },
}

const STATUS_EMOJI: Record<string, string> = {
  PREPARACAO: '🌾', INOCULADO: '🧪', AMADURECIMENTO: '🍄',
  FRUTIFICACAO: '🌱', CONCLUIDO: '✅',
}

const STATUS_LABEL: Record<string, string> = {
  PREPARACAO: 'Preparo', INOCULADO: 'Inoculado', AMADURECIMENTO: 'Amadurecimento',
  FRUTIFICACAO: 'Frutificação', CONCLUIDO: 'Concluído',
}

const BADGE_CLASS: Record<string, string> = {
  PREPARACAO: 'badge-prep', INOCULADO: 'badge-inoc', AMADURECIMENTO: 'badge-amad',
  FRUTIFICACAO: 'badge-frut', CONCLUIDO: 'badge-conc',
}

export function ExperimentoCard({
  exp,
  onClick,
  selected,
  diasSemMonitoramento,
}: {
  exp: {
    id: string
    codigo: string
    status: string
    especieNome: string
    formulacaoNome: string
    totalBlocos: number
    cnTotal: number | null
    usuarioNome: string
  }
  onClick: () => void
  selected?: boolean
  diasSemMonitoramento?: number | null
}) {
  const thumb = THUMB_COLORS[exp.status] ?? THUMB_COLORS.PREPARACAO
  const progressPct = (STATUS_ORDER.indexOf(exp.status) / (STATUS_ORDER.length - 1)) * 100

  return (
    <div
      className="card-sm cursor-pointer transition-all hover:shadow-md"
      style={{
        outline: selected ? `2px solid var(--purple)` : 'none',
        outlineOffset: 1,
      }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="exp-thumb" style={{ background: thumb.bg }}>
        <span style={{ fontSize: 34 }}>{STATUS_EMOJI[exp.status]}</span>
        <span
          className={`badge ${BADGE_CLASS[exp.status]}`}
          style={{ position: 'absolute', top: 8, right: 10 }}
        >
          {STATUS_LABEL[exp.status]}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>
          {exp.codigo}
        </p>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          {exp.especieNome} · {exp.formulacaoNome} · {exp.totalBlocos} blocos
        </p>

        {/* Barra de progresso da fase */}
        <div className="progress-track" style={{ marginBottom: 8 }}>
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%`, background: thumb.badge }}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <span style={{ fontSize: 11, color: '#888' }}>
            C/N {exp.cnTotal?.toFixed(1) ?? '—'}
          </span>
          {diasSemMonitoramento != null && diasSemMonitoramento > 3 ? (
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 6, background: '#FFF0E0', color: '#FF6B00',
              }}
            >
              ⚠ sem reg. {diasSemMonitoramento}d
            </span>
          ) : diasSemMonitoramento === 0 ? (
            <span
              style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 6, background: 'var(--green-l)', color: 'var(--green)',
              }}
            >
              ✓ reg. hoje
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ── MiniChart ─────────────────────────────────────────────────────────────────
export function MiniChart({
  data,
  color,
  label,
}: {
  data: number[]
  color: string
  label: string
}) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{label}</p>
      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 3,
          height: 44, background: '#F7F6F3', borderRadius: 8, padding: '4px 6px',
        }}
      >
        {data.map((v, i) => (
          <div
            key={i}
            className="mini-bar"
            style={{
              height: `${(v / max) * 100}%`,
              background: i === data.length - 1 ? color : color + '55',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── ContribuicaoBar ───────────────────────────────────────────────────────────
export function ContribuicaoBar({
  nome, pct, cor,
}: {
  nome: string
  pct: number
  cor: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#333', fontWeight: 500 }}>{nome}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: cor }}
        />
      </div>
    </div>
  )
}

// ── Stat summary card ─────────────────────────────────────────────────────────
export function StatCard({
  value, label, color,
}: {
  value: string
  label: string
  color?: string
}) {
  return (
    <div
      style={{
        background: '#fff', border: '1px solid var(--gray-line)',
        borderRadius: 14, padding: '14px', textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 22, fontWeight: 700, color: color ?? '#111', marginBottom: 2 }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: '#888' }}>{label}</p>
    </div>
  )
}

// ── Re-exports de constantes úteis ────────────────────────────────────────────
export { STATUS_LABEL, BADGE_CLASS, STATUS_ORDER }
