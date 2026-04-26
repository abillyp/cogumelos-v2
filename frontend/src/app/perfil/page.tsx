// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PerfilPage() {
  return <ProtectedRoute><Perfil /></ProtectedRoute>
}

function Perfil() {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()

  if (!user) return null

  const inicial = user.nome.charAt(0).toUpperCase()

  return (
    <div style={{ padding: '24px 16px', maxWidth: 480, margin: '0 auto' }}>

      {/* Avatar + nome */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF3D00, #FF6B35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12,
        }}>
          {inicial}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 4 }}>
          {user.nome}
        </h1>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{user.email}</p>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 999,
          background: isAdmin ? 'var(--amber-l)' : 'var(--purple-l)',
          color: isAdmin ? 'var(--amber)' : 'var(--purple)',
        }}>
          {user.role}
        </span>
      </div>

      {/* Seção de informações */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
          Conta
        </p>

        {[
          { label: 'Nome', value: user.nome },
          { label: 'Email', value: user.email },
          { label: 'Perfil', value: user.role },
        ].map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '0.5px solid #F0F0F0',
          }}>
            <span style={{ fontSize: 14, color: '#888' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Links rápidos — só desktop tem navbar, mobile precisa desses atalhos */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
          Navegação
        </p>
        {[
          { label: 'Insumos',  href: '/insumos',      emoji: '🌿' },
          ...(isAdmin ? [{ label: 'Admin', href: '/admin', emoji: '⚙️' }] : []),
        ].map(({ label, href, emoji }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '12px 0',
              borderBottom: '0.5px solid #F0F0F0', background: 'none',
              border: 'none', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 14, color: '#111', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{emoji}</span> {label}
            </span>
            <span style={{ color: '#bbb', fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>

      {/* Botão sair */}
      <button
        onClick={logout}
        style={{
          width: '100%', padding: '14px',
          background: 'var(--red-l)', border: 'none',
          borderRadius: 14, fontSize: 15, fontWeight: 700,
          color: 'var(--red)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sair da conta
      </button>

      <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', marginTop: 24 }}>
        🍄 cogumelos.app
      </p>
    </div>
  )
}
