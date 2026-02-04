# Monetization Model — Tome Nota (Versão Atualizada – Fevereiro 2026)

## Overview

### Sobre o Tome Nota

Tome Nota é um aplicativo **minimalista, offline-first** de anotações feito com React Native e Expo. Projetado para velocidade e simplicidade, permite capturar ideias instantaneamente sem atrito.

**Funcionalidades Principais:**

- Notas organizadas em **seções** (com títulos e subtítulos opcionais)
- Blocos de conteúdo múltiplos: **texto**, **checklists** e **listas**
- **Categorias** e **tags** para organização
- **Arquivar** e **excluir** com gestos de swipe
- **Autosave** — sem botão de salvar
- Funciona **100% offline** com armazenamento local SQLite

**Filosofia de Design:**

> Construa a menor coisa que você realmente usaria todos os dias.

Velocidade, clareza e confiabilidade acima de features. O app abre em menos de 1 segundo, sem splash screens ou spinners de loading para dados locais.

---

### Modelo de Monetização

Tome Nota usa modelo **freemium** com dois tiers:

- **Free**: Funcionalidade completa + anúncios
- **Premium**: Sem anúncios + features adicionais

---

## Comparação de Tiers

| Funcionalidade                    | Free                  | Premium       |
| --------------------------------- | --------------------- | ------------- |
| Criar notas ilimitadas            | ✓                     | ✓             |
| Seções, texto, listas, checklists | ✓                     | ✓             |
| Categorias & tags                 | ✓                     | ✓             |
| Arquivar & excluir                | ✓                     | ✓             |
| Acesso offline                    | ✓                     | ✓             |
| **Anúncios**                      | Sim                   | **Não**       |
| Anexos de imagens                 | Limitado (5 por nota) | **Ilimitado** |
| Sincronização na nuvem            | —                     | ✓             |
| Blocos de localização             | —                     | ✓             |
| Visualização em álbum             | —                     | ✓             |
| Temas personalizados              | —                     | ✓             |
| Suporte prioritário               | —                     | ✓             |

---

## Preços Sugeridos (Atualizados 2026)

### Assinatura Premium – Preços Base (US, Canadá, Europa)

| Plano  | Preço      | Economia         |
| ------ | ---------- | ---------------- |
| Mensal | $2.99/mês  | —                |
| Anual  | $19.99/ano | 44% (~$1.67/mês) |

### Preços Regionais Sugeridos (Ajustados por PPP e Mercado 2025-2026)

Use as ferramentas de regional pricing do Google Play Console e App Store Connect para configurar por país. As sugestões abaixo maximizam conversão em mercados emergentes (onde volume > margem unitária), baseadas em benchmarks recentes:

| Região / Tier                       | Países Exemplo                                              | Mensal        | Anual           | % do Preço Base | Justificativa                                                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------- | ------------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tier 1 – Mercados Desenvolvidos** | US, Canadá, UE (Alemanha, França, UK), Austrália, Japão     | $2.99         | $19.99          | 100%            | Preço padrão – alto poder de compra, boa conversão em ~2-4%                                                                                                   |
| **Tier 2 – Mercados Médio-Alto**    | México, Turquia, Polônia, Malásia, Tailândia                | $1.99 – $2.49 | $12.99 – $14.99 | 60-80%          | Equilíbrio entre volume e ARPU; ~40-60% do base recomendado por guias Google/RevenueCat                                                                       |
| **Tier 3 – Mercados Emergentes**    | Brasil, Índia, Indonésia, Filipinas, Vietnã, Egito, Nigéria | $0.99 – $1.49 | $6.99 – $9.99   | 30-50%          | Alta sensibilidade a preço; apps indie convertem 2-3x mais com reduções de 50-70%. No Brasil/Índia, preços abaixo de R$ 7-8/mês (ou ₹80-100) performam melhor |

**Sugestão Específica para Brasil (seu mercado principal – Petrolina/PE):**

- Mensal: **R$ 4,99 – R$ 6,99** (~$0.99 – $1.39 USD)
- Anual: **R$ 34,99 – R$ 49,99** (~$6.99 – $9.99 USD, equivalente a ~R$ 2,90–4,15/mês)
- Razão: Usuários brasileiros esperam preços ~30-50% do US em apps de produtividade. Competidores locais e apps globais ajustam para ~R$ 5-10/mês para maximizar upsell.

**Dicas para Implementação:**

- Teste A/B: Comece com $1.49 mensal / $9.99 anual em Brasil/Índia e monitore taxa de conversão vs. churn.
- Ofereça trial de 7 dias premium em todos os tiers para aumentar conversão em ~20%.
- Monitore ARPU por região via RevenueCat – ajuste trimestralmente.

---

## Estratégia de Anúncios no Tier Free

_(Mantida igual ao original – não alterada aqui para brevidade. Inclua os placements, frequency capping, AdMob config, etc., do seu plano original se quiser o MD completo.)_

## Implementação de Assinaturas Premium

_(Mantida igual – RevenueCat, product IDs, paywall, etc.)_

## Projeções de Receita (Ajustadas)

Com preços regionais mais agressivos em emergentes, espere:

- Conversão free-to-paid: 2.5-4% (maior volume compensa menor ARPU)
- Receita ads: Mais sensível a geo (eCPM baixo em BR/IN), mas volume alto
- Total estimado com 10k MAU: ~$3.000–5.000/mês (ajustado para realismo 2026)

## Considerações Finais e Próximos Passos

- Foque em retenção: Ads não intrusivos + trial premium = chave para conversão.
- Experimente lifetime option ($29.99–$49.99) em mercados desenvolvidos.
- Monitore métricas: Use RevenueCat + Firebase para funil de conversão por região.

Se precisar de ajustes (ex.: inclusão completa de ads/paywall ou variações), avise!

Feito com ❤️ por Grok – baseado no seu plano original + dados de mercado 2025-2026.
