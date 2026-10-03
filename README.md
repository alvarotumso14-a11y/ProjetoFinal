# GlicHelp / TiaBete — frontend

HTML, CSS e JavaScript sem framework. A API ASP.NET está incluída em `BeckEndTiaBete-main (2)/BeckEndTiaBete-main`.

## Executar localmente

Requer Node.js moderno. Execute `node dev-server.mjs` e abra http://localhost:5173/login.html. A API local do backend incluído escuta em http://localhost:5288/api (e redireciona HTTP para HTTPS na porta 7130); permita a origem http://localhost:5173 no CORS da API.

Defina `window.GLICHELP_API_URL` antes de carregar Js/Api.js para usar outro endereço (inclua /api). Configure a API de produção antes de publicar: a configuração desta versão está vazia para evitar enviar testes ao ambiente publicado anterior. Não coloque chaves JWT, credenciais SMTP ou do banco no frontend.

## Compatibilidade com o backend incluído

O backend foi comparado com as chamadas feitas pelo frontend. Login, perfil, reativação e operações de registros têm rotas correspondentes; os demais fluxos e formatos abaixo ainda não estão totalmente alinhados:

- `POST /usuario` cria a conta imediatamente e retorna 201 com o usuário. O frontend espera uma tentativa de cadastro, confirmação por código e posterior login.
- O backend não implementa `POST /usuario/consultar-cadastro`, `/usuario/confirmar-email`, `/usuario/reenviar-codigo` nem `/usuario/confirmar-novo-email`. A alteração de e-mail via `PATCH /usuario/perfil` é imediata (204).
- O backend não implementa `POST /usuario/recuperar-senha` nem `/usuario/redefinir-senha`; a tela de recuperação existe no frontend, mas depende desses endpoints.
- O backend devolve 201 ao criar um registro e 204 ao atualizar/excluir; o frontend aceita respostas sem corpo. HI usa `glicemiaAcimaDoLimite=true` e `glicemia=null` em ambos.
- O backend usa `int` para fator de sensibilidade, HGT alvo e dose, enquanto o frontend permite casas decimais em fator e dose. O backend permite fator/HGT alvo até 600, embora o frontend limite a 501. A validação do backend também não impõe todas as faixas de HGT/data do frontend.
- A observação aceita até 500 caracteres no backend, mas a interface limita a 200. Aceite dos termos, consentimento de saúde e responsável legal enviados pelo frontend não aparecem no DTO/modelo do backend e não são persistidos.

## Verificação

Execute `node regression-tests.cjs` e `node Js/form-inputs-tests.cjs`. As fixtures verificam histórico com observação, escape de HTML, limite de HGT entre 19 e 501 mg/dL na calculadora, máscara de telefone e limites dos campos de perfil/cadastro. Os testes não usam contas reais nem fazem requisições de rede. A fórmula da calculadora não passou por validação clínica.

## Limites conhecidos

Para ativar cadastro/alteração de e-mail com confirmação e recuperação de senha, é necessário implementar os endpoints e o envio de códigos no backend. Também é necessário alinhar os tipos/faixas numéricos e persistir os consentimentos antes de usar esses fluxos com dados reais. GlicBot usa o serviço externo existente, fora do escopo desta integração. A fórmula da calculadora não passou por validação clínica.
