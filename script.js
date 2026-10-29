
const form = document.getElementById("formGasto");
const campoNome = document.getElementById("nome");
const campoValor = document.getElementById("valor");
const campoCategoria = document.getElementById("categoria");
const campoData = document.getElementById("data");
const filtro = document.getElementById("filtro");

const listaGastos = document.getElementById("listaGastos");
const mensagemVazia = document.getElementById("mensagemVazia");

const totalGastos = document.getElementById("totalGastos");
const quantidadeGastos = document.getElementById("quantidadeGastos");
const maiorGasto = document.getElementById("maiorGasto");
const nomeMaiorGasto = document.getElementById("nomeMaiorGasto");
const totalFiltrado = document.getElementById("totalFiltrado");

const botaoLimparTudo = document.getElementById("limparTudo");

const simbolos = {
    "Alimentação": "🍓",
    "Transporte": "🚗",
    "Lazer": "🎬",
    "Estudos": "📚",
    "Compras": "🛍️",
    "Saúde": "💊",
    "Contas": "🏠",
    "Outros": "💗"
};

function carregarGastos() {
    try {
        const dados = JSON.parse(
            localStorage.getItem("meusGastos") || "[]"
        );

        if (!Array.isArray(dados)) {
            return [];
        }

        return dados.filter(gasto =>
            gasto &&
            typeof gasto.id === "string" &&
            typeof gasto.nome === "string" &&
            Number.isFinite(gasto.valor) &&
            gasto.valor > 0 &&
            Object.hasOwn(simbolos, gasto.categoria) &&
            typeof gasto.data === "string"
        );
    } catch {
        return [];
    }
}

let gastos = carregarGastos();

function salvarGastos() {
    try {
        localStorage.setItem("meusGastos", JSON.stringify(gastos));
        return true;
    } catch {
        alert("Não foi possível salvar os dados neste navegador.");
        return false;
    }
}

function formatarDinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarData(data) {
    const partes = data.split("-");

    if (partes.length !== 3) {
        return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function atualizarTela() {
    const total = gastos.reduce((soma, gasto) => soma + gasto.valor, 0);

    totalGastos.textContent = formatarDinheiro(total);
    quantidadeGastos.textContent = gastos.length;

    if (gastos.length > 0) {
        const maior = gastos.reduce((anterior, atual) =>
            atual.valor > anterior.valor ? atual : anterior
        );

        maiorGasto.textContent = formatarDinheiro(maior.valor);
        nomeMaiorGasto.textContent = maior.nome;
    } else {
        maiorGasto.textContent = formatarDinheiro(0);
        nomeMaiorGasto.textContent = "Nenhum gasto ainda";
    }

    mostrarGastos();
}

function mostrarGastos() {
    listaGastos.replaceChildren();

    const categoriaSelecionada = filtro.value;

    const gastosExibidos = gastos
        .filter(gasto =>
            categoriaSelecionada === "Todas" ||
            gasto.categoria === categoriaSelecionada
        )
        .sort((a, b) => b.data.localeCompare(a.data));

    mensagemVazia.style.display =
        gastosExibidos.length === 0 ? "block" : "none";

    if (gastosExibidos.length === 0) {
        const titulo = mensagemVazia.querySelector("h3");
        const texto = mensagemVazia.querySelector("p");

        if (gastos.length > 0) {
            titulo.textContent = "Nenhum gasto nesta categoria";
            texto.textContent = "Experimente escolher outra categoria.";
        } else {
            titulo.textContent = "Nenhuma despesa por aqui!";
            texto.textContent = "Adicione seu primeiro gasto para começar.";
        }
    }

    let somaFiltrada = 0;

    gastosExibidos.forEach(gasto => {
        somaFiltrada += gasto.valor;

        const item = document.createElement("article");
        item.className = "gasto";

        const icone = document.createElement("div");
        icone.className = "gasto-icone";
        icone.textContent = simbolos[gasto.categoria];

        const detalhes = document.createElement("div");
        detalhes.className = "gasto-detalhes";

        const nome = document.createElement("h3");
        nome.textContent = gasto.nome;

        const info = document.createElement("p");
        info.textContent =
            `${gasto.categoria} • ${formatarData(gasto.data)}`;

        detalhes.append(nome, info);

        const valores = document.createElement("div");
        valores.className = "gasto-valor";

        const valor = document.createElement("strong");
        valor.textContent = formatarDinheiro(gasto.valor);

        const excluir = document.createElement("button");
        excluir.className = "botao-excluir";
        excluir.type = "button";
        excluir.textContent = "Excluir";
        excluir.setAttribute(
            "aria-label",
            `Excluir despesa ${gasto.nome}`
        );

        excluir.addEventListener("click", () => {
            excluirGasto(gasto.id);
        });

        valores.append(valor, excluir);
        item.append(icone, detalhes, valores);
        listaGastos.appendChild(item);
    });

    totalFiltrado.textContent = formatarDinheiro(somaFiltrada);
}

form.addEventListener("submit", evento => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const valor = Number(campoValor.value);
    const categoria = campoCategoria.value;
    const data = campoData.value;

    if (!nome) {
        alert("Digite o nome da despesa.");
        campoNome.focus();
        return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
        alert("Digite um valor maior que zero.");
        campoValor.focus();
        return;
    }

    if (!Object.hasOwn(simbolos, categoria)) {
        alert("Escolha uma categoria válida.");
        return;
    }

    if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        alert("Escolha uma data válida.");
        return;
    }

    const novaDespesa = {
        id: crypto.randomUUID(),
        nome,
        valor: Math.round(valor * 100) / 100,
        categoria,
        data
    };

    gastos.push(novaDespesa);

    if (!salvarGastos()) {
        gastos.pop();
        return;
    }

    form.reset();
    definirDataAtual();
    filtro.value = "Todas";
    atualizarTela();
});

function excluirGasto(id) {
    const gastosAnteriores = gastos;

    gastos = gastos.filter(gasto => gasto.id !== id);

    if (!salvarGastos()) {
        gastos = gastosAnteriores;
        return;
    }

    atualizarTela();
}

botaoLimparTudo.addEventListener("click", () => {
    if (gastos.length === 0) {
        alert("Não existem despesas para excluir.");
        return;
    }

    const confirmar = confirm(
        "Tem certeza que deseja excluir todas as despesas? Essa ação não pode ser desfeita."
    );

    if (!confirmar) {
        return;
    }

    const gastosAnteriores = gastos;
    gastos = [];

    if (!salvarGastos()) {
        gastos = gastosAnteriores;
        return;
    }

    atualizarTela();
});

filtro.addEventListener("change", mostrarGastos);

function definirDataAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    campoData.value = `${ano}-${mes}-${dia}`;
}

definirDataAtual();
atualizarTela();
