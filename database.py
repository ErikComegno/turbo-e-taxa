"""
Banco de dados da Turbo e Taxa (SQLite).

O arquivo do banco (turbo_e_taxa.db) é criado sozinho na primeira vez que
o sistema roda, já com o catálogo de carros e os preços de Curitiba.
"""
import json
import os
import sqlite3
import sys

# No .exe o banco fica ao lado do executável; rodando pelo Python, ao lado deste arquivo
_PASTA = os.path.dirname(sys.executable) if getattr(sys, "frozen", False) else os.path.dirname(os.path.abspath(__file__))
CAMINHO_BANCO = os.environ.get("TURBO_DB", os.path.join(_PASTA, "turbo_e_taxa.db"))

ESQUEMA = """
CREATE TABLE IF NOT EXISTS veiculos (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    marca                   TEXT NOT NULL,
    modelo                  TEXT NOT NULL,
    ano                     INTEGER NOT NULL,
    tipo                    TEXT NOT NULL CHECK (tipo IN ('combustao', 'hibrido', 'eletrico')),
    carroceria              TEXT NOT NULL CHECK (carroceria IN ('hatch', 'sedan', 'suv')),
    preco                   REAL NOT NULL,
    consumo_cidade          REAL NOT NULL,   -- km/l (gasolina) ou km/kWh (elétrico)
    consumo_estrada         REAL NOT NULL,
    consumo_etanol_cidade   REAL,            -- só para flex
    consumo_etanol_estrada  REAL,
    velocidade_maxima       INTEGER,         -- km/h
    aceleracao_0_100        REAL,            -- segundos
    autonomia_km            INTEGER,         -- só elétricos
    seguro_anual            REAL NOT NULL,
    manutencao_anual        REAL NOT NULL,   -- para 15.000 km/ano
    depreciacao_anual       REAL NOT NULL,   -- ex: 0.08 = 8% ao ano
    fonte                   TEXT
);

CREATE TABLE IF NOT EXISTS precos_regiao (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    regiao          TEXT NOT NULL,
    gasolina        REAL NOT NULL,
    etanol          REAL NOT NULL,
    kwh             REAL NOT NULL,
    kwh_publico     REAL NOT NULL,
    aliquota_ipva   REAL NOT NULL,
    atualizado_em   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS simulacoes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    criada_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    entrada     TEXT NOT NULL,   -- JSON com o que o usuário preencheu
    resultado   TEXT NOT NULL    -- JSON com o resultado calculado
);
"""

# Valores de referência para demonstração.
# "verificado" = conferido em fonte pública (fabricante, Inmetro, FIPE ou imprensa).
# "aproximado" = estimativa do grupo; atualizar antes de usar de verdade.
# Seguro é sempre estimativa: o valor real depende do perfil do motorista.
VEICULOS_INICIAIS = [
    # marca, modelo, ano, tipo, carroceria, preco, cons_cid, cons_est, et_cid, et_est, vmax, 0-100, autonomia, seguro, manut, deprec, fonte
    ("Chevrolet", "Onix LT 1.0 Turbo", 2024, "combustao", "hatch", 77208, 13.1, 16.1, 9.2, 11.4, 187, 10.1, None, 3500, 2250, 0.075,
     "Preço FIPE 06/2026, desempenho e consumo a gasolina verificados; etanol e seguro aproximados"),
    ("Volkswagen", "Polo Track 1.0", 2023, "combustao", "hatch", 66000, 13.2, 15.5, 9.2, 10.8, 170, 14.0, None, 3000, 2000, 0.075,
     "Preço FIPE 07/2026 verificado; ficha técnica aproximada"),
    ("Hyundai", "HB20 Comfort 1.0", 2023, "combustao", "hatch", 69000, 13.0, 15.0, 9.0, 10.5, 160, 14.5, None, 3100, 2000, 0.07,
     "Preço FIPE 07/2026 verificado; ficha técnica aproximada"),
    ("Caoa Chery", "Tiggo 5X Sport 1.5 Turbo", 2025, "combustao", "suv", 112241, 9.9, 11.5, 6.9, 8.1, 193, 10.3, None, 4500, 2600, 0.09,
     "Preço FIPE, desempenho e consumo verificados; seguro aproximado"),
    ("Caoa Chery", "Tiggo 5X Sport Hybrid", 2026, "hibrido", "suv", 124990, 11.0, 12.5, 7.7, 8.8, 185, 10.0, None, 5000, 2200, 0.09,
     "Preço verificado; ficha técnica aproximada"),
    ("Caoa Chery", "Tiggo 5X Pro Hybrid", 2024, "hibrido", "suv", 154990, 11.8, 12.3, 8.7, 8.8, 176, 9.2, None, 5500, 2000, 0.09,
     "Preço, desempenho e consumo Inmetro verificados; seguro aproximado"),
    ("Toyota", "Corolla Altis Hybrid", 2025, "hibrido", "sedan", 185000, 17.9, 15.5, 12.5, 11.0, 180, 11.0, None, 6500, 2200, 0.08,
     "Valores aproximados"),
    ("Renault", "Kwid E-Tech", 2026, "eletrico", "hatch", 99990, 7.2, 7.2, None, None, 130, 14.6, 185, 5000, 1200, 0.09,
     "Preço, desempenho, consumo e autonomia Inmetro verificados; seguro estimado (R$ 4 a 6 mil)"),
    ("BYD", "Dolphin Mini", 2024, "eletrico", "hatch", 115800, 6.8, 6.8, None, None, 130, 14.9, 280, 5000, 1300, 0.07,
     "Preço de lançamento verificado; ficha técnica aproximada"),
    ("BYD", "Dolphin", 2023, "eletrico", "hatch", 149900, 6.4, 6.4, None, None, 150, 10.9, 291, 6000, 1400, 0.09,
     "Preço de lançamento verificado; ficha técnica aproximada"),
    ("Volvo", "EX30 Core", 2024, "eletrico", "suv", 229900, 5.8, 5.8, None, None, 180, 5.7, 250, 9000, 1800, 0.10,
     "Preço de lançamento verificado; seguro entre R$ 7 e 11 mil; ficha técnica aproximada"),
]

PRECOS_INICIAIS = {
    "regiao": "Curitiba - PR",
    "gasolina": 6.84,       # ANP, ago/2026
    "etanol": 4.70,         # ANP, ago/2026
    "kwh": 0.76,            # Copel, após revisão de jun/2026
    "kwh_publico": 2.00,    # estimativa para carregador público rápido
    "aliquota_ipva": 0.019, # Paraná 2026
    "atualizado_em": "2026-08",
}


def conectar():
    conexao = sqlite3.connect(CAMINHO_BANCO)
    conexao.row_factory = sqlite3.Row
    return conexao


def iniciar_banco():
    """Cria as tabelas e coloca os dados iniciais se o banco estiver vazio."""
    with conectar() as con:
        con.executescript(ESQUEMA)
        if con.execute("SELECT COUNT(*) FROM veiculos").fetchone()[0] == 0:
            con.executemany(
                """INSERT INTO veiculos (marca, modelo, ano, tipo, carroceria, preco, consumo_cidade, consumo_estrada,
                   consumo_etanol_cidade, consumo_etanol_estrada, velocidade_maxima, aceleracao_0_100, autonomia_km,
                   seguro_anual, manutencao_anual, depreciacao_anual, fonte)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                VEICULOS_INICIAIS,
            )
        if con.execute("SELECT COUNT(*) FROM precos_regiao").fetchone()[0] == 0:
            con.execute(
                """INSERT INTO precos_regiao (id, regiao, gasolina, etanol, kwh, kwh_publico, aliquota_ipva, atualizado_em)
                   VALUES (1, :regiao, :gasolina, :etanol, :kwh, :kwh_publico, :aliquota_ipva, :atualizado_em)""",
                PRECOS_INICIAIS,
            )


# ---------- Veículos ----------

def listar_veiculos(tipo=None, busca=None):
    sql = "SELECT * FROM veiculos WHERE 1=1"
    parametros = []
    if tipo:
        sql += " AND tipo = ?"
        parametros.append(tipo)
    if busca:
        sql += " AND (marca || ' ' || modelo) LIKE ?"
        parametros.append(f"%{busca}%")
    sql += " ORDER BY marca, modelo"
    with conectar() as con:
        return [dict(linha) for linha in con.execute(sql, parametros)]


def buscar_veiculo(id_veiculo):
    with conectar() as con:
        linha = con.execute("SELECT * FROM veiculos WHERE id = ?", (id_veiculo,)).fetchone()
        return dict(linha) if linha else None


# ---------- Preços ----------

def buscar_precos():
    with conectar() as con:
        return dict(con.execute("SELECT * FROM precos_regiao WHERE id = 1").fetchone())


# ---------- Simulações salvas ----------

def salvar_simulacao(nome, entrada, resultado):
    with conectar() as con:
        cursor = con.execute(
            "INSERT INTO simulacoes (nome, entrada, resultado) VALUES (?, ?, ?)",
            (nome, json.dumps(entrada, ensure_ascii=False), json.dumps(resultado, ensure_ascii=False)),
        )
        return cursor.lastrowid


def listar_simulacoes():
    with conectar() as con:
        linhas = con.execute("SELECT id, nome, criada_em, resultado FROM simulacoes ORDER BY id DESC").fetchall()
    lista = []
    for linha in linhas:
        resultado = json.loads(linha["resultado"])
        mais_barato = resultado["resultados"][resultado["mais_barato"]]["carro"]
        lista.append({
            "id": linha["id"],
            "nome": linha["nome"],
            "criada_em": linha["criada_em"],
            "mais_barato": f'{mais_barato["marca"]} {mais_barato["modelo"]}',
            "economia": resultado["economia_vs_referencia"],
        })
    return lista


def buscar_simulacao(id_simulacao):
    with conectar() as con:
        linha = con.execute("SELECT * FROM simulacoes WHERE id = ?", (id_simulacao,)).fetchone()
    if not linha:
        return None
    return {
        "id": linha["id"],
        "nome": linha["nome"],
        "criada_em": linha["criada_em"],
        "entrada": json.loads(linha["entrada"]),
        "resultado": json.loads(linha["resultado"]),
    }


def apagar_simulacao(id_simulacao):
    with conectar() as con:
        return con.execute("DELETE FROM simulacoes WHERE id = ?", (id_simulacao,)).rowcount > 0
