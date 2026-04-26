// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children, adminOnly = false }: {
  children: React.ReactNode
  adminOnly?: boolean
}) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/login')
      else if (adminOnly && !isAdmin) router.push('/calculadora')
    }
  }, [user, loading, isAdmin, adminOnly])

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-sm text-gray-400">Carregando...</div>
    </div>
  )
  if (adminOnly && !isAdmin) return null
  return <>{children}</>
}
