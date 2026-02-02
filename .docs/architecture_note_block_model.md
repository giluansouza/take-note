# Arquitetura — Modelo Unificado de Blocos para Notas

## Visão Geral

Este documento formaliza a decisão arquitetural de **eliminar o conceito de Seções** e adotar um **modelo unificado e linear de blocos** para a criação e edição de notas.

A nota passa a ser composta por uma **lista ordenada de blocos**, onde a estrutura visual (títulos, subtítulos, citações) emerge do próprio conteúdo, e não de uma hierarquia rígida pré-definida.

---

## Motivação da Decisão

### Problemas do Modelo Anterior (Seções)

Modelo anterior:

```
Note
 └─ Section
     └─ Block
```

Principais limitações:

- Fricção de UX: exige que o usuário pense em estrutura antes de escrever
- Complexidade desnecessária no código
- Mais tabelas, mais estados e mais edge cases
- Renderização mais custosa e difícil de manter
- Baixa flexibilidade para evolução futura

---

## Novo Modelo Arquitetural (Aprovado)

Modelo adotado:

```
Note
 └─ Block[] (lista ordenada)
```

Cada nota contém **apenas uma lista linear de blocos**, renderizada na ordem definida pelo campo `order`.

Não existe mais entidade de Seção.

---

## Conceito Central: Bloco

O **Bloco** é a menor e única unidade estrutural da nota.

### Propriedades essenciais de um Bloco

```ts
Block {
  id: string
  note_id: string
  type: BlockType
  content: string | JSON
  order: number
  created_at: datetime
  updated_at: datetime
}
```

---

## Tipos de Bloco (BlockType)

Enum inicial aprovado:

```ts
BlockType =
  | 'text'
  | 'title'
  | 'subtitle'
  | 'quote'
  | 'checklist'
  | 'list'
```

Observações:

- `title` e `subtitle` são **blocos visuais**, não estruturais
- Eles criam separação visual equivalente a seções, sem hierarquia técnica
- Novos tipos podem ser adicionados sem impacto estrutural

---

## Renderização

A tela de nota renderiza:

```ts
blocks
  .sort(by order)
  .map(renderBlock)
```

Não há renderização aninhada.

Cada bloco conhece apenas seu tipo e conteúdo.

---

## Transformação de Blocos

### Regra Fundamental

> Transformar um bloco **nunca cria outro bloco**.

A transformação consiste apenas em alterar o campo `type` do bloco existente.

Exemplos:

- `text` → `title`
- `title` → `text`
- `text` → `quote`

O `content` é preservado integralmente.

---

## Heurísticas Assistivas (Markdown-like)

O sistema pode oferecer atalhos opcionais para criação de blocos:

| Entrada digitada | Resultado |
|-----------------|-----------|
| `# `            | Bloco `title` |
| `## `           | Bloco `subtitle` |
| `> `            | Bloco `quote` |
| `- `            | Bloco `list` |
| `[ ] `          | Bloco `checklist` |

Regras:

- Heurísticas são **assistivas**, nunca obrigatórias
- O usuário pode desfazer ou alterar o tipo manualmente
- O texto digitado após o marcador é preservado

---

## Ordenação de Blocos

### Princípios

- A ordem define o significado da nota
- Inserções entre blocos devem ser baratas
- Reordenação não deve exigir reindexação global

### Estratégia recomendada

- Campo `order` como número decimal ou espaçado (ex: 1000, 2000, 3000)
- Inserções usam média entre valores adjacentes

---

## Impacto no Banco de Dados

### Remoções

- Tabela `sections`
- Relacionamentos `note → section`

### Centralização

- Tabela `blocks` torna-se a estrutura principal
- `note_id` referencia diretamente a nota

---

## Migração de Dados (Visão Geral)

Durante a migração:

1. Cada `Section` existente será convertida em:
   - Um bloco `title` (section title)
   - Opcionalmente um bloco `subtitle`
2. Os blocos internos são mantidos
3. A ordem final respeita a sequência original

Migração deve ser:

- Determinística
- Executada uma única vez
- Totalmente reversível em ambiente de desenvolvimento

---

## Benefícios Arquiteturais

- UX mais fluida e natural
- Código mais simples e coeso
- Menos entidades e menos estados
- Facilidade extrema para novos tipos de bloco
- Base sólida para features futuras (imagens, embeds, código, callouts)

---

## Decisão Final

✔ Modelo de Seções removido
✔ Nota como lista linear de blocos
✔ Blocos como única unidade estrutural
✔ Arquitetura aprovada para evolução do produto

---

> Arquitetura boa é aquela que o usuário nunca percebe — apenas sente que tudo flui.

