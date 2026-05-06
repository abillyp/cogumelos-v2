// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { AuthUser } from '@/lib/types'

function LoginContent() {
  const router          = useRouter()
  const { login, user } = useAuth()
  const [tab, setTab]           = useState<'login' | 'registro'>('login')
  const [nome, setNome]         = useState('')
  const [nomeProdutor, setNomeProdutor] = useState('')
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [erro, setErro]         = useState('')
  const searchParams = useSearchParams()
  const [loading, setLoading]   = useState(false)

  useEffect(() => { if (user) router.push('/') }, [user])

  useEffect(() => {
    const erroParam = searchParams.get('erro')
    const msgs: Record<string, string> = {
      trial_expirado:      'Período de trial encerrado. Assine um plano para continuar.',
      assinatura_expirada: 'Assinatura expirada. Renove seu plano para continuar.',
      cancelado:           'Assinatura cancelada. Entre em contato para reativar.',
      sessao_expirada:     'Sua sessão expirou. Faça login novamente.',
    }
    if (erroParam && msgs[erroParam]) setErro(msgs[erroParam])
  }, [searchParams])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setLoading(true)
  try {
    console.log('=== chamando login', { email, senha: '***' })
    const data: any = tab === 'login'
      ? await api.auth.login({ email, senha })
      : await api.auth.registro({ nome, nomeProdutor, email, senha })
    console.log('=== response', data)

      login(data.token, {
        id: data.id, nome: data.nome, email: data.email, role: data.role,
        loginType: data.loginType,
      } as AuthUser)
      router.push('/')
    } catch (err: any) {
      setErro(err.message)
    } finally { setLoading(false) }
  }

  function loginGoogle() {
    window.location.href = `${window.location.origin}/oauth2/authorization/google`
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--gray-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#FF3D00', marginBottom: 4 }}>
            🍄 cogumelos<span style={{ fontWeight: 400, color: '#bbb' }}>.app</span>
          </h1>
          <p style={{ fontSize: 14, color: '#888' }}>Sistema de cultivo de cogumelos</p>
        </div>

        <div className="card">
          {/* Botão Google */}
          <button onClick={loginGoogle} style={{
            width: '100%', height: 48, borderRadius: 12,
            border: '1.5px solid #EBEBEB', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 14, fontWeight: 600, color: '#333', cursor: 'pointer', marginBottom: 16,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>

          {/* Divisor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: '0.5px', background: '#EBEBEB' }} />
            <span style={{ fontSize: 12, color: '#bbb', fontWeight: 500 }}>ou</span>
            <div style={{ flex: 1, height: '0.5px', background: '#EBEBEB' }} />
          </div>

          {/* Abas login / registro */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#F7F6F3', borderRadius: 12, padding: 3 }}>
            {(['login', 'registro'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setErro('') }} style={{
                flex: 1, padding: '7px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all .15s',
                background: tab === t ? '#fff' : 'transparent',
                color: tab === t ? 'var(--purple)' : '#888',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tab === 'registro' && (
              <>
                <div>
                  <label className="label">Nome</label>
                  <input className="input" value={nome} onChange={e => setNome(e.target.value)}
                    placeholder="Seu nome completo" required />
                </div>
                <div>
                  <label className="label">Nome do produtor / empresa</label>
                  <input className="input" value={nomeProdutor} onChange={e => setNomeProdutor(e.target.value)}
                    placeholder="Ex: Cogumelos São Paulo" required />
                </div>
              </>
            )}

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoComplete="email" />
            </div>

            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" value={senha} onChange={e => setSenha(e.target.value)}
                placeholder={tab === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'} required
                minLength={tab === 'registro' ? 6 : undefined}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {erro && (
              <div style={{ background: 'var(--red-l)', border: '1px solid #F7C1C1', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: 'var(--red)' }}>
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
              {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>

            {/* Link esqueci minha senha — só na aba login */}
            {tab === 'login' && (
              <button
                type="button"
                onClick={() => router.push('/esqueci-minha-senha')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#888', textAlign: 'center', padding: '4px 0',
                }}
              >
                Esqueci minha senha
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'var(--gray-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ fontSize:14, color:'#bbb' }}>Carregando...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}