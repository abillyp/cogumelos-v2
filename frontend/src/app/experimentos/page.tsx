// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

'use client'
import { useEffect, useState, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'
import { api } from '@/lib/api'
import { Experimento, Formulacao, Monitoramento, Colheita } from '@/lib/types'
import { TimelineBar, MiniChart, StatCard } from '@/components/Components'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

const STATUS_ORDER = ['PREPARACAO','INOCULADO','AMADURECIMENTO','FRUTIFICACAO','CONCLUIDO']
const STATUS_LABEL: Record<string,string> = {
  PREPARACAO:'Preparo', INOCULADO:'Inoculado', AMADURECIMENTO:'Amadurec.',
  FRUTIFICACAO:'Frutificação', CONCLUIDO:'Concluído',
}
const STATUS_EMOJI: Record<string,string> = {
  PREPARACAO:'🌾', INOCULADO:'🧪', AMADURECIMENTO:'🍄', FRUTIFICACAO:'🌱', CONCLUIDO:'✅',
}
const STATUS_STYLE: Record<string,{bg:string; badge:string; badgeText:string}> = {
  PREPARACAO:     { bg:'linear-gradient(135deg,#F1EFE8,#E5E3D8)', badge:'#888',    badgeText:'#fff' },
  INOCULADO:      { bg:'linear-gradient(135deg,#EEEDFE,#D5D2FB)', badge:'#534AB7', badgeText:'#fff' },
  AMADURECIMENTO: { bg:'linear-gradient(135deg,#E3FFF0,#C7F7DF)', badge:'#00A550', badgeText:'#fff' },
  FRUTIFICACAO:   { bg:'linear-gradient(135deg,#E3F0FF,#C7E0FF)', badge:'#1F6FEB', badgeText:'#fff' },
  CONCLUIDO:      { bg:'linear-gradient(135deg,#EAF3DE,#D5EBBE)', badge:'#27500A', badgeText:'#fff' },
}


// DatePicker com react-day-picker — sem popup nativo, funciona dentro de modais
function DateInput({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        readOnly
        className={className}
        value={validSelected ? format(validSelected, 'dd/MM/yyyy') : ''}
        placeholder="DD/MM/AAAA"
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => { e.stopPropagation(); setOpen(o => !o) }}
      />
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 9999,
            background: '#fff', border: '1px solid #EBEBEB',
            borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            padding: '8px', marginTop: 4,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <DayPicker
            mode="single"
            selected={validSelected}
            onSelect={(day) => {
              if (day) { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) }
            }}
            locale={ptBR}
            styles={{
              caption: { color: '#111' },
              day_selected: { background: '#534AB7', color: '#fff' },
              day_today: { color: '#534AB7', fontWeight: 700 },
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function ExperimentosPage() {
  return <ProtectedRoute><Experimentos /></ProtectedRoute>
}

function Experimentos() {
  const { isAdmin } = useAuth()
  const [experimentos, setExperimentos] = useState<Experimento[]>([])
  const [formulacoes, setFormulacoes]   = useState<Formulacao[]>([])
  const [selected, setSelected]         = useState<Experimento | null>(null)
  const [monitoramentos, setMonitoramentos] = useState<Monitoramento[]>([])
  const [colheitas, setColheitas]           = useState<Colheita[]>([])
  const [modalAberto, setModalAberto]       = useState(false)
  const [abaDetalhe, setAbaDetalhe]         = useState<'monitor'|'colheitas'|'custos'>('monitor')
  const [showNovoExp, setShowNovoExp]       = useState(false)
  const [verTodosMonitor, setVerTodosMonitor] = useState(false)

  // form novo experimento
  const [formulacaoId, setFormulacaoId] = useState('')
  const [codigo, setCodigo]             = useState('')
  const [dataPreparo, setDataPreparo]   = useState('')
  const [totalBlocos, setTotalBlocos]   = useState(40)
  const [pesoBlocoKg, setPesoBlocoKg]   = useState(1.2)
  const [criando, setCriando]           = useState(false)
  const [erroCreate, setErroCreate]     = useState('')

  // form monitoramento
  const [sala, setSala] = useState('FRUTIFICACAO')
  const [dataM, setDataM] = useState(new Date().toISOString().slice(0,10))
  const [temp, setTemp] = useState('')
  const [umid, setUmid] = useState('')
  const [obs,  setObs]  = useState('')
  const [erroMon, setErroMon] = useState('')

  // form colheita
  const [dataC, setDataC]         = useState(new Date().toISOString().slice(0,10))
  const [pesoTotal, setPesoTotal] = useState('')
  const [notasC, setNotasC]       = useState('')
  const [erroCol, setErroCol]     = useState('')

  // form custos
  const [precoVendaKg, setPrecoVendaKg]     = useState('')
  const [custos, setCustos]                 = useState<Record<string,string>>({})
  const [salvandoCustos, setSalvandoCustos] = useState(false)
  const [erroCustos, setErroCustos]         = useState('')

  async function carregarBase() {
    try {
      const [expsRes, formsRes, sugestaoRes] = await Promise.allSettled([
        api.experimentos.listar()         as Promise<any>,
        api.formulacoes.listar()          as Promise<any>,
        api.experimentos.codigoSugestao() as Promise<any>,
      ])
      if (expsRes.status    === 'fulfilled') setExperimentos(expsRes.value)
      if (formsRes.status   === 'fulfilled') {
        setFormulacoes(formsRes.value)
        if (formsRes.value[0]) setFormulacaoId(formsRes.value[0].id)
      }
      if (sugestaoRes.status === 'fulfilled') setCodigo(sugestaoRes.value.codigo)
    } catch(e) { console.error(e) }
  }

  useEffect(() => { carregarBase() }, [])

  async function abrirDetalhe(e: Experimento) {
    setSelected(e)
    setAbaDetalhe('monitor')
    setVerTodosMonitor(false)
    setPrecoVendaKg(e.precoVendaKg?.toString() ?? '')
    setErroCustos(''); setErroMon(''); setErroCol('')
    const custosMap: Record<string,string> = {}
    e.custos?.forEach((c:any) => { custosMap[c.insumoId] = c.custoPorKg?.toString() ?? '' })
    setCustos(custosMap)
    const [m, c] = await Promise.all([
      api.experimentos.monitoramentos.listar(e.id) as any,
      api.experimentos.colheitas.listar(e.id)      as any,
    ])
    setMonitoramentos(m)
    setColheitas(c)
    setModalAberto(true)
  }

  function fecharModal() { setModalAberto(false); setSelected(null) }

  async function criar() {
    if (!formulacaoId || !codigo || !dataPreparo) { setErroCreate('Preencha todos os campos.'); return }
    setCriando(true); setErroCreate('')
    try {
      await api.experimentos.criar({ formulacaoId, codigo, dataPreparo, totalBlocos, pesoBlocoKg })
      const d:any = await api.experimentos.listar(); setExperimentos(d)
      setDataPreparo(''); setShowNovoExp(false)
      const s:any = await api.experimentos.codigoSugestao(); setCodigo(s.codigo)
    } catch(e:any) { setErroCreate(e.message) }
    finally { setCriando(false) }
  }

  async function avancar(id: string) {
    await api.experimentos.avancar(id)
    const d:any = await api.experimentos.listar(); setExperimentos(d)
    const upd = d.find((e:Experimento) => e.id === id)
    if (upd) await abrirDetalhe(upd)
  }

  async function salvarMon() {
    if (!selected) return; setErroMon('')
    try {
      await api.experimentos.monitoramentos.criar(selected.id, {
        sala, data: dataM,
        temperatura: temp ? parseFloat(temp) : null,
        umidade:     umid ? parseFloat(umid) : null,
        observacao:  obs || null,
      })
      setObs(''); setTemp(''); setUmid('')
      const m:any = await api.experimentos.monitoramentos.listar(selected.id)
      setMonitoramentos(m)
    } catch(e:any) { setErroMon(e.message) }
  }

  async function salvarColheita() {
    if (!selected || !pesoTotal) return; setErroCol('')
    try {
      await api.experimentos.colheitas.criar(selected.id, {
        data: dataC, pesoTotalKg: parseFloat(pesoTotal), notas: notasC || null,
      })
      setPesoTotal(''); setNotasC('')
      const c:any = await api.experimentos.colheitas.listar(selected.id)
      setColheitas(c)
    } catch(e:any) { setErroCol(e.message) }
  }

  async function salvarCustos() {
    if (!selected) return
    setSalvandoCustos(true); setErroCustos('')
    try {
      await api.experimentos.salvarCustos(selected.id, {
        precoVendaKg: precoVendaKg ? parseFloat(precoVendaKg) : null,
        custos: Object.entries(custos)
          .filter(([,v]) => v !== '')
          .map(([insumoId,v]) => ({ insumoId, custoPorKg: parseFloat(v) })),
      })
      await carregarBase()
      const d:any = await api.experimentos.listar()
      const upd = d.find((e:Experimento) => e.id === selected.id)
      if (upd) await abrirDetalhe(upd)
    } catch(e:any) { setErroCustos(e.message) }
    finally { setSalvandoCustos(false) }
  }

  // Stats
  const ativos       = experimentos.filter(e => e.status !== 'CONCLUIDO').length
  const totalColhido = experimentos.reduce((s,e) => s+(e.financeiro?.totalColhidoKg??0),0)
  const receitaTotal = experimentos.reduce((s,e) => s+(e.financeiro?.receitaTotal??0),0)
  const margens      = experimentos.filter(e => e.financeiro?.margemPct != null)
  const margemMedia  = margens.length ? margens.reduce((s,e)=>s+(e.financeiro!.margemPct!),0)/margens.length : null

  // Gráficos
  const tempsChart = monitoramentos.slice(0,7).reverse().map(m=>m.temperatura??0)
  const umidsChart = monitoramentos.slice(0,7).reverse().map(m=>m.umidade??0)
  const monitorsVisiveis = verTodosMonitor ? monitoramentos : monitoramentos.slice(0,5)
  const totalColhidoExp  = colheitas.reduce((s,c)=>s+c.pesoTotalKg,0)

  // ── Card de experimento (reutilizado desktop + mobile) ──
  function ExpCard({ e }: { e: Experimento }) {
    const st = STATUS_STYLE[e.status] ?? STATUS_STYLE.PREPARACAO
    const progressPct = (STATUS_ORDER.indexOf(e.status) / (STATUS_ORDER.length-1)) * 100
    return (
      <div
        onClick={() => abrirDetalhe(e)}
        style={{
          background:'#fff', border:'1px solid #EBEBEB',
          borderRadius:16, overflow:'hidden', cursor:'pointer',
          transition:'box-shadow .15s',
        }}
      >
        {/* Thumb */}
        <div style={{ height:80, background:st.bg, display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
          <span style={{ fontSize:32 }}>{STATUS_EMOJI[e.status]}</span>
          <span style={{
            position:'absolute', top:8, right:10, fontSize:10, fontWeight:700,
            padding:'2px 8px', borderRadius:999, background:st.badge, color:st.badgeText,
          }}>
            {STATUS_LABEL[e.status]}
          </span>
        </div>
        {/* Body */}
        <div style={{ padding:'12px 14px' }}>
          <p style={{ fontSize:14, fontWeight:700, color:'#111', marginBottom:2 }}>{e.codigo}</p>
          <p style={{ fontSize:12, color:'#888', marginBottom:8 }}>
            {e.especieNome} · {e.formulacaoNome} · {e.totalBlocos} blocos
          </p>
          <div style={{ height:4, background:'#F0F0F0', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:st.badge, borderRadius:2 }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:'#888' }}>C/N {e.cnTotal?.toFixed(1)??'—'}</span>
            {e.financeiro?.receitaTotal != null && e.financeiro.receitaTotal > 0 && (
              <span style={{ fontSize:11, fontWeight:700, color:'var(--teal)' }}>
                R$ {e.financeiro.receitaTotal.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Conteúdo do modal de detalhe ──
  function DetalheContent() {
    if (!selected) return null
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Header */}
        <div className="card" style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#111' }}>{selected.codigo}</h2>
              <p style={{ fontSize:13, color:'#888' }}>
                {selected.especieNome} · {selected.formulacaoNome}
                {isAdmin && ` · por ${selected.usuarioNome}`}
              </p>
            </div>
            {selected.status !== 'CONCLUIDO' && (
              <button className="btn-primary" style={{ fontSize:13 }} onClick={() => avancar(selected.id)}>
                Avançar →
              </button>
            )}
          </div>
          <TimelineBar status={selected.status} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:10 }}>
            {[
              ['Preparo',      selected.dataPreparo],
              ['Inoculação',   selected.dataInoculacao??'—'],
              ['Frutificação', selected.frutificacaoInicio??'—'],
              ['Blocos',       String(selected.totalBlocos)],
            ].map(([k,v]) => (
              <div key={k}>
                <p style={{ fontSize:10, color:'#bbb', textTransform:'uppercase', letterSpacing:'.04em' }}>{k}</p>
                <p style={{ fontSize:13, fontWeight:700, color:'#111' }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Abas */}
        <div className="tabs-bar">
          {(['monitor','colheitas','custos'] as const).map(a => (
            <button key={a} className={`tab-btn ${abaDetalhe===a?'active':''}`} onClick={() => setAbaDetalhe(a)}>
              {a==='monitor'?'Monitoramento':a==='colheitas'?'Colheitas':'Custos'}
            </button>
          ))}
        </div>

        {/* Aba Monitoramento */}
        {abaDetalhe === 'monitor' && (
          <div className="card">
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Registrar monitoramento</h3>
            {/* Mobile: 2 colunas */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              <div><label className="label">Data</label>
                <DateInput className="input text-sm" value={dataM} onChange={setDataM} /></div>
              <div><label className="label">Sala</label>
                <select className="input text-sm" value={sala} onChange={e=>setSala(e.target.value)}>
                  <option value="AMADURECIMENTO">Amadurecimento</option>
                  <option value="FRUTIFICACAO">Frutificação</option>
                </select></div>
              <div><label className="label">Temp (°C)</label>
                <input type="number" step={0.1} className="input text-sm" value={temp} onChange={e=>setTemp(e.target.value)} placeholder="22" /></div>
              <div><label className="label">Umidade (%)</label>
                <input type="number" className="input text-sm" value={umid} onChange={e=>setUmid(e.target.value)} placeholder="85" /></div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input className="input text-sm" style={{ flex:1 }} value={obs} onChange={e=>setObs(e.target.value)} placeholder="Observação (opcional)..." />
              <button className="btn-primary" onClick={salvarMon}>Salvar</button>
            </div>
            {erroMon && <p style={{ fontSize:12, color:'var(--red)', marginBottom:8 }}>{erroMon}</p>}

            {monitoramentos.length > 0 && (
              <>
                <div style={{ display:'flex', gap:10, marginBottom:12 }}>
                  <MiniChart data={tempsChart} color="var(--purple)" label={`Temp °C — ${monitoramentos[0]?.temperatura??'—'}°C`} />
                  <MiniChart data={umidsChart} color="var(--teal-m)" label={`Umidade % — ${monitoramentos[0]?.umidade??'—'}%`} />
                </div>
                <div className="table-wrap">
                  <table className="tbl" style={{ minWidth:340 }}>
                    <thead><tr><th>Data</th><th>Sala</th><th>Temp</th><th>Umidade</th><th>Obs</th></tr></thead>
                    <tbody>
                      {monitorsVisiveis.map(m => (
                        <tr key={m.id}>
                          <td>{m.data}</td>
                          <td style={{ color:'#888' }}>{m.sala==='AMADURECIMENTO'?'Amad.':'Frut.'}</td>
                          <td>{m.temperatura??'—'}°C</td>
                          <td>{m.umidade??'—'}%</td>
                          <td style={{ color:'#888' }}>{m.observacao??'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {monitoramentos.length > 5 && (
                  <button onClick={() => setVerTodosMonitor(v=>!v)}
                    style={{ fontSize:12, color:'var(--purple)', background:'none', border:'none', cursor:'pointer', marginTop:6 }}>
                    {verTodosMonitor ? 'Ver menos' : `Ver todos (${monitoramentos.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Aba Colheitas */}
        {abaDetalhe === 'colheitas' && (
          <div className="card">
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Registrar colheita</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
              <div><label className="label">Data</label>
                <DateInput className="input text-sm" value={dataC} onChange={setDataC} /></div>
              <div><label className="label">Peso total (kg)</label>
                <input type="number" step={0.1} className="input text-sm" value={pesoTotal} onChange={e=>setPesoTotal(e.target.value)} placeholder="28.4" /></div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input className="input text-sm" style={{ flex:1 }} value={notasC} onChange={e=>setNotasC(e.target.value)} placeholder="Notas (opcional)..." />
              <button className="btn-primary" onClick={salvarColheita}>Salvar</button>
            </div>
            {erroCol && <p style={{ fontSize:12, color:'var(--red)', marginBottom:8 }}>{erroCol}</p>}
            {colheitas.length > 0 && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                  {[
                    { label:'Total colhido', value:`${totalColhidoExp.toFixed(1)} kg`, color:'var(--teal)' },
                    { label:'Colheitas',     value:String(colheitas.length) },
                    { label:'Média',         value:`${(totalColhidoExp/colheitas.length).toFixed(1)} kg` },
                  ].map(({label,value,color}) => (
                    <div key={label} style={{ background:'#F7F6F3', borderRadius:10, padding:'10px 12px' }}>
                      <p style={{ fontSize:10, color:'#888', marginBottom:2 }}>{label}</p>
                      <p style={{ fontSize:15, fontWeight:700, color:color??'#111' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="table-wrap">
                  <table className="tbl" style={{ minWidth:280 }}>
                    <thead><tr><th>Data</th><th>Total</th><th>Média/bloco</th><th>Notas</th></tr></thead>
                    <tbody>
                      {colheitas.map(c => (
                        <tr key={c.id}>
                          <td>{c.data}</td>
                          <td style={{ fontWeight:700 }}>{c.pesoTotalKg} kg</td>
                          <td style={{ color:'var(--teal)' }}>{c.mediaPorBlocoKg?.toFixed(3)} kg</td>
                          <td style={{ color:'#888' }}>{c.notas??'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Aba Custos */}
        {abaDetalhe === 'custos' && (
          <div className="card">
            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Custos e venda</h3>
            <div style={{ marginBottom:12 }}>
              <label className="label">Preço de venda (R$/kg)</label>
              <input type="number" step={0.01} className="input text-sm" value={precoVendaKg}
                onChange={e=>setPrecoVendaKg(e.target.value)} placeholder="35.00" />
            </div>
            {(selected.insumos??[]).length > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                {(selected.insumos??[]).map((i:any) => (
                  <div key={i.insumoId} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ flex:1, fontSize:13, color:'#333' }}>
                      {i.nome} <span style={{ color:'#bbb' }}>— {i.pesoKg} kg</span>
                    </span>
                    <input type="number" step={0.01} placeholder="R$/kg" className="input text-xs"
                      style={{ width:90 }} value={custos[i.insumoId]??''}
                      onChange={e=>setCustos(prev=>({...prev,[i.insumoId]:e.target.value}))} />
                  </div>
                ))}
              </div>
            )}
            {selected.financeiro && (
              <div style={{ background:'#F7F6F3', borderRadius:12, padding:12, marginBottom:12 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#888', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>
                  Resumo financeiro
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { label:'Custo substrato', value:`R$ ${selected.financeiro.custoTotalSubstrato?.toFixed(2)??'—'}` },
                    { label:'Custo/bloco',     value:`R$ ${selected.financeiro.custoPorBloco?.toFixed(2)??'—'}` },
                    { label:'Receita total',   value:`R$ ${selected.financeiro.receitaTotal?.toFixed(2)??'—'}`, color:'var(--teal)' },
                    { label:'Margem',          value:`${selected.financeiro.margemPct?.toFixed(1)??'—'}%`, color:(selected.financeiro.margemPct??0)>=0?'var(--teal)':'var(--red)' },
                  ].map(({label,value,color}) => (
                    <div key={label}>
                      <p style={{ fontSize:10, color:'#bbb' }}>{label}</p>
                      <p style={{ fontSize:15, fontWeight:700, color:color??'#111' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {erroCustos && <p style={{ fontSize:12, color:'var(--red)', marginBottom:8 }}>{erroCustos}</p>}
            <button className="btn-primary" onClick={salvarCustos} disabled={salvandoCustos} style={{ width:'100%' }}>
              {salvandoCustos ? 'Salvando...' : 'Salvar custos'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Form novo experimento ──
  function NovoExpForm() {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {formulacoes.length === 0 ? (
          <div style={{ background:'var(--purple-l)', borderRadius:12, padding:14 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--purple-d)', marginBottom:6 }}>Crie uma formulação primeiro</p>
            <a href="/calculadora" className="btn-primary" style={{ fontSize:12, textDecoration:'none' }}>
              Ir para a Calculadora →
            </a>
          </div>
        ) : (
          <>
            <div>
              <label className="label">Formulação</label>
              <select className="input" value={formulacaoId} onChange={e=>setFormulacaoId(e.target.value)}>
                {formulacoes.map(f => <option key={f.id} value={f.id}>{f.nome} — {f.especieNome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Código</label>
              <input className="input" value={codigo} onChange={e=>setCodigo(e.target.value)} placeholder="EXP-2026-001" />
            </div>
            <div>
              <label className="label">Data de preparo</label>
              <DateInput className="input" value={dataPreparo} onChange={setDataPreparo} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label className="label">Blocos</label>
                <input type="number" className="input" value={totalBlocos} onChange={e=>setTotalBlocos(parseInt(e.target.value))} />
              </div>
              <div>
                <label className="label">Kg/bloco</label>
                <input type="number" step={0.1} className="input" value={pesoBlocoKg} onChange={e=>setPesoBlocoKg(parseFloat(e.target.value))} />
              </div>
            </div>
            {erroCreate && <p style={{ fontSize:12, color:'var(--red)' }}>{erroCreate}</p>}
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button className="btn" style={{ flex:1 }} onClick={() => setShowNovoExp(false)}>Cancelar</button>
              <button className="btn-primary" style={{ flex:2 }} onClick={criar} disabled={criando}>
                {criando ? 'Criando...' : 'Criar experimento'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#111', marginBottom:2 }}>Seus experimentos</h1>
          <p style={{ fontSize:14, color:'#888' }}>{experimentos.length} lotes · {ativos} em andamento</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNovoExp(true)}>+ Novo lote</button>
      </div>

      {/* Grid de cards */}
      {experimentos.length === 0 ? (
        <p style={{ textAlign:'center', padding:'60px 0', color:'#bbb', fontSize:14 }}>
          Nenhum experimento ainda. Crie o primeiro lote!
        </p>
      ) : (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
          gap:16,
          marginBottom:24,
        }}>
          {experimentos.map(e => <ExpCard key={e.id} e={e} />)}
        </div>
      )}

      {/* Stats */}
      {experimentos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          <StatCard value={String(experimentos.length)} label="Experimentos" />
          <StatCard value={`${totalColhido.toFixed(1)} kg`} label="Colhidos" color="var(--teal)" />
          <StatCard value={receitaTotal > 0 ? `R$ ${(receitaTotal/1000).toFixed(1)}k` : '—'} label="Receita" color="var(--teal)" />
          <StatCard value={margemMedia != null ? `${margemMedia.toFixed(0)}%` : '—'} label="Margem média" />
        </div>
      )}

      {/* ── Modal: Novo experimento ── */}
      {showNovoExp && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, display:'flex', alignItems:'flex-end' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNovoExp(false)
          }}
        >
          <div
            style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:'20px 16px 32px', width:'100%' }}
            className="sm:rounded-[20px] sm:max-w-[440px] sm:mx-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle mobile */}
            <div className="sm:hidden" style={{ width:36, height:4, borderRadius:2, background:'#E0E0E0', margin:'0 auto 16px' }} />
            <h2 style={{ fontSize:16, fontWeight:800, marginBottom:16 }}>Novo experimento</h2>
            <NovoExpForm />
          </div>
        </div>
      )}

      {/* ── Modal: Detalhe do experimento ── */}
      {modalAberto && selected && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:50, display:'flex', alignItems:'flex-end' }}
          className="sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharModal()
          }}
        >
          <div
            style={{
              background:'#F7F6F3',
              borderRadius:'20px 20px 0 0',
              width:'100%',
              maxHeight:'92vh',
              overflowY:'auto',
              display:'flex',
              flexDirection:'column',
              gap:12,
              padding:'20px 16px 32px',
            }}
            className="sm:rounded-[20px] sm:max-w-[680px] sm:mx-auto sm:max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle + botão fechar — mobile e desktop */}
            <div style={{ display:'flex', alignItems:'center', marginBottom:8 }}>
              <div className="sm:hidden" style={{ width:36, height:4, borderRadius:2, background:'#D0D0D0', flex:1, margin:'0 auto' }} />
              <button
                onClick={fecharModal}
                style={{
                  marginLeft:'auto', background:'#F0F0F0', border:'none',
                  width:32, height:32, borderRadius:'50%',
                  fontSize:16, color:'#555', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}
              >
                ✕
              </button>
            </div>
            <DetalheContent />
          </div>
        </div>
      )}
    </div>
  )
}
