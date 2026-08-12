import { useEffect, useMemo, useState } from 'react'
import { X, Wrench, Trash2, Loader2, AlertTriangle, Search } from 'lucide-react'

import { STATUS, STATUS_META, TIPO_EQ, DESTINO_META } from './data'
import { useCriarManutencao, useEditarManutencao, useExcluirManutencao } from '../../hooks/useManutencao'
import { useEquipamentos } from '../../hooks/useEquipamentos'
import { useTecnicos } from '../../hooks/useTecnicos'
import { useChamadosDIT } from '../../hooks/useChamados'
import { useAuth } from '../../contexts/AuthContext'

const C = {
  surface:  '#ffffff',
  surface2: '#fbfaf7',
  hover:    '#f3f2ee',
  border:   '#ececea',
  border2:  '#e3e2df',
  text1:    '#15161b',
  text2:    '#5b5e68',
  text3:    '#8b8d96',
  accent:   '#4f46e5',
  accentInk:'#2d2783',
  erro:     '#dc2626',
}

// Modal de ordem de manutenção. `manutencao` null = retirada nova.
export default function ManutencaoModal({ manutencao, onClose }) {
  const editando = !!manutencao?.id
  const cru = manutencao?._raw

  const { user } = useAuth()
  const criar = useCriarManutencao()
  const editar = useEditarManutencao()
  const excluir = useExcluirManutencao()

  const { data: equipamentos = [] } = useEquipamentos()
  const { data: tecnicos = [] } = useTecnicos()
  const { data: chamados = [] } = useChamadosDIT()

  const [form, setForm] = useState({
    equipamento: cru?.equipamento ?? '',
    chamado: cru?.chamado ?? '',
    diagnostico: cru?.diagnostico || '',
    localizacao: cru?.localizacao_atual_equipamento || '',
    servico: cru?.servico_executado || '',
    status: cru?.status ?? STATUS.EM_ANDAMENTO,
    backup: !!cru?.backup,
    destino: cru?.destino_equipamento ?? '',
  })
  const [tecnicosSel, setTecnicosSel] = useState(cru?.tecnicos || [])
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false)

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // equipamento escolhido define se backup é obrigatório
  const equipSel = useMemo(
    () => equipamentos.find((e) => String(e.id) === String(form.equipamento)),
    [equipamentos, form.equipamento]
  )
  const ehComputador = equipSel?.tipo === TIPO_EQ.COMPUTADOR
  const finalizando = Number(form.status) === STATUS.FINALIZADO

  // espelha as regras do backend, pra avisar antes de tentar salvar
  const encerrando = finalizando || Number(form.status) === STATUS.NAO_REALIZADA
  const faltaServico = finalizando && !form.servico.trim()
  const faltaBackup = finalizando && ehComputador && !form.backup
  const faltaDestino = encerrando && form.destino === ''
  const podeSalvar =
    form.equipamento && !faltaServico && !faltaBackup && !faltaDestino

  const salvando = criar.isPending || editar.isPending
  const erroMut = criar.error || editar.error || excluir.error

  const toggleTecnico = (id) =>
    setTecnicosSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = (e) => {
    e.preventDefault()
    if (!podeSalvar || salvando) return
    const body = {
      equipamento: Number(form.equipamento),
      chamado: form.chamado ? Number(form.chamado) : null,
      destino_equipamento: form.destino === '' ? null : Number(form.destino),
      diagnostico: form.diagnostico.trim(),
      localizacao_atual_equipamento: form.localizacao.trim(),
      servico_executado: form.servico.trim(),
      status: Number(form.status),
      backup: form.backup,
      tecnicos: tecnicosSel,
    }
    // registra quem fez o backup no momento em que ele é marcado
    if (form.backup && !cru?.backup_feito_por) {
      body.backup_feito_por = user?.id
      body.backup_data = new Date().toISOString()
    }
    const onOk = { onSuccess: onClose }
    if (editando) editar.mutate({ id: manutencao.id, ...body }, onOk)
    else criar.mutate(body, onOk)
  }

  const msgErro = () => {
    const d = erroMut?.data
    if (erroMut?.status === 401 || erroMut?.status === 403) return 'Sem permissão. Faça login no /admin e recarregue.'
    if (d?.detail) return d.detail
    const primeiro = d && Object.entries(d)[0]
    if (primeiro) {
      const [campo, msgs] = primeiro
      return `${campo}: ${Array.isArray(msgs) ? msgs[0] : msgs}`
    }
    return `Erro ao salvar${erroMut?.status ? ` (${erroMut.status})` : ''}.`
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(20,22,36,0.4)' }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-2xl rounded-lg overflow-hidden flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: C.surface,
          border: `1px solid ${C.border2}`,
          boxShadow: '0 20px 48px -8px rgba(20,22,36,0.25)',
        }}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" strokeWidth={1.75} style={{ color: C.accent }} />
            <h3 className="m-0 text-[15px] font-semibold tracking-tight" style={{ color: C.text1 }}>
              {editando ? 'Ordem de manutenção' : 'Retirar para manutenção'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style={{ color: C.text3 }} aria-label="Fechar">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Equipamento" required>
              <select
                value={form.equipamento}
                onChange={(e) => update('equipamento', e.target.value)}
                disabled={editando}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none disabled:opacity-60"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              >
                <option value="">Selecione…</option>
                {equipamentos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.patrimonio ? `${e.patrimonio} · ` : ''}{e.marca} {e.modelo}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo label="Chamado de origem" hint="opcional - retirada avulsa não tem chamado">
              <select
                value={form.chamado}
                onChange={(e) => update('chamado', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              >
                <option value="">Sem chamado (retirada avulsa)</option>
                {chamados.map((c) => (
                  <option key={c.id} value={c.id}>#{c.code} · {c.title}</option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Diagnóstico">
            <textarea
              value={form.diagnostico}
              onChange={(e) => update('diagnostico', e.target.value)}
              rows={2}
              placeholder="O que foi identificado no equipamento"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </Campo>

          <Campo label="Localização atual do equipamento" hint="texto livre">
            <input
              type="text"
              value={form.localizacao}
              onChange={(e) => update('localizacao', e.target.value)}
              placeholder="Ex.: Bancada da DIT, 2º andar"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
              style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
            />
          </Campo>

          {/* Backup - obrigatório pra computador antes de finalizar */}
          <div
            className="rounded-md p-3"
            style={{
              backgroundColor: faltaBackup ? '#fef3c7' : C.surface2,
              border: `1px solid ${faltaBackup ? '#fcd34d' : C.border}`,
            }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.backup}
                onChange={(e) => update('backup', e.target.checked)}
                className="w-4 h-4"
                style={{ accentColor: C.accent }}
              />
              <span className="text-[13px]" style={{ color: C.text1 }}>Backup realizado</span>
              {ehComputador && (
                <span className="text-[11px]" style={{ color: '#92400e' }}>
                  · obrigatório para computadores
                </span>
              )}
            </label>
            {cru?.backup && manutencao?.backup_feito_por && (
              <div className="text-[11px] mt-1.5 ml-6" style={{ color: C.text3 }}>
                Feito por {manutencao.backup_feito_por}
                {manutencao.backup_data ? ` em ${manutencao.backup_data}` : ''}
              </div>
            )}
            {faltaBackup && (
              <div className="flex items-center gap-1.5 text-[11px] mt-1.5 ml-6" style={{ color: '#92400e' }}>
                <AlertTriangle className="w-3 h-3" strokeWidth={2} />
                Este equipamento é um computador: registre o backup antes de finalizar.
              </div>
            )}
          </div>

          <Campo label="Técnicos responsáveis">
            <div className="flex flex-wrap gap-2">
              {tecnicos.length === 0 ? (
                <span className="text-[12px]" style={{ color: C.text3 }}>Nenhum técnico cadastrado.</span>
              ) : tecnicos.map((t) => {
                const ativo = tecnicosSel.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTecnico(t.id)}
                    className="px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors"
                    style={
                      ativo
                        ? { backgroundColor: '#eef0ff', color: C.accentInk, border: '1px solid #c7d2fe' }
                        : { backgroundColor: C.surface2, color: C.text2, border: `1px solid ${C.border}` }
                    }
                  >
                    {t.primeiro_nome}
                  </button>
                )
              })}
            </div>
          </Campo>

          {/* Situação + destino do equipamento */}
          <div className="grid grid-cols-2 gap-4">
            <Campo label="Situação">
              <select
                value={form.status}
                onChange={(e) => update('status', Number(e.target.value))}
                className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, color: C.text1 }}
              >
                {Object.entries(STATUS_META).map(([val, meta]) => (
                  <option key={val} value={val}>{meta.label}</option>
                ))}
              </select>
            </Campo>

            {/* Só faz sentido ao encerrar: enquanto a ordem corre, o
                equipamento está "Em manutenção" */}
            {encerrando && (
              <Campo label="Destino do equipamento" required hint="para onde ele vai agora">
                <select
                  value={form.destino}
                  onChange={(e) => update('destino', e.target.value)}
                  className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none"
                  style={{
                    backgroundColor: C.surface2,
                    border: `1px solid ${faltaDestino ? C.erro : C.border}`,
                    color: C.text1,
                  }}
                >
                  <option value="">Selecione…</option>
                  {Object.entries(DESTINO_META).map(([val, meta]) => (
                    <option key={val} value={val}>{meta.label}</option>
                  ))}
                </select>
                {faltaDestino && (
                  <div className="text-[11px] mt-1" style={{ color: C.erro }}>
                    Diga se o equipamento volta ao uso, vai pro estoque ou pro descarte.
                  </div>
                )}
              </Campo>
            )}
          </div>

          <Campo
            label="Serviço executado"
            required={finalizando}
            hint={finalizando ? 'obrigatório para finalizar' : undefined}
          >
            <textarea
              value={form.servico}
              onChange={(e) => update('servico', e.target.value)}
              rows={2}
              placeholder="O que foi feito no equipamento"
              className="w-full px-3 py-2 text-[13px] rounded-md focus:outline-none resize-none"
              style={{
                backgroundColor: C.surface2,
                border: `1px solid ${faltaServico ? C.erro : C.border}`,
                color: C.text1,
              }}
            />
            {faltaServico && (
              <div className="text-[11px] mt-1" style={{ color: C.erro }}>
                Descreva o serviço executado antes de finalizar.
              </div>
            )}
          </Campo>

          {erroMut && (
            <div className="text-[12px] px-3 py-2 rounded-md" style={{ backgroundColor: '#fee2e2', color: '#7f1d1d' }}>
              {msgErro()}
            </div>
          )}
        </div>

        <div className="px-5 py-3 flex items-center justify-between gap-2" style={{ backgroundColor: C.surface2, borderTop: `1px solid ${C.border}` }}>
          {editando ? (
            confirmandoExcluir ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: C.text2 }}>Confirmar?</span>
                <button type="button" onClick={() => excluir.mutate(manutencao.id, { onSuccess: onClose })} disabled={excluir.isPending}
                  className="px-2.5 py-1.5 rounded-md text-[12px] font-medium" style={{ backgroundColor: C.erro, color: '#fff' }}>
                  {excluir.isPending ? 'Excluindo…' : 'Sim, excluir'}
                </button>
                <button type="button" onClick={() => setConfirmandoExcluir(false)} className="px-2.5 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmandoExcluir(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px]" style={{ color: C.erro }}>
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                Excluir ordem
              </button>
            )
          ) : <span />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md text-[12px]" style={{ color: C.text2 }}>
              Cancelar
            </button>
            <button type="submit" disabled={!podeSalvar || salvando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium"
              style={{ backgroundColor: (podeSalvar && !salvando) ? C.accent : '#c7c5d9', color: '#fff', cursor: (podeSalvar && !salvando) ? 'pointer' : 'not-allowed' }}>
              {salvando && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />}
              {editando ? 'Salvar' : 'Abrir ordem'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Campo({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.text2 }}>
        {label}{required && <span className="ml-0.5" style={{ color: C.erro }}>*</span>}
        {hint && <span className="ml-1.5 font-normal" style={{ color: C.text3 }}>({hint})</span>}
      </label>
      {children}
    </div>
  )
}
