// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Modal } from '@/components/Components'
import { diasRestantes } from '@/lib/calculos'
import { useAdminTenants } from '@/hooks/useAdminTenants'
import type { TenantAdmin } from '@/hooks/useAdminTenants'

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
// ── Estilos compartilhados ─────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  width: '100%', background: '#F7F6F3',
  border: '1.5px solid #D0CDE8', borderRadius: 8,
  padding: '8px 12px', fontSize: 13, color: '#111', outline: 'none',
}
const labelSt: React.CSSProperties = {
  fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5, display: 'block',
}
const btnSmSt: React.CSSProperties = {
  border: '0.5px solid var(--color-border-secondary)', borderRadius: 8,
  padding: '5px 10px', fontSize: 12, background: 'transparent',
  color: 'var(--color-text-secondary)', cursor: 'pointer',
}

// ── Export principal ───────────────────────────────────────────────────────────
export default function AdminTenantsPage() {
  return <ProtectedRoute><AdminTenants /></ProtectedRoute>
}

// ── Componente principal ───────────────────────────────────────────────────────
function AdminTenants() {
  const {
    isAdmin,
    resumo, loading,
    busca, setBusca,
    filtroStatus, setFiltroStatus,
    editando,
    showModal, setShowModal,
    showNovo, setShowNovo,
    salvando,
    erro,
    showConfirmDelete, setShowConfirmDelete,
    confirmNome, setConfirmNome,
    excluindo,
    erroNovo, setErroNovo,
    erroPage, setErroPage,
    showUsuarios, setShowUsuarios,
    tenantUsuarios,
    usuarios,
    loadingUsuarios,
    removendo,
    erroUsuarios,
    formEdicao, setFormEdicao,
    formNovo, setFormNovo,
    filtrados,
    abrirEditar, abrirUsuarios, removerUsuario,
    excluirTenant, salvar, estenderTrial, criarTenant,
  } = useAdminTenants()

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
          onClick={() => { setShowNovo(true); setErroNovo('') }}
          style={{ background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          + Novo tenant
        </button>
      </div>

      {erroPage && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: '#791F1F', margin: 0 }}>{erroPage}</p>
          <button onClick={() => setErroPage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#A32D2D' }}>✕</button>
        </div>
      )}

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
              {['Usuário / Tenant', 'Role', 'Plano / Status', 'Trial / Expiração', 'Usuários', 'Ações'].map((h, i) => (
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
                    {t.adminRole ? (
                      <span style={{
                        background: t.adminRole.includes('ADMIN') ? '#EEEDFE' : '#EAF3DE',
                        color:      t.adminRole.includes('ADMIN') ? '#3C3489' : '#27500A',
                        fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999
                      }}>
                        {t.adminRole.includes('ADMIN') ? t.adminRole : 'Produtor'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>—</span>
                    )}
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

                  {/* ── Coluna Usuários — link clicável ── */}
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => abrirUsuarios(t)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#534AB7', fontSize: 13, fontWeight: 500, padding: 0,
                        textDecoration: 'underline', textUnderlineOffset: 3,
                      }}
                    >
                      {t.totalUsuarios} {t.totalUsuarios === 1 ? 'usuário' : 'usuários'} →
                    </button>
                  </td>

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

      {/* ── Modal editar tenant ── */}
      {showModal && editando && (
        <Modal onClose={() => setShowModal(false)} maxWidth={440}>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: 'var(--color-text-primary)' }}>
                Editar tenant — {editando.usuarioAdminNome}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelSt}>Nome do produtor</label>
                  <input value={formEdicao.nome} onChange={e => setFormEdicao(f => ({ ...f, nome: e.target.value }))} style={inputSt} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelSt}>Plano</label>
                    <select value={formEdicao.plano} onChange={e => setFormEdicao(f => ({ ...f, plano: e.target.value }))} style={inputSt}>
                      <option value="BASICO">Básico</option>
                      <option value="PRO">Pro</option>
                      <option value="COMERCIAL">Comercial</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelSt}>Status</label>
                    <select value={formEdicao.status} onChange={e => setFormEdicao(f => ({ ...f, status: e.target.value }))} style={inputSt}>
                      <option value="TRIAL">Trial</option>
                      <option value="ATIVO">Ativo</option>
                      <option value="EXPIRADO">Expirado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelSt}>Trial expira em</label>
                  <input type="date" value={formEdicao.trialExpira} onChange={e => setFormEdicao(f => ({ ...f, trialExpira: e.target.value }))} style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Assinatura expira em</label>
                  <input type="date" value={formEdicao.assinaturaExpira} onChange={e => setFormEdicao(f => ({ ...f, assinaturaExpira: e.target.value }))} style={inputSt} />
                </div>
              </div>
              {erro && <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{erro}</p>}

              {/* Botões salvar/cancelar */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={salvar} disabled={salvando} style={{ flex: 2, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {salvando ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>

              {/* ── Zona de exclusão ── */}
              {!showConfirmDelete ? (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => { setShowConfirmDelete(true); setConfirmNome('') }}
                    style={{ width: '100%', background: 'transparent', border: '0.5px solid #FECACA', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#A32D2D', cursor: 'pointer' }}
                  >
                    Excluir tenant permanentemente
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 12, background: '#FEF2F2', border: '0.5px solid #FECACA', borderRadius: 8, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#A32D2D', marginBottom: 6 }}>
                    ⚠️ Esta ação é irreversível. Todos os dados do tenant serão apagados.
                  </p>
                  <p style={{ fontSize: 12, color: '#A32D2D', marginBottom: 10 }}>
                    Digite <strong>{editando?.nome}</strong> para confirmar:
                  </p>
                  <input
                    value={confirmNome}
                    onChange={e => setConfirmNome(e.target.value)}
                    placeholder={editando?.nome}
                    style={{ ...inputSt, marginBottom: 10, borderColor: '#FECACA' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setShowConfirmDelete(false); setConfirmNome('') }}
                      style={{ flex: 1, background: 'transparent', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: '7px 0', fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={excluirTenant}
                      disabled={confirmNome !== editando?.nome || excluindo}
                      style={{
                        flex: 2, border: 'none', borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 500,
                        cursor: confirmNome === editando?.nome ? 'pointer' : 'not-allowed',
                        background: confirmNome === editando?.nome ? '#A32D2D' : '#FECACA',
                        color: '#fff', opacity: excluindo ? 0.7 : 1,
                      }}
                    >
                      {excluindo ? 'Excluindo...' : 'Confirmar exclusão'}
                    </button>
                  </div>
                </div>
              )}

        </Modal>
      )}

      {/* ── Modal novo tenant ── */}
      {showNovo && (
        <Modal onClose={() => setShowNovo(false)} maxWidth={440}>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 16, color: 'var(--color-text-primary)' }}>Novo tenant</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Dados da empresa</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <div>
                  <label style={labelSt}>Nome da empresa</label>
                  <input value={formNovo.nome} onChange={e => setFormNovo(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Cogumelos São Paulo" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Email da empresa</label>
                  <input type="email" value={formNovo.email} onChange={e => setFormNovo(f => ({ ...f, email: e.target.value }))} placeholder="empresa@email.com" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Plano inicial</label>
                  <select value={formNovo.plano} onChange={e => setFormNovo(f => ({ ...f, plano: e.target.value }))} style={inputSt}>
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
                  <input value={formNovo.adminNome} onChange={e => setFormNovo(f => ({ ...f, adminNome: e.target.value }))} placeholder="Nome completo" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Email</label>
                  <input type="email" value={formNovo.adminEmail} onChange={e => setFormNovo(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@empresa.com" style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Senha inicial</label>
                  <input type="password" value={formNovo.adminSenha} onChange={e => setFormNovo(f => ({ ...f, adminSenha: e.target.value }))} placeholder="Mínimo 6 caracteres" style={inputSt} />
                </div>
              </div>
              {erroNovo && <p style={{ fontSize: 12, color: '#A32D2D', marginTop: 10 }}>{erroNovo}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                <button onClick={() => setShowNovo(false)} style={{ flex: 1, background: 'transparent', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, fontSize: 13, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={criarTenant} disabled={salvando} style={{ flex: 2, background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, padding: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  {salvando ? 'Criando...' : 'Criar tenant'}
                </button>
              </div>
        </Modal>
      )}

      {/* ── Modal usuários do tenant ── */}
      {showUsuarios && tenantUsuarios && (
        <Modal onClose={() => setShowUsuarios(false)} maxWidth={480} contentStyle={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Usuários — {tenantUsuarios.nome}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {usuarios.length} {usuarios.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
                  </p>
                </div>
                <button
                  onClick={() => setShowUsuarios(false)}
                  style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >×</button>
              </div>

              {erroUsuarios && (
                <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#791F1F' }}>
                  {erroUsuarios}
                </div>
              )}

              {/* Lista */}
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loadingUsuarios ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                    Carregando...
                  </p>
                ) : usuarios.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '24px 0' }}>
                    Nenhum usuário encontrado.
                  </p>
                ) : usuarios.map(u => {
                  const av = avatarColor(u.nome)
                  const isAdmin = u.role === 'ADMIN'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--color-background-secondary)' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                        {initials(u.nome)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{u.nome}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: isAdmin ? '#EEEDFE' : '#EAF3DE', color: isAdmin ? '#3C3489' : '#27500A', flexShrink: 0 }}>
                        {isAdmin ? 'Admin' : 'Produtor'}
                      </span>
                      <button
                        onClick={() => !isAdmin && removerUsuario(u.id)}
                        disabled={removendo === u.id || isAdmin}
                        style={{
                          fontSize: 12, padding: '4px 10px', borderRadius: 6,
                          cursor: isAdmin ? 'not-allowed' : 'pointer',
                          border: '0.5px solid',
                          background: isAdmin ? 'transparent' : '#FEF2F2',
                          borderColor: isAdmin ? 'var(--color-border-secondary)' : '#FECACA',
                          color: isAdmin ? 'var(--color-text-tertiary)' : '#A32D2D',
                          opacity: removendo === u.id ? 0.6 : 1,
                          flexShrink: 0,
                        }}
                      >
                        {removendo === u.id ? '...' : isAdmin ? '—' : 'Remover'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Aviso */}
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: '#FAEEDA', border: '0.5px solid #F0C98A' }}>
                <p style={{ fontSize: 12, color: '#633806' }}>
                  ⚠️ Ao remover um usuário todos os seus dados serão deletados permanentemente.
                </p>
              </div>

        </Modal>
      )}

    </div>
  )
}
