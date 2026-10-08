# GlicHelp / TiaBete — frontend

HTML, CSS e JavaScript sem framework. A API ASP.NET está incluída em `BeckEndTiaBete-main (2)/BeckEndTiaBete-main`.

## Executar localmente

Requer Node.js moderno. Execute `node dev-server.mjs` e abra http://localhost:5173/login.html. A API local do backend incluído escuta em http://localhost:5288/api (e redireciona HTTP para HTTPS na porta 7130); permita a origem http://localhost:5173 no CORS da API.

Defina `window.GLICHELP_API_URL` antes de carregar Js/Api.js para usar outro endereço (inclua /api). Configure a API de produção antes de publicar: a configuração desta versão está vazia para evitar enviar testes ao ambiente publicado anterior. Não coloque chaves JWT, credenciais SMTP ou do banco no frontend.

### Segredos locais do backend

O arquivo `BackEnd/Presentation/appsettings.json` mantém vazios `ConnectionStrings:DefaultConnection` e `Jwt:Key`. Configure os valores locais com User Secrets (o nome do banco local é `glichelpdb`):

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=glichelpdb;User=SEU_USUARIO;Password=SUA_SENHA" --project BackEnd/Presentation/Presentation.csproj
dotnet user-secrets set "Jwt:Key" "SUA_CHAVE_ALEATORIA_COM_PELO_MENOS_32_BYTES" --project BackEnd/Presentation/Presentation.csproj
dotnet user-secrets set "Smtp:Password" "COLE_A_SENHA_DE_APP_SOMENTE_NO_SEU_TERMINAL" --project BackEnd/Presentation/Presentation.csproj
```

Para Gmail, a pessoa responsável pela conta `glichelpgh@gmail.com` precisa ativar a verificação em duas etapas e gerar uma senha de app em https://myaccount.google.com/apppasswords. O host, remetente e usuário `glichelpgh@gmail.com` já estão configurados em `BackEnd/Presentation/appsettings.json`; a senha de app deve ficar somente em User Secrets no desenvolvimento ou na variável `Smtp__Password` em produção. Nunca a coloque em arquivo versionado nem a envie pelo chat. Se uma senha de app for exposta, revogue-a no Google e gere outra.

Em Development, sem senha configurada, o código aparece somente no console local para permitir testes; fora de Development, a API não inicia sem `Smtp__Password`. O envio usa StartTLS e timeout de 15 segundos. Se falhar no cadastro, reenvio ou troca de e-mail, a API retorna 503; a recuperação de senha mantém uma resposta genérica. O intervalo mínimo entre reenvios é de 60 segundos.

## GlicBot

O chat usa `https://tiabete-server.onrender.com/api/glicbot` por padrão. Para usar outro endpoint, defina `window.GLICBOT_API_URL` antes de carregar `Js/glicbot.js`, por exemplo:

```html
<script>
  window.GLICBOT_API_URL = "https://seu-servidor.example/api/glicbot";
</script>
<script src="Js/glicbot.js"></script>
```

O servidor do GlicBot é o repositório [Tiabete-server](https://github.com/kablumenschein/Tiabete-server), separado deste frontend. No serviço dele no Render, configure a variável `ALLOWED_ORIGINS` com a origem exata do site publicado (somente esquema e domínio, sem caminho ou barra final), por exemplo `https://seu-site.example`. Para permitir mais de uma origem, separe-as por vírgula; em desenvolvimento, inclua também `http://localhost:5173`. Sem essa configuração, o servidor aceita apenas origens locais e o navegador bloqueia a chamada do site publicado.

## Compatibilidade com o backend incluído

O backend foi comparado com as chamadas feitas pelo frontend. Login, perfil, reativação, confirmação de e-mail, recuperação de senha e operações de registros têm rotas correspondentes; há diferenças de formatos e validações:

- `POST /usuario` salva os dados ainda não confirmados em `CadastrosPendentes`; o registro em `Usuarios` só é criado depois que o código de seis dígitos enviado por e-mail é validado.
- O backend implementa `POST /usuario/consultar-cadastro`, `/usuario/confirmar-email`, `/usuario/reenviar-codigo`, `/usuario/confirmar-novo-email`, `/usuario/recuperar-senha` e `/usuario/redefinir-senha`.
- O backend devolve 201 ao criar um registro e 204 ao atualizar/excluir; o frontend aceita respostas sem corpo. HI usa `glicemiaAcimaDoLimite=true` e `glicemia=null` em ambos.
- O backend usa `int` para fator de sensibilidade, HGT alvo e dose, enquanto o frontend permite casas decimais em fator e dose. O backend permite fator/HGT alvo até 600, embora o frontend limite a 501. A validação do backend também não impõe todas as faixas de HGT/data do frontend.
- A observação aceita até 500 caracteres no backend, mas a interface limita a 200.

## Verificação

Execute `node regression-tests.cjs` e `node Js/form-inputs-tests.cjs`. As fixtures verificam histórico com observação, escape de HTML, limite de HGT entre 19 e 501 mg/dL na calculadora, máscara de telefone e limites dos campos de perfil/cadastro. Os testes não usam contas reais nem fazem requisições de rede. A fórmula da calculadora não passou por validação clínica.

## Limites conhecidos

Antes de usar o fluxo de confirmação, aplique as migrations do backend para criar a tabela `CadastrosPendentes`. Ainda é necessário alinhar os tipos/faixas numéricos entre frontend e backend. GlicBot usa o serviço externo existente, fora do escopo desta integração. A fórmula da calculadora não passou por validação clínica.
