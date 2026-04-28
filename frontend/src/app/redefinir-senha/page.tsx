// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function RedefinirSenhaForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setErro('')
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem.'); return }
    if (novaSenha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await api.auth.redefinirSenha(token, novaSenha)
      setSucesso(true)
    } catch (e: any) {
      setErro(e.message || 'Token inválido ou expirado.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div style={{ padding: '40px 24px', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <p style={{ color: 'var(--red)' }}>Link inválido. Solicite um novo link de recuperação.</p>
      <button onClick={() => router.push('/esqueci-minha-senha')} style={btnStyle}>Solicitar novo link</button>
    </div>
  )

  if (sucesso) return (
    <div style={{ padding: '40px 24px', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Senha redefinida!</h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Agora você pode fazer login com sua nova senha.</p>
      <button onClick={() => router.push('/login')} style={btnStyle}>Ir para o login</button>
    </div>
  )

  return (
    <div style={{ padding: '40px 24px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Redefinir senha</h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>Escolha uma nova senha para sua conta.</p>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nova senha</label>
        <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
          placeholder="Mínimo 6 caracteres" style={inputStyle} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Confirmar senha</label>
        <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
          placeholder="Repita a nova senha" style={inputStyle} />
      </div>

      {erro && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}

      <button onClick={handleSubmit} disabled={loading || !novaSenha || !confirmar} style={btnStyle}>
        {loading ? 'Salvando...' : 'Redefinir senha'}
      </button>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return <Suspense><RedefinirSenhaForm /></Suspense>
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E8E8E8', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
const btnStyle: React.CSSProperties = { width: '100%', padding: '14px', background: 'var(--green)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', marginTop: 8 }