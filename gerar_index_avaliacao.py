"""
Gera avaliacao/index.html: a calculadora inteira em um único arquivo,
que abre direto no navegador (sem Python e sem servidor).

Uso:  python gerar_index_avaliacao.py
Rode de novo sempre que mudar o site, o cálculo ou o catálogo de carros.
"""
import base64
import json
import os
import re

import database

PASTA = os.path.dirname(os.path.abspath(__file__))
COLUNAS = ["marca", "modelo", "ano", "tipo", "carroceria", "preco", "consumo_cidade", "consumo_estrada",
           "consumo_etanol_cidade", "consumo_etanol_estrada", "velocidade_maxima", "aceleracao_0_100",
           "autonomia_km", "seguro_anual", "manutencao_anual", "depreciacao_anual", "fonte"]


def ler(*partes):
    with open(os.path.join(PASTA, *partes), encoding="utf-8") as f:
        return f.read()


def main():
    catalogo = [dict(zip(COLUNAS, linha), id=i) for i, linha in enumerate(database.VEICULOS_INICIAIS, start=1)]
    precos = dict(database.PRECOS_INICIAIS, id=1)

    with open(os.path.join(PASTA, "static", "img", "emblema.png"), "rb") as f:
        emblema = "data:image/png;base64," + base64.b64encode(f.read()).decode()

    local_api = (ler("static", "js", "local-api.js")
                 .replace("__CATALOGO__", json.dumps(catalogo, ensure_ascii=False))
                 .replace("__PRECOS__", json.dumps(precos, ensure_ascii=False)))

    app_js = ler("static", "js", "app.js")
    app_js, trocas = re.subn(r"async function api\(caminho, opcoes = \{\}\) \{.*?\n\}\n",
                             "async function api(caminho, opcoes = {}) {\n  return LocalApi.requisitar(caminho, opcoes);\n}\n",
                             app_js, flags=re.S)
    assert trocas == 1, "Não achei a função api() no app.js"

    html = ler("static", "index.html")
    html = html.replace('<link rel="stylesheet" href="/static/css/style.css">', "<style>\n" + ler("static", "css", "style.css") + "\n</style>")
    html = html.replace('<script src="/static/js/app.js"></script>', "<script>\n" + local_api + "\n" + app_js + "\n</script>")
    html = html.replace("/static/img/emblema.png", emblema)
    html = html.replace(
        "Os valores são estimativas para ajudar na decisão, não uma proposta de venda.</p>",
        "Os valores são estimativas para ajudar na decisão, não uma proposta de venda.</p>\n"
        "  <p>Versão de avaliação: roda direto no navegador. As simulações salvas ficam guardadas neste navegador.</p>")
    assert "/static/" not in html, "Ainda há caminhos /static/ no arquivo"

    destino = os.path.join(PASTA, "avaliacao")
    os.makedirs(destino, exist_ok=True)
    with open(os.path.join(destino, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Pronto: avaliacao/index.html")


if __name__ == "__main__":
    main()
