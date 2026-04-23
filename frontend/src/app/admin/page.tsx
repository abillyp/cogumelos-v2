// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: contato@cogumelos.app

'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { UsuarioAdmin } from '@/lib/types'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminPage() {
  return <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
}

function AdminPanel() {
  const [usuarios, setUsuarios]   = useState<UsuarioAdmin[]>([])
  const [modal, setModal]         = useState(false)
  const [nome, setNome]           = useState('')
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  async function carregar() {
    const d: any = await api.admin.usuarios.listar()
    setUsuarios(d)
  }

  useEffect(() => { carregar() }, [])

  async function criar() {
    if (!nome || !email || !senha) { setErro('Preencha todos os campos.'); return }
    setSalvando(true); setErro('')
    try {
      await api.admin.usuarios.criar({ nome, email, senha })
      setNome(''); setEmail(''); setSenha(''); setModal(false)
      carregar()
    } catch (e: any) { setErro(e.message) }
    finally { setSalvando(false) }
  }

  async function toggleAtivo(u: UsuarioAdmin) {
    await api.admin.usuarios.atualizar(u.id, { ativo: !u.ativo })
    carregar()
  }

  async function toggleRole(u: UsuarioAdmin) {
    await api.admin.usuarios.atualizar(u.id, { role: u.role === 'ADMIN' ? 'PRODUTOR' : 'ADMIN' })
    carregar()
  }

  async function deletar(id: string) {
    if (!confirm('Remover este usuário?')) return
    await api.admin.usuarios.deletar(id); carregar()
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-lg font-medium mb-1">Painel admin</h1>
          <p className="text-sm text-gray-500">Gerencie usuários do sistema</p>
        </div>
        <button onClick={() => { setModal(true); setErro('') }} className="btn-primary text-sm">+ Usuário</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="text-left pb-2">Nome</th>
                <th className="text-left pb-2">Email</th>
                <th className="text-left pb-2">Perfil</th>
                <th className="text-left pb-2">Status</th>
                <th className="text-left pb-2">Criado em</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">{u.nome}</td>
                  <td className="py-2 text-gray-500 text-xs">{u.email}</td>
                  <td className="py-2">
                    <button onClick={() => toggleRole(u)}
                      className="badge text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={u.role === 'ADMIN'
                        ? { background:'var(--amber-l)', color:'var(--amber)' }
                        : { background:'var(--purple-l)', color:'var(--purple)' }}>
                      {u.role}
                    </button>
                  </td>
                  <td className="py-2">
                    <button onClick={() => toggleAtivo(u)}
                      className="badge text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      style={u.ativo
                        ? { background:'var(--teal-l)', color:'var(--teal)' }
                        : { background:'#f3f4f6', color:'#9ca3af' }}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-2 text-gray-400 text-xs">{u.criadoEm}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => deletar(u.id)} className="text-xs text-gray-300 hover:text-red-400">remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal novo usuário */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setModal(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 w-full sm:max-w-sm"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-medium mb-4">Novo usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Nome</label>
                <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@email.com" />
              </div>
              <div>
                <label className="label">Senha inicial</label>
                <input type="password" className="input" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              {erro && <p className="text-xs text-red-500">{erro}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="btn" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={criar} disabled={salvando}>
                {salvando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
