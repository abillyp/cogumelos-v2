// Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
// Todos os direitos reservados.
// Uso não autorizado é expressamente proibido. Ver arquivo LICENSE.
// Contato: alessandro.billy@organico4you.com.br

import { useEffect, useMemo, useState } from 'react'
import { api, toErrorMessage } from '@/lib/api'
import type { Formulacao, Insumo, Especie } from '@/lib/types'
import { toNum, calcular, calcularAgua, type LinhaCalculo } from '@/lib/calculos'

export type Linha = LinhaCalculo

const DRAFT_KEY = 'cogumelos:calc-draft'

export function useCalculadora() {
  const [insumos, setInsumos]         = useState<Insumo[]>([])
  const [especies, setEspecies]       = useState<Especie[]>([])
  const [formulacoes, setFormulacoes] = useState<Formulacao[]>([])
  const [especieId, setEspecieId]     = useState('')
  const [nome, setNome]               = useState('')
  const [linhas, setLinhas]           = useState<Linha[]>([{ insumoId: '', pesoRealKg: 0, umidadePct: 40 }])
  const [umidadeDesejada, setUmidadeDesejada] = useState<number | string>('')
  const [pesoBlocoKg, setPesoBlocoKg]         = useState<number | string>('')
  const [salvando, setSalvando]       = useState(false)
  const [notif, setNotif]             = useState<{ texto: string; ok: boolean } | null>(null)

  // Carrega dados iniciais e restaura rascunho
  useEffect(() => {
    api.insumos.listar().then(setInsumos)
    api.especies.listar().then(d => { setEspecies(d); if (d[0]) setEspecieId(d[0].id) })
    api.formulacoes.listar().then(setFormulacoes)
    try {
      const draft = localStorage.getItem(DRAFT_KEY)
      if (draft) {
        const { nome: n, especieId: eid, linhas: l, umidadeDesejada: u, pesoBlocoKg: p } = JSON.parse(draft)
        if (n)         setNome(n)
        if (eid)       setEspecieId(eid)
        if (l?.length) setLinhas(l)
        if (u)         setUmidadeDesejada(u)
        if (p)         setPesoBlocoKg(p)
      }
    } catch { /* ignora */ }
  }, [])

  // Persiste rascunho automaticamente
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ nome, especieId, linhas, umidadeDesejada, pesoBlocoKg })) } catch { /* ignora */ }
  }, [nome, especieId, linhas, umidadeDesejada, pesoBlocoKg])

  const especie = useMemo(
    () => especies.find(e => e.id === especieId),
    [especies, especieId]
  )

  const { cnTotal, phMedio, totalPeso, contribs, totalC, totalPesoSeco, totalPesoUmido } = useMemo(
    () => calcular(linhas, insumos),
    [linhas, insumos]
  )

  const contribsPct = useMemo(
    () => contribs.map(({ id, nome, cKg }) => ({ id, nome, pct: totalC > 0 ? (cKg / totalC) * 100 : 0 })).filter(c => c.pct > 0),
    [contribs, totalC]
  )

  const { agua, pesoFinal, qtdBlocos } = useMemo(() => {
    const umidNum = toNum(umidadeDesejada)
    const agua = (umidadeDesejada !== '' && totalPeso > 0)
      ? calcularAgua(totalPesoSeco, totalPeso, umidNum)
      : null
    const pesoFinal = agua !== null ? totalPeso + agua : null
    const pesoNum = toNum(pesoBlocoKg)
    const qtdBlocos = (pesoFinal !== null && pesoBlocoKg !== '' && pesoNum > 0)
      ? Math.round((pesoFinal / pesoNum) * 100) / 100
      : null
    return { agua, pesoFinal, qtdBlocos }
  }, [umidadeDesejada, pesoBlocoKg, totalPeso, totalPesoSeco])

  function setLinha(i: number, field: keyof Linha, value: string | number) {
    setLinhas(l => l.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function duplicarFormulacao(f: Formulacao) {
    setNome(f.nome + ' (cópia)')
    setEspecieId(f.especieId)
    setLinhas(f.insumos.map(fi => ({ insumoId: fi.insumoId, pesoRealKg: fi.pesoRealKg, umidadePct: Math.round(fi.umidadePct * 100) })))
    setUmidadeDesejada(f.umidadeDesejada ?? '')
    setPesoBlocoKg(f.pesoBlocoKg ?? '')
  }

  function recarregarFormulacoes() {
    api.formulacoes.listar().then(setFormulacoes)
  }

  async function salvar() {
    if (!especieId || !nome.trim()) { setNotif({ texto: 'Preencha nome e espécie.', ok: false }); return }
    if (umidadeDesejada === '')      { setNotif({ texto: 'Informe a umidade desejada.', ok: false }); return }
    if (pesoBlocoKg === '')          { setNotif({ texto: 'Informe o peso por bloco.', ok: false }); return }
    const validas = linhas.filter(l => l.insumoId && toNum(l.pesoRealKg) > 0)
    if (!validas.length)             { setNotif({ texto: 'Adicione pelo menos um insumo.', ok: false }); return }
    setSalvando(true); setNotif(null)
    const umidNum = toNum(umidadeDesejada)
    const pesoNum = toNum(pesoBlocoKg)
    try {
      await api.formulacoes.criar({
        especieId, nome,
        insumos: validas.map(l => ({ ...l, pesoRealKg: toNum(l.pesoRealKg), umidadePct: toNum(l.umidadePct) / 100 })),
        umidadeDesejada: umidNum,
        pesoBlocoKg: pesoNum,
        totalBlocos: qtdBlocos,
      })
      setNotif({ texto: 'Formulação salva!', ok: true })
      setNome(''); setLinhas([{ insumoId: '', pesoRealKg: 0, umidadePct: 40 }])
      setUmidadeDesejada(''); setPesoBlocoKg('')
      localStorage.removeItem(DRAFT_KEY)
      recarregarFormulacoes()
    } catch (e: unknown) { setNotif({ texto: toErrorMessage(e), ok: false }) }
    finally { setSalvando(false) }
  }

  return {
    // Dados carregados da API
    insumos, especies, formulacoes,
    // Estado do formulário
    nome, setNome,
    especieId, setEspecieId,
    linhas, setLinhas, setLinha,
    umidadeDesejada, setUmidadeDesejada,
    pesoBlocoKg, setPesoBlocoKg,
    // Valores calculados
    especie, cnTotal, phMedio, totalPeso, contribs, totalC, totalPesoSeco, totalPesoUmido,
    contribsPct, agua, pesoFinal, qtdBlocos,
    // Ações
    salvar, duplicarFormulacao, recarregarFormulacoes,
    // Status
    salvando,
    msg: notif?.texto ?? '',
    msgOk: notif?.ok ?? false,
  }
}
