// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { useInsumos } from '@/hooks/useInsumos'

export default function InsumosPage() {
  return <ProtectedRoute><Insumos /></ProtectedRoute>
}

function Insumos() {
  const { isAdmin } = useAuth()
  const {
    insumos, categorias, todasCats, filtrados,
    filtro, setFiltro, busca, setBusca,
    modal, setModal, editando,
    novaCategoria, setNovaCategoria, form, setForm, novaCtg, setNovaCtg,
    salvando, erro, setErro,
    confirmandoDelete, setConfirmandoDelete, erroDeletar, setErroDeletar,
    abrirNovo, abrirEditar, salvar, deletar,
  } = useInsumos()

  const CAT_COLORS: Record<string,{bg:string;color:string}> = {
    'Gramínea':  { bg:'#E3F0FF', color:'#0C447C' },
    'Farelo':    { bg:'#E1F5EE', color:'#085041' },
    'Palha':     { bg:'#FAEEDA', color:'#633806' },
    'Resíduo':   { bg:'#EEEDFE', color:'#3C3489' },
    'Madeira':   { bg:'#EAF3DE', color:'#27500A' },
  }
  function catStyle(cat:string|null) {
    if (!cat) return { bg:'#F1EFE8', color:'#888' }
    return CAT_COLORS[cat] ?? { bg:'#F1EFE8', color:'#555' }
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#111', marginBottom:2 }}>Insumos</h1>
          <p style={{ fontSize:14, color:'#888' }}>Catálogo de materiais</p>
        </div>
        {isAdmin && <button className="btn-primary" onClick={abrirNovo}>+ Insumo</button>}
      </div>

      {erroDeletar && (
        <div style={{ background:'#FCEBEB', border:'0.5px solid #F09595', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:13, color:'#791F1F', margin:0 }}>{erroDeletar}</p>
          <button onClick={() => setErroDeletar('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#A32D2D' }}>✕</button>
        </div>
      )}

      {/* Busca mobile */}
      <input
        className="input"
        style={{ marginBottom:12 }}
        value={busca}
        onChange={e => setBusca(e.target.value)}
        placeholder="🔍  Buscar insumo..."
      />

      {/* Filtro categorias — scroll horizontal */}
      <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:4, marginBottom:16, WebkitOverflowScrolling:'touch' }}>
        {todasCats.map(c => (
          <button
            key={c}
            onClick={() => setFiltro(c)}
            style={{
              flexShrink:0, padding:'6px 14px', borderRadius:999,
              fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid',
              background: filtro===c ? 'var(--purple)' : '#fff',
              borderColor: filtro===c ? 'var(--purple)' : '#EBEBEB',
              color: filtro===c ? '#fff' : '#555',
            }}
          >
            {c}
            {c !== 'Todos' && (
              <span style={{ marginLeft:4, opacity:.65, fontSize:11 }}>
                ({insumos.filter(i => i.categoria===c).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden" style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtrados.length === 0 && (
          <p style={{ textAlign:'center', color:'#bbb', padding:'32px 0' }}>Nenhum insumo encontrado.</p>
        )}
        {filtrados.map(i => {
          const cs = catStyle(i.categoria)
          return (
            <div key={i.id} style={{ background:'#fff', border:'1px solid #EBEBEB', borderRadius:14, padding:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#111' }}>{i.nome}</p>
                  {i.categoria && (
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:999, background:cs.bg, color:cs.color }}>
                      {i.categoria}
                    </span>
                  )}
                </div>
                <p style={{ fontSize:18, fontWeight:800, color: (i.cnRatio ?? (i.nitrogenioPct > 0 ? i.carbonoPct / i.nitrogenioPct : 0)) > 100 ? 'var(--amber)' : 'var(--teal)' }}>
                  C/N {(i.cnRatio ?? (i.nitrogenioPct > 0 ? i.carbonoPct / i.nitrogenioPct : null))?.toFixed(2) ?? '—'}
                </p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                {[
                  { label:'MO%', value:(i.moPct*100).toFixed(2) },
                  { label:'C%',  value:(i.carbonoPct*100).toFixed(2) },
                  { label:'N%',  value:(i.nitrogenioPct*100).toFixed(2) },
                  { label:'pH',  value:i.ph??'—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background:'#F7F6F3', borderRadius:8, padding:'6px 8px' }}>
                    <p style={{ fontSize:9, color:'#888', marginBottom:1 }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:700, color:'#111' }}>{value}</p>
                  </div>
                ))}
              </div>
              {isAdmin && (
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  <button className="btn" style={{ flex:1, fontSize:12 }} onClick={() => abrirEditar(i)}>Editar</button>
                  {confirmandoDelete === i.id ? (
                    <span style={{ display:'flex', gap:4, alignItems:'center', flex:1 }}>
                      <button onClick={() => deletar(i.id)} style={{ flex:1, fontSize:11, padding:'6px 4px', borderRadius:8, background:'var(--red)', color:'#fff', border:'none', cursor:'pointer', fontWeight:600 }}>Confirmar</button>
                      <button onClick={() => setConfirmandoDelete(null)} style={{ flex:1, fontSize:11, padding:'6px 4px', borderRadius:8, background:'transparent', color:'#888', border:'0.5px solid #ddd', cursor:'pointer' }}>Cancelar</button>
                    </span>
                  ) : (
                    <button style={{ flex:1, fontSize:12, padding:'8px', borderRadius:10, background:'var(--red-l)', color:'var(--red)', border:'none', cursor:'pointer', fontWeight:600 }}
                      onClick={() => setConfirmandoDelete(i.id)}>Remover</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop: tabela */}
      <div className="card hidden sm:block" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table className="tbl" style={{ minWidth:480 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft:18 }}>Material</th>
                <th>Categoria</th>
                <th style={{ textAlign:'right' }}>MO%</th>
                <th style={{ textAlign:'right' }}>C%</th>
                <th style={{ textAlign:'right' }}>N%</th>
                <th style={{ textAlign:'right' }}>C/N</th>
                <th style={{ textAlign:'right' }}>pH</th>
                {isAdmin && <th style={{ paddingRight:18 }} />}
              </tr>
            </thead>
            <tbody>
              {filtrados.map(i => {
                const cs = catStyle(i.categoria)
                return (
                  <tr key={i.id}>
                    <td style={{ fontWeight:700, paddingLeft:18 }}>{i.nome}</td>
                    <td>
                      {i.categoria ? (
                        <span style={{ fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:999, background:cs.bg, color:cs.color }}>
                          {i.categoria}
                        </span>
                      ) : <span style={{ color:'#bbb' }}>—</span>}
                    </td>
                    <td style={{ textAlign:'right', color:'#888' }}>{(i.moPct*100).toFixed(1)}</td>
                    <td style={{ textAlign:'right', color:'#888' }}>{(i.carbonoPct*100).toFixed(1)}</td>
                    <td style={{ textAlign:'right', color:'#888' }}>{(i.nitrogenioPct*100).toFixed(2)}</td>
                    <td style={{ textAlign:'right', fontWeight:700, color:i.cnRatio>100?'var(--amber)':'var(--teal)' }}>
                      {i.cnRatio?.toFixed(0)??'—'}
                    </td>
                    <td style={{ textAlign:'right', color:'#888' }}>{i.ph??'—'}</td>
                    {isAdmin && (
                      <td style={{ textAlign:'right', paddingRight:18, whiteSpace:'nowrap' }}>
                        <button onClick={() => abrirEditar(i)} style={{ fontSize:12, color:'#aaa', background:'none', border:'none', cursor:'pointer', marginRight:8 }}>editar</button>
                        {confirmandoDelete === i.id ? (
                          <>
                            <button onClick={() => deletar(i.id)} style={{ fontSize:12, color:'#fff', background:'var(--red)', border:'none', borderRadius:6, padding:'2px 8px', cursor:'pointer', marginRight:4 }}>confirmar</button>
                            <button onClick={() => setConfirmandoDelete(null)} style={{ fontSize:12, color:'#888', background:'none', border:'none', cursor:'pointer' }}>cancelar</button>
                          </>
                        ) : (
                          <button onClick={() => setConfirmandoDelete(i.id)} style={{ fontSize:12, color:'var(--red)', background:'none', border:'none', cursor:'pointer' }}>remover</button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtrados.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign:'center', color:'#bbb', padding:'32px 0' }}>Nenhum insumo encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom sheet: modal criar/editar */}
      {modal && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, display:'flex', alignItems:'flex-end' }}
          className="sm:items-center sm:p-4"
          onClick={() => setModal(false)}
        >
          <div
            style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 40px', width:'100%', maxHeight:'90vh', overflowY:'auto' }}
            className="sm:rounded-[20px] sm:max-w-[480px] sm:mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sm:hidden" style={{ width:36, height:4, borderRadius:2, background:'#E0E0E0', margin:'0 auto 16px' }} />
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>
              {editando ? 'Editar insumo' : 'Novo insumo'}
            </h2>

            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.nome}
                  onChange={e => setForm(f => ({...f, nome:e.target.value}))} placeholder="Ex: Serragem de eucalipto" />
              </div>

              <div>
                <label className="label">Categoria</label>
                {!novaCategoria ? (
                  <div style={{ display:'flex', gap:8 }}>
                    <select className="input" style={{ flex:1 }} value={form.categoria}
                      onChange={e => setForm(f => ({...f, categoria:e.target.value}))}>
                      <option value="">Sem categoria</option>
                      {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn" style={{ fontSize:12 }} onClick={() => setNovaCategoria(true)}>+ Nova</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:8 }}>
                    <input className="input" style={{ flex:1 }} placeholder="Nome da nova categoria"
                      value={novaCtg} onChange={e => setNovaCtg(e.target.value)} autoFocus />
                    <button className="btn" style={{ fontSize:12 }} onClick={() => setNovaCategoria(false)}>Cancelar</button>
                  </div>
                )}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                <div>
                  <label className="label">MO (0–1)</label>
                  <input type="number" step={0.001} className="input" value={form.moPct}
                    onChange={e => setForm(f => ({...f, moPct:e.target.value}))} />
                </div>
                <div>
                  <label className="label">C% (0–1)</label>
                  <input type="number" step={0.001} className="input" value={form.carbonoPct}
                    onChange={e => setForm(f => ({...f, carbonoPct:e.target.value}))} />
                </div>
                <div>
                  <label className="label">N% (0–1)</label>
                  <input type="number" step={0.0001} className="input" value={form.nitrogenioPct}
                    onChange={e => setForm(f => ({...f, nitrogenioPct:e.target.value}))} />
                </div>
              </div>

              <div>
                <label className="label">pH (opcional)</label>
                <input type="number" step={0.1} className="input" value={form.ph}
                  onChange={e => setForm(f => ({...f, ph:e.target.value}))} placeholder="Ex: 6.5" />
              </div>
            </div>

            {erro && <p style={{ fontSize:12, color:'var(--red)', marginTop:10 }}>{erro}</p>}

            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <button className="btn" style={{ flex:1 }} onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={salvar} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
