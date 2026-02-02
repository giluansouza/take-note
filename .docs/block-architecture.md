# Arquitetura — Modelo Unificado de Blocos para Notas

## Visão Geral

Este documento formaliza a decisão arquitetural de eliminar o conceito de Seções e adotar um modelo unificado e linear de blocos para a criação e edição de notas.

A nota passa a ser composta por uma lista ordenada de blocos, onde a estrutura visual (títulos, subtítulos, citações, listas) emerge do próprio conteúdo — e não de uma hierarquia rígida.

Este modelo é inspirado em editores modernos como Notion e Craft, com foco em fluxo rápido de escrita, baixo atrito cognitivo e evolução futura segura.

---

## Motivação da Decisão

### Problemas do Modelo Anterior (Seções)

Modelo anterior:

Note
└─ Section
└─ Block

Principais limitações:

- Fricção de UX: o usuário precisa pensar em estrutura antes de escrever
- Complexidade técnica desnecessária
- Mais entidades, mais estados e mais edge cases
- Renderização mais custosa
- Evolução futura limitada (ex: embeds, imagens, blocos avançados)

---

## Novo Modelo Arquitetural (Aprovado)

Modelo adotado:

Note
└─ Block[] (lista linear ordenada)

Cada nota contém apenas uma lista de blocos, renderizada pela ordem definida no campo `order`.

Não existe mais entidade `Section`.

---

## Conceito Central: Bloco

O Bloco é a menor e única unidade estrutural da nota.

### Propriedades Essenciais

Block

- id: string
- note_id: string
- type: BlockType
- content: string | JSON
- order: number
- created_at: datetime
- updated_at: datetime

---

## Tipos de Bloco (BlockType)

Enum inicial aprovado:

- text
- title
- subtitle
- quote
- checklist
- list

Observações:

- `title` e `subtitle` são blocos visuais, não hierárquicos
- Eles substituem seções sem criar árvore estrutural
- Novos tipos podem ser adicionados sem impacto no modelo

---

## Modelo de Interação (Decisão Profissional)

A criação e inserção de blocos segue três abordagens complementares, cada uma com um papel claro.

### 1. Primário — Teclado / Fluxo Rápido

- Enter cria novo bloco abaixo
- O novo bloco é criado quando o bloco atual está encerrado
- Um bloco é considerado encerrado quando:
  - O cursor está em uma linha vazia
  - Ou o tipo do bloco define criação direta (ex: title)

Este é o caminho principal do editor.

---

### 2. Visual — Touch / Descoberta

- Botão “+” discreto entre blocos
- Aparece:
  - Entre blocos
  - Quando o cursor está próximo
  - Quando o bloco está em foco
- Permite escolher o tipo do novo bloco

---

### 3. Secundário — Fallback

- Menu do bloco → Inserir abaixo
- Sempre disponível como alternativa

---

## Regras de Enter (CRÍTICO PARA UX)

### Bloco `text`

- Enter em linha com texto → nova linha no mesmo bloco
- Enter em linha vazia → cria novo bloco `text` abaixo

---

### Blocos `title`, `subtitle`, `quote`

- Enter → cria novo bloco `text` abaixo

Esses blocos nunca criam nova linha interna.

---

### Blocos `checklist` e `list`

- Enter com item preenchido → cria novo item
- Enter em item vazio → cria novo bloco abaixo

---

## Renderização

A tela de nota renderiza os blocos da seguinte forma:

- Ordena por `order`
- Renderiza linearmente
- Não existe renderização aninhada

Cada bloco é independente.

---

## Transformação de Blocos

### Regra Fundamental

Transformar um bloco nunca cria outro bloco.

A transformação altera apenas o campo `type`.

Exemplos:

- text → title
- title → text
- text → quote

O conteúdo é sempre preservado.

---

## Heurísticas Assistivas (Markdown-like)

Atalhos opcionais:

- `# ` → title
- `## ` → subtitle
- `> ` → quote
- `- ` → list
- `[ ] ` → checklist

Regras:

- São assistivas, nunca obrigatórias
- Sempre reversíveis
- O texto digitado é preservado

---

## Ordenação de Blocos

### Princípios

- A ordem define o significado da nota
- Inserções devem ser baratas
- Reordenação não pode exigir reindexação global

### Estratégia Recomendada

- Campo `order` numérico espaçado (ex: 1000, 2000, 3000)
- Inserções usam média entre valores adjacentes

---

## Impacto no Banco de Dados

### Remoções

- Tabela `sections`
- Relacionamentos `note → section`

### Centralização

- Tabela `blocks` torna-se a base estrutural
- `note_id` referencia diretamente a nota

---

## Migração de Dados (Visão Geral)

Durante a migração:

1. Cada Section vira:
   - Um bloco `title`
   - Opcionalmente um bloco `subtitle`
2. Blocos internos são preservados
3. A ordem original é respeitada

Migração deve ser:

- Determinística
- Executada uma única vez
- Reversível em ambiente de desenvolvimento

---

## Benefícios Arquiteturais

- Escrita fluida e natural
- UX previsível e profissional
- Código simples e coeso
- Base sólida para novos blocos (imagem, embed, código, callout)
- Compatível com mobile-first e desktop

---

## Decisão Final

✔ Seções removidas
✔ Nota como lista linear de blocos
✔ Bloco como única unidade estrutural
✔ Modelo validado por UX moderno

Arquitetura boa é aquela que o usuário nunca percebe — apenas sente que tudo flui.
