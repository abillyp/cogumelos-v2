'use client'
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface TenantAdmin {
  id: number; nome: string; email: string
  plano: string; status: string
  trialExpira: string | null; assinaturaExpira: string | null
  criadoEm: string
  usuarioAdminNome: string; usuarioAdminEmail: string
  totalExperimentos: number; totalUsuarios: number
}
interface Resumo {
  total: number; emTrial: number; ativos: number
  expirados: number; expira3dias: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  TRIAL: 'Trial', ATIVO: 'Ativo', EXPIRADO: 'Expirado', CANCELADO: 'Cancelado',
}
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  TRIAL:     { bg: '#FAEEDA', color: '#633806' },
  ATIVO:     { bg: '#EAF3DE', color: '#27500A' },
  EXPIRADO:  { bg: '#FCEBEB', color: '#791F1F' },
  CANCELADO: { bg: '#F1EFE8', color: '#444441' },
}
const AVATAR_COLORS = [
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#E3F0FF', color: '#0C447C' },
  { bg: '#EAF3DE', color: '#27500A' },
]
function avatarColor(nome: string) {
  return AVATAR_COLORS[nome.charCodeAt(0) % AVATAR_COLORS.length]
}
function initials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
function diasRestantes(data: string | null): number | null {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / 86_400_000)
}

// ── Estilos compartilhados ─────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', background: '#F7F6F3',
  border: '1.5px solid #D0CDE8', borderRadius: 8,
  padding: '8px 12px', fontSize: 13, color: '#111', outline: 'none',
}

const modalBoxSt: React.CSSProperties = {
  background: '#fff', border: '0.5px solid #EBEBEB',
  borderRadius: 12, padding: 20,
}
const labelSt: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5, display: 'block',
}
const btnSmSt: React.CSSProperties = {
  border: '0.5px solid var(--color-border-secondary)', borderRadius: 8,
  padding: '5px 10px', fontSize: 12, background: 'transparent',
  color: 'var(--color-text-secondary)', cursor: 'pointer',
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────


// ── Export principal ───────────────────────────────────────────────────────────
export default function AdminTenantsPage() {
  return <ProtectedRoute><AdminTenants /></ProtectedRoute>
}

// ── Componente principal ───────────────────────────────────────────────────────
function AdminTenants() {
  const { isAdmin } = useAuth()
  const router = useRouter()

  const [tenants, setTenants]           = useState<TenantAdmin[]>([])
  const [resumo, setResumo]             = useState<Resumo>({ total: 0, emTrial: 0, ativos: 0, expirados: 0, expira3dias: 0 })
  const [loading, setLoading]           = useState(true)
  const [busca, setBusca]               = useState('')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [editando, setEditando]         = useState<TenantAdmin | null>(null)
  const [showModal, setShowModal]       = useState(false)
  const [showNovo, setShowNovo]         = useState(false)
  const [salvando, setSalvando]         = useState(false)
  const [erro, setErro]                 = useState('')

  // form edição
  const [fNome, setFNome]                       = useState('')
  const [fPlano, setFPlano]                     = useState('BASICO')
  const [fStatus, setFStatus]                   = useState('TRIAL')
  const [fTrialExpira, setFTrialExpira]         = useState('')
  const [fAssinaturaExpira, setFAssinaturaExpira] = useState('')

  // form novo
  const [nNome, setNNome]         = useState('')
  const [nEmail, setNEmail]       = useState('')
  const [nAdminNome, setNAdminNome] = useState('')
  const [nAdminEmail, setNAdminEmail] = useState('')
  const [nAdminSenha, setNAdminSenha] = useState('')
  const [nPlano, setNPlano]       = useState('BASICO')

  const carregar = useCallback(async () => {
    try {
      const [ts, rs]: any[] = await Promise.all([
        api.admin.tenants.listar(),
        api.admin.tenants.resumo(),
      ])
      setTenants(ts)
      setResumo(rs)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) { router.push('/'); return }
    carregar()
  }, [isAdmin, carregar, router])

  function abrirEditar(t: TenantAdmin) {
    setEditando(t)
    setFNome(t.nome)
    setFPlano(t.plano)
    setFStatus(t.status)
    setFTrialExpira(t.trialExpira?.slice(0, 10) ?? '')
    setFAssinaturaExpira(t.assinaturaExpira?.slice(0, 10) ?? '')
    setErro('')
    setShowModal(true)
  }

  async function salvar() {
    if (!editando) return
    setSalvando(true); setErro('')
    try {
      await api.admin.tenants.atualizar(editando.id, {
        nome: fNome, plano: fPlano, status: fStatus,
        trialExpira: fTrialExpira || null,
        assinaturaExpira: fAssinaturaExpira || null,
      })
      await carregar()
      setShowModal(false)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function estenderTrial(id: number) {
    try {
      await api.admin.tenants.estenderTrial(id, 14)
      await carregar()
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function criarTenant() {
    setSalvando(true); setErro('')
    try {
      await api.admin.tenants.criar({
        nome: nNome, email: nEmail,
        nomeAdmin: nAdminNome, emailAdmin: nAdminEmail,
        senhaAdmin: nAdminSenha, plano: nPlano,
      })
      await carregar()
      setShowNovo(false)
      setNNome(''); setNEmail(''); setNAdminNome(''); setNAdminEmail(''); setNAdminSenha('')
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = tenants.filter(t => {
    const termo = busca.toLowerCase()
    const matchBusca = !busca
      || t.nome.toLowerCase().includes(termo)
      || t.email.toLowerCase().includes(termo)
      || t.usuarioAdminEmail.toLowerCase().includes(termo)
    const matchStatus = filtroStatus === 'TODOS' || t.status === filtroStatus
    return matchBusca && matchStatus
  })

  if (!isAdmin) return null

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>
            Gestão de usuários
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Tenants, planos e status de assinaturas
          </p>
        </div>
        <button
          onClick={() => { setShowNovo(true); setErro('') }}
          style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Novo tenant
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total de tenants',       value: resumo.total,     sub: undefined, color: undefined },
          { label: 'Em trial',               value: resumo.emTrial,   sub: resumo.expira3dias > 0 ? `${resumo.expira3dias} expiram em 3 dias` : undefined, color: '#BA7517' },
          { label: 'Ativos (pagantes)',       value: resumo.ativos,    sub: resumo.total > 0 ? `taxa de conversão ${Math.round((resumo.ativos / resumo.total) * 100)}%` : undefined, color: '#3B6D11' },
          { label: 'Expirados / cancelados',  value: resumo.expirados, sub: 'oportunidade de reativação', color: '#A32D2D' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 500, color: color ?? 'var(--color-text-primary)' }}>{value}</p>
            {sub && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 3 }}>{sub}</p>}
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input
          type="text" placeholder="Buscar por nome, email ou tenant..."
          value={busca} onChange={e => setBusca(e.target.value)}
          style={{ flex: 1, ...inputSt }}
        />
        <select
          value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          style={{ ...inputSt, width: 'auto', cursor: 'pointer' }}
        >
          <option value="TODOS">Todos os status</option>
          <option value="TRIAL">Trial</option>
          <option value="ATIVO">Ativo</option>
          <option value="EXPIRADO">Expirado</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--color-background-secondary)' }}>
              {['Usuário / Tenant', 'Role', 'Plano / Status', 'Trial / Expiração', 'Exp.', 'Ações'].map((h, i) => (
                <th key={h} style={{ padding: '10px 16px', textAlign: i === 5 ? 'right' : 'left', fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-tertiary)' }}>
                  Nenhum tenant encontrado.
                </td>
              </tr>
            )}
            {filtrados.map((t, idx) => {
              const av = avatarColor(t.usuarioAdminNome || t.nome)
              const bs = STATUS_STYLE[t.status] ?? STATUS_STYLE.CANCELADO
              const dias = t.status === 'TRIAL' ? diasRestantes(t.trialExpira)
                : t.status === 'ATIVO' ? diasRestantes(t.assinaturaExpira) : null
              return (
                <tr key={t.id} style={{ borderBottom: idx < filtrados.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                        {initials(t.usuarioAdminNome || t.nome)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{t.usuarioAdminNome || '—'}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{t.usuarioAdminEmail}</p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{t.nome}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#EEEDFE', color: '#3C3489', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999 }}>Admin</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: bs.bg, color: bs.color, fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999 }}>
                      {t.status === 'ATIVO' ? `Ativo — ${t.plano}` : STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {dias !== null ? (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 500, color: dias <= 3 ? '#A32D2D' : dias <= 7 ? '#BA7517' : '#3B6D11' }}>
                          {dias > 0 ? `${dias} dias restantes` : `Expirou há ${Math.abs(dias)} dias`}
                        </p>
                        <div style={{ height: 4, background: 'var(--color-background-secondary)', borderRadius: 2, overflow: 'hidden', width: 80, marginTop: 4 }}>
                          <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (dias / 14) * 100))}%`, background: dias <= 3 ? '#E24B4A' : dias <= 7 ? '#EF9F27' : '#639922', borderRadius: 2 }} />
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {t.trialExpira ? `Encerrado em ${new Date(t.trialExpira).toLocaleDateString('pt-BR')}` : '—'}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{t.totalExperimentos}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {t.status === 'TRIAL' && (
                        <button onClick={() => estenderTrial(t.id)} style={btnSmSt}>
                          Estender trial
                        </button>
                      )}
                      {(t.status === 'EXPIRADO' || t.status === 'CANCELADO') && (
                        <button
                          onClick={() => abrirEditar({ ...t, status: 'ATIVO' })}
                          style={{ ...btnSmSt, color: '#534AB7', borderColor: '#AFA9EC' }}
                        >
                          Reativar
                        </button>
                      )}
                      <button onClick={() => abrirEditar(t)} style={btnSmSt}>Editar</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modais renderizados como siblings do div principal */}
      {showModal && editando && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowModal(false)}
        >
          <div style={{ width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={modalBoxSt}>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: 'var(--color-text-primary)' }}>
                Editar tenant — {editando.usuarioAdminNome}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelSt}>Nome do produtor</label>
                  <input value={fNome} onChange={e => setFNome(e.target.value)} style={inputSt} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelSt}>Plano</label>
                    <select value={fPlano} onChange={e => setFPlano(e.target.value)} style={inputSt}>
                      <option value="BASICO">Básico</option>
                      <option value="PRO">Pro</option>
                      <option value="COMERCIAL">Comercial</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>Status</label>
                    <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={inputSt}>
                      <option value="TRIAL">Trial</option>
                      <option value="ATIVO">Ativo</option>
                      <option value="EXPIRADO">Expirado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Trial expira em</label>
                  <input type="date" value={fTrialExpira} onChange={e => setFTrialExpira(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Assinatura expira em</label>
                  <input type="date" value={fAssinaturaExpira} onChange={e => setFAssinaturaExpira(e.target.value)} style={inputSt} />
                </div>
              </div>
              {erro && <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{erro}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando} style={{ flex: 2, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNovo && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowNovo(false)}
        >
          <div style={{ width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={{ ...modalBoxSt, maxHeight: '90vh', overflowY: 'auto' }}>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: 'var(--color-text-primary)' }}>Novo tenant</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Dados da empresa</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={labelSt}>Nome da empresa</label>
                  <input value={nNome} onChange={e => setNNome(e.target.value)} placeholder="Ex: Cogumelos São Paulo" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Email da empresa</label>
                  <input type="email" value={nEmail} onChange={e => setNEmail(e.target.value)} placeholder="empresa@email.com" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Plano inicial</label>
                  <select value={nPlano} onChange={e => setNPlano(e.target.value)} style={inputSt}>
                    <option value="BASICO">Básico</option>
                    <option value="PRO">Pro</option>
                    <option value="COMERCIAL">Comercial</option>
                  </select>
                </div>
              </div>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Admin do tenant</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={labelSt}>Nome</label>
                  <input value={nAdminNome} onChange={e => setNAdminNome(e.target.value)} placeholder="Nome completo" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Email</label>
                  <input type="email" value={nAdminEmail} onChange={e => setNAdminEmail(e.target.value)} placeholder="admin@empresa.com" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Senha inicial</label>
                  <input type="password" value={nAdminSenha} onChange={e => setNAdminSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputSt} />
                </div>
              </div>
              {erro && <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{erro}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <button onClick={() => setShowNovo(false)} style={{ flex: 1, background: 'transparent', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={criarTenant} disabled={salvando} style={{ flex: 2, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {salvando ? 'Criando...' : 'Criar tenant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
