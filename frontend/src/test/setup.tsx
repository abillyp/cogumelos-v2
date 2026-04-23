/// <reference types="vitest/globals" />
// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: contato@cogumelos.app

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// Mock do next/navigation globalmente
vi.mock('next/navigation', () => ({
  useRouter:       () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname:     () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock do next/link — usa tsx para suportar JSX
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement('a', { href }, children),
}))

// Limpa localStorage entre testes
beforeEach(() => {
  localStorage.clear()
})
