    // Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode-svg'

const ALLOWED_ORIGINS = [
  'https://app.organico4you.com.br',
  'https://cogumelos.app',
  'http://localhost:3000',
]

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') ?? ''
  if (!url) {
    return new NextResponse('url param required', { status: 400 })
  }
  try {
    const parsed = new URL(url)
    const origin = `${parsed.protocol}//${parsed.host}`
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse('URL não permitida', { status: 400 })
    }
  } catch {
    return new NextResponse('URL inválida', { status: 400 })
  }
  const svg = new QRCode({
    content: url,
    width: 52,
    height: 52,
    padding: 1,
    color: '#111111',
    background: '#ffffff',
    ecl: 'M',
  }).svg()
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
