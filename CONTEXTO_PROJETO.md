# Sistema de Chamados — Contexto do Projeto

Documento de referência. Carregar no início de cada sessão para que o assistente entenda domínio, convenções, decisões já tomadas e o que falta.

---

## 1. Visão geral

Sistema interno de gestão de chamados de TI/infra para uma prefeitura. Backend Django REST Framework + frontend React (Vite + Tailwind). O usuário-alvo central é o **despachante** — operador que vê chamados entrando em tempo real e atribui equipes técnicas em campo.

- **Backend:** `backendChamados/` — Django 5.2 + DRF + MySQL
- **Frontend:** `frontendChamados/` — React 19 + Vite + Tailwind v3
- **Auth:** SessionAuthentication (cookies), `AUTH_USER_MODEL = usuario.Usuario`

---

## 2. Módulos (Django apps)

| App | Endpoint base | Responsabilidade |
|---|---|---|
| `automovel` | `/api/automovel/` | Veículos + agenda de uso |
| `chamado` | `/api/chamados/` | **Entidade central** — tickets |
| `equipamento` | `/api/equipamento/` | Patrimônio (impressoras, computadores, etc.) |
| `equipeTecnica` | `/api/equipes/` | Técnicos, equipes, atendimentos |
| `manutencao` | `/api/manutencao/` | Ordens de manutenção |
| `terceirizada` | `/api/terceirizada/` | Empresas externas + chamados delegados |
| `unidade` | `/api/localidades/` | Bairro, Endereço, Secretaria, Divisão, Unidade |
| `usuario` | `/api/usuarios/` | Usuários + login/logout/sessao-atual |
| `core` | — | `BaseModel` abstrato (auditoria + soft delete) |

Todos os models herdam de `core.BaseModel` (`created_at`, `updated_at`, `created_by`, `updated_by`, `active`, `visible`).

---

## 3. Relações M:N

| Relação | Tipo | Implementação |
|---|---|---|
| Equipe ↔ Tecnico | M:N puro | `ManyToManyField` direto |
| Manutencao ↔ Tecnico | M:N puro | `ManyToManyField` direto |
| Chamado ↔ Equipamento | M:N puro | `ManyToManyField` direto |
| Chamado ↔ Equipe | M:N com through | `Atendimento` explícito |

`Atendimento` carrega `iniciado_em`, `encerrado_em`, `observacoes`, `motivo_encerramento`.

---

## 4. Workflow do chamado

```
aberto → em_andamento → resolvido
                     ↘ aguardando
                     ↘ agendado
```

- Ao **atribuir equipe** a chamado `aberto`, status vira `em_andamento` automaticamente.
- Ao **criar/encerrar** `Atendimento`, atualizar `Equipe.chamado_atual`.
- Urgência: 0 Baixa / 1 Média / 2 Alta / 3 Crítica.

---

## 5. Padrões de backend (Fase 1)

### AuditMixin obrigatório em todas as ViewSets

```python
class AuditMixin:
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
```

### Settings DRF

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Validações específicas

- **Chamado:** `nome_solicitante` deve bater com `request.user.nome_completo` em POST/PUT.
- **Equipe solo:** avisar (não bloquear) ao criar equipe com 1 técnico.
- **Atendimento:** atualizar `Equipe.chamado_atual` ao criar/encerrar.

### Endpoint custom

```
POST /api/atender-solo/{chamado_id}/
```

Numa transação: cria `Equipe` (sem viatura) + adiciona técnico logado + cria `Atendimento`.

---

## 6. Frontend — arquitetura

### Stack

- React 19 + Vite + Tailwind v3
- **TanStack Query** para estado servidor (não `useState` para listas)
- `lucide-react` para ícones (padronizar — abandonar SVGs inline)
- `react-router-dom` a instalar

### Estrutura de pastas

```
src/
├── api/              ← fetch puro, credentials: 'include'
│   ├── chamados.js
│   ├── equipes.js
│   └── ...
├── hooks/            ← wrappers de useQuery/useMutation
│   ├── useChamados.js
│   └── ...
├── pages/
├── components/
└── Sidebar/
```

### Regras TanStack Query

- `refetchInterval: 3000-5000` em listas críticas (chamados, equipes em campo).
- `refetchOnWindowFocus: true` global.
- **Optimistic updates** em todas as mutations.
- Mutations sempre invalidam queries relacionadas.

### Sidebar — paleta navy/teal

```
bg:          #0d1f2d
bgHover:     #14293a
border:      #1e3a4a
accent:      #7fb89e
accentBg:    #1a3d3a
```

Grupos: **Operação** (Chamados, Manutenção) · **Cadastros** (Equipamentos, Automóveis, Unidades) · **Pessoas** (Técnicos, Equipes) · **Organização** (Secretarias, Empresas Terceirizadas).

### Tela despachante

KPIs do turno + cards de equipes ativas (com viatura, localização, ticket em curso) + tabela de chamados ordenada por prioridade + modais de atribuir/criar chamado + toasts.

---

## 7. Fases

| Fase | Objetivo | Status |
|---|---|---|
| 0 | Models + estrutura | ✅ (falta polir Manutenção) |
| 1 | DRF + CRUD via REST | 🔄 em andamento |
| 2 | Lógica de equipes (formar/dissolver, atender solo) | 🔜 |
| 3 | Docker + Redis local | 🔜 |
| 4 | WebSocket para eventos críticos | 🔜 |
| 5 | Polish: offline, reconnect, persistência | 🔜 |

---

## 8. Checklist antes/durante de codar API

- [x] `AUTH_USER_MODEL = 'usuario.Usuario'` antes da primeira migration
- [x] Migrations na ordem: localização → Usuario → resto
- [x] `Tecnico` criado após `Usuario` existir
- [x] `Atendimento` precisa de `Equipe` e `Chamado` existindo
- [ ] AuditMixin aplicado em **todas** as ViewSets
- [ ] Validar `nome_solicitante` vs `request.user.nome_completo` em POST/PUT de Chamado
- [ ] Atualizar `Equipe.chamado_atual` ao criar/encerrar Atendimento
- [ ] CORS + CSRF configurados (origens diferentes em dev)
- [ ] `credentials: 'include'` em todo fetch do front
- [ ] Endpoint `POST /api/atender-solo/{chamado_id}/`

---

## 9. Decisões abertas

- **Regras de Manutenção** (parcialmente definidas):
  - **Criação manual** — técnico clica "Retirar para manutenção" partindo de um chamado/equipamento. Não é automática.
  - **Backup obrigatório só pra computadores** (tipo = COMPUTADOR). Outros tipos (impressora, monitor, telefone) não exigem.
  - **Localização atual do equipamento** = texto livre por enquanto; vira choices quando tiver dados pra padronizar (mesmo padrão de `tipo_agendamento`).
  - **Finalização**: técnico marca como `Finalizado`, obrigatoriamente preenche `servico_executado` e `concluida_em` é setado automaticamente.
  - **Status estendido pra solicitante** (na tela de Chamados, perspectiva da unidade solicitante):
    - `em_backup` — backup sendo feito antes de retirar
    - `backup_realizado` — backup ok, equipamento pode sair
    - `em_manutencao` — equipamento com o técnico/oficina
    - `manutencao_finalizada` — concluída tecnicamente
    - `aguardando_devolucao` — vai voltar ao solicitante
    - `sem_conserto` — descarte
    - `aguardando_entrega_backup` — descartado, falta entregar o backup pro solicitante
  - Esses sub-status são **derivados** de combinações de `backup`, `status`, `servico_executado`, `concluida_em` + possíveis novos campos (`devolvido_em`, `backup_entregue_em`). Detalhar quando wire na API.

- **Double-check de manutenção e fechamento de chamado** (decisão aberta):
  - **Retirar equipamento pra manutenção** — técnico solicita e precisa de aprovação do **solicitante**, do **chefe imediato** ou de **outro colaborador do mesmo setor**?
  - **Fechar chamado** — mesma lógica: precisa double-check entre o(s) **técnico(s)** que atendeu e o **solicitante / chefe imediato / outro do setor** (quando o solicitante original não está presente)?
  - Definir UX: notificação pendente? Botão "confirmar conclusão"? Quem pode bypass?
- Status do `Automovel` muda automaticamente quando entra/sai de Equipe?
- **Campo `Automovel.assentos`** (IntegerField) — necessário pro lobby de equipes calcular quantos slots exibir. Hoje mockado no front (Strada=2, Saveiro=5).
- **`Equipamento` precisa de proprietário** — todo equipamento pertence a alguém:
  - **Comprado** → propriedade da prefeitura
  - **Alugado** → propriedade de uma `EmpresaTerceirizada`

  Estrutura sugerida:

  ```python
  class Equipamento(BaseModel):
      # ... campos existentes
      proprio = models.BooleanField(default=True)  # True = prefeitura, False = terceirizada
      empresa_terceirizada = models.ForeignKey(
          'terceirizada.EmpresaTerceirizada',
          on_delete=models.PROTECT, null=True, blank=True,
          related_name='equipamentos_alugados',
      )

      class Meta:
          constraints = [
              models.CheckConstraint(
                  check=(
                      models.Q(proprio=True, empresa_terceirizada__isnull=True) |
                      models.Q(proprio=False, empresa_terceirizada__isnull=False)
                  ),
                  name='proprio_xor_terceirizada',
              ),
          ]
  ```

  Validação no serializer: se `proprio=False`, `empresa_terceirizada` é obrigatório.

  Frontend precisará: badge "Prefeitura" / nome da empresa no card e drawer de Equipamento + filtro por propriedade.

- **Atributos específicos por tipo de Equipamento** — telefone tem ramal e usuário responsável; outros tipos podem ter atributos próprios (ex: impressora → modelo do toner; monitor → polegadas; computador → especificações). Duas estratégias:

  **Recomendada — tabela especializada (one-to-one com `Equipamento`):**

  ```python
  class Telefone(BaseModel):
      equipamento = models.OneToOneField('equipamento.Equipamento', on_delete=models.CASCADE, related_name='telefone')
      ramal = models.CharField(max_length=20)
      usuario_responsavel = models.ForeignKey('usuario.Usuario', on_delete=models.PROTECT, related_name='telefones')
  ```

  Vantagem: campos com tipos/validação próprios, queries limpas (`telefone.usuario_responsavel`). Cria tabela só pros tipos que **têm** atributos extras — não precisa criar `Computador` / `Monitor` / `Impressora` por simetria se não tiverem nada além do que `Equipamento` já cobre.

  Validação no serializer: ao criar `Equipamento` com `tipo=TELEFONE`, exigir `ramal` e `usuario_responsavel`. **`Equipamento.tipo` é imutável após criação** (`read_only_after_create`) — patrimônios físicos não trocam de natureza, então o problema "telefone vira computador" não existe. Se for absolutamente necessário corrigir cadastro errado, fazer via admin/script com migração explícita e manter `Telefone` antigo como histórico.

  **Alternativa rejeitada — `JSONField atributos`:** flexível mas perde validação por tipo e queries. Evitar.

  Frontend precisará: campos no form de cadastro condicionais ao tipo + exibição do ramal e responsável no card/drawer quando `tipo=TELEFONE`. Filtro "Por ramal" e "Por responsável" na tela de Equipamentos.
- **`Tecnico.responsabilidade` → M:N** — um técnico pode acumular múltiplas atribuições (ex: Redes + Infra). Estrutura sugerida:

  ```python
  class Tecnico(BaseModel):
      disponivel = models.BooleanField(default=True)
      usuario    = models.OneToOneField('usuario.Usuario', on_delete=models.PROTECT, related_name='tecnico')
      responsabilidades = models.ManyToManyField('Responsabilidade', related_name='tecnicos', blank=True)

  class Responsabilidade(BaseModel):
      RESPONSABILIDADE_CHOICES = [
          (0, 'Redes'), (1, 'Infra'), (2, 'Suporte'),
          (3, 'Despachante'), (4, 'Auditoria'),
      ]
      codigo = models.IntegerField(choices=RESPONSABILIDADE_CHOICES, unique=True)
  ```

  Alternativa mais simples (sem novo model): manter as choices como constantes e criar `TecnicoResponsabilidade` como tabela through com `tecnico` + `responsabilidade` (int) + `UniqueConstraint`.

  Migration vai precisar de data migration pra preservar `responsabilidade` atuais.

  Frontend já trabalha com array `responsabilidades: number[]` — wire na API direto depois.
- Permissões granulares (técnico vê só seus próprios chamados?)
- Auth do WebSocket (Fase 4)
- `tipo_agendamento` da `AgendaAutomovel` virar `choices`?
- Histórico de remanejamento de Equipamento
- Model `Area` para priorização geográfica
- **Padrão de styling frontend:** Tailwind em tudo ou CSS clássico? Hoje a Sidebar usa Tailwind+inline-styles e a página de Chamados usa CSS clássico (`styles.css`). Precisa decidir.
- **Models `Predio` e `Sala`** para plantas internas (Paço, futuramente hospital/escola polo). Estrutura sugerida:

  ```python
  class Predio(BaseModel):
      endereco = models.OneToOneField('unidade.Endereco', on_delete=models.PROTECT, related_name='predio')
      nome = models.CharField(max_length=150)
      quantidade_andares = models.IntegerField(default=1)
      # OneToMany de Andar/PlantaAndar (com upload de imagem) ou ImageField direto

  class Sala(BaseModel):
      predio = models.ForeignKey('Predio', on_delete=models.CASCADE, related_name='salas')
      andar = models.IntegerField()
      label = models.CharField(max_length=100)
      pos_x = models.IntegerField()
      pos_y = models.IntegerField()
      largura = models.IntegerField()
      altura = models.IntegerField()
      unidades = models.ManyToManyField('unidade.Unidade', related_name='salas', blank=True)
  ```

  Frontend já tem a aba "Prédios" e a tela de planta com placeholder SVG — basta wire na API quando estiver pronto.

---

## 10. Convenções de código

### Backend
- `snake_case` em campos e métodos
- `choices` via lista de tuplas (não classe)
- Foco em API — Django admin não é prioridade
- Todo model novo herda de `core.BaseModel`

### Frontend
- Componente único por arquivo, mas subcomponentes coesos podem ficar juntos (ex: `NavItem` dentro de `Sidebar.jsx`)
- Ícones via `lucide-react` (não SVG inline)
- Cores via Tailwind config (`tailwind.config.js` já tem `ink-*` e `accent`)
- Apagar arquivos órfãos imediatamente (não deixar dead code)

---

## 11. Estilo de trabalho do dev

- Entende **cada** decisão antes de codar — não copia-cola
- Passo a passo, função por função
- Revisão minuciosa antes de avançar
- **Importante:** dev pode pular detalhes em revisão. Sempre listar **TUDO** que falta, mesmo o que já foi apontado antes.

---

## 12. Estado atual do código (snapshot)

### Concluído
- Models dos 8 apps
- Serializers + Views + URLs default (CRUD básico) dos 8 apps
- `LoginView`, `LogoutView`, `SessaoAtualView` em `usuario`
- Sidebar (navy/teal, responsiva, colapsável)
- Página despachante com layout completo (mock data)
- Conflito Tailwind v3/v4 resolvido (removido `@tailwindcss/vite@4`)

### Pendente imediato
- AuditMixin em todas as ViewSets
- Validações específicas (nome_solicitante, Equipe.chamado_atual)
- CORS + CSRF
- Instalar `@tanstack/react-query` e `react-router-dom`
- Criar camadas `src/api/` e `src/hooks/`
- Wire da página despachante na API real
- Apagar Sidebar órfã em `src/components/chamados/Sidebar.jsx`
- Decidir padrão de styling do frontend
