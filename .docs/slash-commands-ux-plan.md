# Plano de Implementacao: Slash Commands + Descoberta Progressiva

Contexto: conversa em `.docs/conversation.md`.

Objetivo: adicionar atalhos de "power user" (principalmente `/` para abrir o menu de blocos) sem onboarding forçado, usando pistas contextuais que aparecem no momento certo e desaparecem sozinhas.

## Principios (Produto/UX)

- Ensinar no momento da necessidade, nao antes.
- Nao bloquear uso do app: tudo deve continuar acessivel por toque/menu.
- Atalhos sao aceleradores, nao requisito.
- Descoberta progressiva: o usuario aprende no fluxo normal.

## Escopo (Mudancas)

1. Digitar `/` no editor abre o menu de blocos (atalho de poder).
2. Placeholder inteligente em bloco vazio sugere `/` de forma sutil.
3. Menu de blocos exibe atalhos (ex: `List -`, `Checklist []`) de forma passiva.
4. Hint contextual "one-shot" sobre `/` no primeiro uso (sem modal, sem tour).
5. Feedback discreto quando o usuario acerta um atalho de markdown (ex: `- `, `[] `).

## Decisoes Importantes (Antes de Codar)

- Quando `/` deve abrir o menu?
  - Recomendado: apenas no inicio da linha (posicao 0 ou apos `\n`).
    - Motivo: evita quebrar digitacao comum como datas `02/04` e caminhos/URLs.

- O que acontece com o caractere `/` digitado?
  - Remover automaticamente o `/` quando abrir o menu, para nao "sujar" o texto.
  - Manter o cursor no mesmo ponto apos remover.

## Fases (Entrega Incremental)

### Fase 1: Base (MVP)

Aceitacao:

- Em um `TextBlock`, ao digitar `/` no inicio da linha, abre o menu de blocos imediatamente.
- O texto nao fica com `/` inserido.
- Placeholder em bloco vazio sugere `/`.
- Menu mostra atalhos ao lado dos itens (passivo).

Implementacao (arquivos):

- `components/TextBlock.tsx`
  - Detectar insercao de `/` e abrir menu.
  - Guardar `selection` via `onSelectionChange` para reposicionar cursor.
  - Placeholder (i18n) quando vazio.
- `components/BlockTypeMenu.tsx`
  - Permitir controle externo do `visible` (ex: props `visible`, `onVisibleChange`) ou expor `open()` via ref.
  - Exibir atalhos ao lado do label (ex: `#`, `##`, `>`, `-`, `[]`).
- `lib/i18n/locales/en.ts`, `lib/i18n/locales/pt-BR.ts`
  - Novas strings:
    - `blocks.textPlaceholder` (ex: "Type..." / "Digite...")
    - `blocks.textPlaceholderWithSlash` (ex: "Type... (/ for commands)")

UX sugerida:

- Placeholder PT: `Digite... ( / para comandos )`
- Placeholder EN: `Type... ( / for commands )`

### Fase 2: Hint Contextual (One-shot)

Aceitacao:

- Em primeiro uso, aparece um texto cinza discreto (inline) perto do bloco:
  - "Dica: use / para inserir um bloco"
- O hint desaparece automaticamente quando:
  - usuario usa `/` uma vez; ou
  - usuario edita 2-3 blocos; ou
  - usuario fecha/abre a nota algumas vezes (definir criterio simples).
- Sem modal e sem botao "entendi".

Implementacao (arquivos):

- `lib/ux/hints.ts` (novo) ou similar
  - Persistir flags em `AsyncStorage`:
    - `@ux.slash_hint_dismissed`
    - `@ux.slash_used`
    - opcional: contadores (`@ux.blocks_edited_count`)
- `components/TextBlock.tsx`
  - Renderizar hint inline quando condicoes forem verdadeiras.
- `lib/i18n/locales/*`
  - Strings:
    - `hints.slashTip`
    - `hints.slashAfterUse` (micro-reforco opcional)

### Fase 3: Feedback Ao Acertar Atalhos Markdown

Aceitacao:

- Quando o usuario transforma sem querer (ex: digita `- ` e vira lista), mostrar hint UMA vez:
  - "Dica: voce pode criar listas digitando - + espaco"
  - "Dica: voce pode criar checklist digitando [] + espaco"
- Nao repetir depois da primeira exibicao por tipo.

Implementacao (arquivos):

- `components/TextBlock.tsx`
  - Ao detectar trigger (`- `, `[] `, `[ ] `), disparar evento/callback `onShowHint(...)`.
- `app/note/[id].tsx`
  - Implementar toast/hint simples reaproveitando o layout do undo-toast (ja existe).
  - Controlar timer e evitar conflito com o toast de undo (prioridade do undo).
- `lib/ux/hints.ts`
  - Flags:
    - `@ux.hint_list_shown`
    - `@ux.hint_checklist_shown`

### Fase 4 (Opcional): Slash Menu "Pro" (Busca/Comandos) - NÃO IMPLEMENTAR

Nao necessario para o MVP, mas melhora a sensacao "Notion-like".

- Abrir menu com foco e uma caixa de busca ("Filter blocks...").
- Navegacao por teclado (setas + Enter) no web.
- Inserir bloco diretamente pelo menu sem precisar sair.

## Riscos e Cuidados

- Conflito com digitacao de datas e caminhos com `/`.
  - Mitigar abrindo apenas no inicio da linha.
- RN `TextInput` + `onKeyPress` pode ser inconsistente; preferir deteccao por diff em `onChangeText` + `selection`.
- Evitar regressao do fluxo atual:
  - Atalhos existentes (`#`, `##`, `>`, `-`, `[]`) devem continuar funcionando.
  - Menu por toque continua igual.

## Testes Minimos (Manual)

1. Bloco vazio: placeholder aparece; digitar texto remove placeholder.
2. Digitar `/` no inicio do bloco: abre menu; texto nao fica com `/`.
3. Digitar `02/04`: nao abre menu; barra permanece.
4. Digitar `- ` no inicio: vira lista; hint aparece uma vez.
5. Abrir/fechar nota: hint `/` nao reaparece depois de usado/dismissed.

## Checklists de PR (Engineering-Ready)

### PR 1: Placeholder + Atalhos Visiveis No Menu

Status: Concluido (2026-02-04)

- Adicionar placeholder inteligente no bloco de texto quando vazio.
  - Arquivo: `components/TextBlock.tsx`
  - Criterio: quando `content` vazio, mostrar placeholder com dica do `/`; ao digitar, some.
- Adicionar strings i18n para placeholders.
  - Arquivos: `lib/i18n/locales/en.ts`, `lib/i18n/locales/pt-BR.ts`
  - Chave sugerida: `blocks.textPlaceholderWithSlash`
- Exibir atalhos passivos no menu de tipos (ex: `List  -`, `Checklist  []`, `Title  #`, `Subtitle  ##`, `Quote  >`).
  - Arquivo: `components/BlockTypeMenu.tsx`
  - Criterio: cada item do menu mostra um hint pequeno alinhado a direita, sem mudar comportamento.
- Testes manuais:
  - Criar nota, focar bloco vazio, ver placeholder.
  - Abrir menu pelo icone, ver atalhos nos itens.

### PR 2: `/` Abre Menu (MVP)

Status: Concluido (2026-02-04)

- Permitir abrir o menu do `BlockTypeMenu` via comando do teclado.
  - Arquivo: `components/BlockTypeMenu.tsx`
  - Tarefa: tornar o `visible` controlavel por prop (`visible`/`onVisibleChange`) ou expor `open()` via `ref`.
- Detectar digitacao de `/` no `TextInput` e abrir menu.
  - Arquivo: `components/TextBlock.tsx`
  - Tarefas:
    - Guardar selecao com `onSelectionChange`.
    - Detectar insercao de `/` via diff em `onChangeText`.
    - Validar "inicio da linha".
    - Remover o `/` do texto e manter cursor.
    - Chamar `open()` do menu.
- Testes manuais:
  - Digitar `/` no inicio: menu abre e o texto nao fica com `/`.
  - Digitar `02/04`: nao abre menu.
  - Digitar `abc/def` no meio: nao abre menu (se adotarmos "inicio da linha").

### PR 3: Hint One-shot Do `/` (Descoberta Progressiva)

Status: Concluido (2026-02-04)

- Criar storage de flags de UX.
  - Arquivo novo: `lib/ux/hints.ts`
  - Flags sugeridas:
    - `@ux.slash_used`
    - `@ux.slash_hint_dismissed`
    - `@ux.blocks_edited_count`
- Mostrar hint inline discreto (sem modal) na nota/bloco.
  - Arquivo: `components/TextBlock.tsx`
  - Tarefas:
    - Renderizar texto cinza "Dica: use / para inserir um bloco" quando condicoes forem verdadeiras.
    - Incrementar contador de edicao de bloco.
    - Dismiss automatico ao usar `/` ou ao atingir limite (ex: 3).
- Adicionar strings i18n do hint.
  - Arquivos: `lib/i18n/locales/en.ts`, `lib/i18n/locales/pt-BR.ts`
  - Chave sugerida: `hints.slashTip`
- Testes manuais:
  - Primeiro uso: hint aparece.
  - Usar `/`: hint some e nao volta.
  - Editar 3 blocos sem usar `/`: hint some e nao volta.

### PR 4: Feedback One-shot Para Atalhos Markdown (`- `, `[] `)

Status: Concluido (2026-02-04)

- Disparar eventos quando uma transformacao acontece por trigger.
  - Arquivo: `components/TextBlock.tsx`
  - Tarefa: quando detectar trigger e chamar `onTransform`, tambem chamar callback opcional tipo `onDetectedMarkdownShortcut("list" | "checklist")`.
- Exibir toast/hint reutilizando padrao existente.
  - Arquivo: `app/note/[id].tsx`
  - Tarefas:
    - Adicionar estado de toast de hint (separado do undo).
    - Prioridade: se undo toast estiver ativo, adiar ou suprimir hint.
    - Timer curto (ex: 2.5s).
- Persistir flags pra nao repetir.
  - Arquivo: `lib/ux/hints.ts`
  - Flags sugeridas:
    - `@ux.hint_list_shown`
    - `@ux.hint_checklist_shown`
- Adicionar strings i18n.
  - Arquivos: `lib/i18n/locales/en.ts`, `lib/i18n/locales/pt-BR.ts`
  - Chaves sugeridas: `hints.listShortcut`, `hints.checklistShortcut`
- Testes manuais:
  - Primeira vez que digita `- `: vira lista e mostra hint 1x.
  - Segunda vez: nao mostra.
  - `[] ` e `[ ] `: idem.

### PR 5 (Opcional): Slash Menu Com Busca ("Pro")

Status: Pendente

- Adicionar filtro de itens no menu (UI + estado).
  - Arquivo: `components/BlockTypeMenu.tsx`
- Navegacao por teclado no web (setas/enter) se fizer sentido.
  - Arquivo: `components/BlockTypeMenu.tsx`
- Testes manuais:
  - Digitar `/` abre menu com foco no campo de busca.
  - Filtrar por "list", "check", etc.
