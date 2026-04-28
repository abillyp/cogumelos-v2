// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api, saveTokens } from '@/lib/api'
import { AuthUser } from '@/lib/types'

function CallbackHandler() {
  const router    = useRouter()
  const params    = useSearchParams()
  const { login } = useAuth()
  const [erro, setErro] = useState('')

  useEffect(() => {
    const token        = params.get('token')
    const refreshToken = params.get('refreshToken')
    const loginType    = params.get('loginType') ?? 'GOOGLE'
    const erroParam    = params.get('erro')

    if (erroParam) {
      const msgs: Record<string, string> = {
        email_nao_autorizado: 'Email não autorizado pelo Google.',
        inativo: 'Usuário inativo. Contate o administrador.',
      }
      setErro(msgs[erroParam] ?? 'Erro ao autenticar com Google.')
      setTimeout(() => router.replace('/login'), 3000)
      return
    }

    if (!token || !refreshToken) {
      setErro('Token não recebido. Tente novamente.')
      setTimeout(() => router.replace('/login'), 3000)
      return
    }

    saveTokens(token, refreshToken)

    api.auth.me()
      .then((data: any) => {
        login(token, refreshToken, {
          id: data.id, nome: data.nome, email: data.email, role: data.role,
          loginType: loginType as 'GOOGLE' | 'EMAIL',
        } as AuthUser)
        router.replace('/')
      })
      .catch(() => {
        setErro('Erro ao carregar dados do usuário.')
        setTimeout(() => router.replace('/login'), 3000)
      })
  }, [])

  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🍄</div>
      {erro ? (
        <>
          <p style={{ fontSize:15, fontWeight:700, color:'var(--red)', marginBottom:8 }}>{erro}</p>
          <p style={{ fontSize:13, color:'#888' }}>Redirecionando para o login...</p>
        </>
      ) : (
        <>
          <p style={{ fontSize:15, fontWeight:700, color:'#111', marginBottom:8 }}>
            Autenticando com Google...
          </p>
          <p style={{ fontSize:13, color:'#888' }}>Aguarde um momento</p>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            border:'3px solid #EEEDFE', borderTopColor:'var(--purple)',
            animation:'spin 0.8s linear infinite', margin:'16px auto 0',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  )
}

export default function OAuth2CallbackPage() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', background:'#F7F6F3', padding:16,
    }}>
      <Suspense fallback={
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>🍄</div>
          <p style={{ fontSize:15, fontWeight:700, color:'#111' }}>Carregando...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}