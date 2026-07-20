// Enums/metadata espelhados do back. Dados reais vêm via useEmpresas (API).
//   GET /api/terceirizada/empresas/
//   GET /api/terceirizada/chamados-externos/

import { Phone, Printer, Monitor, Camera, Globe } from 'lucide-react'

// Mirror do EmpresaTerceirizada.responsabilidade no back
export const RESP = {
  TELEFONIA:  0,
  IMPRESSORA: 1,
  COMPUTADOR: 2,
  CAMERA:     3,
  PROVEDOR:   4,
}

export const RESP_META = {
  [RESP.TELEFONIA]:  { label: 'Telefonia',           cor: '#ca8a04', icon: Phone },
  [RESP.IMPRESSORA]: { label: 'Impressoras',         cor: '#475569', icon: Printer },
  [RESP.COMPUTADOR]: { label: 'Computadores',        cor: '#2563eb', icon: Monitor },
  [RESP.CAMERA]:     { label: 'Câmeras',             cor: '#7c3aed', icon: Camera },
  [RESP.PROVEDOR]:   { label: 'Provedor de Internet', cor: '#16a34a', icon: Globe },
}

// ===== Status (mirror do back) =====
export const STATUS = {
  ABERTO:        0,
  EM_ANDAMENTO:  1,
  FINALIZADO:    2,
  NAO_RESOLVIDO: 3,
}

export const STATUS_META = {
  [STATUS.ABERTO]:        { label: 'Aberto',         cor: '#ea580c' },
  [STATUS.EM_ANDAMENTO]:  { label: 'Em andamento',   cor: '#2563eb' },
  [STATUS.FINALIZADO]:    { label: 'Finalizado',     cor: '#16a34a' },
  [STATUS.NAO_RESOLVIDO]: { label: 'Não resolvido',  cor: '#dc2626' },
}

// ISO ("2026-05-12T09:14:00Z") ou "2026-05-12 09:14" → "12/05 09:14"
export function formatarDataHora(s) {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d)) return ''
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dia}/${mes} ${hh}:${mm}`
}
