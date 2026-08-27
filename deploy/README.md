# Deploy na VPS

Três containers: **nginx** (SPA + proxy), **gunicorn/Django**, **MySQL**.

Esta VPS **já hospeda outros sistemas em produção**. O desenho segue o padrão
que já existe nela (o mesmo do `sistemadeconcursos` e do `mangacutter`): o
nginx do host é dono da 80/443 e do TLS, e cada aplicação fica num container
preso ao **loopback**.

```
internet → nginx do HOST :443 (TLS, certbot)
              │  proxy_pass
              ↓
        127.0.0.1:8003  nginx do container ─┬─ /              → SPA (Vite)
                                            ├─ /api/, /admin/ → gunicorn:8000
                                            ├─ /static/       → collectstatic
                                            └─ /media/        → uploads
```

Nada desta stack publica porta pública: **o MySQL e o gunicorn não são
alcançáveis de fora**, só pela rede interna do compose.

Front e API saem da **mesma origem**. É isso que faz o cookie de sessão do
Django funcionar sem CORS — em produção a lista de CORS fica vazia de propósito.

## Arquivos

| Arquivo | Papel |
|---|---|
| `docker-compose.yml` | os três serviços e os volumes |
| `.env.example` | modelo do `.env` (copie e preencha na VPS) |
| `backendChamados/Dockerfile` | Python 3.12 + gunicorn, build do mysqlclient em estágio separado |
| `backendChamados/entrypoint.sh` | espera o banco, roda `migrate` e `collectstatic` |
| `backendChamados/requirements.txt` | versões congeladas do que já estava instalado |
| `frontendChamados/Dockerfile` | build do Vite → nginx |
| `deploy/nginx/default.conf` | nginx DE DENTRO do container (SPA + rotas) |
| `deploy/nginx/host-chamados.conf` | site do nginx DO HOST na VPS atual (Hostinger) |
| `deploy/nginx/host-chamados.template.conf` | modelo do site, para servidor novo |
| `deploy/nginx/catchall.conf` | fecha 444 em domínio desconhecido |
| `deploy/instalar-nginx-host.sh` | nginx + certbot + site, em máquina limpa |
| `deploy/nginx/proxy_params_chamados` | cabeçalhos de proxy pro Django |
| `deploy/verificar-vps.sh` | diagnóstico read-only: o que já roda na VPS e o que conflita |
| `deploy/provisionar-vps.sh` | prepara a máquina: Docker, firewall, fuso (swap só se a RAM for baixa) |
| `backendChamados/gunicorn.conf.py` | workers/threads — é aqui que mora a capacidade |
| `backendChamados/healthcheck.py` | sonda do `HEALTHCHECK`: o Django ainda responde? |
| `deploy/swarm/stack.yml` | versão Swarm da stack (secrets, réplicas) |
| `deploy/swarm/publicar.sh` | build das imagens + secrets + `stack deploy` |
| `deploy/exportar-banco.sh` | dump do banco + uploads, na máquina de dev |
| `deploy/importar-banco.sh` | restaura o pacote na VPS (compose ou swarm) |

## Ambientes

| | servidor definitivo | VPS de transição |
|---|---|---|
| IP | `177.107.71.189` (prefeitura) | `2.24.89.242` (Hostinger KVM4) |
| SSH | **porta 2210** | porta 22 |
| SO | Ubuntu (OpenSSH 10.2) | Ubuntu 24.04 |
| nginx | instalado por `instalar-nginx-host.sh` | já existia, com outros 8 sites |
| Domínio | `os.braganca.sp.gov.br` (zona Cloudflare) | idem, enquanto não vira |

O domínio é o mesmo nos dois: a troca é um registro A na Cloudflare, e por isso
os dois nunca respondem ao mesmo tempo — ver "Migrar para o servidor definitivo".

**A porta do SSH é 2210, não 22.** O `provisionar-vps.sh --dedicada` detecta a
porta real antes de ativar o firewall; nunca libere "OpenSSH" às cegas nessa
máquina, porque isso abriria a 22 e fecharia a 2210 — trancando o acesso.

## Servidor novo, do zero

Quando a máquina é **dedicada a este sistema** e ainda não tem nginx nenhum
(diferente da VPS atual, que já hospedava outros sites):

```bash
git clone <repo> /opt/sistema-chamados && cd /opt/sistema-chamados
sudo bash deploy/provisionar-vps.sh --dedicada
```

A flag `--dedicada` liga o firewall com SSH, 80 e 443 — seguro aqui, porque não
há serviço de terceiro para ficar de fora. Sem ela o script não ativa nada.

Depois o `.env` (ver a seção abaixo) e a stack:

```bash
docker compose up -d --build
```

E o nginx do host, que é a porta de entrada:

```bash
sudo bash deploy/instalar-nginx-host.sh <dominio> 8003
```

Ele instala nginx e certbot, gera o arquivo do site a partir do modelo,
desativa a página "Welcome to nginx" e coloca no lugar dela um **catch-all**
que fecha a conexão (444) para quem chega por um domínio desconhecido — sem
isso, o nginx entrega essas requisições ao primeiro site carregado.

Ao final ele imprime a sequência do DNS e do certificado. Nada de certbot antes
de o domínio resolver para esta máquina.

## Migrar para o servidor definitivo

Da VPS da Hostinger (`2.24.89.242`) para o servidor da prefeitura
(`177.107.71.189`), com o **mesmo domínio**. A ordem existe para que o sistema
só saia do ar no instante da virada de DNS.

**1. Preparar o servidor novo** (nada disso afeta quem está usando hoje):

```bash
git clone <repo> /opt/sistema-chamados && cd /opt/sistema-chamados
sudo bash deploy/provisionar-vps.sh --dedicada
cp .env.example .env      # gerar os três segredos aqui — NÃO copie os da VPS
docker compose up -d --build
sudo bash deploy/instalar-nginx-host.sh os.braganca.sp.gov.br 8003
```

**2. Levar o banco.** No servidor ANTIGO, gerar o pacote (dump + uploads):

```bash
cd ~/smit/sistemaChamadosSmit
docker compose exec -T db mysqldump -u root -p"$DB_ROOT_PASSWORD"   --single-transaction --no-tablespaces --set-gtid-purged=OFF   sistema_chamados | gzip > /root/banco.sql.gz
docker compose cp backend:/app/media /root/media && tar -czf /root/media.tar.gz -C /root media
```

Enviar para o novo — repare no **`-P 2210`** maiúsculo, que é a porta do SSH:

```bash
scp -P 2210 /root/banco.sql.gz /root/media.tar.gz root@177.107.71.189:/root/
```

E importar, já no servidor novo:

```bash
cd /opt/sistema-chamados
bash deploy/importar-banco.sh /root/banco.sql.gz /root/media.tar.gz
```

A conferência no fim tem que fechar com a mesma contagem do servidor antigo.

**3. Testar sem mexer no DNS**, pelo cabeçalho Host:

```bash
curl -s -o /dev/null -w '%{http_code}
' -H 'Host: os.braganca.sp.gov.br' http://127.0.0.1/
```

Para clicar na tela antes da virada, aponte o domínio no `hosts` da sua máquina
para `177.107.71.189` — e **apague a linha depois**.

**4. Virar o DNS.** Na Cloudflare, o registro A de `os` passa de `2.24.89.242`
para `177.107.71.189`. Mantenha a nuvem **cinza** (DNS only), senão o certbot
não valida. Confirme antes de seguir:

```bash
dig +short os.braganca.sp.gov.br @8.8.8.8    # tem que responder 177.107.71.189
```

**5. Emitir o certificado** no servidor novo, e só então ligar o HTTPS:

```bash
certbot --nginx -d os.braganca.sp.gov.br
sed -i 's/^DJANGO_HTTPS=0/DJANGO_HTTPS=1/' .env && docker compose up -d backend
```

**6. Desligar o antigo** só depois de alguns dias de uso normal — resolvedores
com cache antigo ainda chegam lá. Enquanto isso ele serve uma cópia velha do
banco, então trate como somente-leitura e avise quem usa.

> Não gere segredos novos copiando o `.env` da VPS: aquele arquivo já circulou
> por dois servidores. Gere na máquina nova, como está no topo do `.env.example`.

## Subir pela primeira vez

**1. Preparar a máquina** (uma vez só, como root — instala Docker, firewall e swap):

```bash
sudo bash deploy/provisionar-vps.sh
```

**2. Clonar e configurar:**

```bash
git clone <repo> sistema-chamados && cd sistema-chamados
cp .env.example .env
```

Gere os três segredos **no próprio servidor** e cole no `.env`. A
`SECRET_KEY` que está no `settings.py` é pública (está versionada) e não serve
para produção:

```bash
openssl rand -base64 48    # DJANGO_SECRET_KEY
openssl rand -base64 24    # DB_PASSWORD
openssl rand -base64 24    # DB_ROOT_PASSWORD
```

`DJANGO_ALLOWED_HOSTS` e `DJANGO_CSRF_TRUSTED_ORIGINS` já vêm preenchidos com o
domínio e o IP deste ambiente.

**3. Subir:**

```bash
docker compose up -d --build
```

O `entrypoint.sh` já roda as migrações e o `collectstatic` sozinho.

O banco nasce vazio — sem nenhum usuário, ninguém consegue entrar ainda. Isso é
esperado; confirme que a stack está de pé pelo HTTP, não pelo login:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H 'Host: os.bragancapta.sp.gov.br' http://127.0.0.1:8003/   # espera-se 200
```

**Migrando de um banco existente** (o caso desta implantação): os usuários vêm
no dump, com as senhas atuais. Vá direto para "Levar o banco atual para a VPS"
e **não** crie superusuário — o import recria o schema e apagaria o que você
criasse agora.

**Instalação limpa**, sem dump: aí sim é preciso um primeiro usuário, senão não
há como entrar para criar os demais.

```bash
docker compose exec backend python manage.py createsuperuser
```

## Swarm (alternativa ao compose)

O `docker-compose.yml` continua sendo o caminho simples. O Swarm entra quando
você quer **atualizar o backend sem derrubar o sistema** e **senha fora do
`environment`**. Em nó único ele não dá alta disponibilidade — se a VPS cair,
cai tudo igual. O ganho real aqui é operacional.

### O que Swarm NÃO resolve

Réplica em nó único **não aumenta capacidade**: as duas dividem os mesmos
4 vCPUs. Quem determina quantas requisições simultâneas o sistema atende é o
número de *workers* do gunicorn — está em
[`gunicorn.conf.py`](../backendChamados/gunicorn.conf.py), com `WEB_CONCURRENCY`
por ambiente:

| | workers por instância | instâncias | total |
|---|---|---|---|
| compose | 9 | 1 | 9 |
| swarm | 4 | 2 | 8 |

O total é o que importa, e ele é ditado pelos núcleos — não pelo número de
réplicas. Subir `replicas` sem baixar `WEB_CONCURRENCY` piora: mais processos
brigando pela mesma CPU.

O que a réplica dá de verdade contra travamento é **substituir instância
travada**: o `HEALTHCHECK` do backend sonda se o Django ainda responde, e o
Swarm troca a réplica que parou de responder — sem isso, "escalar" só
multiplica container zumbi.

Se o travamento continuar depois disso, o próximo suspeito é consulta ao banco
(N+1 nos serializers), não infraestrutura. Aí a ferramenta é medir, não
aumentar réplica.

```bash
docker swarm init --advertise-addr 2.24.89.242   # uma vez só
bash deploy/swarm/publicar.sh                    # build + secrets + deploy
```

O `publicar.sh` cria os três secrets na primeira execução (gerados com
`openssl` dentro da VPS) e faz o deploy. Nas próximas vezes ele reaproveita os
secrets existentes e só reconstrói as imagens.

Diferenças que valem saber:

| | compose | swarm |
|---|---|---|
| Senhas | `.env` (visível em `docker inspect`) | secret em `/run/secrets/` |
| Backend | 1 container | 2 réplicas, atualização `start-first` |
| Banco | 1 container | 1 réplica, `stop-first`, preso ao nó manager |
| Build | `docker compose up --build` | `publicar.sh` (Swarm não builda) |

O banco fica em **uma réplica só, de propósito**. Dois MySQL no mesmo volume
corrompem os dados — escalar banco é replicação, não `replicas: 2`.

```bash
docker stack services chamados          # estado
docker service logs -f chamados_backend # log
docker stack rm chamados                # derrubar (volumes ficam)
```

## Levar o banco atual para a VPS

O `migrate` roda sozinho no entrypoint, então o **schema** nunca é problema. O
que precisa viajar são os **dados** — hoje 2008 usuários e 173 unidades — e os
**uploads** (plantas dos andares), que são arquivos em disco e não estão no
dump.

Na máquina de desenvolvimento:

```bash
bash deploy/exportar-banco.sh
scp deploy/dump/*.gz root@2.24.89.242:/root/
```

Na VPS, com a stack já no ar:

```bash
bash deploy/importar-banco.sh /root/banco-AAAAMMDD-HHMM.sql.gz /root/media-AAAAMMDD-HHMM.tar.gz
```

O script detecta sozinho se você está em compose ou swarm, **faz backup do que
já estava lá** antes de qualquer coisa, para o backend durante a troca,
recria o schema, importa e mostra a contagem de registros para você conferir
contra a origem.

> O dump sai em `deploy/dump/`, que está no `.gitignore`. Ele contém dados
> pessoais de mais de 2000 servidores — não versione, não mande por e-mail e
> apague da VPS depois de conferir a importação.

## Operação

```bash
docker compose logs -f backend        # log do gunicorn
docker compose ps                     # estado dos containers
docker compose up -d --build          # publicar uma versão nova
docker compose exec backend python manage.py migrate   # migração avulsa
```

Backup do banco (o volume `db_data` guarda os dados; isto gera o dump):

```bash
docker compose exec db mysqldump -u root -p"$DB_ROOT_PASSWORD" sistema_chamados > backup-$(date +%F).sql
```

## Publicar no nginx do host

A stack sozinha só responde em `http://127.0.0.1:8003`, de dentro da VPS. Quem
a expõe é o nginx do host, igual aos outros sistemas:

```bash
sudo cp deploy/nginx/host-chamados.conf \
        /etc/nginx/sites-available/os.bragancapta.sp.gov.br
sudo ln -s /etc/nginx/sites-available/os.bragancapta.sp.gov.br \
           /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` antes do reload não é formalidade: um erro de sintaxe aqui derruba
**todos** os sites da máquina, não só este.

Teste local antes de mexer em DNS:

```bash
curl -H 'Host: os.bragancapta.sp.gov.br' -I http://127.0.0.1/
```

## HTTPS

### Pré-requisito: apontar o DNS

Hoje `os.bragancapta.sp.gov.br` resolve para `162.241.60.59` (a hospedagem
antiga). O Let's Encrypt valida acessando o domínio pela internet — enquanto o
registro A não apontar para `2.24.89.242`, a emissão falha.

```bash
dig +short os.bragancapta.sp.gov.br      # tem que responder 2.24.89.242
```

### Emitir o certificado

Pelo certbot que **já existe no host** — o mesmo que emitiu os certificados de
`mangacutter.com`, `concursos.vgrn.cloud` e companhia. Não instale um segundo:

```bash
sudo certbot --nginx -d os.bragancapta.sp.gov.br
```

Ele reescreve o arquivo do site acrescentando o bloco 443 e o redirecionamento,
e a renovação automática já está configurada na máquina.

### Ativar no Django

```bash
sed -i 's/^DJANGO_HTTPS=0/DJANGO_HTTPS=1/' .env
docker compose up -d backend
```

**Vire o `DJANGO_HTTPS` só depois do certificado ativo.** Com ele em `1` sobre
HTTP puro, o navegador descarta o cookie de sessão e o login entra em loop sem
mensagem de erro.

### Renovação

O certificado vale 90 dias. Agende a renovação no cron do host:

```bash
0 3 * * 1 cd /caminho/do/repo && docker compose run --rm certbot renew --quiet && docker compose restart web
```

Depois do TLS no ar, vale ligar `SECURE_SSL_REDIRECT` e `SECURE_HSTS_SECONDS`
no `settings.py` — são os dois avisos que sobram no `manage.py check --deploy`.

## Firewall

O compose publica só a 80. Garanta que 3306 (MySQL) e 8000 (gunicorn) não estão
abertos no provedor: eles não precisam sair da VPS.
