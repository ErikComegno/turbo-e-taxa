# Turbo e Taxa · Calculadora de custo veicular

Sistema web que compara quanto custa ter um carro **a combustão**, **híbrido** ou **elétrico** ao longo dos anos.

O usuário escolhe um carro (o dele, ou o que quer comprar). Se ele deixar os outros tipos em branco, o sistema escolhe sozinho um híbrido e um elétrico na mesma faixa de preço. Depois mostra o custo por mês, o custo por km, o total no período e em quanto tempo a diferença de preço se paga (payback).

Projeto Integrador · Design Profissional · Universidade Positivo · 2026

---

## Funcionalidades

- Comparação lado a lado de até 3 carros (combustão, híbrido e elétrico).
- Sugestão automática dos tipos que o usuário não preencheu, pelo preço mais próximo.
- Ajuste do preço e do consumo do carro escolhido.
- Uso configurável: km por mês, porcentagem na cidade, anos de uso, gasolina ou etanol e local de recarga (casa, trabalho ou carregador público).
- Preços de combustível e energia já preenchidos com as médias de Curitiba, editáveis.
- Custos calculados: desvalorização, combustível/energia, manutenção, seguro e IPVA.
- Ficha técnica de cada carro: velocidade máxima, 0 a 100 km/h, consumo, autonomia (elétricos) e seguro médio.
- Ilustração do carro conforme a carroceria (hatch, sedã ou SUV).
- Gráfico de "pra onde vai o dinheiro" e tabela com todos os valores.
- Salvar, abrir e apagar simulações (ficam guardadas no banco de dados).
- Página "Como calculamos" explicando as fórmulas.
- Gráfico "quanto tu gasta ano a ano", que mostra o ponto em que o carro mais caro começa a compensar.
- Ilustrações e ícones em todas as telas para facilitar a leitura.
- Painel de **Acessibilidade** (botão no topo), com as escolhas salvas no navegador:
  - tema claro ou escuro;
  - alto contraste (cores mais fortes, bordas grossas, links sublinhados);
  - texto grande ou muito grande;
  - cores para daltonismo (laranja, amarelo e azul, paleta Okabe-Ito);
  - letra de leitura fácil (Atkinson Hyperlegible, feita para baixa visão);
  - desligar animações.
- Informação nunca depende só da cor: etiquetas têm texto e ícone, o payback tem ✓ ou ✗ e as linhas do gráfico têm traços diferentes.
- Respeita as configurações do sistema da pessoa (alto contraste e menos movimento).
- Funciona no computador e no celular, e dá para usar só com o teclado.

## Tecnologias

| Parte | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (sem framework) |
| Back-end | Python 3 com Flask |
| Banco de dados | SQLite (arquivo local, criado sozinho) |
| Testes | `unittest` do Python |

Escolhemos essas tecnologias porque rodam em qualquer computador com Python, sem precisar instalar servidor de banco de dados.

## Versão de avaliação (sem instalar nada)

O arquivo **`avaliacao/index.html`** tem a calculadora inteira em um único arquivo. É só abrir no navegador (Chrome, Edge ou Firefox): não precisa de Python nem de servidor.

- As contas são as mesmas do sistema completo (o `calculo.py` foi reescrito em JavaScript no `static/js/local-api.js`).
- O catálogo de carros e os preços vão junto dentro do arquivo.
- As simulações salvas ficam guardadas no próprio navegador.

Sempre que mudar o site, o cálculo ou o catálogo, gere de novo com:

```bash
python gerar_index_avaliacao.py
```

## Jeito mais fácil de abrir (dois cliques)

**Windows:** dê dois cliques em **`iniciar.bat`**. Na primeira vez ele prepara tudo sozinho (leva menos de 1 minuto). Depois o navegador abre direto no sistema.

**Linux ou Mac:** no terminal, dentro da pasta, rode `./iniciar.sh`.

Só é preciso ter o Python instalado (no Windows, marque "Add Python to PATH" na instalação).

## Gerar o executável (.exe)

Para ter um único arquivo que abre o sistema sem precisar de Python:

1. No Windows, dê dois cliques em **`gerar_exe.bat`**.
2. Espere terminar (uns 2 minutos na primeira vez).
3. O arquivo fica em **`dist\TurboETaxa.exe`**. Dois cliques nele abrem o sistema no navegador.

Pode copiar o `TurboETaxa.exe` para qualquer pasta ou computador com Windows. O banco de dados (`turbo_e_taxa.db`) é criado na mesma pasta do `.exe`. Para fechar o sistema, feche a janela preta que abre junto.

No Linux ou Mac, use `./gerar_executavel.sh` (o arquivo fica em `dist/TurboETaxa`).

O executável é gerado com o PyInstaller e só funciona no sistema em que foi gerado: o `.exe` precisa ser gerado em um Windows.

## Como rodar pelo terminal (passo a passo)

### 1. Pré-requisito

Ter o **Python 3.10 ou mais novo** instalado. Para conferir, abra o terminal e digite:

```bash
python --version
```

(No Linux e no Mac pode ser `python3 --version`.)

### 2. Baixar o projeto

```bash
git clone https://github.com/SEU-USUARIO/turbo-e-taxa.git
cd turbo-e-taxa
```

### 3. Criar o ambiente virtual e instalar o Flask

**Windows (PowerShell ou CMD):**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**Linux ou Mac:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Rodar o sistema

```bash
python app.py
```

O navegador abre sozinho em **http://localhost:5000**.

Na primeira vez, o arquivo `turbo_e_taxa.db` é criado sozinho, já com o catálogo de carros e os preços de Curitiba. Para começar do zero, basta apagar esse arquivo e rodar de novo.

Para parar o servidor, aperte `Ctrl + C` no terminal.

### 5. Rodar os testes

```bash
python -m unittest discover tests -v
```

São 13 testes: 11 conferem as contas e 2 testam a API de ponta a ponta (simular, salvar, listar, abrir e apagar).

## Arquitetura

```
 Navegador (static/)                 Servidor Flask (app.py)              Banco SQLite
┌──────────────────────┐   fetch   ┌───────────────────────────┐       ┌──────────────────┐
│ index.html           │ ───────►  │ Rotas /api/...            │ ────► │ veiculos         │
│ css/style.css        │   JSON    │ valida o que chegou       │       │ precos_regiao    │
│ js/app.js            │ ◄───────  │ chama o cálculo           │ ◄──── │ simulacoes       │
└──────────────────────┘           └─────────────┬─────────────┘       └──────────────────┘
                                                 │
                                                 ▼
                                   ┌───────────────────────────┐
                                   │ calculo.py                │
                                   │ custos, payback, sugestão │
                                   └───────────────────────────┘
```

- **static/**: tudo o que o navegador mostra. O `app.js` busca os dados na API e monta as telas.
- **app.py**: recebe os pedidos do navegador, confere se os dados estão certos e devolve JSON.
- **calculo.py**: só faz contas. Não depende do Flask nem do banco, por isso é fácil de testar.
- **database.py**: cria as tabelas, coloca os dados iniciais e faz as consultas.

### Estrutura de pastas

```
turbo-e-taxa/
├── app.py              # servidor e rotas da API
├── calculo.py          # regras de cálculo
├── database.py         # banco de dados e dados iniciais
├── requirements.txt    # dependências (Flask)
├── iniciar.bat         # abre o sistema no Windows (dois cliques)
├── iniciar.sh          # abre o sistema no Linux/Mac
├── gerar_exe.bat       # gera o TurboETaxa.exe no Windows
├── gerar_executavel.sh # gera o executável no Linux/Mac
├── icone.ico           # ícone do executável
├── gerar_index_avaliacao.py  # gera a versão de avaliação
├── avaliacao/
│   └── index.html      # calculadora em um arquivo só, abre direto no navegador
├── static/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── js/local-api.js # cálculo em JavaScript (usado na versão de avaliação)
│   └── img/            # logo da empresa
└── tests/
    └── test_calculo.py
```

## API

| Método | Endereço | O que faz |
|---|---|---|
| GET | `/api/veiculos?tipo=eletrico&busca=byd` | Lista carros do catálogo (filtros opcionais) |
| GET | `/api/veiculos/<id>` | Dados de um carro |
| GET | `/api/precos` | Preços de combustível e energia da região |
| POST | `/api/simular` | Calcula a comparação |
| GET | `/api/simulacoes` | Lista as simulações salvas |
| POST | `/api/simulacoes` | Salva uma simulação |
| GET | `/api/simulacoes/<id>` | Abre uma simulação salva |
| DELETE | `/api/simulacoes/<id>` | Apaga uma simulação |

Exemplo do que o `POST /api/simular` recebe:

```json
{
  "carros": { "combustao": { "id": 1, "preco": 90000 } },
  "km_mes": 1400,
  "pct_cidade": 60,
  "anos": 5,
  "combustivel": "gasolina",
  "recarga": "casa",
  "precos": { "gasolina": 6.84, "etanol": 4.70, "kwh": 0.76, "kwh_publico": 2.00 }
}
```

Se algum dado vier errado, a API responde com status 400 e uma mensagem, por exemplo: `{"erro": "O campo 'km por mês' precisa ser um número."}`.

## Banco de dados

**veiculos**: catálogo de carros. Guarda marca, modelo, ano, tipo, carroceria, preço, consumo na cidade e na estrada (km/l ou km/kWh), consumo com etanol, velocidade máxima, 0 a 100 km/h, autonomia, seguro anual, manutenção anual, desvalorização anual e a fonte dos dados.

**precos_regiao**: preço da gasolina, do etanol, do kWh em casa, do kWh em carregador público e a alíquota do IPVA.

**simulacoes**: simulações salvas. Guarda o nome, a data, o que o usuário preencheu e o resultado (os dois em JSON).

## Como o cálculo funciona

Para cada carro, no período escolhido:

- **Desvalorização** = preço − preço × (1 − taxa anual) ^ anos
- **Combustível/energia** = (km na cidade ÷ consumo na cidade + km na estrada ÷ consumo na estrada) × preço do litro ou do kWh
- **Manutenção** = manutenção anual × (km por ano ÷ 15.000), com mínimo de 50%
- **Seguro** = seguro anual × anos
- **IPVA** = soma, ano a ano, de 1,9% do valor do carro naquele ano
- **Total** = soma de tudo acima
- **Custo por mês** = (combustível + manutenção + seguro + IPVA) de um ano ÷ 12
- **Payback** = diferença de preço ÷ economia por ano no uso. Se o carro gasta mais no dia a dia que o de referência, ele nunca se paga.

O carro de referência é o primeiro que o usuário preencheu.

## Fontes dos dados

- Preço da gasolina e do etanol em Curitiba: ANP, pesquisa semanal de agosto de 2026.
- Tarifa de energia: Copel, após a revisão tarifária de junho de 2026.
- IPVA do Paraná em 2026: 1,9% (Secretaria da Fazenda do PR).
- Preços, consumo e desempenho: fabricantes, Inmetro, Tabela FIPE e imprensa especializada.
- Desvalorização: levantamento da Gazeta do Povo com dados da FIPE (julho de 2026).
- Dados de manutenção do carro a combustão: entrevista com mecânico (Fase 1).

**Importante:** alguns valores do catálogo são aproximados e o seguro é sempre uma estimativa. A coluna `fonte` da tabela `veiculos` diz o que foi conferido e o que é aproximado. Antes de usar o sistema para uma decisão real, atualize esses dados.

## Equipe

| Integrante | Função |
|---|---|
| Vinicius Duda Vidal | _a definir_ |
| _nome_ | _a definir_ |
| _nome_ | _a definir_ |
| _nome_ | _a definir_ |
