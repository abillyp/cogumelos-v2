// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function EsqueciSenhaPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setErro('')
    setLoading(true)
    try {
      await api.auth.esqueciSenha(email)
      setEnviado(true)
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) return (
    <div style={{ padding: '40px 24px', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Email enviado!</h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Se o email estiver cadastrado, você receberá as instruções em breve. Verifique sua caixa de entrada.
      </p>
      <button onClick={() => router.push('/login')} style={btnStyle}>
        Voltar para o login
      </button>
    </div>
  )

  return (
    <div style={{ padding: '40px 24px', maxWidth: 400, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888', marginBottom: 24 }}>
        ← Voltar
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Esqueceu a senha?</h1>
      <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
        Informe seu email e enviaremos um link para redefinir sua senha.
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          style={inputStyle}
        />
      </div>

      {erro && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{erro}</p>}

      <button onClick={handleSubmit} disabled={loading || !email} style={btnStyle}>
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #E8E8E8', fontSize: 15, outline: 'none', boxSizing: 'border-box' }
const btnStyle: React.CSSProperties = { width: '100%', padding: '14px', background: 'var(--green)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer' }