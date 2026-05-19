// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode-svg'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') ?? ''
  if (!url) {
    return new NextResponse('url param required', { status: 400 })
  }
  const svg = new (QRCode as any)({
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
