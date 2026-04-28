// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'

export default function PerfilPage() {
  return <ProtectedRoute><Perfil /></ProtectedRoute>
}

function Perfil() {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()

  if (!user) return null

  const inicial = user.nome.charAt(0).toUpperCase()
  const isOAuth2 = user.loginType === 'GOOGLE'

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

      {/* Navegação */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
          Navegação
        </p>
        {[
          { label: 'Insumos', href: '/insumos', emoji: '🌿' },
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

      {/* Alterar senha — só para usuários email/senha */}
      {!isOAuth2 && <AlterarSenha />}

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

function AlterarSenha() {
  const [aberto, setAberto] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setErro('')
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (novaSenha.length < 6) { setErro('Mínimo 6 caracteres.'); return }
    setLoading(true)
    try {
      await api.auth.alterarSenha(senhaAtual, novaSenha)
      setSucesso(true)
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
      setTimeout(() => { setSucesso(false); setAberto(false) }, 2000)
    } catch (e: any) {
      setErro(e.message || 'Erro ao alterar senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <button onClick={() => setAberto(!aberto)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>🔒 Alterar senha</span>
        <span style={{ color: '#bbb', fontSize: 16 }}>{aberto ? '∧' : '›'}</span>
      </button>

      {aberto && (
        <div style={{ marginTop: 16 }}>
          {[
            { label: 'Senha atual', value: senhaAtual, set: setSenhaAtual },
            { label: 'Nova senha', value: novaSenha, set: setNovaSenha },
            { label: 'Confirmar nova senha', value: confirmar, set: setConfirmar },
          ].map(({ label, value, set }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={e => set(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #E8E8E8', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          {erro && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{erro}</p>}
          {sucesso && <p style={{ color: 'var(--green)', fontSize: 13, marginBottom: 8 }}>✓ Senha alterada com sucesso!</p>}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '12px', background: 'var(--green)', border: 'none',
            borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </div>
      )}
    </div>
  )
}