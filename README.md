# GlicHelp / TiaBete — frontend

HTML, CSS e JavaScript sem framework. Requer uma API compatível com os contratos abaixo.

## Executar localmente

Requer Node.js moderno. Execute `node dev-server.mjs` e abra http://localhost:5173/login.html. A API local padrão é http://localhost:5388/api; permita a origem http://localhost:5173 no CORS da API.

Defina `window.GLICHELP_API_URL` antes de carregar Js/Api.js para usar outro endereço (inclua /api). Configure a API de produção antes de publicar: a configuração desta versão está vazia para evitar enviar testes ao ambiente publicado anterior. Não coloque chaves JWT, credenciais SMTP ou do banco no frontend.

## Contratos necessários

- POST /usuario retorna 202 com mensagem e tentativaId. Confirmação de cadastro exige email, codigo e tentativaId; somente depois ocorre login.
- POST /usuario/consultar-cadastro recebe email e retorna status novo, ativo ou desativado. Conta desativada segue para reativar-conta.html, exigindo a senha atual em POST /usuario/reativar.
- PATCH /usuario/perfil retorna 202 quando inicia confirmação de novo e-mail. POST /usuario/confirmar-novo-email exige JWT e codigo. Depois da confirmação, o usuário entra novamente.
- Excluir conta usa DELETE /usuario/perfil para desativar, preservando os dados. Reativação ocorre pelo caminho Criar conta.
- HI é representado por glicemiaAcimaDoLimite=true e glicemia=null. Valores numéricos positivos e dose zero são preservados.

## Verificação

Execute `node regression-tests.cjs` e `node form-inputs-tests.cjs`. As fixtures verificam histórico com observação, escape de HTML, limite de HGT entre 19 e 501 mg/dL na calculadora, máscara de telefone e limites dos campos de perfil/cadastro. Os testes não usam contas reais nem fazem requisições de rede. A fórmula da calculadora não passou por validação clínica.

## Limites conhecidos

Recuperação de senha não implementada. Campos extras de consentimento exigem persistência própria na API. GlicBot usa o serviço externo existente, fora do escopo deste PR. Esta atualização de frontend depende de uma API compatível; o código e as migrations do backend não estão incluídos.
