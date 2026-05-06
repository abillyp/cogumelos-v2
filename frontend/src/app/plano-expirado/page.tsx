// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { clearTokens } from '@/lib/api'

const MENSAGENS: Record<string, { titulo: string; descricao: string; icone: string }> = {
  trial_expirado: {
    icone: '⏰',
    titulo: 'Seu período gratuito encerrou',
    descricao: 'Você aproveitou 14 dias explorando o cogumelos.app. Para continuar gerenciando seus cultivos, escolha um plano.',
  },
  assinatura_expirada: {
    icone: '📅',
    titulo: 'Sua assinatura expirou',
    descricao: 'Renove seu plano para continuar acessando seus experimentos, relatórios e formulações.',
  },
  cancelado: {
    icone: '🔒',
    titulo: 'Assinatura cancelada',
    descricao: 'Sua assinatura foi cancelada. Entre em contato conosco para reativar ou escolha um novo plano.',
  },
}

function PlanoExpiradoContent() {
  const params  = useSearchParams()
  const tipo    = params.get('tipo') ?? 'trial_expirado'
  const msg     = MENSAGENS[tipo] ?? MENSAGENS.trial_expirado

  function sair() {
    clearTokens()
    window.location.href = '/login'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gray-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #EBEBEB',
        borderRadius: 20,
        padding: '40px 32px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <p style={{ fontSize: 14, color: '#FF3D00', fontWeight: 800, marginBottom: 24 }}>
          🍄 cogumelos<span style={{ fontWeight: 400, color: '#bbb' }}>.app</span>
        </p>

        {/* Ícone */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#FAEEDA', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 20px',
        }}>
          {msg.icone}
        </div>

        {/* Título */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', marginBottom: 12 }}>
          {msg.titulo}
        </h1>

        {/* Descrição */}
        <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 32 }}>
          {msg.descricao}
        </p>

        {/* O que você vai ter com um plano */}
        <div style={{
          background: '#F7F6F3',
          borderRadius: 14,
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: 28,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            O que você terá acesso
          </p>
          {[
            'Experimentos ilimitados',
            'Relatórios avançados com eficiência biológica',
            'Calculadora C/N com histórico',
            'Monitoramento de temperatura e umidade',
            'Exportação de dados em CSV',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: '#0F6E56', fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 13, color: '#444' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href="mailto:alessandro.billy@organico4you.com.br?subject=Quero assinar um plano"
            style={{
              display: 'block', padding: '14px', borderRadius: 12,
              background: 'var(--purple)', color: '#fff',
              fontSize: 14, fontWeight: 700, textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Entrar em contato para assinar
          </a>

          <button
            onClick={sair}
            style={{
              padding: '12px', borderRadius: 12,
              background: 'transparent', border: '1px solid #EBEBEB',
              color: '#888', fontSize: 13, cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Sair da conta
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#bbb', marginTop: 20 }}>
          Seus dados ficam preservados por 30 dias após o encerramento.
        </p>
      </div>
    </div>
  )
}

export default function PlanoExpiradoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--gray-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: '#bbb' }}>Carregando...</p>
      </div>
    }>
      <PlanoExpiradoContent />
    </Suspense>
  )
}
