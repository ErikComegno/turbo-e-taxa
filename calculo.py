"""
Cálculo do custo total de ter um carro (TCO - Total Cost of Ownership).

Este arquivo não depende do Flask nem do banco de dados: recebe dicionários
e devolve dicionários. Isso facilita testar (veja tests/test_calculo.py).

Custos considerados no período escolhido (ex: 5 anos):
  - Desvalorização: quanto o carro perde de valor
  - Combustível ou energia
  - Manutenção
  - Seguro
  - IPVA
"""

KM_BASE_MANUTENCAO = 15000  # a manutenção cadastrada no banco é para 15.000 km/ano


def valor_no_ano(preco, depreciacao_anual, ano):
    """Valor do carro depois de 'ano' anos (desvalorização composta)."""
    return preco * (1 - depreciacao_anual) ** ano


def calcular_carro(carro, uso, precos):
    """
    Calcula todos os custos de um carro.

    carro: dados do veículo (vindos do banco, com possíveis ajustes do usuário)
    uso:   km_mes, pct_cidade (0 a 100), anos, recarga ('casa', 'trabalho', 'publico'), combustivel ('gasolina' ou 'etanol')
    precos: gasolina, etanol, kwh, kwh_publico, aliquota_ipva (ex: 0.019)
    """
    anos = int(uso["anos"])
    km_ano = float(uso["km_mes"]) * 12
    km_total = km_ano * anos
    cidade = float(uso["pct_cidade"]) / 100
    estrada = 1 - cidade
    preco = float(carro["preco"])

    # 1) Combustível ou energia
    if carro["tipo"] == "eletrico":
        # consumo em km por kWh
        kwh_ano = km_ano * cidade / carro["consumo_cidade"] + km_ano * estrada / carro["consumo_estrada"]
        preco_unidade = precos["kwh_publico"] if uso.get("recarga") == "publico" else precos["kwh"]
        energia_ano = kwh_ano * preco_unidade
        unidade = "kWh"
    else:
        usa_etanol = (
            uso.get("combustivel") == "etanol"
            and carro.get("consumo_etanol_cidade")
            and carro.get("consumo_etanol_estrada")
        )
        if usa_etanol:
            c_cid, c_est, preco_unidade = carro["consumo_etanol_cidade"], carro["consumo_etanol_estrada"], precos["etanol"]
        else:
            c_cid, c_est, preco_unidade = carro["consumo_cidade"], carro["consumo_estrada"], precos["gasolina"]
        litros_ano = km_ano * cidade / c_cid + km_ano * estrada / c_est
        energia_ano = litros_ano * preco_unidade
        unidade = "litro"

    # 2) Manutenção (proporcional ao quanto a pessoa roda, mínimo de 50%)
    fator_uso = max(0.5, km_ano / KM_BASE_MANUTENCAO)
    manutencao_ano = carro["manutencao_anual"] * fator_uso

    # 3) Seguro
    seguro_ano = carro["seguro_anual"]

    # 4) IPVA: cobrado todo ano sobre o valor do carro naquele ano
    ipva_por_ano = [
        precos["aliquota_ipva"] * valor_no_ano(preco, carro["depreciacao_anual"], n) for n in range(anos)
    ]
    ipva_total = sum(ipva_por_ano)

    # 5) Desvalorização
    valor_final = valor_no_ano(preco, carro["depreciacao_anual"], anos)
    desvalorizacao = preco - valor_final

    # Quanto a pessoa já gastou no fim de cada ano, somando a compra (para o gráfico).
    # As linhas de dois carros se cruzam quando o mais caro se paga.
    gasto_acumulado = [round(preco, 2)]
    for n in range(anos):
        gasto_acumulado.append(round(gasto_acumulado[-1] + energia_ano + manutencao_ano + seguro_ano + ipva_por_ano[n], 2))

    energia_total = energia_ano * anos
    manutencao_total = manutencao_ano * anos
    seguro_total = seguro_ano * anos
    total = desvalorizacao + energia_total + manutencao_total + seguro_total + ipva_total

    # custo de uso (sem a desvalorização), usado no "por mês" e no payback
    uso_ano = energia_ano + manutencao_ano + seguro_ano + ipva_total / anos

    return {
        "carro": carro,
        "unidade_energia": unidade,
        "preco_unidade": round(preco_unidade, 2),
        "custos": {
            "desvalorizacao": round(desvalorizacao, 2),
            "energia": round(energia_total, 2),
            "manutencao": round(manutencao_total, 2),
            "seguro": round(seguro_total, 2),
            "ipva": round(ipva_total, 2),
        },
        "total": round(total, 2),
        "valor_revenda": round(valor_final, 2),
        "custo_mes": round(uso_ano / 12, 2),
        "custo_km": round(energia_ano / km_ano, 2) if km_ano else 0,
        "custo_uso_ano": round(uso_ano, 2),
        "km_total": km_total,
        "gasto_acumulado": gasto_acumulado,
    }


def calcular_payback(resultado, referencia):
    """
    Em quanto tempo a diferença de preço volta com a economia no uso.

    Retorna um dicionário:
      {"situacao": "referencia"}      -> é o próprio carro de referência
      {"situacao": "imediato"}        -> custa menos e gasta menos
      {"situacao": "nunca"}           -> gasta mais no dia a dia, nunca se paga
      {"situacao": "anos", "meses": N}
    """
    if resultado is referencia:
        return {"situacao": "referencia"}
    diferenca_preco = resultado["carro"]["preco"] - referencia["carro"]["preco"]
    economia_ano = referencia["custo_uso_ano"] - resultado["custo_uso_ano"]
    if economia_ano <= 0:
        return {"situacao": "nunca"}
    if diferenca_preco <= 0:
        return {"situacao": "imediato"}
    meses = round(diferenca_preco / economia_ano * 12)
    return {"situacao": "anos", "meses": max(1, meses)}


def sugerir_carro(catalogo, tipo, preco_alvo):
    """Escolhe, do catálogo, o carro do tipo pedido com o preço mais próximo."""
    opcoes = [c for c in catalogo if c["tipo"] == tipo]
    if not opcoes:
        return None
    return min(opcoes, key=lambda c: abs(c["preco"] - preco_alvo))


def comparar(escolhidos, catalogo, uso, precos):
    """
    escolhidos: dicionário {tipo: carro ou None}. Pelo menos um precisa vir preenchido.
    O primeiro carro preenchido (na ordem combustão, híbrido, elétrico) vira a referência.
    Os tipos vazios recebem uma sugestão na mesma faixa de preço.
    """
    ordem = ["combustao", "hibrido", "eletrico"]
    informados = [escolhidos[t] for t in ordem if escolhidos.get(t)]
    if not informados:
        raise ValueError("Escolha pelo menos um carro para comparar.")
    referencia_carro = informados[0]

    carros = {}
    for tipo in ordem:
        if escolhidos.get(tipo):
            carros[tipo] = dict(escolhidos[tipo], sugerido=False)
        else:
            sugestao = sugerir_carro(catalogo, tipo, referencia_carro["preco"])
            carros[tipo] = dict(sugestao, sugerido=True) if sugestao else None

    resultados = {t: calcular_carro(c, uso, precos) for t, c in carros.items() if c}
    referencia = next(r for r in resultados.values() if r["carro"]["id"] == referencia_carro["id"])

    for r in resultados.values():
        r["payback"] = calcular_payback(r, referencia)
        r["eh_referencia"] = r is referencia

    mais_barato = min(resultados, key=lambda t: resultados[t]["total"])
    economia = round(referencia["total"] - resultados[mais_barato]["total"], 2)

    return {
        "uso": uso,
        "precos": precos,
        "resultados": resultados,
        "mais_barato": mais_barato,
        "referencia": next(t for t, r in resultados.items() if r is referencia),
        "economia_vs_referencia": economia,
        "economia_mes_vs_referencia": round(referencia["custo_mes"] - resultados[mais_barato]["custo_mes"], 2),
    }
