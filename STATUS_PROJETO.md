# Sistema de Chamados - Prefeitura de Bragança Paulista

Status do projeto em **17/07/2026**. Backend Django REST (`backendChamados/`),
frontend React 19 + Vite + Tailwind (`frontendChamados/`), banco MySQL local
(`sistema_chamados`).

---

## O QUE ESTÁ FEITO

### Infraestrutura / base
- [x] Django + DRF com apps: `usuario`, `unidade`, `chamado`, `equipamento`,
      `automovel`, `equipeTecnica`, `manutencao`, `terceirizada`, `ramal`, `core`
- [x] `BaseModel` (created/updated_at/by, active, visible) + `AuditMixin` em todos os ViewSets
- [x] Autenticação por sessão cross-origin (`CsrfExemptSessionAuthentication`),
      CORS pra localhost:5173/5174, MEDIA configurado (uploads de plantas)
- [x] Front com TanStack Query em camadas: `api/` (fetch + credentials) → `hooks/` → `adapters/` → páginas
- [x] Paleta clara padronizada + sidebar navy; build Vite verde

### Autenticação e usuários
- [x] Login/logout/sessão (`/api/usuarios/login|logout|sessao/`) + tela de login
      (fundo navy, brasão da prefeitura)
- [x] Roteamento por papel: DIT → sistema completo; demais → portal do solicitante
- [x] Troca de senha no perfil (todos) + endpoint `trocar-senha`
- [x] Flag `precisa_trocar_senha` + **alerta vermelho "TROQUE SUA SENHA"** na
      página inicial dos dois perfis (some após trocar)
- [x] **Import do AD**: 2.007 usuários criados (username = login de rede, senha
      inicial `Mudar@123`), 30 contas de sistema descartadas
  - Tratamento em `usuario/management/commands/tratar_usuarios_ad.py`
  - Mapeamento grupo AD → divisão em `backendChamados/mapeamento_grupos_ad.csv` (revisável)
  - Ressalvas provisórias em `backendChamados/RESSALVAS_MAPEAMENTO_AD.md`
    (DICA/SMA, Apoio Financeiro→Tesouraria, Cadastro Imobiliário→AFTI, Convênios→SMGDEI id 965)
- [x] `divisao_definida` + admin **"Pendências de divisão"** (fila pra resolver
      usuário por usuário; ~1.499 pendentes)
- [x] **Solicitação de setor**: usuário sem divisão é bloqueado de abrir chamado
      e pede vínculo pelo perfil (busca por nome/sigla); chefe aprova na aba
      "Solicitações" do portal; DIT aprova na página "Solicitações" do sistema
      completo. Aprovação grava divisão + resolve pendência. Testado ponta a ponta.

### Chamados (portal do solicitante)
- [x] Abertura de chamado SEM urgência (só a DIT define urgência)
- [x] Chamado vai automaticamente pro setor do solicitante; chefes, secretários
      e DIT podem escolher a unidade
- [x] Visibilidade por papel (backend `?visiveis=1`):
      comum vê o setor; chefe vê o dele + de todos os subordinados (recursivo,
      agrupado por divisão); secretário vê a secretaria toda; DIT vê tudo
- [x] Abas **Abertos / Em andamento / Concluídos** + filtro "só os meus"

### Localidades (unidade)
- [x] Bairros (117), Endereços (106, geocodificados: 38 exatos / 43 bairro / 25 centro,
      campo `geo_precisao` + admin pra ajuste manual), Secretarias (20, com cor),
      Divisões (98), Unidades (169), Telefones (194), E-mails (95), Responsáveis (62)
- [x] Tela de unidades: mapa Leaflet + lista agrupada por endereço, filtros,
      CRUD de endereço
- [x] **Planta do Paço**: models `Predio`/`PlantaAndar`/`Sala` (sala = polígono
      em % da imagem, ocupante = Divisão), imagens térreo/superior no MEDIA,
      **editor visual de polígono no admin** (clicar pra criar vértice, arrastar,
      duplo-clique remove), front renderiza SVG com hover bidirecional
- [x] Botão "Visualizar planta" derivado da API (sem id hardcoded)

### Módulos conectados à API (CRUD completo)
- [x] **Automóveis** (2 veículos reais: Saveiro e Gol) + agendamentos (tipo obrigatório)
- [x] **Equipamentos** (0 no banco - aguardando inventário real)
- [x] **Terceirizadas** (empresas + chamados delegados; drawer + modal CRUD)
- [x] **Ramais** (495 ramais / 52 setores importados de `ramais.txt` via
      `seed_ramais`; tabela com busca/filtros + CRUD)

### Dados reais no banco
| Entidade | Qtd | | Entidade | Qtd |
|---|---|---|---|---|
| Usuários | 2.008 | | Unidades | 169 |
| Ramais | 495 | | Divisões | 98 |
| Endereços | 106 | | Secretarias | 20 |
| Telefones | 194 | | Automóveis | 2 |

---

## O QUE FALTA

### Crítico / próximo
- [ ] **Chamados - visão DIT**: a página de chamados do sistema completo ainda é
      MOCK (`pages/chamados/data.js`). Conectar na API real: tabela, filtros,
      mapa, mudança de status/urgência, atribuição de equipe
- [ ] **Fluxo de status do chamado**: quem move Aberto → Em andamento → Finalizado
      (DIT/técnico), preenchimento de `finalizado_em`
- [ ] **Técnicos**: módulo inteiro mock; depende de decisão sobre
      Usuario ↔ responsabilidades (M:N) - adiado algumas vezes
- [ ] **Equipes**: mock; model `Equipe`/`Atendimento` existe no back mas sem
      serializer/tela conectada
- [ ] **Manutenção**: mock
- [ ] **Secretarias (tela)**: parcialmente conectada (hooks `useSecretariasArvore`
      prontos), falta religar a página toda

### Usuários / AD
- [ ] Resolver ~1.499 **pendências de divisão** (admin → Pendências de divisão;
      194 têm múltiplas candidatas anotadas em `obs_importacao`)
- [ ] Conferir as 4 **ressalvas do mapeamento AD** (`RESSALVAS_MAPEAMENTO_AD.md`)
- [ ] Preencher `chefe_imediato` (hoje vazio - a aprovação de setor por chefes
      só funciona na prática via DIT até isso existir)
- [ ] Definir secretários (`Secretaria.secretario_responsavel`) pra visão de
      secretário valer
- [ ] Sincronização periódica com o AD (re-rodar tratar/importar com export novo)

### Planta do Paço
- [ ] Cadastrar as salas dos 2 andares no editor do admin (0 salas hoje)
- [ ] (Opcional) plantas de outros prédios

### Dados
- [ ] Ajustar manualmente ~68 endereços com coordenada imprecisa
      (admin → Endereços → filtro `geo_precisao`)
- [ ] Inventário de equipamentos (tabela vazia); pendências anotadas:
      dono próprio/terceirizada, Telefone OneToOne com ramal/responsável, tipo imutável
- [ ] Vincular ramais às divisões (`Ramal.divisao` existe, hoje NULL)

### Técnica / segurança (antes de produção)
- [ ] `SECRET_KEY`/credenciais MySQL fora do `settings.py` (env vars); `DEBUG=False`
- [ ] Trocar senha do MySQL (root/root)
- [ ] Permissões por papel nos endpoints de escrita (hoje todo autenticado
      escreve na maioria dos módulos; chamados já tem regras)
- [ ] Forçar troca de senha no primeiro login também no admin/altsenha via API
      (front já bloqueia com alerta, mas não impede navegação)
- [ ] Testes automatizados (hoje só smoke tests manuais)
- [ ] Deploy (servidor, gunicorn/nginx, static/media, backup do banco)

### Observações pro repositório
- `Usuarios_AD_Completo.csv`, `usuarios_ad_tratado.csv`, `usuarios_ad_descartados.csv`
  e `ramais.txt` contêm **dados pessoais de servidores** - mantidos FORA do git
  (.gitignore). Os comandos de seed leem esses arquivos localmente.
- As imagens das plantas (`backendChamados/media/plantas/`) ESTÃO versionadas -
  são necessárias pro `seed_planta_paco`. Uploads futuros de outras plantas
  entram aí também; se o diretório crescer, avaliar ignorar.
- O banco MySQL não vai pro git - recriar com `migrate` + comandos de seed.
