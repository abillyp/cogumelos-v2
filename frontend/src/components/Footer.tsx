// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '0.5px solid #EBEBEB',
      padding: '16px 24px',
      marginTop: 32,
      paddingBottom: 84,
    }}>
      <div style={{
        maxWidth: '64rem',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}>
        <span style={{ fontSize: 12, color: '#bbb' }}>
          cogumelos.app &copy; {new Date().getFullYear()}
        </span>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/privacidade" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
            Privacidade
          </Link>
          <Link href="/termos" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
            Termos de Uso
          </Link>
          <a href="mailto:privacidade@cogumelos.app" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>
            DPO: privacidade@cogumelos.app
          </a>
        </div>
      </div>
    </footer>
  )
}
