// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.

'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return { hasError: true, message }
  }

  componentDidCatch(error: unknown, info: { componentStack: string }) {
    // Em produção substituir por serviço de monitoramento (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '40vh', padding: '32px 16px', textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 32, marginBottom: 16 }}>🍄</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            Algo deu errado
          </p>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20, maxWidth: 360 }}>
            {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{
              background: 'var(--purple)', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 24px', fontSize: 14,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
