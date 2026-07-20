# Ressalvas — mapeamento dos grupos do AD (usuários)

Decisões **provisórias** tomadas em 16/07/2026 durante o tratamento do
`Usuarios_AD_Completo.csv`. Conferir depois e ajustar o
`mapeamento_grupos_ad.csv` (e re-rodar `python manage.py tratar_usuarios_ad`)
se alguma estiver errada.

## 1. DICA — ficou na SMA
O grupo não aparece no AD, mas surgiu a dúvida se a **Divisão Comunicação
Administrativa (DICA, id 919)** seria da SECOM. Mantivemos como está no banco:
**SMA**. Se confirmar que é SECOM, trocar a `secretaria` da divisão 919 no admin.

## 2. Apoio Financeiro → Tesouraria (SMF)
Grupo `Divisao de Apoio Financeiro` (22 pessoas) mapeado pra
**id 944 — SMF · Divisão de Fiscalização (sigla "Tesouraria")**.
Premissa: apoio financeiro = tesouraria. Conferir se não deveria ser uma
divisão própria.

## 3. Cadastro Técnico Imobiliário → AFTI (SMF)
Grupos `Divisao de Cadastro Tecnico Imobiliario - Edicao` (128 pessoas) e
`- Consulta` (33) mapeados pra **id 945 — SMF · Divisão de Fiscalização (AFTI)**.
Premissa: quem mexe no cadastro imobiliário responde ao AFTI. Atenção: esses
grupos parecem ser **permissão de sistema** (edição/consulta), então muita
gente de outras áreas os tem — vários usuários caíram em "multiplas divisoes"
por causa disso.

## 4. Convênios → divisão criada na SMGDEI
Não existia no banco. Criada **id 965 — SMGDEI · Divisão de Convênios** e o
grupo `Divisao de Convenios` (21 pessoas) aponta pra ela.
Conferir se convênios é mesmo da SMGDEI (os ramais de CONVENIOS ficam junto
ao gabinete) e se o nome oficial é esse.
