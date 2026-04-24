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

  const contribsPct = contribs
    .map(({ id, nome, cKg }) => ({ id, nome, pct: totalC > 0 ? (cKg/totalC)*100 : 0 }))
    .filter(c => c.pct > 0)

  function setLinha(i: number, field: keyof Linha, value: string | number) {
    setLinhas(l => l.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function duplicarFormulacao(f: Formulacao) {
    setNome(f.nome + ' (cópia)')
    setEspecieId(f.especieId)
    setLinhas(f.insumos.map(fi => ({
      insumoId:   fi.insumoId,
      pesoRealKg: fi.pesoRealKg,
      umidadePct: Math.round(fi.umidadePct * 100),
    })))
    setShowFormulacoes(false)
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
      api.formulacoes.listar().then((d:any) => setFormulacoes(d))
    } catch(e:any) { setMsg(e.message); setMsgOk(false) }
    finally { setSalvando(false) }
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:'#111', marginBottom:2 }}>Calculadora</h1>
        <p style={{ fontSize:14, color:'#888' }}>Monte sua formulação e veja o C/N em tempo real</p>
      </div>

      {/* Métricas — 2 cols mobile, 4 desktop */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:12 }}
        className="sm:grid-cols-4">
        <MetricCard label="Relação C/N" value={cnTotal !== null ? cnTotal.toFixed(1) : '—'}
          unit={especie ? `ideal: ${especie.cnMin}–${especie.cnMax}` : ''}
          highlight={cnTotal !== null && especie ? cnTotal >= especie.cnMin && cnTotal <= especie.cnMax : false}
          warn={cnTotal !== null && especie ? cnTotal < especie.cnMin || cnTotal > especie.cnMax : false} />
        <MetricCard label="pH médio"   value={phMedio ? phMedio.toFixed(1) : '—'} unit="estimado" />
        <MetricCard label="Peso total" value={totalPeso.toFixed(1)} unit="kg" />
        <MetricCard label="Espécie"    value={especie?.nome.split(' ')[0] ?? '—'} />
      </div>

      {especie && (
        <CnAlert cnTotal={cnTotal} cnMin={especie.cnMin} cnMax={especie.cnMax} especieNome={especie.nome} />
      )}

      {/* Nome e espécie */}
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14 }}
          className="sm:flex-row">
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

        {/* Header de colunas — só desktop */}
        <div className="hidden sm:grid" style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 32px', gap:8, paddingBottom:8, borderBottom:'1px solid #F0F0F0', marginBottom:4 }}>
          {['Material','Peso (kg)','Umidade (%)','C (kg)','N (kg)',''].map((h,i) => (
            <span key={i} style={{ fontSize:10, fontWeight:700, color:'#bbb', textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</span>
          ))}
        </div>

        {/* Linhas de insumos */}
        {linhas.map((l, i) => {
          const ins = insumos.find(x => x.id === l.insumoId)
          const ps  = ins ? l.pesoRealKg * (1 - l.umidadePct/100) : 0
          return (
            <div key={i} style={{ borderBottom:'1px solid #F7F6F3', paddingBottom:10, marginBottom:10 }}>
              {/* Mobile */}
              <div className="sm:hidden">
                <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <select className="input" style={{ flex:1 }} value={l.insumoId}
                    onChange={e => setLinha(i,'insumoId',e.target.value)}>
                    <option value="">Selecione o insumo...</option>
                    {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                  </select>
                  <button onClick={() => setLinhas(l => l.filter((_,idx) => idx !== i))}
                    style={{ color:'var(--red)', fontSize:22, background:'none', border:'none', cursor:'pointer', padding:'0 6px' }}>×</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <label className="label">Peso (kg)</label>
                    <input type="number" min={0} step={0.1} className="input" value={l.pesoRealKg}
                      onChange={e => setLinha(i,'pesoRealKg',parseFloat(e.target.value)||0)} />
                  </div>
                  <div>
                    <label className="label">Umidade (%)</label>
                    <input type="number" min={0} max={100} className="input" value={l.umidadePct}
                      onChange={e => setLinha(i,'umidadePct',parseFloat(e.target.value)||0)} />
                  </div>
                </div>
                {ins && (
                  <p style={{ fontSize:11, color:'#888', marginTop:4 }}>
                    C: {(ps*ins.carbonoPct).toFixed(2)} kg · N: {(ps*ins.nitrogenioPct).toFixed(4)} kg
                  </p>
                )}
              </div>
              {/* Desktop */}
              <div className="hidden sm:grid" style={{ gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 32px', gap:8, alignItems:'center' }}>
                <select className="input text-xs" value={l.insumoId} onChange={e => setLinha(i,'insumoId',e.target.value)}>
                  <option value="">Selecione...</option>
                  {insumos.map(ins => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                </select>
                <input type="number" min={0} step={0.1} className="input text-xs" value={l.pesoRealKg}
                  onChange={e => setLinha(i,'pesoRealKg',parseFloat(e.target.value)||0)} />
                <input type="number" min={0} max={100} className="input text-xs" value={l.umidadePct}
                  onChange={e => setLinha(i,'umidadePct',parseFloat(e.target.value)||0)} />
                <span style={{ fontSize:13, color:'#888' }}>{ins ? (ps*ins.carbonoPct).toFixed(2) : '—'}</span>
                <span style={{ fontSize:13, color:'#888' }}>{ins ? (ps*ins.nitrogenioPct).toFixed(4) : '—'}</span>
                <button onClick={() => setLinhas(l => l.filter((_,idx) => idx !== i))}
                  style={{ color:'#ddd', fontSize:20, background:'none', border:'none', cursor:'pointer' }}>×</button>
              </div>
            </div>
          )
        })}

        {/* Ações */}
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

      {/* Contribuição por insumo — mobile card */}
      {contribsPct.length > 0 && (
        <div className="card" style={{ marginBottom:12 }}>
          <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Contribuição no C/N</h3>
          {contribsPct.map(({ id, nome, pct }, i) => (
            <ContribuicaoBar key={id} nome={nome} pct={pct} cor={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </div>
      )}

      {/* Formulações salvas */}
      {formulacoes.length > 0 && (
        <>
          {/* Mobile: botão que abre bottom sheet */}
          <button
            className="sm:hidden btn"
            style={{ width:'100%', marginBottom:12, justifyContent:'space-between' }}
            onClick={() => setShowFormulacoes(true)}
          >
            <span>Ver formulações salvas ({formulacoes.length})</span>
            <span>›</span>
          </button>

          {/* Desktop: tabela inline */}
          <div className="card hidden sm:block">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Formulações salvas</h3>
            <div className="table-wrap">
              <table className="tbl" style={{ minWidth:400 }}>
                <thead>
                  <tr>
                    <th>Nome</th><th>Espécie</th><th>C/N</th><th>Criado por</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {formulacoes.map(f => (
                    <tr key={f.id}>
                      <td style={{ fontWeight:600 }}>{f.nome}</td>
                      <td style={{ color:'#888' }}>{f.especieNome}</td>
                      <td style={{ fontWeight:700, color: f.cnDentroFaixa ? 'var(--teal)' : 'var(--amber)' }}>
                        {f.cnTotal?.toFixed(1) ?? '—'}
                      </td>
                      <td style={{ color:'#bbb', fontSize:12 }}>{f.usuarioNome}</td>
                      <td style={{ textAlign:'right' }}>
                        <button style={{ fontSize:12, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', marginRight:8 }}
                          onClick={() => duplicarFormulacao(f)}>duplicar</button>
                        <button style={{ fontSize:12, color:'var(--red)', background:'none', border:'none', cursor:'pointer' }}
                          onClick={() => api.formulacoes.deletar(f.id).then(() => api.formulacoes.listar().then((d:any) => setFormulacoes(d)))}>
                          remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Bottom sheet: formulações no mobile */}
      {showFormulacoes && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, display:'flex', alignItems:'flex-end' }}
          onClick={() => setShowFormulacoes(false)}
        >
          <div
            style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 40px', width:'100%', maxHeight:'80vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
              <div style={{ width:36, height:4, borderRadius:2, background:'#E0E0E0', flex:1, margin:'0 auto' }} />
              <button
                onClick={() => setShowFormulacoes(false)}
                style={{ marginLeft:'auto', background:'#F0F0F0', border:'none', width:32, height:32, borderRadius:'50%', fontSize:16, color:'#555', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
              >✕</button>
            </div>
            <h3 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Formulações salvas</h3>
            {formulacoes.map(f => (
              <div key={f.id} style={{ padding:'12px 0', borderBottom:'0.5px solid #F0F0F0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:'#111' }}>{f.nome}</p>
                  <p style={{ fontSize:12, color:'#888' }}>
                    {f.especieNome} · C/N <span style={{ fontWeight:700, color: f.cnDentroFaixa ? 'var(--teal)' : 'var(--amber)' }}>{f.cnTotal?.toFixed(1)??'—'}</span>
                  </p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn" style={{ fontSize:12, padding:'6px 12px' }} onClick={() => duplicarFormulacao(f)}>
                    Duplicar
                  </button>
                  <button style={{ fontSize:12, color:'var(--red)', background:'none', border:'none', cursor:'pointer' }}
                    onClick={() => api.formulacoes.deletar(f.id).then(() => { api.formulacoes.listar().then((d:any) => setFormulacoes(d)); })}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
