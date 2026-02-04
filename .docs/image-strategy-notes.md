# Estratégia de Imagens em Notas — Compressão, Miniaturas e Referência via SQLite

## Visão Geral

Este documento define a estratégia oficial para **inclusão de imagens em notas**, considerando:

- Mobile-first (React Native / Expo)
- Offline-first
- Performance
- Escalabilidade futura
- Simplicidade arquitetural

As imagens **não são armazenadas no SQLite**, mas sim **no storage local do app**, com **referência (link)** persistida no banco.

---

## Princípios Fundamentais

- SQLite **não armazena blobs de imagem**
- O banco armazena apenas **metadados e caminhos**
- Imagens são sempre:
  - Comprimidas
  - Versionadas (original + thumbnail)
  - Endereçadas por ID estável
- A nota continua sendo uma **lista linear de blocos**

---

## Modelo Arquitetural

A imagem é tratada como **um tipo de bloco**, mantendo coerência com a arquitetura unificada.

Note
└─ Block[] (ordered)
└─ image

yaml
Copy code

---

## Tipo de Bloco: `image`

### BlockType

```ts
BlockType =
  | 'text'
  | 'title'
  | 'subtitle'
  | 'quote'
  | 'checklist'
  | 'list'
  | 'image'
Estrutura do Bloco image
O conteúdo do bloco image é um objeto JSON serializado.

ts
Copy code
ImageBlockContent {
  id: string
  original_uri: string
  thumbnail_uri: string
  width: number
  height: number
  size_kb: number
  mime_type: string
  created_at: datetime
}
Esse objeto é armazenado no campo content do bloco.

Fluxo de Inclusão de Imagem
1. Origem da Imagem
Câmera

Galeria

Compartilhamento externo (future-proof)

2. Processamento Imediato (Obrigatório)
Ao selecionar a imagem:

Gerar ID único (uuid)

Criar duas versões:

Original comprimida

Thumbnail

Persistir ambas no storage local

Criar bloco image com referência

Compressão de Imagens
Objetivo
Reduzir tamanho sem perda visual perceptível

Garantir renderização rápida

Evitar consumo excessivo de armazenamento

Estratégia Recomendada
Formato final: JPEG

Qualidade: 80%

Largura máxima:

2048px (landscape)

1536px (portrait)

Manter proporção original

Miniaturas (Thumbnails)
Objetivo
Scroll fluido

Lista de notas rápida

Baixo consumo de memória

Padrão
Largura máxima: 400px

Qualidade: 60%

Mesmo aspecto da imagem original

Miniaturas são obrigatórias.

Organização no Storage Local
Estrutura recomendada:

bash
Copy code
/app-data/
 └─ images/
     └─ {note_id}/
         ├─ {image_id}.jpg
         └─ {image_id}_thumb.jpg
Benefícios:

Fácil limpeza por nota

Organização previsível

Migração futura facilitada

Persistência no SQLite
Tabela blocks
O bloco image é armazenado normalmente:

ts
Copy code
Block {
  id: string
  note_id: string
  type: 'image'
  content: string // JSON serializado
  order: number
}
Exemplo de content
json
Copy code
{
  "id": "img_9f2c",
  "original_uri": "file:///app-data/images/note_123/img_9f2c.jpg",
  "thumbnail_uri": "file:///app-data/images/note_123/img_9f2c_thumb.jpg",
  "width": 3024,
  "height": 4032,
  "size_kb": 412,
  "mime_type": "image/jpeg",
  "created_at": "2026-02-02T10:15:00Z"
}
Renderização
Lista de Blocos
Renderiza thumbnail

Lazy loading

Placeholder enquanto carrega

Visualização Expandida
Ao tocar:

Abrir imagem original

Zoom / pan

Fullscreen

Reordenação de Imagens
Imagem é apenas mais um bloco

Pode ser movida livremente

Ordem controlada pelo campo order

Nenhuma regra especial necessária.

Exclusão de Imagens
Regra
Excluir um bloco image:

Remove o bloco do SQLite

Remove arquivos físicos:

original

thumbnail

Nunca deixar arquivos órfãos.

Migração e Backup (Visão Futura)
Esse modelo permite facilmente:

Backup das notas (SQLite)

Backup das imagens (pasta /images)

Sync futuro com cloud

Exportação Markdown + assets

Benefícios da Estratégia
Performance excelente

Banco leve

Offline-first real

Simples de implementar

Escalável para sync e cloud

Compatível com qualquer editor moderno

Decisão Final
✔ Imagem é um bloco
✔ SQLite armazena apenas referência
✔ Imagens no storage local
✔ Compressão e thumbnail obrigatórias
✔ Arquitetura preparada para o futuro

Uma boa estratégia de mídia é invisível para o usuário — ele só percebe que tudo é rápido.

yaml
Copy code

---

Se quiser, no próximo passo eu posso:

- 📱 Traduzir isso em **implementação prática no Expo (ImagePicker + ImageManipulator)**
- 🧪 Definir **testes de performance / memória**
- ☁️ Estender o modelo para **sync cloud incremental**
- 📄 Criar **exportação Markdown + pasta `/assets`**

Esse documento fecha **100% da base técnica** de um editor moderno.
```
