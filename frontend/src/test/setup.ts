// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: contato@cogumelos.app

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock do next/navigation globalmente
vi.mock('next/navigation', () => ({
  useRouter:     () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname:   () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock do next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Limpa localStorage entre testes
beforeEach(() => {
  localStorage.clear()
})
