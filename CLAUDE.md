# CLAUDE.md — GlicBot (assistente de IA do GlicHelp)

## O que é este projeto

GlicBot é o assistente conversacional planejado para a v2 do GlicHelp (app de
controle de glicemia/insulina para pessoas com diabetes). Responde perguntas
sobre diabetes, sobre o uso do app e, futuramente, dá dicas personalizadas.
Este documento existe para orientar quem for construir o GlicBot (humano ou
Claude Code) — é um plano vivo, não uma arquitetura fechada.

**Restrição de contexto:** GlicHelp é um projeto sem fins lucrativos, com
esforço/orçamento limitado. Toda decisão técnica abaixo prioriza o menor
esforço que resolve o problema agora, não a solução mais sofisticada possível.

## Stack (proposto — a validar)

| Camada | Escolha | Status |
|--------|---------|--------|
| Linguagem do backend do bot | Node.js/Express — proxy mínimo, só pra não expor a chave de API no navegador | Definido |
| LLM | Groq (console.groq.com), free tier — modelo `openai/gpt-oss-20b`, trocável via variável de ambiente. Migrado da NVIDIA NIM em set/2026: mesmo modelo, hardware mais rápido, sem treinar com os dados enviados | Definido |
| Técnica de resposta | RAG (Retrieval-Augmented Generation) | Definido |
| Base de conhecimento | FAQ + textos sobre diabetes + docs do app, em Markdown | Definido |
| Prototipagem | NotebookLM (Google) para validar respostas antes de codar | Definido |
| Frontend | Já existe — HTML/CSS/JS vanilla; GlicBot entra como componente de chat | Existente |

## Fluxo de execução — v1 (RAG simples, sem agente)

1. **Usuário pergunta** no chat do app.
2. **Backend recebe a pergunta.**
3. **Busca na base de conhecimento** pelos trechos mais relevantes (com base
   pequena, isso pode ser só colar o conteúdo inteiro no prompt — busca
   vetorial de verdade só compensa quando a base crescer).
4. **Monta o prompt aumentado**: pergunta do usuário + trechos recuperados.
5. **Chama o LLM**, instruído a responder *somente* com base no contexto
   fornecido.
6. **Retorna a resposta.** Se a base não tiver a informação, o bot diz que
   não sabe — nunca inventa.

Isso ainda não é "agentic": é um pipeline de pergunta-e-resposta. Vira
agentic quando o bot ganha ferramentas para *agir* (ex.: consultar os
registros de glicemia do próprio usuário no banco) — deixar para uma fase
posterior, só se o produto pedir.

**Status:** v1 implementada e em produção — `Js/glicbot.js` (front-end) e
`server/` (proxy Node/Express + Groq), hospedados respectivamente a definir
(GitHub Pages) e Render. A base de conhecimento tem 14 categorias: as 5
originais cobrindo os chips do `glicbot.html` (hipoglicemia, hiperglicemia,
alimentação, exercício, insulina) mais 9 adicionadas em set/2026 (tipos de
diabetes, metas glicêmicas, cuidados com os pés, pré-diabetes, cetoacidose,
dias de doença, álcool, vacinas, complicações crônicas). Ver
`README-glicbot.md` para setup e para a lista de fontes.

**Fontes da base de conhecimento** (conteúdo verificado contra mais de uma
fonte quando possível, nunca inventado):
- Sociedade Brasileira de Diabetes — [Diretriz 2026](https://diretriz.diabetes.org.br/)
- Ministério da Saúde — [Linhas de Cuidado](https://linhasdecuidado.saude.gov.br/)
- American Diabetes Association — [Standards of Care in Diabetes](https://professional.diabetes.org/standards-of-care)
- Mayo Clinic — [mayoclinic.org](https://www.mayoclinic.org/)
- Joslin Diabetes Center (Harvard Medical School) — [joslin.org](https://joslin.org/)

Os valores numéricos (metas de glicemia, por exemplo) foram cruzados entre
a SBD e a ADA e batem exatamente — reforça que não é uma posição isolada de
uma única fonte.

**Incidente de segurança (set/2026):** uma chave de API foi commitada por
engano num arquivo `.env.example` público no GitHub. Remediado: chave
revogada, nova chave gerada, `.env.example` corrigido, variável de ambiente
atualizada no Render. Lição registrada: nunca colar segredos reais em
arquivos `.example`.

## Observability — sempre pensar em métrica, sempre pensar em log

Não deixar para depois; instrumentar desde a primeira versão:

- **Logar** toda pergunta recebida, a resposta gerada e quais trechos da
  base foram recuperados para gerá-la (essencial para debug e auditoria).
- **Métricas mínimas desde o dia 1:** volume de perguntas, taxa de perguntas
  sem resposta encontrada na base, tempo de resposta, custo por chamada de
  API.
- Quando o volume justificar, considerar uma ferramenta de observabilidade
  de LLM (ex.: Langfuse) para rastrear chamadas e uso de ferramentas.

## Princípios contra alucinação e desvio

- A base de conhecimento é a **fonte única de verdade** — o LLM nunca deve
  responder com informação que não esteja nela.
- Toda resposta deveria poder apontar de onde veio a informação (qual
  documento/seção da FAQ) — nunca inventar fonte.
- Se a base não cobre a pergunta, o bot **admite que não sabe** em vez de
  arriscar um chute plausível.
- Revisar periodicamente se as respostas do bot continuam batendo com o
  conteúdo real da base — esse é o "desvio" a evitar: uma resposta que soa
  bem mas já não corresponde ao que está indexado (ex.: base atualizada,
  prompt não).

## Frameworks e referências para estudar

- **AgenticGoKit** (Go) — framework open-source com RAG, memória e
  orquestração multi-agente prontos. Vale como referência de arquitetura
  mesmo que não seja adotado diretamente.
- **Hermes Agent** — atenção, existem dois projetos com esse nome:
  - o pacote Python leve sobre o LlamaIndex, com integração de ferramentas
    e memória — mais próximo do escopo do GlicBot;
  - o agente autônomo da Nous Research, multi-plataforma (Telegram, CLI
    etc.) — muito mais amplo que o necessário aqui, não é o foco.
- **[agentic-rag-for-dummies](https://github.com/GiovanniPasq/agentic-rag-for-dummies)**
  (Python/LangGraph) — exemplo completo e didático que já implementa os
  princípios contra alucinação acima na prática: indexação hierárquica de
  documentos, reescrita de pergunta, resposta com citação obrigatória da
  fonte, resposta de fallback quando os dados são insuficientes, e avaliação
  de qualidade com métricas (RAGAS). Boa referência de como transformar os
  princípios da seção anterior em prompts e código reais.
- **Alternativa a qualquer framework pronto:** criar as próprias
  skills/prompts sob medida para o caso de uso do GlicBot, mantendo o
  esforço mínimo necessário em vez de importar a complexidade de um
  framework multi-agente que o produto ainda não precisa.

## Nível de esforço — caminho gradual

1. **Mínimo:** base de FAQ pequena colada direto no prompt a cada chamada;
   zero infraestrutura de busca.
2. **Médio:** protótipo no NotebookLM com conteúdo real de diabetes/app,
   usado para validar respostas e amadurecer a lista de perguntas.
3. **Maior:** quando a base crescer demais para caber num prompt, montar um
   backend próprio com busca vetorial de verdade — só nesse ponto os
   frameworks acima (AgenticGoKit, Hermes, LangGraph) passam a valer o
   esforço de adoção.

## Convenções importantes

- Não pular direto para um framework multi-agente sem antes validar a ideia
  no nível "mínimo esforço" acima.
- Toda mudança na base de conhecimento é uma mudança de conteúdo, não de
  código — deve ser possível atualizar a FAQ sem tocar no backend.
- GlicBot não substitui aconselhamento médico; isso deve aparecer no
  disclaimer do bot sempre que a pergunta tocar em decisões de saúde.
