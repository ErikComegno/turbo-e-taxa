# Fase 4 · Roteiro da Apresentação Final (Banca do Mercado)

[← Voltar ao README](../README.md) · Anterior: [MVP e validação](05-mvp-e-validacao.md)

Pitch de cerca de 8 minutos + demonstração live do sistema rodando localmente.

## Antes de começar (checklist)

- [ ] Rodar `python -m unittest discover tests` e conferir que os 13 testes passam.
- [ ] Abrir o sistema com `iniciar.bat` (ou `python app.py`) e deixar o navegador em **http://localhost:5000**.
- [ ] Ter a versão `avaliacao/index.html` aberta em outra aba como plano B (funciona sem Python).
- [ ] Apagar o `turbo_e_taxa.db` para começar com o histórico limpo, ou deixar uma simulação salva para mostrar.
- [ ] Repositório aberto no GitHub para mostrar o README.

## Roteiro

| Tempo | Quem | O que falar / mostrar |
|---|---|---|
| 0:00 | Vinicius (Gerente de Projeto) | Apresenta a empresa **Turbo e Taxa**, a equipe e a função de cada um. |
| 1:00 | Vinicius | O problema: 88% de necessidade para calculadora de custo de carro híbrido/elétrico (2º maior índice da pesquisa do professor). Pessoas comparam só o preço de compra. |
| 2:00 | Rafael (UI/UX) | Pesquisa de campo, personas e jornada. Wireframes → alta fidelidade. Identidade visual e acessibilidade. |
| 3:30 | Luís Matheus (Front-end) | **Demo live:** escolher só o Onix, deixar o sistema sugerir híbrido e elétrico, comparar. Mostrar o destaque, os cartões e o gráfico "quanto tu gasta ano a ano" com o ponto de payback. Mostrar o painel de acessibilidade e o celular. |
| 5:30 | Erik (Back-end e Banco de Dados) | Arquitetura (navegador → Flask → `calculo.py` → SQLite), a API, salvar e abrir uma simulação, e os testes automáticos. |
| 7:00 | Vinicius | Próximos passos (preços por região, FIPE automática, modo motorista de aplicativo) e encerramento. |
| 8:00 | Todos | Perguntas da banca. |

## Perguntas prováveis da banca

- **De onde vêm os números?** ANP (combustível), Copel (energia), Sefaz-PR (IPVA), FIPE, Inmetro e fabricantes. A coluna `fonte` no banco diz o que foi conferido e o que é aproximado.
- **Por que Flask e SQLite?** Rodam em qualquer computador com Python, sem instalar servidor de banco, e atendem o requisito de execução local.
- **E se o usuário não souber o consumo do carro?** O catálogo já traz o consumo; o usuário só ajusta se quiser.
- **Como garantem que o cálculo está certo?** `calculo.py` é separado do resto e tem testes automáticos com valores conferidos à mão.
