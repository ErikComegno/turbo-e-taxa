"""
Turbo e Taxa - Calculadora de custo veicular
Servidor (back-end) feito com Flask.

Para rodar:  python app.py   e abrir http://localhost:5000
"""
import os
import sys
import threading
import webbrowser

from flask import Flask, jsonify, request, send_from_directory

import calculo
import database

# Quando roda como .exe (PyInstaller), os arquivos do site ficam numa pasta temporária
PASTA_BASE = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
EXECUTAVEL = getattr(sys, "frozen", False)

app = Flask(__name__, static_folder=os.path.join(PASTA_BASE, "static"), static_url_path="/static")

TIPOS = ("combustao", "hibrido", "eletrico")
CAMPOS_EDITAVEIS = ("preco", "consumo_cidade", "consumo_estrada")


def erro(mensagem, status=400):
    return jsonify({"erro": mensagem}), status


def numero(valor, nome, minimo=None, maximo=None):
    """Converte para número e confere limites. Aceita vírgula (ex: '6,84')."""
    try:
        n = float(str(valor).replace(",", "."))
    except (TypeError, ValueError):
        raise ValueError(f"O campo '{nome}' precisa ser um número.")
    if minimo is not None and n < minimo:
        raise ValueError(f"O campo '{nome}' precisa ser no mínimo {minimo}.")
    if maximo is not None and n > maximo:
        raise ValueError(f"O campo '{nome}' precisa ser no máximo {maximo}.")
    return n


# ---------- Páginas ----------

@app.get("/")
def pagina_inicial():
    return send_from_directory(app.static_folder, "index.html")


# ---------- API: catálogo e preços ----------

@app.get("/api/veiculos")
def api_listar_veiculos():
    tipo = request.args.get("tipo")
    if tipo and tipo not in TIPOS:
        return erro("Tipo inválido. Use combustao, hibrido ou eletrico.")
    return jsonify(database.listar_veiculos(tipo, request.args.get("busca")))


@app.get("/api/veiculos/<int:id_veiculo>")
def api_buscar_veiculo(id_veiculo):
    veiculo = database.buscar_veiculo(id_veiculo)
    return jsonify(veiculo) if veiculo else erro("Carro não encontrado.", 404)


@app.get("/api/precos")
def api_precos():
    return jsonify(database.buscar_precos())


# ---------- API: simulação ----------

def montar_entrada(dados):
    """Lê e valida o que veio da tela. Devolve (escolhidos, uso, precos)."""
    uso = {
        "km_mes": numero(dados.get("km_mes"), "km por mês", 1, 20000),
        "pct_cidade": numero(dados.get("pct_cidade", 60), "% na cidade", 0, 100),
        "anos": int(numero(dados.get("anos", 5), "anos", 1, 15)),
        "recarga": dados.get("recarga", "casa"),
        "combustivel": dados.get("combustivel", "gasolina"),
    }
    if uso["recarga"] not in ("casa", "trabalho", "publico"):
        raise ValueError("Local de recarga inválido.")
    if uso["combustivel"] not in ("gasolina", "etanol"):
        raise ValueError("Combustível inválido.")

    base = database.buscar_precos()
    p = dados.get("precos", {})
    precos = {
        "gasolina": numero(p.get("gasolina", base["gasolina"]), "preço da gasolina", 0.01),
        "etanol": numero(p.get("etanol", base["etanol"]), "preço do etanol", 0.01),
        "kwh": numero(p.get("kwh", base["kwh"]), "preço do kWh", 0.01),
        "kwh_publico": numero(p.get("kwh_publico", base["kwh_publico"]), "preço do kWh público", 0.01),
        "aliquota_ipva": base["aliquota_ipva"],
    }

    escolhidos = {}
    for tipo in TIPOS:
        info = (dados.get("carros") or {}).get(tipo)
        if not info or not info.get("id"):
            escolhidos[tipo] = None
            continue
        veiculo = database.buscar_veiculo(int(info["id"]))
        if not veiculo:
            raise ValueError("Um dos carros escolhidos não existe no catálogo.")
        if veiculo["tipo"] != tipo:
            raise ValueError(f"O carro {veiculo['modelo']} não é do tipo {tipo}.")
        # o usuário pode corrigir preço e consumo do carro dele
        for campo in CAMPOS_EDITAVEIS:
            if info.get(campo) not in (None, ""):
                veiculo[campo] = numero(info[campo], campo, 0.1)
        escolhidos[tipo] = veiculo

    if not any(escolhidos.values()):
        raise ValueError("Escolha pelo menos um carro para comparar.")
    return escolhidos, uso, precos


@app.post("/api/simular")
def api_simular():
    dados = request.get_json(silent=True) or {}
    try:
        escolhidos, uso, precos = montar_entrada(dados)
        resultado = calculo.comparar(escolhidos, database.listar_veiculos(), uso, precos)
    except ValueError as e:
        return erro(str(e))
    return jsonify(resultado)


# ---------- API: simulações salvas ----------

@app.get("/api/simulacoes")
def api_listar_simulacoes():
    return jsonify(database.listar_simulacoes())


@app.post("/api/simulacoes")
def api_salvar_simulacao():
    dados = request.get_json(silent=True) or {}
    nome = (dados.get("nome") or "").strip() or "Simulação sem nome"
    if len(nome) > 80:
        return erro("O nome pode ter no máximo 80 letras.")
    try:
        escolhidos, uso, precos = montar_entrada(dados.get("entrada") or {})
        resultado = calculo.comparar(escolhidos, database.listar_veiculos(), uso, precos)
    except ValueError as e:
        return erro(str(e))
    novo_id = database.salvar_simulacao(nome, dados["entrada"], resultado)
    return jsonify({"id": novo_id, "nome": nome}), 201


@app.get("/api/simulacoes/<int:id_simulacao>")
def api_buscar_simulacao(id_simulacao):
    simulacao = database.buscar_simulacao(id_simulacao)
    return jsonify(simulacao) if simulacao else erro("Simulação não encontrada.", 404)


@app.delete("/api/simulacoes/<int:id_simulacao>")
def api_apagar_simulacao(id_simulacao):
    if database.apagar_simulacao(id_simulacao):
        return jsonify({"apagada": True})
    return erro("Simulação não encontrada.", 404)


database.iniciar_banco()

if __name__ == "__main__":
    endereco = "http://localhost:5000"
    print(f"\n  Turbo e Taxa rodando em {endereco}")
    print("  Para fechar, feche esta janela ou aperte Ctrl + C.\n")
    # abre o navegador sozinho (só uma vez, mesmo com o recarregamento automático)
    if os.environ.get("WERKZEUG_RUN_MAIN") != "true" and os.environ.get("TURBO_SEM_NAVEGADOR") != "1":
        threading.Timer(1.2, lambda: webbrowser.open(endereco)).start()
    app.run(debug=not EXECUTAVEL, port=5000)
