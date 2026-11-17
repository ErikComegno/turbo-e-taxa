# Fase 2 · Entendimento de Requisitos

[← Voltar ao README](../README.md) · Anterior: [Fase 1 · Pesquisa](01-pesquisa-de-campo.md) · Próxima: [Fase 2 · Design UI/UX](03-design-ux.md)

Requisitos levantados a partir da pesquisa do professor, da pesquisa de campo e da matriz de dores.

## Requisitos funcionais

| ID | Requisito | Prioridade | Status no MVP |
|---|---|---|---|
| RF01 | O usuário escolhe pelo menos um carro (combustão, híbrido ou elétrico) a partir de um catálogo. | Alta | Feito |
| RF02 | Quando o usuário não escolhe um dos tipos, o sistema sugere um carro desse tipo com o preço mais próximo. | Alta | Feito |
| RF03 | O usuário pode ajustar preço e consumo do carro escolhido. | Média | Feito |
| RF04 | O usuário informa o uso: km por mês, % na cidade, anos de uso, gasolina ou etanol e local de recarga (casa, trabalho, público). | Alta | Feito |
| RF05 | O sistema traz preços de combustível e energia de Curitiba já preenchidos, e o usuário pode editar. | Média | Feito |
| RF06 | O sistema calcula, para cada carro: desvalorização, combustível/energia, manutenção, seguro, IPVA, total, custo por mês e custo por km. | Alta | Feito |
| RF07 | O sistema calcula o payback (em quanto tempo a diferença de preço se paga) em relação ao carro de referência. | Alta | Feito |
| RF08 | O resultado mostra o carro mais barato em destaque, cartões lado a lado com ficha técnica, gráfico "pra onde vai o dinheiro" e tabela completa. | Alta | Feito |
| RF09 | O sistema mostra o gráfico "quanto tu gasta ano a ano" com o ponto em que o carro mais caro começa a compensar. | Média | Feito |
| RF10 | O usuário pode salvar a simulação com um nome, listar, abrir de novo e apagar. | Média | Feito |
| RF11 | O sistema explica as fórmulas na tela "Como calculamos". | Média | Feito |
| RF12 | O usuário pode configurar acessibilidade: tema claro/escuro, alto contraste, tamanho do texto, cores para daltonismo, fonte de leitura fácil e desligar animações. | Média | Feito |

## Requisitos não funcionais

| ID | Requisito | Como foi atendido |
|---|---|---|
| RNF01 | Rodar localmente, sem servidor de banco de dados. | Python + Flask + SQLite (arquivo criado sozinho). Scripts `iniciar.bat` / `iniciar.sh` e versão `.exe`. |
| RNF02 | Responder em menos de 1 segundo numa máquina comum. | Cálculo simples em `calculo.py`, catálogo pequeno no SQLite. |
| RNF03 | Funcionar no computador e no celular. | Layout responsivo em CSS (grid/flex e media queries). |
| RNF04 | Acessível (WCAG 2.1 como referência). | Navegação por teclado, foco visível, `aria-*`, contraste, informação que não depende só da cor, respeito a `prefers-contrast` e `prefers-reduced-motion`. |
| RNF05 | Validar dados de entrada no navegador e no servidor. | `validar()` no `app.js` e função `numero()` no `app.py` (status 400 com mensagem clara). |
| RNF06 | Código testável. | `calculo.py` não depende do Flask nem do banco; 13 testes com `unittest`. |
| RNF07 | Linguagem simples e próxima do usuário. | Textos curtos, no tom da marca ("Bah!", "pra ti"). |
| RNF08 | Transparência dos dados. | Coluna `fonte` em cada carro do catálogo e seção "Fontes dos dados" no README. |

## Regras de negócio

- **RN01** · O carro de referência é o primeiro que o usuário preencheu (ordem: combustão, híbrido, elétrico).
- **RN02** · A manutenção cadastrada vale para 15.000 km/ano e é proporcional ao uso, com mínimo de 50%.
- **RN03** · IPVA do Paraná em 2026: 1,9% do valor do carro em cada ano (o valor cai com a desvalorização).
- **RN04** · Elétrico carregado em carregador público usa o preço do kWh público.
- **RN05** · Se o carro gasta mais no dia a dia que o de referência, o payback é "nunca se paga".
- **RN06** · Pelo menos um carro precisa ser escolhido para simular.

## Escopo fora do MVP (próximas versões)

- Login e simulações sincronizadas entre aparelhos.
- Atualização automática de preços (API da ANP e Tabela FIPE).
- Preços de outras cidades e estados (IPVA e tarifa de energia por UF).
- Cotação de seguro real por perfil do motorista.
- Modo "motorista de aplicativo", com ganhos por corrida e meta diária.
