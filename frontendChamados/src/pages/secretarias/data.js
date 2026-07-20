// Mock - substituir por TanStack Query quando wire na API:
//   GET /api/localidades/secretarias/
//   GET /api/localidades/divisoes/
//   GET /api/localidades/unidades/

export const SEED_SECRETARIAS = [
  { id: 1, nome: 'Secretaria de Saúde',         sigla: 'SMS', cor: '#dc2626', secretario: 'Ana Beatriz Moraes' },
  { id: 2, nome: 'Secretaria de Educação',      sigla: 'SME', cor: '#2563eb', secretario: 'Carlos Henrique Silva' },
  { id: 3, nome: 'Secretaria de Administração', sigla: 'SMA', cor: '#7c3aed', secretario: 'João Pedro Almeida' },
  { id: 4, nome: 'Secretaria de Fazenda',       sigla: 'SF',  cor: '#16a34a', secretario: 'Mariana Costa' },
  { id: 5, nome: 'Secretaria de Cultura',       sigla: 'SMC', cor: '#f97316', secretario: null },
  { id: 6, nome: 'Secretaria de Obras',         sigla: 'SO',  cor: '#0891b2', secretario: 'Roberto Lima' },
  { id: 7, nome: 'Secretaria de Segurança',     sigla: 'SS',  cor: '#475569', secretario: 'Patrícia Nogueira' },
  { id: 8, nome: 'Secretaria de Esportes',      sigla: 'SE',  cor: '#ca8a04', secretario: 'Felipe Andrade' },
  { id: 9, nome: 'Secretaria de Assistência',   sigla: 'SAS', cor: '#db2777', secretario: 'Luciana Tavares' },
]

export const SEED_DIVISOES = [
  // Saúde
  { id: 1,  nome: 'Atenção Básica',          sigla: 'AB',     secretaria_id: 1 },
  { id: 2,  nome: 'TI Hospitalar',           sigla: 'TI-HOSP', secretaria_id: 1 },
  { id: 3,  nome: 'Vigilância Sanitária',    sigla: 'VS',     secretaria_id: 1 },
  // Educação
  { id: 4,  nome: 'Ensino Fundamental',      sigla: 'EF',     secretaria_id: 2 },
  { id: 5,  nome: 'Ensino Infantil',         sigla: 'EI',     secretaria_id: 2 },
  { id: 6,  nome: 'Logística Educacional',   sigla: 'LOG',    secretaria_id: 2 },
  // Administração
  { id: 7,  nome: 'Patrimônio',              sigla: 'PAT',    secretaria_id: 3 },
  { id: 8,  nome: 'Gabinete',                sigla: 'GAB',    secretaria_id: 3 },
  // Fazenda
  { id: 9,  nome: 'Tecnologia',              sigla: 'TI',     secretaria_id: 4 },
  { id: 10, nome: 'Datacenter',              sigla: 'DC',     secretaria_id: 4 },
  // Cultura
  { id: 11, nome: 'Centros Culturais',       sigla: 'CC',     secretaria_id: 5 },
  // Obras
  { id: 12, nome: 'Manutenção Predial',      sigla: 'MP',     secretaria_id: 6 },
  // Segurança
  { id: 13, nome: 'Monitoramento',           sigla: 'MON',    secretaria_id: 7 },
  // Esportes
  { id: 14, nome: 'Equipamentos Esportivos', sigla: 'EQ',     secretaria_id: 8 },
  // Assistência
  { id: 15, nome: 'CRAS Centro',             sigla: 'CRAS-C', secretaria_id: 9 },
  { id: 16, nome: 'CRAS Bairros',            sigla: 'CRAS-B', secretaria_id: 9 },
]

// Reaproveita o mock de Unidades de /unidades/data.js - duplico aqui pra
// evitar dependência cruzada entre módulos enquanto está tudo mockado.
// Quando wire na API, o /unidades passa a vir da mesma fonte.
export const SEED_UNIDADES = [
  { id: 1,  nome: 'Gabinete do Prefeito',        divisao_id: 8,  secretaria_id: 3 },
  { id: 2,  nome: 'Secretaria de Administração', divisao_id: 8,  secretaria_id: 3 },
  { id: 3,  nome: 'Secretaria de Fazenda',       divisao_id: 9,  secretaria_id: 4 },
  { id: 4,  nome: 'Secretaria de Saúde',         divisao_id: 1,  secretaria_id: 1 },
  { id: 5,  nome: 'Secretaria de Educação',      divisao_id: 4,  secretaria_id: 2 },
  { id: 6,  nome: 'Secretaria de Cultura',       divisao_id: 11, secretaria_id: 5 },
  { id: 7,  nome: 'Secretaria de Obras',         divisao_id: 12, secretaria_id: 6 },
  { id: 8,  nome: 'Secretaria de Esportes',      divisao_id: 14, secretaria_id: 8 },
  { id: 9,  nome: 'Secretaria de Assistência',   divisao_id: 15, secretaria_id: 9 },
  { id: 10, nome: 'Rodoviária Municipal',        divisao_id: 12, secretaria_id: 6 },
  { id: 11, nome: 'Mercado Municipal',           divisao_id: 7,  secretaria_id: 3 },
  { id: 12, nome: 'UBS Lavapés',                 divisao_id: 1,  secretaria_id: 1 },
  { id: 13, nome: 'EMEF Jardim Recreio',         divisao_id: 4,  secretaria_id: 2 },
  { id: 14, nome: 'Centro Esportivo Recreio',    divisao_id: 14, secretaria_id: 8 },
  { id: 15, nome: 'CRAS Jardim Petrópolis',      divisao_id: 15, secretaria_id: 9 },
  { id: 16, nome: 'EMEI Vila Aparecida',         divisao_id: 5,  secretaria_id: 2 },
  { id: 17, nome: 'Delegacia da Mulher',         divisao_id: 13, secretaria_id: 7 },
  { id: 18, nome: 'UBS Águas Claras',            divisao_id: 1,  secretaria_id: 1 },
  { id: 19, nome: 'EMEF São Lourenço',           divisao_id: 4,  secretaria_id: 2 },
  { id: 20, nome: 'Almoxarifado de Obras',       divisao_id: 12, secretaria_id: 6 },
  { id: 21, nome: 'Posto de Saúde Rural',        divisao_id: 1,  secretaria_id: 1 },
  { id: 22, nome: 'Centro Cultural Cidade',      divisao_id: 11, secretaria_id: 5 },
  { id: 23, nome: 'EMEI Jardim Europa',          divisao_id: 5,  secretaria_id: 2 },
]

// Helper que monta a view consolidada usada pelos cards/drawer
export function getSecretariasConsolidadas() {
  return SEED_SECRETARIAS.map((s) => {
    const divisoes = SEED_DIVISOES
      .filter((d) => d.secretaria_id === s.id)
      .map((d) => ({
        ...d,
        unidades: SEED_UNIDADES.filter((u) => u.divisao_id === d.id),
      }))
    const qtdUnidades = divisoes.reduce((acc, d) => acc + d.unidades.length, 0)
    return {
      ...s,
      divisoes,
      qtd_divisoes: divisoes.length,
      qtd_unidades: qtdUnidades,
    }
  })
}
