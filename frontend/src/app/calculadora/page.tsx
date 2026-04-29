// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Insumo, Especie, Formulacao } from '@/lib/types'
import { MetricCard, CnAlert, ContribuicaoBar } from '@/components/Components'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Linha { insumoId: string; pesoRealKg: number; umidadePct: number }

const DRAFT_KEY = 'cogumelos:calc-draft'
const BAR_COLORS = ['var(--purple)','var(--teal-m)','var(--amber)','var(--blue)','#D2A8FF']

function calcular(linhas: Linha[], insumos: Insumo[]) {
  let totalC = 0, totalN = 0, totalPeso = 0, somaPh = 0, countPh = 0
  const contribs: { id: string; nome: string; cKg: number }[] = []
  for (const l of linhas) {
    const ins = insumos.find(i => i.id === l.insumoId)
    if (!ins || !l.pesoRealKg) { contribs.push({ id: l.insumoId, nome: '—', cKg: 0 }); continue }
    const ps  = l.pesoRealKg * (1 - l.umidadePct / 100)
    const cKg = ps * ins.carbonoPct
    const nKg = ps * ins.nitrogenioPct
    totalC    += cKg; totalN += nKg; totalPeso += l.pesoRealKg
    if (ins.ph !== null) { somaPh += ins.ph; countPh++ }
    contribs.push({ id: l.insumoId, nome: ins.nome, cKg })
  }
  return {
    cnTotal:  totalN > 0 ? totalC / totalN : null,
    phMedio:  countPh > 0 ? somaPh / countPh : null,
    totalPeso, contribs, totalC,
  }
}

// ─── Modal de consulta ───────────────────────────────────────────────────────
function ModalConsulta({ formulacao, onFechar }: { formulacao: Formulacao, onFechar: () => void }) {
  const pesoTotal = formulacao.insumos.reduce((acc, i) => acc + i.pesoRealKg, 0)

  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E8E8E8', padding: '20px', width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 6px' }}>{formulacao.nome}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#EEEDFE', color: '#534AB7' }}>{formulacao.especieNome}</span>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#FEF3C7', color: '#92400E' }}>em uso</span>
            </div>
          </div>
          <button onClick={onFechar} style={{ background: '#F0F0F0', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'C/N', value: formulacao.cnTotal?.toFixed(1) ?? '—' },
            { label: 'pH médio', value: formulacao.phMedio?.toFixed(1) ?? '—' },
            { label: 'Peso total', value: `${pesoTotal.toFixed(1)} kg` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#F7F6F3', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#888', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#111' }}>{value}</p>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '0.5px solid #F0F0F0', paddingTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 10px' }}>Composição</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {formulacao.insumos.map(ins => (
              <div key={ins.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F7F6F3', borderRadius: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{ins.insumoNome}</span>
                <span style={{ fontSize: 12, color: '#888' }}>{ins.pesoRealKg} kg · {(ins.umidadePct * 100).toFixed(0)}% umid.</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#bbb', textAlign: 'right', marginTop: 16, marginBottom: 0 }}>Criado por {formulacao.usuarioNome}</p>
      </div>
    </div>
  )
}

// ─── Modal de edição ─────────────────────────────────────────────────────────
function ModalEdicao({ formulacao, insumos, especies, onFechar, onSalva }: {
  formulacao: Formulacao
  insumos: Insumo[]
  especies: Especie[]
  onFechar: () => void
  onSalva: () => void
}) {
  const [nome, setNome]           = useState(formulacao.nome)
  const [especieId, setEspecieId] = useState(formulacao.especieId)
  const [linhas, setLinhas]       = useState<Linha[]>(
    formulacao.insumos.map(fi => ({
      insumoId:   fi.insumoId,
      pesoRealKg: fi.pesoRealKg,
      umidadePct: Math.round(fi.umidadePct * 100),
    }))
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  const especie = especies.find(e => e.id === especieId)
  const { cnTotal } = calcular(linhas, insumos)

  function setLinha(i: number, field: keyof Linha, value: string | number) {
    setLinhas(l => l.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  async function salvar() {
    if (!nome.trim()) { setErro('Preencha o nome.'); return }
    const validas = linhas.filter(l => l.insumoId && l.pesoRealKg > 0)
    if (!validas.length) { setErro('Adicione pelo menos um insumo.'); return }
    setSalvando(true); setErro('')
    try {
      await api.formulacoes.atualizar(formulacao.id, {
        especieId, nome,
        insumos: validas.map(l => ({ ...l, umidadePct: l.umidadePct / 100 }))
      })
      onSalva()
      onFechar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E8E8E8', padding: '20px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0 }}>Editar formulação</p>
          <button onClick={onFechar} style={{ background: '#F0F0F0', border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {especie && cnTotal !== null && (
          <div style={{ background: cnTotal >= especie.cnMin && cnTotal <= especie.cnMax ? '#E1F5EE' : '#FEF3C7', borderRadius: 10, padding: '8px 12px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#555' }}>C/N calculado</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: cnTotal >= especie.cnMin && cnTotal <= especie.cnMax ? '#0F6E56' : '#92400E' }}>
              {cnTotal.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 400 }}>ideal: {especie.cnMin}–{especie.cnMax}</span>
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div>
            <label className="label">Nome</label>
            <input className="input" value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div>
            <label className="label">Espécie</label>
            <select className="input" value={especieId} onChange={e => setEspecieId(e.target.value)}>
              {especies.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em', margin: '0 0 8px' }}>Composição</p>
            {linhas.map((l, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                {i === 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 28px', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em' }}>Material</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em' }}>Peso (kg)</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.04em' }}>Umidade (%)</span>
                    <span />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 28px', gap: 6, alignItems: 'center' }}>
                  <select className="input" value={l.insumoId} onChange={e => setLinha(i, 'insumoId', e.target.value)}>
                    <option value="">Selecione...</option>
                    {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                  </select>
                  <input type="number" min={0} step={0.1} className="input"
                    value={l.pesoRealKg === 0 ? '' : l.pesoRealKg}
                    onChange={e => setLinha(i, 'pesoRealKg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  <input type="number" min={0} max={100} className="input"
                    value={l.umidadePct === 0 ? '' : l.umidadePct}
                    onChange={e => setLinha(i, 'umidadePct', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  <button onClick={() => setLinhas(l => l.filter((_, idx) => idx !== i))}
                    style={{ color: '#ddd', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                </div>
              </div>
            ))}

        <button className="btn" onClick={() => setLinhas(l => [...l, { insumoId: '', pesoRealKg: 0, umidadePct: 40 }])} style={{ marginBottom: 16 }}>
          + Adicionar insumo
        </button>

        {erro && <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 10 }}>{erro}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onFechar} className="btn" style={{ padding: '10px 20px' }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary" style={{ padding: '10px 20px' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Botão de remoção ────────────────────────────────────────────────────────
function BotaoRemover({ formulacao, onRemovida, variant = 'mobile' }: {
  formulacao: Formulacao
  onRemovida: () => void
  variant?: 'mobile' | 'desktop'
}) {
  const [emUso, setEmUso]             = useState<boolean | null>(null)
  const [loading, setLoading]         = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  async function verificar() {
    setLoading(true)
    try {
      const resultado = await api.formulacoes.emUso(formulacao.id) as boolean
      setEmUso(resultado)
      if (!resultado) setConfirmando(true)
    } finally {
      setLoading(false)
    }
  }

  async function confirmarRemocao() {
    try {
      await api.formulacoes.deletar(formulacao.id)
      onRemovida()
    } catch (e: any) { alert(e.message) }
  }

  if (emUso === true) {
    return <span style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>em uso</span>
  }

  if (confirmando) {
    return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--red)' }}>Confirmar?</span>
        <button onClick={confirmarRemocao} style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: '1px solid var(--red)', borderRadius: 6, padding: '2px 8px', cursor: 'pointer' }}>sim</button>
        <button onClick={() => { setConfirmando(false); setEmUso(null) }} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>não</button>
      </span>
    )
  }

  if (variant === 'desktop') {
    return (
      <button onClick={verificar} disabled={loading} style={{ fontSize: 12, color: loading ? '#bbb' : 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>
        {loading ? '...' : 'remover'}
      </button>
    )
  }

  return (
    <button onClick={verificar} disabled={loading} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading ? '...' : '×'}
    </button>
  )
}

// ─── Página ──────────────────────────────────────────────────────────────────
export default function CalculadoraPage() {
  return <ProtectedRoute><Calculadora /></ProtectedRoute>
}

function Calculadora() {
  const [insumos, setInsumos]         = useState<Insumo[]>([])
  const [especies, setEspecies]       = useState<Especie[]>([])
  const [formulacoes, setFormulacoes] = useState<Formulacao[]>([])
  const [especieId, setEspecieId]     = useState('')
  const [nome, setNome]               = useState('')
  const [linhas, setLinhas]           = useState<Linha[]>([{ insumoId:'', pesoRealKg:0, umidadePct:40 }])
  const [salvando, setSalvando]       = useState(false)
  const [msg, setMsg]                 = useState('')
  const [msgOk, setMsgOk]             = useState(false)
  const [showFormulacoes, setShowFormulacoes] = useState(false)
  const [modalConsulta, setModalConsulta]     = useState<Formulacao | null>(null)
  const [modalEdicao, setModalEdicao]         = useState<Formulacao | null>(null)

  useEffect(() => {
    api.insumos.listar().then((d:any) => setInsumos(d))
    api.especies.listar().then((d:any) => { setEspecies(d); if (d[0]) setEspecieId(d[0].id) })
    api.formulacoes.listar().then((d:any) => setFormulacoes(d))
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const { nome:n, especieId:eid, linhas:l } = JSON.parse(draft)
        if (n)    setNome(n)
        if (eid)  setEspecieId(eid)
        if (l?.length) setLinhas(l)
      }
    } catch { /* ignora */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ nome, especieId, linhas })) } catch { /* ignora */ }
  }, [nome, especieId, linhas])

  const especie = especies.find(e => e.id === especieId)
  const { cnTotal, phMedio, totalPeso, contribs, totalC } = calcular(linhas, insumos)
  const contribsPct = contribs.map(({ id, nome, cKg }) => ({ id, nome, pct: totalC > 0 ? (cKg/totalC)*100 : 0 })).filter(c => c.pct > 0)

  function setLinha(i: number, field: keyof Linha, value: string | number) {
    setLinhas(l => l.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function duplicarFormulacao(f: Formulacao) {
    setNome(f.nome + ' (cópia)')
    setEspecieId(f.especieId)
    setLinhas(f.insumos.map(fi => ({ insumoId: fi.insumoId, pesoRealKg: fi.pesoRealKg, umidadePct: Math.round(fi.umidadePct * 100) })))
    setShowFormulacoes(false)
  }

  function recarregarFormulacoes() {
    api.formulacoes.listar().then((d:any) => setFormulacoes(d))
  }

  async function salvar() {
    if (!especieId || !nome.trim()) { setMsg('Preencha nome e espécie.'); setMsgOk(false); return }
    const validas = linhas.filter(l => l.insumoId && l.pesoRealKg > 0)
    if (!validas.length) { setMsg('Adicione pelo menos um insumo.'); setMsgOk(false); return }
    setSalvando(true); setMsg('')
    try {
      await api.formulacoes.criar({ especieId, nome, insumos: validas.map(l => ({ ...l, umidadePct: l.umidadePct/100 })) })
      setMsg('Formulação salva!'); setMsgOk(true)
      setNome(''); setLinhas([{ insumoId:'', pesoRealKg:0, umidadePct:40 }])
      localStorage.removeItem(DRAFT_KEY)
      recarregarFormulacoes()
    } catch(e:any) { setMsg(e.message); setMsgOk(false) }
    finally { setSalvando(false) }
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#111', marginBottom:2 }}>Calculadora</h1>
        <p style={{ fontSize:14, color:'#888' }}>Monte sua formulação e veja o C/N em tempo real</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:12 }} className="sm:grid-cols-4">
        <MetricCard label="Relação C/N" value={cnTotal !== null ? cnTotal.toFixed(1) : '—'}
          unit={especie ? `ideal: ${especie.cnMin}–${especie.cnMax}` : ''}
          highlight={cnTotal !== null && especie ? cnTotal >= especie.cnMin && cnTotal <= especie.cnMax : false}
          warn={cnTotal !== null && especie ? cnTotal < especie.cnMin || cnTotal > especie.cnMax : false} />
        <MetricCard label="pH médio" value={phMedio ? phMedio.toFixed(1) : '—'} unit="estimado" />
        <MetricCard label="Peso total" value={totalPeso.toFixed(1)} unit="kg" />
        <MetricCard label="Espécie" value={especie?.nome.split(' ')[0] ?? '—'} />
      </div>

      {especie && <CnAlert cnTotal={cnTotal} cnMin={especie.cnMin} cnMax={especie.cnMax} especieNome={especie.nome} />}

      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }} className="sm:flex-row">
          <div style={{ flex:1 }}>
            <label className="label">Nome da formulação</label>
            <input className="input" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Shimeji A3" />
          </div>
          <div style={{ flex:1 }}>
            <label className="label">Espécie</label>
            <select className="input" value={especieId} onChange={e => setEspecieId(e.target.value)}>
              {especies.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="hidden sm:grid" style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 32px', gap:8, paddingBottom:8, borderBottom:'1px solid #F0F0F0', marginBottom:4 }}>
          {['Material','Peso (kg)','Umidade (%)','C (kg)','N (kg)',''].map((h,i) => (
            <span key={i} style={{ fontSize:10, fontWeight:700, color:'#bbb', textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</span>
          ))}
        </div>

        {linhas.map((l, i) => {
          const ins = insumos.find(x => x.id === l.insumoId)
          const ps  = ins ? l.pesoRealKg * (1 - l.umidadePct/100) : 0
          return (
            <div key={i} style={{ borderBottom:'1px solid #F7F6F3', paddingBottom:10, marginBottom:10 }}>
              <div className="sm:hidden">
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <select className="input" style={{ flex:1 }} value={l.insumoId} onChange={e => setLinha(i,'insumoId',e.target.value)}>
                    <option value="">Selecione o insumo...</option>
                    {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                  </select>
                  <button onClick={() => setLinhas(l => l.filter((_,idx) => idx !== i))}
                    style={{ color:'var(--red)', fontSize:22, background:'none', border:'none', cursor:'pointer', padding:'0 6px' }}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label className="label">Peso (kg)</label>
                    <input type="number" min={0} step={0.1} className="input"
                      value={l.pesoRealKg === 0 ? '' : l.pesoRealKg}
                      onChange={e => setLinha(i, 'pesoRealKg', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="label">Umidade (%)</label>
                    <input type="number" min={0} max={100} className="input"
                      value={l.umidadePct === 0 ? '' : l.umidadePct}
                      onChange={e => setLinha(i, 'umidadePct', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                {ins && <p style={{ fontSize:11, color:'#888', marginTop:4 }}>C: {(ps*ins.carbonoPct).toFixed(2)} kg · N: {(ps*ins.nitrogenioPct).toFixed(4)} kg</p>}
              </div>
              <div className="hidden sm:grid" style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 32px', gap:8, alignItems:'center' }}>
                <select className="input text-xs" value={l.insumoId} onChange={e => setLinha(i,'insumoId',e.target.value)}>
                  <option value="">Selecione...</option>
                  {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                </select>
                <input type="number" min={0} step={0.1} className="input text-xs"
                  value={l.pesoRealKg === 0 ? '' : l.pesoRealKg}
                  onChange={e => setLinha(i,'pesoRealKg', e.target.value === '' ? 0 : parseFloat(e.target.value)||0)} />
                <input type="number" min={0} max={100} className="input text-xs"
                  value={l.umidadePct === 0 ? '' : l.umidadePct}
                  onChange={e => setLinha(i,'umidadePct', e.target.value === '' ? 0 : parseFloat(e.target.value)||0)} />
                <span style={{ fontSize:13, color:'#888' }}>{ins ? (ps*ins.carbonoPct).toFixed(2) : '—'}</span>
                <span style={{ fontSize:13, color:'#888' }}>{ins ? (ps*ins.nitrogenioPct).toFixed(4) : '—'}</span>
                <button onClick={() => setLinhas(l => l.filter((_,idx) => idx !== i))}
                  style={{ color:'#ddd', fontSize:20, background:'none', border:'none', cursor:'pointer' }}>×</button>
              </div>
            </div>
          )
        })}

        <div style={{ display:'flex', flexDirection:'column', gap:8 }} className="sm:flex-row sm:justify-between">
          <button className="btn" onClick={() => setLinhas(l => [...l, { insumoId:'', pesoRealKg:0, umidadePct:40 }])}>
            + Adicionar insumo
          </button>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }} className="sm:flex-row sm:items-center">
            {msg && <span style={{ fontSize:12, color: msgOk ? 'var(--teal)' : 'var(--red)' }}>{msg}</span>}
            <button className="btn-primary" onClick={salvar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar formulação'}
            </button>
          </div>
        </div>
        <p style={{ fontSize:10, color:'#bbb', marginTop:8 }}>✓ Rascunho salvo automaticamente</p>
      </div>

      {contribsPct.length > 0 && (
        <div className="card" style={{ marginBottom:12 }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Contribuição no C/N</h3>
          {contribsPct.map(({ id, nome, pct }, i) => (
            <ContribuicaoBar key={id} nome={nome} pct={pct} cor={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </div>
      )}

      {formulacoes.length > 0 && (
        <>
          <button className="sm:hidden btn" style={{ width:'100%', marginBottom:12, justifyContent:'space-between' }} onClick={() => setShowFormulacoes(true)}>
            <span>Ver formulações salvas ({formulacoes.length})</span>
            <span>›</span>
          </button>

          <div className="card hidden sm:block">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Formulações salvas</h3>
            <div className="table-wrap">
              <table className="tbl" style={{ minWidth:400 }}>
                <thead>
                  <tr><th>Nome</th><th>Espécie</th><th>C/N</th><th>Criado por</th><th></th></tr>
                </thead>
                <tbody>
                  {formulacoes.map(f => (
                    <tr key={f.id}>
                      <td>
                        <button onClick={() => setModalEdicao(f)}
                          style={{ fontWeight:600, background:'none', border:'none', cursor:'pointer', color:'var(--purple)', padding:0, textDecoration:'underline', fontSize:'inherit' }}>
                          {f.nome}
                        </button>
                      </td>
                      <td style={{ color:'#888' }}>{f.especieNome}</td>
                      <td style={{ fontWeight:700, color: f.cnDentroFaixa ? 'var(--teal)' : 'var(--amber)' }}>{f.cnTotal?.toFixed(1) ?? '—'}</td>
                      <td style={{ color:'#bbb', fontSize:12 }}>{f.usuarioNome}</td>
                      <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                        <button style={{ fontSize:12, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', marginRight:8 }} onClick={() => duplicarFormulacao(f)}>duplicar</button>
                        <button style={{ fontSize:12, color:'var(--teal, #1D9E75)', background:'none', border:'none', cursor:'pointer', marginRight:8 }} onClick={() => setModalConsulta(f)}>consultar</button>
                        <BotaoRemover formulacao={f} onRemovida={recarregarFormulacoes} variant="desktop" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet mobile */}
      {showFormulacoes && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, display:'flex', alignItems:'flex-end' }} onClick={() => setShowFormulacoes(false)}>
          <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 40px', width:'100%', maxHeight:'80vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:'#E0E0E0', flex:1, margin:'0 auto' }} />
              <button onClick={() => setShowFormulacoes(false)} style={{ marginLeft:'auto', background:'#F0F0F0', border:'none', width:32, height:32, borderRadius:'50%', fontSize:16, color:'#555', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
            </div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Formulações salvas</h3>
            {formulacoes.map(f => (
              <div key={f.id} style={{ padding:'12px 0', borderBottom:'0.5px solid #F0F0F0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <button onClick={() => { setShowFormulacoes(false); setModalEdicao(f) }}
                    style={{ fontSize:14, fontWeight:700, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>
                    {f.nome}
                  </button>
                  <span style={{ fontSize:12, color:'#888' }}>
                    {f.especieNome} · C/N <span style={{ fontWeight:700, color: f.cnDentroFaixa ? 'var(--teal)' : 'var(--amber)' }}>{f.cnTotal?.toFixed(1)??'—'}</span>
                  </span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <button className="btn" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => duplicarFormulacao(f)}>Duplicar</button>
                  <button className="btn" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => { setShowFormulacoes(false); setModalConsulta(f) }}>Consultar</button>
                  <BotaoRemover formulacao={f} onRemovida={recarregarFormulacoes} variant="mobile" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalConsulta && <ModalConsulta formulacao={modalConsulta} onFechar={() => setModalConsulta(null)} />}
      {modalEdicao && (
        <ModalEdicao
          formulacao={modalEdicao}
          insumos={insumos}
          especies={especies}
          onFechar={() => setModalEdicao(null)}
          onSalva={recarregarFormulacoes}
        />
      )}
    </div>
  )
}
