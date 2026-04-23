// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: contato@cogumelos.app

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Experimento } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'

const STATUS_LABEL: Record<string, string> = {
  PREPARACAO: 'Preparo', INOCULADO: 'Inoculado',
  AMADURECIMENTO: 'Amadurec.', FRUTIFICACAO: 'Frutificação', CONCLUIDO: 'Concluído',
}

const STATUS_COLORS: Record<string, { bg: string; color: string; badge: string }> = {
  PREPARACAO:     { bg: 'linear-gradient(135deg,#F1EFE8,#E5E3D8)', color: '#888',    badge: '#888' },
  INOCULADO:      { bg: 'linear-gradient(135deg,#EEEDFE,#D5D2FB)', color: '#534AB7', badge: '#534AB7' },
  AMADURECIMENTO: { bg: 'linear-gradient(135deg,#E3FFF0,#C7F7DF)', color: '#00A550', badge: '#00A550' },
  FRUTIFICACAO:   { bg: 'linear-gradient(135deg,#E3F0FF,#C7E0FF)', color: '#1F6FEB', badge: '#1F6FEB' },
  CONCLUIDO:      { bg: 'linear-gradient(135deg,#EAF3DE,#D5EBBE)', color: '#27500A', badge: '#27500A' },
}

const STATUS_EMOJI: Record<string, string> = {
  PREPARACAO: '🌾', INOCULADO: '🧪', AMADURECIMENTO: '🍄',
  FRUTIFICACAO: '🌱', CONCLUIDO: '✅',
}

export default function HomePage() {
  return (
    <>
      {/* Desktop — redireciona para /experimentos */}
      <div className="hidden sm:block">
        <DesktopRedirect />
      </div>
      {/* Mobile — home screen */}
      <div className="sm:hidden">
        <ProtectedRoute><MobileHome /></ProtectedRoute>
      </div>
    </>
  )
}

function DesktopRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/experimentos') }, [])
  return null
}

function MobileHome() {
  const { user } = useAuth()
  const router   = useRouter()
  const [experimentos, setExperimentos] = useState<Experimento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.experimentos.listar()
      .then((d: any) => setExperimentos(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const ativos     = experimentos.filter(e => e.status !== 'CONCLUIDO')
  const alertas    = ativos.filter(e => {
    // alerta se último monitoramento foi há mais de 3 dias (simplificado)
    return e.status === 'FRUTIFICACAO' || e.status === 'AMADURECIMENTO'
  })
  const receitaTotal = experimentos.reduce((s, e) => s + (e.financeiro?.receitaTotal ?? 0), 0)
  const primeiroNome = user?.nome.split(' ')[0] ?? ''

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div style={{ padding: '16px 16px 0' }}>
      {/* Saudação */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>{saudacao} 👋</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{primeiroNome}</h1>
      </div>

      {/* Quick cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <QuickCard
          bg="#EEEDFE" color="#3C3489"
          iconBg="#534AB7"
          icon="🌱"
          value={String(ativos.length)}
          label="em andamento"
          onClick={() => router.push('/experimentos')}
        />
        <QuickCard
          bg="#FAEEDA" color="#633806"
          iconBg="#BA7517"
          icon="⚠"
          value={String(alertas.length)}
          label="alertas"
          onClick={() => router.push('/experimentos')}
        />
        <QuickCard
          bg="#E1F5EE" color="#085041"
          iconBg="#0F6E56"
          icon="R$"
          value={receitaTotal > 0 ? `${(receitaTotal / 1000).toFixed(1)}k` : '—'}
          label="receita total"
          onClick={() => router.push('/relatorio')}
        />
        <QuickCard
          bg="#E6F1FB" color="#0C447C"
          iconBg="#185FA5"
          icon="📊"
          value="Ver"
          label="relatório"
          onClick={() => router.push('/relatorio')}
        />
      </div>

      {/* Lotes em andamento */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Em andamento</h2>
        <button
          onClick={() => router.push('/experimentos')}
          style={{ fontSize: 12, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          ver todos
        </button>
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: '#bbb', textAlign: 'center', padding: '24px 0' }}>Carregando...</p>
      )}

      {!loading && ativos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: 14, color: '#bbb', marginBottom: 12 }}>Nenhum lote em andamento.</p>
          <button
            className="btn-primary"
            onClick={() => router.push('/experimentos')}
          >
            + Criar primeiro lote
          </button>
        </div>
      )}

      {ativos.map(e => {
        const sc = STATUS_COLORS[e.status] ?? STATUS_COLORS.PREPARACAO
        const progressPct = (['PREPARACAO','INOCULADO','AMADURECIMENTO','FRUTIFICACAO','CONCLUIDO']
          .indexOf(e.status) / 4) * 100

        return (
          <div
            key={e.id}
            onClick={() => router.push('/experimentos')}
            style={{
              background: '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 12,
              border: '1px solid #EBEBEB',
              cursor: 'pointer',
            }}
          >
            {/* Thumb */}
            <div style={{
              height: 72, background: sc.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              <span style={{ fontSize: 30 }}>{STATUS_EMOJI[e.status]}</span>
              <span style={{
                position: 'absolute', top: 8, right: 10,
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 999, background: sc.badge, color: '#fff',
              }}>
                {STATUS_LABEL[e.status]}
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: '10px 14px' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 2 }}>{e.codigo}</p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                {e.especieNome} · {e.totalBlocos} blocos · C/N {e.cnTotal?.toFixed(1) ?? '—'}
              </p>

              {/* Progress bar */}
              <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: sc.badge, borderRadius: 2, transition: 'width .4s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#888' }}>
                  {e.formulacaoNome}
                </span>
                {e.financeiro?.receitaTotal != null && e.financeiro.receitaTotal > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>
                    R$ {e.financeiro.receitaTotal.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Atalho calculadora */}
      <div
        onClick={() => router.push('/calculadora')}
        style={{
          background: 'var(--purple-l)', borderRadius: 16, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', marginBottom: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-d)' }}>Calculadora de substrato</p>
          <p style={{ fontSize: 11, color: 'var(--purple)' }}>Monte uma nova formulação C/N</p>
        </div>
        <span style={{ fontSize: 20 }}>⚗</span>
      </div>
    </div>
  )
}

function QuickCard({
  bg, color, iconBg, icon, value, label, onClick,
}: {
  bg: string; color: string; iconBg: string; icon: string
  value: string; label: string; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: bg, borderRadius: 16, padding: '14px 12px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, color: '#fff', fontWeight: 700,
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 20, fontWeight: 800, color }}>{value}</p>
      <p style={{ fontSize: 11, fontWeight: 600, color, opacity: .75 }}>{label}</p>
    </div>
  )
}
