# Fase 1 · Pesquisa de Campo

[← Voltar ao README](../README.md) · Próxima: [Fase 2 · Requisitos](02-requisitos.md)

## 1. Segmento escolhido

Do estudo de caso do Prof. Me. Sedenilso Machado (pesquisa com mais de 40 mil entrevistados), a equipe escolheu o segmento **5 · Calculadora (Carros Híbridos vs. Elétricos vs. Combustão)**:

> Simulação comparativa cruzando perfil de custo de aquisição, custo de manutenção, custo de rodagem diária, tarifas de energia/combustível, depreciação e payback do investimento.

### Por que esse segmento

| Dado da pesquisa do professor | O que significa para o Turbo e Taxa |
|---|---|
| **88%** de necessidade percebida para "Calculadora TCO Carro Híbrido/Elétrico", o **2º maior índice** entre os 15 segmentos | Existe público grande e demanda clara. |
| Ferramentas de apoio à decisão baseada em ROI pessoal têm **engajamento 3x maior** quando mostram economia financeira direta | A tela de resultado abre com a economia em reais ("te economiza R$ X em N anos") e o payback. |
| Sistemas que não resolvem uma dor financeira direta têm **abandono acima de 78%** nos primeiros 30 dias | O foco é uma pergunta só: "qual carro sai mais barato pra mim?". |
| O público prefere **soluções específicas de nicho** a planilhas ou sistemas genéricos | Em vez de uma planilha, a ferramenta já traz catálogo, preços da região e as contas prontas. |

## 2. Objetivo da pesquisa primária

Entender, com 1 a 2 pessoas reais do público-alvo, **como elas decidem entre carro a combustão, híbrido e elétrico** e quais custos levam em conta (ou esquecem) nessa decisão.

### Público-alvo

- Pessoas que vão trocar ou comprar carro nos próximos 12 meses e estão em dúvida sobre o tipo de motorização.
- Quem roda bastante por mês (trabalho, aplicativo, deslocamento longo), para quem o custo por km pesa mais.
- Profissionais que conhecem o custo real de manter um carro (ex.: mecânico), para validar os números de manutenção.

## 3. Roteiro da entrevista

Entrevista semiestruturada, 15 a 20 minutos, presencial ou por chamada.

**Perfil**
1. Qual carro você tem hoje (marca, modelo, ano, combustível)?
2. Quantos km você roda por mês, mais ou menos? Mais na cidade ou na estrada?
3. Usa o carro para trabalhar (aplicativo, entregas, visitas)?

**Decisão de compra**
4. Você pensa em trocar de carro? Já considerou um híbrido ou elétrico?
5. O que mais pesa na escolha: preço de compra, gasto com combustível, manutenção, revenda?
6. Como você compara hoje? (concessionária, vídeos, planilha, amigos, nada)

**Custos**
7. Quanto você gasta por mês com combustível? E por ano com manutenção, seguro e IPVA?
8. Você sabe quanto o seu carro perdeu de valor desde que comprou?
9. Se tivesse um elétrico, onde carregaria (casa, trabalho, carregador público)?

**Dores e expectativas**
10. Qual a maior dúvida ou medo em relação a híbridos e elétricos?
11. Se uma ferramenta respondesse "qual carro sai mais barato pra você", o que ela precisaria mostrar para você confiar no resultado?
12. Você usaria isso no celular, no computador ou nos dois?

**Para o profissional de manutenção (mecânico)**
- Qual o custo médio anual de manutenção de um carro popular a combustão rodando cerca de 15.000 km/ano?
- Quais itens mais pesam (troca de óleo, freios, pneus, correia)? Como isso muda em híbridos e elétricos?

## 4. Registro das entrevistas

> Preencher com as respostas reais (resumo ou transcrição). Não inventar respostas: se algo não foi perguntado, deixar em branco.

### Entrevista 1 · Profissional de manutenção (mecânico)

| Campo | Resposta |
|---|---|
| Data e formato | _preencher_ |
| Perfil | _preencher (tempo de profissão, tipo de oficina)_ |
| Custo médio anual de manutenção (combustão, ~15.000 km/ano) | _preencher_ |
| Itens que mais pesam | _preencher_ |
| Opinião sobre manutenção de híbridos/elétricos | _preencher_ |
| Frase marcante | _preencher_ |

### Entrevista 2 · Motorista do público-alvo

| Campo | Resposta |
|---|---|
| Data e formato | _preencher_ |
| Carro atual e uso (km/mês, cidade/estrada) | _preencher_ |
| Pensa em trocar? Considera híbrido/elétrico? | _preencher_ |
| Como compara hoje | _preencher_ |
| Maior dúvida ou medo | _preencher_ |
| O que precisaria ver para confiar no resultado | _preencher_ |

## 5. Matriz de dores e oportunidades

Cruza as dores esperadas no segmento (pesquisa do professor) com a solução do sistema. Na coluna "Confirmado na entrevista?", marque o que apareceu nas conversas reais.

| # | Dor do usuário | Oportunidade / o que o sistema faz | Funcionalidade | Confirmado na entrevista? |
|---|---|---|---|---|
| 1 | Só olha o preço de compra e esquece o custo de uso | Mostrar o custo total no período (compra, combustível, manutenção, seguro, IPVA, desvalorização) | Comparação lado a lado + "Pra onde vai o dinheiro" | _sim / não_ |
| 2 | Não sabe em quanto tempo um carro mais caro "se paga" | Calcular o payback e mostrar o ponto de virada | Payback + gráfico "Quanto tu gasta ano a ano" | _sim / não_ |
| 3 | Não sabe qual híbrido ou elétrico comparar com o carro dele | Sugerir automaticamente um carro de cada tipo na mesma faixa de preço | Sugestão automática | _sim / não_ |
| 4 | Os valores mudam conforme a região e o uso | Preços de Curitiba já preenchidos e editáveis; km/mês, % cidade e local de recarga configuráveis | Formulário de uso e preços | _sim / não_ |
| 5 | Desconfia de números "mágicos" | Explicar cada fórmula em linguagem simples e mostrar as fontes | Tela "Como calculamos" | _sim / não_ |
| 6 | Quer comparar cenários diferentes e voltar depois | Salvar, abrir e apagar simulações | "Minhas simulações" | _sim / não_ |
| 7 | Leitura difícil para quem tem baixa visão, daltonismo ou usa só o teclado | Painel de acessibilidade e informação que não depende só da cor | Painel "Acessibilidade" | _sim / não_ |

## 6. Conclusões da fase

- O problema principal é **comparar custo total, não só preço**. Isso guiou a tela de resultado.
- A ferramenta precisa ser **rápida** (uma tela de entrada, um clique) para não cair no abandono de 78% apontado pela pesquisa.
- Os números precisam ser **explicáveis**: por isso a tela "Como calculamos" e a coluna `fonte` no banco de dados.
- _Adicionar aqui o que as entrevistas reais confirmaram ou mudaram._
