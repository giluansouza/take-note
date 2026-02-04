# Funcionalidades de Notas e Fluxo de Criacao/Edicao

Este documento descreve as funcionalidades relacionadas a notas e o funcionamento da criacao/edicao no app, com base no codigo atual.

## Escopo

Funcionalidades cobertas:
- Criacao de notas
- Edicao de notas (titulo, blocos, tipos, imagens)
- Insercao e remocao de blocos
- Persistencia e ordenacao de blocos
- Tratamento de notas vazias

Arquivos chave:
- `app/index.tsx`
- `app/note/[id].tsx`
- `components/BlockRenderer.tsx`
- `components/BlockTypeMenu.tsx`
- `components/TextBlock.tsx`
- `components/ListBlock.tsx`
- `components/ChecklistBlock.tsx`
- `components/TitleBlock.tsx`
- `components/SubtitleBlock.tsx`
- `components/QuoteBlock.tsx`
- `components/ImageBlock.tsx`
- `components/ImageSourceMenu.tsx`
- `lib/notes.repository.ts`
- `lib/blocks.repository.ts`
- `lib/images.service.ts`

## Criacao de nota

Fluxo principal:
- A tela inicial cria notas em `handleCreateNote`.
- Um titulo fallback e gerado com `formatFallbackTitle`.
- A nota e persistida via `createNote`.
- Em seguida, e criado um primeiro bloco `text` com ordem `1000`.
- O usuario e direcionado para a tela da nota com `autofocus=1` para focar o primeiro bloco.

Pontos de referencia:
- `app/index.tsx` cria a nota e o bloco inicial.
- `lib/notes.repository.ts` grava a nota.
- `lib/blocks.repository.ts` grava o bloco.

## Edicao de nota

### Titulo
- O titulo e editavel na tela da nota (`TextInput`).
- Alteracoes sao salvas com debounce de 500ms via `updateNoteTitle`.

Referencia:
- `app/note/[id].tsx` em `handleTitleChange`.

### Blocos e tipos
Tipos suportados:
- `text`, `title`, `subtitle`, `quote`, `list`, `checklist`, `image`.

Renderizacao:
- `BlockRenderer` escolhe o componente do bloco com base no tipo.
- Cada bloco renderiza um menu de tipo (quando focado) para transformacao e acoes.

Referencia:
- `components/BlockRenderer.tsx`
- `components/BlockTypeMenu.tsx`

### Transformacao de tipo
- Ao transformar um bloco, o app converte o conteudo quando necessario.
- `text -> checklist` e `text -> list` convertem linhas em JSON.
- A transformacao e persistida via `transformBlockType`.

Referencia:
- `app/note/[id].tsx` em `handleBlockTransform`.
- `lib/blocks.repository.ts` em `textToChecklistContent` e `textToListContent`.

### Edicao de conteudo
- Cada bloco controla seu proprio conteudo e salva via `updateBlockContent`.
- O `TextBlock` salva com debounce de 500ms.
- `TextBlock` suporta atalhos de transformacao no inicio da linha:
  - `# ` -> `title`
  - `## ` -> `subtitle`
  - `> ` -> `quote`
  - `- ` -> `list`
  - `[] ` ou `[ ] ` -> `checklist`

Referencia:
- `components/TextBlock.tsx`
- `lib/blocks.repository.ts`

## Insercao de blocos

### Inserir abaixo
- O menu de tipo inclui a acao `Insert Below`.
- `handleInsertBlockBelow` calcula a ordem entre o bloco atual e o proximo.
- Se nao houver proximo bloco, a nova ordem recebe `current.order + 1000`.

Referencia:
- `components/BlockTypeMenu.tsx`
- `app/note/[id].tsx` em `handleInsertBlockBelow`.

### Inserir imagem
- A opcao `Inserir imagem` aparece no menu de tipos, acima de `Insert Below`.
- Ao selecionar, o app abre o `ImageSourceMenu` para camera ou galeria.
- A imagem e processada, salva em disco e um bloco `image` e criado.

Referencia:
- `components/BlockTypeMenu.tsx`
- `components/ImageSourceMenu.tsx`
- `lib/images.service.ts`
- `app/note/[id].tsx` em `handleAddImage`.

### Insercao via teclado (texto)
- No `TextBlock`, pressionar Enter em linha vazia cria um novo bloco abaixo.

Referencia:
- `components/TextBlock.tsx`.

## Remocao de blocos

### Delete
- Cada bloco pode ser removido via menu.
- Para blocos de imagem, os arquivos sao apagados.
- Existe um toast de desfazer (3s) para blocos nao-image.

Referencia:
- `app/note/[id].tsx` em `handleDeleteBlock` e `handleUndoDelete`.
- `lib/images.service.ts` em `deleteImageFiles`.

### Garantia de bloco minimo
- Se o usuario apagar o ultimo bloco da nota, o app cria automaticamente um novo bloco `text` vazio.
- Isso evita estados onde nao ha como inserir novos blocos.

Referencia:
- `app/note/[id].tsx` em `handleDeleteBlock`.

## Ordenacao e persistencia

- Blocos sao ordenados pelo campo `order`.
- Insercoes usam gaps de 1000 para reduzir reordenacoes.
- Dados sao persistidos em SQLite via repositorios.

Referencia:
- `lib/blocks.repository.ts`.

## Imagens

- Imagens sao redimensionadas e comprimidas.
- O original e o thumbnail sao salvos em `documentDirectory/images/<noteId>/`.
- O bloco armazena metadados em JSON (`ImageBlockContent`).

Referencia:
- `lib/images.service.ts`.
- `lib/blocks.repository.ts`.

## Comportamento quando a nota abre

- Se a nota nao possui blocos, um primeiro bloco `text` e criado automaticamente.
- O bloco inicial recebe foco (autofocus).

Referencia:
- `app/note/[id].tsx` em `loadNote`.

## Observacoes de UX

- O menu de tipo de bloco aparece apenas quando o bloco esta focado.
- Ha um botao de insercao entre blocos quando o bloco esta focado.
- A edicao do titulo e independente da edicao de blocos.

Referencia:
- `app/note/[id].tsx`.
- `components/BlockTypeMenu.tsx`.
