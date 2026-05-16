// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { AuthProvider } from '@/hooks/useAuth'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
