"""
Testes automáticos. Para rodar:  python -m unittest discover tests
"""
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import calculo  # noqa: E402

PRECOS = {"gasolina": 6.0, "etanol": 4.0, "kwh": 1.0, "kwh_publico": 2.0, "aliquota_ipva": 0.02}
USO = {"km_mes": 1250, "pct_cidade": 100, "anos": 1, "recarga": "casa", "combustivel": "gasolina"}  # 15.000 km/ano


def carro(id, tipo, preco, consumo, seguro=1000, manut=1000, deprec=0.10):
    return {"id": id, "marca": "Teste", "modelo": f"Carro {id}", "ano": 2026, "tipo": tipo, "carroceria": "hatch",
            "preco": preco, "consumo_cidade": consumo, "consumo_estrada": consumo,
            "consumo_etanol_cidade": consumo * 0.7, "consumo_etanol_estrada": consumo * 0.7,
            "seguro_anual": seguro, "manutencao_anual": manut, "depreciacao_anual": deprec}


class TestCalculoCarro(unittest.TestCase):
    def test_custos_de_um_ano(self):
        # 15.000 km a 15 km/l = 1.000 litros x R$ 6 = R$ 6.000
        r = calculo.calcular_carro(carro(1, "combustao", 100000, 15), USO, PRECOS)
        self.assertEqual(r["custos"]["energia"], 6000)
        self.assertEqual(r["custos"]["manutencao"], 1000)
        self.assertEqual(r["custos"]["seguro"], 1000)
        self.assertEqual(r["custos"]["ipva"], 2000)            # 2% de 100 mil
        self.assertEqual(r["custos"]["desvalorizacao"], 10000)  # 10% de 100 mil
        self.assertEqual(r["total"], 20000)
        self.assertEqual(r["custo_km"], 0.4)

    def test_eletrico_usa_kwh_e_recarga_publica_custa_mais(self):
        eletrico = carro(2, "eletrico", 100000, 7.5)  # 15.000 / 7,5 = 2.000 kWh
        casa = calculo.calcular_carro(eletrico, USO, PRECOS)
        publico = calculo.calcular_carro(eletrico, dict(USO, recarga="publico"), PRECOS)
        self.assertEqual(casa["custos"]["energia"], 2000)
        self.assertEqual(publico["custos"]["energia"], 4000)

    def test_etanol(self):
        r = calculo.calcular_carro(carro(1, "combustao", 100000, 15), dict(USO, combustivel="etanol"), PRECOS)
        # 15.000 / 10,5 km/l x R$ 4
        self.assertAlmostEqual(r["custos"]["energia"], 15000 / 10.5 * 4, places=1)

    def test_gasto_acumulado_comeca_no_preco(self):
        r = calculo.calcular_carro(carro(1, "combustao", 100000, 15), dict(USO, anos=2), PRECOS)
        # ano 1: 6.000 + 1.000 + 1.000 + IPVA 2.000 ; ano 2: mesmo uso + IPVA 1.800
        self.assertEqual(r["gasto_acumulado"], [100000, 110000, 119800])

    def test_ipva_diminui_com_a_desvalorizacao(self):
        r = calculo.calcular_carro(carro(1, "combustao", 100000, 15), dict(USO, anos=2), PRECOS)
        self.assertEqual(r["custos"]["ipva"], 2000 + 1800)


class TestPayback(unittest.TestCase):
    def setUp(self):
        self.ref = calculo.calcular_carro(carro(1, "combustao", 100000, 10), USO, PRECOS)

    def test_referencia(self):
        self.assertEqual(calculo.calcular_payback(self.ref, self.ref)["situacao"], "referencia")

    def test_nunca_se_paga_quando_gasta_mais(self):
        caro = calculo.calcular_carro(carro(2, "hibrido", 150000, 5), USO, PRECOS)
        self.assertEqual(calculo.calcular_payback(caro, self.ref)["situacao"], "nunca")

    def test_imediato_quando_e_mais_barato_e_gasta_menos(self):
        barato = calculo.calcular_carro(carro(3, "eletrico", 90000, 7.5), USO, PRECOS)
        self.assertEqual(calculo.calcular_payback(barato, self.ref)["situacao"], "imediato")

    def test_meses(self):
        # referência gasta 9.000 de combustível; elétrico gasta 2.000 -> economiza ~7.000/ano no uso
        eletrico = calculo.calcular_carro(carro(4, "eletrico", 107000, 7.5), USO, PRECOS)
        p = calculo.calcular_payback(eletrico, self.ref)
        self.assertEqual(p["situacao"], "anos")
        self.assertTrue(10 <= p["meses"] <= 13)


class TestComparar(unittest.TestCase):
    def test_sugere_os_tipos_que_faltam_pelo_preco(self):
        catalogo = [
            carro(1, "combustao", 80000, 13),
            carro(2, "hibrido", 120000, 15), carro(3, "hibrido", 200000, 18),
            carro(4, "eletrico", 95000, 7), carro(5, "eletrico", 230000, 6),
        ]
        res = calculo.comparar({"combustao": catalogo[0], "hibrido": None, "eletrico": None}, catalogo, USO, PRECOS)
        self.assertEqual(res["resultados"]["hibrido"]["carro"]["id"], 2)
        self.assertEqual(res["resultados"]["eletrico"]["carro"]["id"], 4)
        self.assertTrue(res["resultados"]["eletrico"]["carro"]["sugerido"])
        self.assertEqual(res["referencia"], "combustao")

    def test_sem_carro_da_erro(self):
        with self.assertRaises(ValueError):
            calculo.comparar({"combustao": None, "hibrido": None, "eletrico": None}, [], USO, PRECOS)


class TestApi(unittest.TestCase):
    """Testa o servidor de ponta a ponta usando um banco temporário."""

    @classmethod
    def setUpClass(cls):
        cls.pasta = tempfile.TemporaryDirectory()
        os.environ["TURBO_DB"] = os.path.join(cls.pasta.name, "teste.db")
        import importlib
        import database
        importlib.reload(database)
        import app as servidor
        importlib.reload(servidor)
        cls.cliente = servidor.app.test_client()

    @classmethod
    def tearDownClass(cls):
        cls.pasta.cleanup()

    def test_fluxo_completo(self):
        veiculos = self.cliente.get("/api/veiculos?tipo=combustao").get_json()
        self.assertTrue(veiculos)
        entrada = {"carros": {"combustao": {"id": veiculos[0]["id"]}}, "km_mes": 1400, "pct_cidade": 60, "anos": 5}

        r = self.cliente.post("/api/simular", json=entrada)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(set(r.get_json()["resultados"]), {"combustao", "hibrido", "eletrico"})

        salvo = self.cliente.post("/api/simulacoes", json={"nome": "Teste", "entrada": entrada})
        self.assertEqual(salvo.status_code, 201)
        id_sim = salvo.get_json()["id"]
        self.assertEqual(len(self.cliente.get("/api/simulacoes").get_json()), 1)
        self.assertEqual(self.cliente.get(f"/api/simulacoes/{id_sim}").status_code, 200)
        self.assertEqual(self.cliente.delete(f"/api/simulacoes/{id_sim}").status_code, 200)
        self.assertEqual(self.cliente.get("/api/simulacoes").get_json(), [])

    def test_erros_de_validacao(self):
        self.assertEqual(self.cliente.post("/api/simular", json={"carros": {}, "km_mes": 1000}).status_code, 400)
        r = self.cliente.post("/api/simular", json={"carros": {"combustao": {"id": 1}}, "km_mes": "abc"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("km por mês", r.get_json()["erro"])


if __name__ == "__main__":
    unittest.main()
