// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { memo } from 'react'

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
        ? `C/N ${cnTotal.toFixed(2)} dentro da faixa ideal para ${especieNome} (${cnMin}–${cnMax}).`
        : `C/N ${cnTotal.toFixed(2)} fora da faixa para ${especieNome} (${cnMin}–${cnMax}). Ajuste os insumos.`}
    </div>
  )
}

// ── MiniChart ─────────────────────────────────────────────────────────────────
export const MiniChart = memo(function MiniChart({
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
})

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

// ── Modal (backdrop centrado) ─────────────────────────────────────────────────
export function Modal({
  onClose,
  maxWidth = 440,
  contentStyle,
  children,
}: {
  onClose: () => void
  maxWidth?: number
  contentStyle?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 100, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, border: '0.5px solid #E8E8E8',
          padding: '20px', width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}

