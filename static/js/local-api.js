/* ===== Versão sem servidor =====
 * Esta parte substitui o back-end (Flask + SQLite) para o site abrir direto no navegador.
 * As contas são as mesmas do calculo.py. As simulações salvas ficam no navegador (localStorage).
 */
const LocalApi = (() => {
  const CATALOGO = __CATALOGO__;
  const PRECOS = __PRECOS__;
  const CHAVE = "turbo-e-taxa:simulacoes";
  const ORDEM = ["combustao", "hibrido", "eletrico"];
  const r2 = (n) => Math.round(n * 100) / 100;

  function falha(msg) { const e = new Error(msg); e.validacao = true; throw e; }

  function numero(valor, nome, minimo, maximo) {
    const n = parseFloat(String(valor ?? "").replace(",", "."));
    if (Number.isNaN(n)) falha(`O campo '${nome}' precisa ser um número.`);
    if (minimo != null && n < minimo) falha(`O campo '${nome}' precisa ser no mínimo ${minimo}.`);
    if (maximo != null && n > maximo) falha(`O campo '${nome}' precisa ser no máximo ${maximo}.`);
    return n;
  }

  const valorNoAno = (preco, dep, ano) => preco * Math.pow(1 - dep, ano);

  function calcularCarro(carro, uso, precos) {
    const anos = uso.anos, kmAno = uso.km_mes * 12, cidade = uso.pct_cidade / 100, estrada = 1 - cidade;
    let energiaAno, precoUnidade, unidade;
    if (carro.tipo === "eletrico") {
      const kwh = (kmAno * cidade) / carro.consumo_cidade + (kmAno * estrada) / carro.consumo_estrada;
      precoUnidade = uso.recarga === "publico" ? precos.kwh_publico : precos.kwh;
      energiaAno = kwh * precoUnidade; unidade = "kWh";
    } else {
      const etanol = uso.combustivel === "etanol" && carro.consumo_etanol_cidade && carro.consumo_etanol_estrada;
      const cc = etanol ? carro.consumo_etanol_cidade : carro.consumo_cidade;
      const ce = etanol ? carro.consumo_etanol_estrada : carro.consumo_estrada;
      precoUnidade = etanol ? precos.etanol : precos.gasolina;
      energiaAno = ((kmAno * cidade) / cc + (kmAno * estrada) / ce) * precoUnidade; unidade = "litro";
    }
    const manutAno = carro.manutencao_anual * Math.max(0.5, kmAno / 15000);
    const seguroAno = carro.seguro_anual;
    let ipva = 0;
    for (let n = 0; n < anos; n++) ipva += precos.aliquota_ipva * valorNoAno(carro.preco, carro.depreciacao_anual, n);
    const gastoAcumulado = [r2(carro.preco)];
    for (let n = 0; n < anos; n++) {
      const ipvaAno = precos.aliquota_ipva * valorNoAno(carro.preco, carro.depreciacao_anual, n);
      gastoAcumulado.push(r2(gastoAcumulado[n] + energiaAno + manutAno + seguroAno + ipvaAno));
    }
    const valorFinal = valorNoAno(carro.preco, carro.depreciacao_anual, anos);
    const desval = carro.preco - valorFinal;
    const total = desval + energiaAno * anos + manutAno * anos + seguroAno * anos + ipva;
    const usoAno = energiaAno + manutAno + seguroAno + ipva / anos;
    return {
      carro, unidade_energia: unidade, preco_unidade: r2(precoUnidade),
      custos: { desvalorizacao: r2(desval), energia: r2(energiaAno * anos), manutencao: r2(manutAno * anos), seguro: r2(seguroAno * anos), ipva: r2(ipva) },
      total: r2(total), valor_revenda: r2(valorFinal), custo_mes: r2(usoAno / 12),
      custo_km: kmAno ? r2(energiaAno / kmAno) : 0, custo_uso_ano: r2(usoAno), km_total: kmAno * anos, gasto_acumulado: gastoAcumulado,
    };
  }

  function payback(r, ref) {
    if (r === ref) return { situacao: "referencia" };
    const dif = r.carro.preco - ref.carro.preco;
    const eco = ref.custo_uso_ano - r.custo_uso_ano;
    if (eco <= 0) return { situacao: "nunca" };
    if (dif <= 0) return { situacao: "imediato" };
    return { situacao: "anos", meses: Math.max(1, Math.round((dif / eco) * 12)) };
  }

  function sugerir(tipo, alvo) {
    const opcoes = CATALOGO.filter((c) => c.tipo === tipo);
    return opcoes.length ? opcoes.reduce((a, b) => (Math.abs(b.preco - alvo) < Math.abs(a.preco - alvo) ? b : a)) : null;
  }

  function montarEntrada(d) {
    const uso = {
      km_mes: numero(d.km_mes, "km por mês", 1, 20000),
      pct_cidade: numero(d.pct_cidade ?? 60, "% na cidade", 0, 100),
      anos: Math.trunc(numero(d.anos ?? 5, "anos", 1, 15)),
      recarga: d.recarga || "casa",
      combustivel: d.combustivel || "gasolina",
    };
    const p = d.precos || {};
    const precos = {
      gasolina: numero(p.gasolina ?? PRECOS.gasolina, "preço da gasolina", 0.01),
      etanol: numero(p.etanol ?? PRECOS.etanol, "preço do etanol", 0.01),
      kwh: numero(p.kwh ?? PRECOS.kwh, "preço do kWh", 0.01),
      kwh_publico: numero(p.kwh_publico ?? PRECOS.kwh_publico, "preço do kWh público", 0.01),
      aliquota_ipva: PRECOS.aliquota_ipva,
    };
    const escolhidos = {};
    ORDEM.forEach((tipo) => {
      const info = (d.carros || {})[tipo];
      if (!info || !info.id) { escolhidos[tipo] = null; return; }
      const v = CATALOGO.find((c) => String(c.id) === String(info.id));
      if (!v) falha("Um dos carros escolhidos não existe no catálogo.");
      const carro = { ...v };
      ["preco", "consumo_cidade", "consumo_estrada"].forEach((k) => {
        if (info[k] !== undefined && info[k] !== null && info[k] !== "") carro[k] = numero(info[k], k, 0.1);
      });
      escolhidos[tipo] = carro;
    });
    if (!Object.values(escolhidos).some(Boolean)) falha("Escolha pelo menos um carro para comparar.");
    return { escolhidos, uso, precos };
  }

  function comparar(d) {
    const { escolhidos, uso, precos } = montarEntrada(d);
    const refCarro = ORDEM.map((t) => escolhidos[t]).find(Boolean);
    const resultados = {};
    ORDEM.forEach((tipo) => {
      const c = escolhidos[tipo] ? { ...escolhidos[tipo], sugerido: false }
        : (() => { const s = sugerir(tipo, refCarro.preco); return s ? { ...s, sugerido: true } : null; })();
      if (c) resultados[tipo] = calcularCarro(c, uso, precos);
    });
    const tipoRef = ORDEM.find((t) => resultados[t] && resultados[t].carro.id === refCarro.id);
    const ref = resultados[tipoRef];
    Object.values(resultados).forEach((r) => { r.payback = payback(r, ref); r.eh_referencia = r === ref; });
    const maisBarato = Object.keys(resultados).reduce((a, b) => (resultados[b].total < resultados[a].total ? b : a));
    return {
      uso, precos, resultados, mais_barato: maisBarato, referencia: tipoRef,
      economia_vs_referencia: r2(ref.total - resultados[maisBarato].total),
      economia_mes_vs_referencia: r2(ref.custo_mes - resultados[maisBarato].custo_mes),
    };
  }

  function lerSalvas() { try { return JSON.parse(localStorage.getItem(CHAVE)) || []; } catch { return []; } }
  function gravarSalvas(lista) {
    try { localStorage.setItem(CHAVE, JSON.stringify(lista)); }
    catch { falha("Este navegador não deixou salvar. Tente abrir o arquivo no Chrome ou no Edge."); }
  }
  const agora = () => { const d = new Date(), z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; };

  // Mesmos endereços da API do Flask, para o resto do site não mudar
  async function requisitar(caminho, opcoes = {}) {
    const metodo = (opcoes.method || "GET").toUpperCase();
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : {};
    const [rota, query] = caminho.split("?");
    const params = new URLSearchParams(query || "");

    if (rota === "/api/precos") return { ...PRECOS };
    if (rota === "/api/veiculos") {
      const tipo = params.get("tipo"), busca = (params.get("busca") || "").toLowerCase();
      return CATALOGO.filter((c) => (!tipo || c.tipo === tipo) && (!busca || `${c.marca} ${c.modelo}`.toLowerCase().includes(busca)))
        .sort((a, b) => `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`));
    }
    if (rota === "/api/simular" && metodo === "POST") return comparar(corpo);
    if (rota === "/api/simulacoes" && metodo === "GET") {
      return lerSalvas().slice().reverse().map((s) => {
        const m = s.resultado.resultados[s.resultado.mais_barato].carro;
        return { id: s.id, nome: s.nome, criada_em: s.criada_em, mais_barato: `${m.marca} ${m.modelo}`, economia: s.resultado.economia_vs_referencia };
      });
    }
    if (rota === "/api/simulacoes" && metodo === "POST") {
      const nome = (corpo.nome || "").trim() || "Simulação sem nome";
      if (nome.length > 80) falha("O nome pode ter no máximo 80 letras.");
      const resultado = comparar(corpo.entrada || {});
      const lista = lerSalvas();
      const id = lista.reduce((m, s) => Math.max(m, s.id), 0) + 1;
      lista.push({ id, nome, criada_em: agora(), entrada: corpo.entrada, resultado });
      gravarSalvas(lista);
      return { id, nome };
    }
    const m = rota.match(/^\/api\/simulacoes\/(\d+)$/);
    if (m) {
      const id = Number(m[1]), lista = lerSalvas(), sim = lista.find((s) => s.id === id);
      if (!sim) falha("Simulação não encontrada.");
      if (metodo === "DELETE") { gravarSalvas(lista.filter((s) => s.id !== id)); return { apagada: true }; }
      return sim;
    }
    falha("Endereço não encontrado.");
  }

  return { requisitar };
})();
