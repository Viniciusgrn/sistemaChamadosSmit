// Adapta Equipe da API -> shape que os cards de Equipes consomem.
// Os cards nasceram resolvendo ids contra seeds; aqui já entregamos resolvido.

const CORES = ['#4f46e5', '#0ea5e9', '#f97316', '#10b981', '#7c3aed', '#dc2626']

function horaCurta(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function adaptaTecnico(t, i) {
  const nome = t.nome || ''
  return {
    id: t.id,
    nome_completo: nome,
    primeiro_nome: nome.split(' ')[0] || nome,
    cargo: t.cargo,
    responsabilidades: t.responsabilidades || [],
    cor: CORES[(t.id ?? i) % CORES.length],
  }
}

export function adaptaEquipe(e) {
  // `tecnicos_nomes` traz só quem está na equipe agora; `participacoes` traz
  // todo mundo que passou por ela, com entrada e saída.
  const tecnicos = (e.tecnicos_nomes || []).map(adaptaTecnico)
  const participacoes = (e.participacoes || []).map((p, i) => ({
    ...adaptaTecnico(p, i),
    entrou_em: p.entrou_em,
    saiu_em: p.saiu_em,
    saiu: p.saiu_em != null,
  }))
  // equipe encerrada não tem mais ninguém "dentro": o card dela mostra o elenco
  // que de fato passou pela equipe, senão apareceria vazia
  const elenco = tecnicos.length ? tecnicos : participacoes
  const v = e.veiculo
  const c = e.chamado

  return {
    id: e.id,
    fase: e.fase,                       // 'lobby' | 'em_campo' | 'encerrada'
    tecnicos,
    participacoes,
    tecnicos_ids: tecnicos.map((t) => t.id),
    tecnicos_nomes: elenco.map((t) => t.primeiro_nome),

    veiculo: v
      ? {
          id: v.id,
          placa: v.placa,
          modelo: v.modelo,
          marca: '',                    // já vem junto em `modelo`
          assentos: v.assentos,
        }
      : null,
    veiculo_placa: v?.placa || null,
    vagas: e.vagas,

    chamado: c
      ? {
          id: c.id, codigo: String(c.id), titulo: c.titulo,
          urgencia: c.urgencia, endereco: c.endereco,
          // interno = chamado no Paço: a equipe atende sem se deslocar
          interno: !!c.interno,
          unidade_nome: c.unidade_nome,
        }
      : null,
    chamado_codigo: c ? String(c.id) : null,
    chamado_atual_codigo: c ? String(c.id) : null,

    criado_em: horaCurta(e.created_at),
    iniciada_em: horaCurta(e.created_at),
    encerrada_em: horaCurta(e.encerrada_em),

    atendimentos: (e.atendimentos || []).map((a) => ({
      codigo: String(a.chamado_id),
      titulo: a.titulo,
      motivo_encerramento: a.motivo_encerramento,
    })),
    qtd_atendimentos_hoje: (e.atendimentos || []).length,
  }
}

// Separa as equipes nas 3 fases que a tela mostra
export function separaPorFase(lista) {
  const equipes = lista.map(adaptaEquipe)
  return {
    lobbies: equipes.filter((e) => e.fase === 'lobby'),
    ativas: equipes.filter((e) => e.fase === 'em_campo'),
    historico: equipes.filter((e) => e.fase === 'encerrada'),
  }
}
