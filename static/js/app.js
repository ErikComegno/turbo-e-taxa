/* Turbo e Taxa · front-end
 * Conversa com o back-end (Flask) pela API em /api/...
 */

const TIPOS = ["combustao", "hibrido", "eletrico"];
const NOME_TIPO = { combustao: "Combustão", hibrido: "Híbrido", eletrico: "Elétrico" };
const ICONE_TIPO = { combustao: "bomba", hibrido: "folha", eletrico: "raio" };
const TRACO_TIPO = { combustao: "", hibrido: "10 6", eletrico: "2 6" }; // linhas diferentes no gráfico, não só a cor

// ---------- Ícones (traço simples, herdam a cor do texto) ----------
const ICONES = {
  carro: '<path d="M5 16h14M3 16v-3l2-5h14l2 5v3"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
  estrada: '<path d="M4 20 9 4M20 20 15 4M12 6v2M12 11v2M12 16v2"/>',
  bomba: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h12M4 10h10M14 8h2l3 3v7a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
  raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  folha: '<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>',
  moeda: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  grafico: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  velocimetro: '<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/>',
  cronometro: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bateria: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2M6 11v2M10 11v2"/>',
  ferramenta: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  documento: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  queda: '<path d="M3 7l6 6 4-4 8 8"/><path d="M21 11v6h-6"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menos: '<path d="M6 12h12"/>',
  trofeu: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  acessibilidade: '<circle cx="12" cy="4.5" r="1.5"/><path d="M5 8l7 1.5L19 8M12 9.5V14l-3 7M12 14l3 7"/>',
  fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
};

function icone(nome) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] || ""}</svg>`;
}

function preencherIcones(raiz = document) {
  raiz.querySelectorAll("[data-icone]:empty").forEach((el) => { el.innerHTML = icone(el.dataset.icone); });
}

const estado = {
  catalogo: { combustao: [], hibrido: [], eletrico: [] },
  escolhidos: { combustao: null, hibrido: null, eletrico: null },
  ultimaEntrada: null,
};

// ---------- Utilidades ----------

const $ = (seletor) => document.querySelector(seletor);

function escapar(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const formatoReais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const reais = (v) => formatoReais.format(v);
const reaisCentavos = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const decimal = (v) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const lerNumero = (texto) => parseFloat(String(texto).replace(",", "."));

async function api(caminho, opcoes = {}) {
  const resposta = await fetch(caminho, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Não foi possível falar com o servidor. Confira se ele está rodando.");
  return dados;
}

// ---------- Ilustração do carro (muda conforme a carroceria) ----------

const FORMAS = {
  hatch: { corpo: "M20 80 L20 64 Q22 56 32 54 L72 49 L96 31 Q102 27 110 27 L158 27 Q167 27 173 33 L194 51 L214 55 Q222 57 222 66 L222 80 Z",
           j1: "M80 50 L100 34 Q104 32 110 32 L132 32 L132 50 Z", j2: "M138 32 L157 32 Q164 32 168 37 L182 50 L138 50 Z", r: 15, rx: [64, 180] },
  sedan: { corpo: "M12 80 L12 64 Q14 57 24 56 L66 52 L92 33 Q98 29 106 29 L150 29 Q159 29 166 35 L186 52 L222 56 Q230 58 230 67 L230 80 Z",
           j1: "M76 52 L96 36 Q100 34 106 34 L126 34 L126 52 Z", j2: "M132 34 L150 34 Q157 34 161 39 L174 52 L132 52 Z", r: 15, rx: [58, 186] },
  suv:   { corpo: "M16 80 L16 58 Q18 49 28 47 L62 43 L82 22 Q87 17 95 17 L170 17 Q179 17 184 23 L203 44 L216 48 Q225 51 225 61 L225 80 Z",
           j1: "M70 44 L88 25 Q91 22 96 22 L128 22 L128 44 Z", j2: "M134 22 L168 22 Q175 22 179 27 L194 44 L134 44 Z", r: 17, rx: [62, 182] },
};

// partes do carro (sem o <svg>), para usar sozinho ou dentro de outra ilustração
function partesCarro(carroceria, tipo) {
  const f = FORMAS[carroceria] || FORMAS.hatch;
  const roda = (x) => `<circle cx="${x}" cy="81" r="${f.r}" style="fill:var(--pneu)"></circle><circle cx="${x}" cy="81" r="${Math.round(f.r / 2)}" style="fill:var(--aro)"></circle>`;
  return `<path d="${f.corpo}" style="fill:var(--cor-${tipo})"></path>
    <path d="${f.j1}" style="fill:var(--janela)" opacity=".8"></path><path d="${f.j2}" style="fill:var(--janela)" opacity=".8"></path>
    ${roda(f.rx[0])}${roda(f.rx[1])}`;
}

function desenhoCarro(carroceria, tipo, rotulo) {
  return `<svg role="img" aria-label="${escapar(rotulo)}" width="100%" height="100%" viewBox="0 0 240 110" preserveAspectRatio="xMidYMid meet">
    <line x1="8" y1="94" x2="232" y2="94" style="stroke:var(--borda)" stroke-width="2"></line>${partesCarro(carroceria, tipo)}</svg>`;
}

// ilustração do topo: os três tipos de carro, com bomba de combustível e carregador
function desenharHero() {
  const placa = (x, tipo, texto) => `
    <g transform="translate(${x} 8)">
      <rect width="150" height="36" rx="18" style="fill:var(--tag-${tipo}-fundo)"></rect>
      <g transform="translate(14 7)" style="color:var(--tag-${tipo}-texto)">${icone(ICONE_TIPO[tipo]).replace("<svg ", '<svg width="22" height="22" ')}</g>
      <text x="44" y="23" style="fill:var(--tag-${tipo}-texto);font:700 14px var(--fonte-texto)">${texto}</text>
    </g>`;
  const bomba = (x) => `<g transform="translate(${x} 118)" style="fill:var(--borda-forte)"><rect width="26" height="54" rx="4"></rect><rect x="5" y="7" width="16" height="12" rx="2" style="fill:var(--fundo)"></rect><path d="M26 16 h8 v26 a4 4 0 0 1 -8 0" fill="none" style="stroke:var(--borda-forte)" stroke-width="3"></path></g>`;
  const carregador = (x) => `<g transform="translate(${x} 112)"><rect width="24" height="60" rx="5" style="fill:var(--borda-forte)"></rect><g transform="translate(3 10)" style="color:var(--cor-eletrico)">${icone("raio").replace("<svg ", '<svg width="18" height="18" ')}</g><path d="M24 40 q14 0 14 18" fill="none" style="stroke:var(--borda-forte)" stroke-width="3"></path></g>`;
  $("#hero-ilustracao").innerHTML = `
    <svg viewBox="0 0 520 220" role="img" aria-label="Três carros lado a lado: combustão, híbrido e elétrico">
      <rect x="0" y="172" width="520" height="4" rx="2" style="fill:var(--borda)"></rect>
      ${placa(8, "combustao", "Combustão")}${placa(185, "hibrido", "Híbrido")}${placa(362, "eletrico", "Elétrico")}
      ${bomba(4)}
      <g transform="translate(40 111) scale(.64)">${partesCarro("hatch", "combustao")}</g>
      <g transform="translate(188 107) scale(.66)">${partesCarro("suv", "hibrido")}</g>
      <g transform="translate(344 111) scale(.64)">${partesCarro("hatch", "eletrico")}</g>
      ${carregador(492)}
    </svg>`;
}

// ---------- Navegação entre telas ----------

function irPara(tela) {
  ["simular", "resultado", "historico", "como"].forEach((t) => {
    $(`#tela-${t}`).hidden = t !== tela;
  });
  document.querySelectorAll(".menu-item").forEach((b) => b.classList.toggle("ativo", b.dataset.ir === tela));
  if (tela === "historico") carregarHistorico();
  window.scrollTo({ top: 0 });
}

document.addEventListener("click", (e) => {
  const alvo = e.target.closest("[data-ir]");
  if (alvo) {
    e.preventDefault();
    irPara(alvo.dataset.ir);
  }
});

// ---------- Botões de opção (anos, combustível, recarga) ----------

document.querySelectorAll(".opcoes").forEach((grupo) => {
  grupo.addEventListener("click", (e) => {
    const botao = e.target.closest(".opcao");
    if (!botao) return;
    grupo.querySelectorAll(".opcao").forEach((b) => {
      b.classList.toggle("ativa", b === botao);
      b.setAttribute("aria-pressed", b === botao);
    });
  });
});

const valorOpcao = (campo) => document.querySelector(`.opcoes[data-campo="${campo}"] .opcao.ativa`).dataset.valor;

function marcarOpcao(campo, valor) {
  document.querySelectorAll(`.opcoes[data-campo="${campo}"] .opcao`).forEach((b) => {
    b.classList.toggle("ativa", b.dataset.valor === String(valor));
  });
}

// ---------- Vagas de carro ----------

function textoOpcao(c) {
  return `${c.marca} ${c.modelo} ${c.ano} · ${reais(c.preco)}`;
}

function desenharVagas() {
  $("#vagas").innerHTML = TIPOS.map((tipo) => {
    const carro = estado.escolhidos[tipo];
    const opcoes = estado.catalogo[tipo]
      .map((c) => `<option value="${c.id}" ${carro && carro.id === c.id ? "selected" : ""}>${escapar(textoOpcao(c))}</option>`)
      .join("");
    const unidade = tipo === "eletrico" ? "km/kWh" : "km/l";

    let miolo;
    if (carro) {
      miolo = `
        <div class="previa">
          <div class="previa-img">${desenhoCarro(carro.carroceria, tipo, `Ilustração de ${carro.modelo}`)}</div>
          <div class="previa-texto">
            <strong>${escapar(carro.marca)} ${escapar(carro.modelo)}</strong>
            <span>${carro.velocidade_maxima} km/h · 0 a 100 em ${decimal(carro.aceleracao_0_100)} s</span>
            <span>Seguro médio: ${reais(carro.seguro_anual)}/ano</span>
          </div>
        </div>
        <div class="ajustes">
          <label class="campo">Preço (R$)<input type="text" inputmode="decimal" data-ajuste="preco" data-tipo="${tipo}" value="${carro.preco}"></label>
          <label class="campo">Cidade (${unidade})<input type="text" inputmode="decimal" data-ajuste="consumo_cidade" data-tipo="${tipo}" value="${decimal(carro.consumo_cidade)}"></label>
          <label class="campo">Estrada (${unidade})<input type="text" inputmode="decimal" data-ajuste="consumo_estrada" data-tipo="${tipo}" value="${decimal(carro.consumo_estrada)}"></label>
        </div>
        <p class="texto-apoio">Preço e consumo vêm do nosso catálogo. Pode corrigir para os valores do teu carro.</p>`;
    } else {
      miolo = `<div class="vaga-vazia"><div class="vaga-desenho">${desenhoCarro(tipo === "hibrido" ? "suv" : "hatch", tipo, "")}</div><strong>Deixa em branco que a gente escolhe</strong><span>Vamos buscar um ${NOME_TIPO[tipo].toLowerCase()} na mesma faixa de preço.</span></div>`;
    }

    return `
      <div class="vaga ${carro ? "preenchida" : ""}" id="vaga-${tipo}">
        <div class="vaga-topo"><span class="etiqueta ${tipo}"><span data-icone="${ICONE_TIPO[tipo]}"></span>${NOME_TIPO[tipo].toUpperCase()}</span><span class="texto-apoio">${carro ? "Escolhido" : "Opcional"}</span></div>
        <label class="campo">Modelo
          <select data-vaga="${tipo}">
            <option value="">Deixa que a gente escolhe</option>
            ${opcoes}
          </select>
        </label>
        ${miolo}
      </div>`;
  }).join("");
  preencherIcones($("#vagas"));
}

$("#vagas").addEventListener("change", (e) => {
  const select = e.target.closest("select[data-vaga]");
  if (!select) return;
  const tipo = select.dataset.vaga;
  const carro = estado.catalogo[tipo].find((c) => String(c.id) === select.value);
  estado.escolhidos[tipo] = carro ? { ...carro } : null;
  $("#erro-form").hidden = true;
  desenharVagas();
  $(`select[data-vaga="${tipo}"]`).focus();
});

// ---------- Monta o que vai para o servidor ----------

function montarEntrada() {
  const carros = {};
  TIPOS.forEach((tipo) => {
    const carro = estado.escolhidos[tipo];
    if (!carro) return;
    const ajuste = { id: carro.id };
    document.querySelectorAll(`[data-ajuste][data-tipo="${tipo}"]`).forEach((input) => {
      let valor = input.value.trim();
      // no preço, o ponto é separador de milhar (ex: 77.208,50); no consumo, aceita 13,1 ou 13.1
      if (input.dataset.ajuste === "preco") valor = valor.replace(/\./g, "");
      ajuste[input.dataset.ajuste] = valor.replace(",", ".");
    });
    carros[tipo] = ajuste;
  });

  return {
    carros,
    km_mes: $("#km_mes").value,
    pct_cidade: $("#pct_cidade").value,
    anos: valorOpcao("anos"),
    combustivel: valorOpcao("combustivel"),
    recarga: valorOpcao("recarga"),
    precos: {
      gasolina: $("#preco_gasolina").value,
      etanol: $("#preco_etanol").value,
      kwh: $("#preco_kwh").value,
      kwh_publico: $("#preco_kwh_publico").value,
    },
  };
}

function validar(entrada) {
  if (!Object.keys(entrada.carros).length) return { msg: "Escolhe pelo menos um carro no passo 1.", campo: "select[data-vaga]" };
  const km = lerNumero(entrada.km_mes);
  if (!(km > 0)) return { msg: "Informa quantos km tu roda por mês.", campo: "#km_mes" };
  const pct = lerNumero(entrada.pct_cidade);
  if (!(pct >= 0 && pct <= 100)) return { msg: "A porcentagem na cidade precisa ficar entre 0 e 100.", campo: "#pct_cidade" };
  return null;
}

$("#form-simulacao").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erroEl = $("#erro-form");
  erroEl.hidden = true;
  document.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));

  const entrada = montarEntrada();
  const problema = validar(entrada);
  if (problema) {
    erroEl.textContent = problema.msg;
    erroEl.hidden = false;
    const campo = document.querySelector(problema.campo);
    if (campo) { campo.setAttribute("aria-invalid", "true"); campo.focus(); }
    return;
  }

  const botao = $("#botao-comparar");
  botao.disabled = true;
  botao.textContent = "Calculando…";
  try {
    const resultado = await api("/api/simular", { method: "POST", body: JSON.stringify(entrada) });
    estado.ultimaEntrada = entrada;
    mostrarResultado(resultado);
  } catch (err) {
    erroEl.textContent = err.message;
    erroEl.hidden = false;
  } finally {
    botao.disabled = false;
    botao.textContent = "Comparar carros";
  }
});

// ---------- Tela de resultado ----------

function textoPayback(p) {
  if (p.situacao === "referencia") return { texto: "Referência", classe: "neutro", icone: "menos" };
  if (p.situacao === "imediato") return { texto: "Na hora", classe: "bom", icone: "check" };
  if (p.situacao === "nunca") return { texto: "Não se paga", classe: "ruim", icone: "x" };
  const anos = Math.floor(p.meses / 12);
  const meses = p.meses % 12;
  const partes = [];
  if (anos) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
  if (meses) partes.push(`${meses} ${meses === 1 ? "mês" : "meses"}`);
  const bom = p.meses <= 60;
  return { texto: partes.join(" e "), classe: bom ? "bom" : "ruim", icone: bom ? "check" : "x" };
}

function fichaTecnica(c) {
  const itens = [["velocimetro", "Velocidade máxima", `${c.velocidade_maxima} km/h`], ["cronometro", "0 a 100 km/h", `${decimal(c.aceleracao_0_100)} s`]];
  if (c.tipo === "eletrico") {
    itens.push(["raio", "Consumo", `${decimal(c.consumo_cidade)} km/kWh`], ["bateria", "Autonomia", `${c.autonomia_km} km`]);
  } else {
    itens.push(["bomba", "Consumo cidade", `${decimal(c.consumo_cidade)} km/l`], ["estrada", "Consumo estrada", `${decimal(c.consumo_estrada)} km/l`]);
  }
  itens.push(["escudo", "Seguro médio", `${reais(c.seguro_anual)}/ano`], ["queda", "Perde por ano", `${Math.round(c.depreciacao_anual * 100)}% do valor`]);
  return `<dl class="ficha">${itens.map(([ic, a, b]) => `<div><dt>${icone(ic)}${a}</dt><dd>${b}</dd></div>`).join("")}</dl>`;
}

function cartao(tipo, r, venceu, anos) {
  const c = r.carro;
  const pb = textoPayback(r.payback);
  const subtitulo = r.eh_referencia ? "Informado por ti" : c.sugerido ? "Sugerido na tua faixa de preço" : "Escolhido por ti";
  return `
    <article class="cartao ${venceu ? "vencedor" : ""}">
      ${venceu ? `<span class="selo-vencedor">${icone("trofeu")}Mais barato</span>` : ""}
      <div class="cartao-imagem">${desenhoCarro(c.carroceria, tipo, `Ilustração de ${c.modelo}`)}<small>Foto ilustrativa</small></div>
      <div class="vaga-topo">
        <span class="etiqueta ${tipo}">${icone(ICONE_TIPO[tipo])}${NOME_TIPO[tipo].toUpperCase()}</span>
        ${r.eh_referencia ? `<span class="texto-apoio">Teu carro</span>` : `<button type="button" class="link-trocar" data-trocar="${tipo}">Trocar modelo</button>`}
      </div>
      <div>
        <h3>${escapar(c.marca)} ${escapar(c.modelo)}</h3>
        <div class="cartao-sub">${subtitulo} · ${c.ano} · ${reais(c.preco)}</div>
      </div>
      ${fichaTecnica(c)}
      <div class="numeros">
        <div class="numero"><span>Custo por mês</span><strong class="${venceu ? "verde" : ""}">${reais(r.custo_mes)}</strong></div>
        <div class="numero"><span>Custo por km</span><strong class="${venceu ? "verde" : ""}">${reaisCentavos(r.custo_km)}</strong></div>
      </div>
      <div class="total-linha"><span>Total em ${anos} anos</span><strong class="${venceu ? "verde" : ""}">${reais(r.total)}</strong></div>
      <div class="payback-linha"><span>Payback</span><span class="selo ${pb.classe}">${icone(pb.icone)}${pb.texto}</span></div>
    </article>`;
}

function mostrarResultado(res) {
  const tipos = TIPOS.filter((t) => res.resultados[t]);
  const anos = res.uso.anos;
  const melhor = res.resultados[res.mais_barato];
  const ref = res.resultados[res.referencia];
  const nomeMelhor = `${melhor.carro.marca} ${melhor.carro.modelo}`;

  const recargaTexto = { casa: "recarga em casa", trabalho: "recarga no trabalho", publico: "recarga pública" }[res.uso.recarga];
  $("#resumo-uso").textContent = `${Number(res.uso.km_mes).toLocaleString("pt-BR")} km/mês, ${anos} anos, ${recargaTexto}`;

  let destaque;
  if (res.mais_barato === res.referencia) {
    destaque = `
      <section class="destaque neutro">
        <div class="destaque-icone">${icone("trofeu")}</div>
        <div class="destaque-texto">
          <h2>Teu carro já é o mais barato para esse uso</h2>
          <p>Em ${anos} anos, nenhuma das outras opções sai mais em conta que o ${escapar(nomeMelhor)}.</p>
        </div>
      </section>`;
  } else {
    const pb = textoPayback(melhor.payback);
    const fraseTempo = melhor.payback.situacao === "imediato"
      ? "Ele já custa menos na compra e gasta menos no dia a dia."
      : `A diferença de preço em relação ao teu carro se paga em ${pb.texto}.`;
    destaque = `
      <section class="destaque">
        <div class="destaque-icone">${icone(ICONE_TIPO[res.mais_barato])}</div>
        <div class="destaque-texto">
          <h2>Bah! O ${NOME_TIPO[res.mais_barato].toLowerCase()} te economiza ${reais(res.economia_vs_referencia)} em ${anos} anos</h2>
          <p>${escapar(nomeMelhor)}. ${fraseTempo}</p>
        </div>
        <div class="destaque-numero"><span>Gasta a menos por mês</span><strong>${reais(res.economia_mes_vs_referencia)}</strong></div>
      </section>`;
  }

  // barras "pra onde vai o dinheiro"
  const partes = [
    ["desvalorizacao", "Desvalorização", "var(--barra-1)"],
    ["energia", "Combustível/energia", "var(--barra-2)"],
    ["manutencao", "Manutenção", "var(--barra-3)"],
    ["ipva", "IPVA", "var(--barra-4)"],
    ["seguro", "Seguro", "var(--barra-5)"],
  ];
  const maiorTotal = Math.max(...tipos.map((t) => res.resultados[t].total));
  const barras = tipos.map((t) => {
    const r = res.resultados[t];
    const segmentos = partes.map(([chave, nome, cor]) =>
      `<div title="${nome}: ${reais(r.custos[chave])}" style="width:${(r.custos[chave] / r.total) * 100}%;background:${cor}"></div>`).join("");
    return `
      <div class="barra-item">
        <div class="barra-item-topo"><strong>${NOME_TIPO[t]} · ${escapar(r.carro.modelo)}</strong><span class="${t === res.mais_barato ? "verde" : ""}">${reais(r.total)}</span></div>
        <div class="barra" style="width:${(r.total / maiorTotal) * 100}%">${segmentos}</div>
      </div>`;
  }).join("");

  const linhas = [["Preço de compra", (r) => r.carro.preco], ...partes.map(([chave, nome]) => [nome, (r) => r.custos[chave]])];
  const tabela = `
    <table class="tabela">
      <thead><tr><th>Em ${anos} anos</th>${tipos.map((t) => `<th>${NOME_TIPO[t]}</th>`).join("")}</tr></thead>
      <tbody>
        ${linhas.map(([nome, f]) => `<tr><td>${nome}</td>${tipos.map((t) => `<td>${reais(f(res.resultados[t]))}</td>`).join("")}</tr>`).join("")}
        <tr><td>Revenda no fim</td>${tipos.map((t) => `<td>${reais(res.resultados[t].valor_revenda)}</td>`).join("")}</tr>
        <tr><td>Custo total</td>${tipos.map((t) => `<td class="${t === res.mais_barato ? "verde" : ""}">${reais(res.resultados[t].total)}</td>`).join("")}</tr>
      </tbody>
    </table>`;

  const temEletrico = Boolean(res.resultados.eletrico);
  $("#conteudo-resultado").innerHTML = `
    ${destaque}
    <div class="cartoes">${tipos.map((t) => cartao(t, res.resultados[t], t === res.mais_barato, anos)).join("")}</div>
    ${graficoAnoAAno(res, tipos)}
    <section class="bloco">
      <div class="bloco-titulo" style="justify-content:space-between">
        <h2 class="titulo-icone">${icone("moeda")}Pra onde vai o dinheiro em ${anos} anos</h2>
        <div class="barras-legenda">${partes.map(([, nome, cor]) => `<span><i style="background:${cor}"></i>${nome}</span>`).join("")}</div>
      </div>
      ${barras}
    </section>
    <section class="bloco">
      <h2 class="titulo-icone">${icone("documento")}Detalhes do cálculo</h2>
      <div class="tabela-caixa">${tabela}</div>
      <p class="texto-apoio">Combustível: ${reaisCentavos(res.precos.gasolina)} a gasolina, ${reaisCentavos(res.precos.etanol)} o etanol. Energia: ${reaisCentavos(res.uso.recarga === "publico" ? res.precos.kwh_publico : res.precos.kwh)} o kWh. Seguro é uma média estimada.</p>
    </section>
    <div class="avisos">
      ${temEletrico ? `<div class="aviso">${icone("bateria")}<div><strong>Bateria</strong><p>Costuma ter garantia de 8 anos. Fora da garantia, a troca é cara. Leva isso em conta se for ficar mais tempo com o carro.</p></div></div>` : ""}
      <div class="aviso">${icone("escudo")}<div><strong>Seguro</strong><p>Elétricos e híbridos costumam ter seguro mais caro. Faz uma cotação com teus dados para ter o valor certo.</p></div></div>
    </div>`;

  $("#msg-salvar").hidden = true;
  $("#nome_simulacao").value = "";
  document.querySelector("#tela-resultado .salvar").hidden = !estado.ultimaEntrada;
  irPara("resultado");
}

// ---------- Gráfico: quanto tu gasta ano a ano (somando a compra) ----------

function graficoAnoAAno(res, tipos) {
  const series = tipos.map((t) => ({ tipo: t, r: res.resultados[t], v: res.resultados[t].gasto_acumulado })).filter((s) => s.v);
  if (series.length < 2) return ""; // simulações antigas não têm esses dados
  const anos = res.uso.anos;
  const W = 680, H = 320, M = { e: 78, d: 150, t: 20, b: 44 };
  const todos = series.flatMap((s) => s.v);
  const passo = [10000, 20000, 25000, 50000, 100000].find((p) => (Math.max(...todos) - Math.min(...todos)) / p <= 5) || 100000;
  const yMin = Math.floor(Math.min(...todos) / passo) * passo;
  const yMax = Math.ceil(Math.max(...todos) / passo) * passo;
  const x = (ano) => M.e + (ano / anos) * (W - M.e - M.d);
  const y = (v) => H - M.b - ((v - yMin) / (yMax - yMin || 1)) * (H - M.t - M.b);
  const mil = (v) => `R$ ${Math.round(v / 1000).toLocaleString("pt-BR")} mil`;

  let grade = "";
  for (let v = yMin; v <= yMax; v += passo) {
    grade += `<line x1="${M.e}" x2="${W - M.d}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--borda)" stroke-width="1"></line>
      <text x="${M.e - 10}" y="${y(v) + 4}" text-anchor="end" style="fill:var(--texto-apoio);font:12px var(--fonte-texto)">${mil(v)}</text>`;
  }
  for (let a = 0; a <= anos; a++) {
    grade += `<text x="${x(a)}" y="${H - M.b + 22}" text-anchor="middle" style="fill:var(--texto-apoio);font:12px var(--fonte-texto)">${a === 0 ? "Compra" : `Ano ${a}`}</text>`;
  }

  // nomes no fim das linhas, afastados para não se sobreporem
  const finais = series.map((s) => ({ s, yy: y(s.v[anos]) })).sort((a, b) => a.yy - b.yy);
  for (let i = 1; i < finais.length; i++) finais[i].yy = Math.max(finais[i].yy, finais[i - 1].yy + 18);

  const linhas = series.map((s) => {
    const pontos = s.v.map((v, a) => `${x(a)},${y(v)}`).join(" ");
    return `<polyline points="${pontos}" fill="none" style="stroke:var(--cor-${s.tipo})" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${TRACO_TIPO[s.tipo]}"></polyline>
      <circle cx="${x(anos)}" cy="${y(s.v[anos])}" r="5" style="fill:var(--cor-${s.tipo})"></circle>`;
  }).join("");
  const rotulos = finais.map(({ s, yy }) =>
    `<text x="${W - M.d + 12}" y="${yy + 4}" style="fill:var(--tag-${s.tipo}-texto);font:700 13px var(--fonte-texto)">${escapar(s.r.carro.modelo.split(" ").slice(0, 2).join(" "))}</text>`).join("");

  // marca o ponto em que o mais barato começa a compensar em relação ao teu carro
  let marca = "";
  const ref = series.find((s) => s.tipo === res.referencia);
  const melhor = series.find((s) => s.tipo === res.mais_barato);
  if (ref && melhor && ref !== melhor && melhor.v[0] > ref.v[0]) {
    for (let a = 1; a <= anos; a++) {
      const antes = melhor.v[a - 1] - ref.v[a - 1], depois = melhor.v[a] - ref.v[a];
      if (antes > 0 && depois <= 0) {
        const frac = antes / (antes - depois);
        const cx = x(a - 1 + frac), cy = y(ref.v[a - 1] + (ref.v[a] - ref.v[a - 1]) * frac);
        marca = `<circle cx="${cx}" cy="${cy}" r="9" fill="none" style="stroke:var(--texto)" stroke-width="2.5"></circle>
          <text x="${cx}" y="${cy - 16}" text-anchor="middle" style="fill:var(--texto);font:700 13px var(--fonte-texto)">Aqui ele se paga</text>`;
        break;
      }
    }
  }

  const legenda = series.map((s) => `<span><svg viewBox="0 0 34 10" aria-hidden="true"><line x1="2" y1="5" x2="32" y2="5" style="stroke:var(--cor-${s.tipo})" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${TRACO_TIPO[s.tipo]}"></line></svg>${NOME_TIPO[s.tipo]} · ${escapar(s.r.carro.modelo)}</span>`).join("");
  const descricao = series.map((s) => `${NOME_TIPO[s.tipo]}: começa em ${reais(s.v[0])} e chega a ${reais(s.v[anos])}`).join("; ");

  return `
    <section class="bloco">
      <h2 class="titulo-icone">${icone("grafico")}Quanto tu gasta ano a ano</h2>
      <p class="texto-apoio">Soma o preço de compra com tudo o que tu paga a cada ano. Quando a linha de um carro mais caro cruza a do teu, ele começou a compensar.</p>
      <div class="grafico-caixa">
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de gasto acumulado. ${escapar(descricao)}">${grade}${linhas}${marca}${rotulos}</svg>
      </div>
      <div class="grafico-legenda">${legenda}</div>
    </section>`;
}

// "Trocar modelo" volta para o formulário com a vaga certa em foco
$("#conteudo-resultado").addEventListener("click", (e) => {
  const botao = e.target.closest("[data-trocar]");
  if (!botao) return;
  irPara("simular");
  const select = $(`select[data-vaga="${botao.dataset.trocar}"]`);
  select.scrollIntoView({ block: "center" });
  select.focus();
});

// ---------- Salvar ----------

$("#form-salvar").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#msg-salvar");
  try {
    const nome = $("#nome_simulacao").value;
    const salvo = await api("/api/simulacoes", { method: "POST", body: JSON.stringify({ nome, entrada: estado.ultimaEntrada }) });
    msg.textContent = `Simulação “${salvo.nome}” salva. Ela aparece em Minhas simulações.`;
    msg.className = "mensagem-ok";
  } catch (err) {
    msg.textContent = err.message;
    msg.className = "mensagem-erro";
  }
  msg.hidden = false;
});

// ---------- Histórico ----------

async function carregarHistorico() {
  const caixa = $("#lista-historico");
  caixa.innerHTML = `<p class="texto-apoio">Carregando…</p>`;
  try {
    const lista = await api("/api/simulacoes");
    if (!lista.length) {
      caixa.innerHTML = `
        <div class="bloco vazio">
          <div class="vazio-desenho">${desenhoCarro("hatch", "hibrido", "")}</div>
          <h2>Nenhuma simulação salva ainda</h2>
          <p class="texto-apoio">Faz uma comparação e clica em “Salvar simulação” no fim do resultado.</p>
          <div><button type="button" class="botao botao-principal" data-ir="simular">Fazer uma simulação</button></div>
        </div>`;
      return;
    }
    caixa.innerHTML = `<div class="historico-lista">${lista.map((s) => `
      <div class="historico-item">
        <div>
          <h2>${escapar(s.nome)}</h2>
          <p>${new Date(s.criada_em.replace(" ", "T")).toLocaleDateString("pt-BR")} · Mais barato: ${escapar(s.mais_barato)}${s.economia > 0 ? ` · economia de ${reais(s.economia)}` : ""}</p>
        </div>
        <div class="historico-acoes">
          <button type="button" class="botao botao-secundario botao-pequeno" data-abrir="${s.id}">Abrir</button>
          <button type="button" class="botao botao-secundario botao-pequeno" data-apagar="${s.id}" aria-label="Apagar ${escapar(s.nome)}">Apagar</button>
        </div>
      </div>`).join("")}</div>`;
  } catch (err) {
    caixa.innerHTML = `<p class="mensagem-erro">${escapar(err.message)}</p>`;
  }
}

$("#lista-historico").addEventListener("click", async (e) => {
  const abrir = e.target.closest("[data-abrir]");
  const apagar = e.target.closest("[data-apagar]");
  if (abrir) {
    const sim = await api(`/api/simulacoes/${abrir.dataset.abrir}`);
    preencherFormulario(sim.entrada);
    estado.ultimaEntrada = null; // já está salva
    mostrarResultado(sim.resultado);
  }
  if (apagar && confirm("Apagar esta simulação? Não dá para desfazer.")) {
    await api(`/api/simulacoes/${apagar.dataset.apagar}`, { method: "DELETE" });
    carregarHistorico();
  }
});

function preencherFormulario(entrada) {
  TIPOS.forEach((tipo) => {
    const info = entrada.carros[tipo];
    const carro = info && estado.catalogo[tipo].find((c) => String(c.id) === String(info.id));
    estado.escolhidos[tipo] = carro ? { ...carro, ...limparNumeros(info) } : null;
  });
  desenharVagas();
  $("#km_mes").value = entrada.km_mes;
  $("#pct_cidade").value = entrada.pct_cidade;
  marcarOpcao("anos", entrada.anos);
  marcarOpcao("combustivel", entrada.combustivel);
  marcarOpcao("recarga", entrada.recarga);
  $("#preco_gasolina").value = entrada.precos.gasolina;
  $("#preco_etanol").value = entrada.precos.etanol;
  $("#preco_kwh").value = entrada.precos.kwh;
  $("#preco_kwh_publico").value = entrada.precos.kwh_publico;
}

function limparNumeros(info) {
  const saida = {};
  ["preco", "consumo_cidade", "consumo_estrada"].forEach((k) => {
    const n = lerNumero(info[k]);
    if (!Number.isNaN(n)) saida[k] = n;
  });
  return saida;
}

// ---------- Acessibilidade ----------

const CHAVE_A11Y = "turbo-e-taxa:acessibilidade";
const OPCOES_A11Y = ["tema", "contraste", "texto", "cores", "fonte", "movimento"];

function lerA11y() {
  try { return JSON.parse(localStorage.getItem(CHAVE_A11Y)) || {}; } catch { return {}; }
}

function aplicarA11y(preferencias) {
  const raiz = document.documentElement;
  OPCOES_A11Y.forEach((k) => {
    if (preferencias[k]) raiz.dataset[k] = preferencias[k];
    else delete raiz.dataset[k];
    document.querySelectorAll(`[data-a11y="${k}"] .opcao`).forEach((b) => {
      const ativo = b.dataset.valor === (preferencias[k] || "");
      b.classList.toggle("ativa", ativo);
      b.setAttribute("aria-pressed", ativo);
    });
  });
  try { localStorage.setItem(CHAVE_A11Y, JSON.stringify(preferencias)); } catch { /* navegador sem armazenamento: vale só nesta visita */ }
}

function preferenciasAtuais() {
  const p = {};
  OPCOES_A11Y.forEach((k) => { if (document.documentElement.dataset[k]) p[k] = document.documentElement.dataset[k]; });
  return p;
}

const painelA11y = $("#painel-acessibilidade");
$("#abrir-acessibilidade").addEventListener("click", () => {
  aplicarA11y(preferenciasAtuais());
  painelA11y.showModal();
});
["#fechar-acessibilidade", "#concluir-acessibilidade"].forEach((s) => $(s).addEventListener("click", () => {
  painelA11y.close();
  $("#abrir-acessibilidade").focus();
}));
$("#restaurar-acessibilidade").addEventListener("click", () => aplicarA11y({}));
painelA11y.addEventListener("click", (e) => {
  const botao = e.target.closest("[data-a11y] .opcao");
  if (!botao) return;
  const p = preferenciasAtuais();
  p[botao.closest("[data-a11y]").dataset.a11y] = botao.dataset.valor;
  aplicarA11y(p);
});

// ---------- Início ----------

async function iniciar() {
  preencherIcones();
  desenharHero();
  try {
    const [precos, ...listas] = await Promise.all([
      api("/api/precos"),
      ...TIPOS.map((t) => api(`/api/veiculos?tipo=${t}`)),
    ]);
    TIPOS.forEach((t, i) => (estado.catalogo[t] = listas[i]));
    $("#preco_gasolina").value = decimal2(precos.gasolina);
    $("#preco_etanol").value = decimal2(precos.etanol);
    $("#preco_kwh").value = decimal2(precos.kwh);
    $("#preco_kwh_publico").value = decimal2(precos.kwh_publico);
    $("#texto-regiao").textContent = `Médias de ${precos.regiao} (ANP e Copel). Troca pelos valores que tu paga.`;
    desenharVagas();
  } catch (err) {
    $("#erro-form").textContent = err.message;
    $("#erro-form").hidden = false;
  }
}

function decimal2(v) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

iniciar();
