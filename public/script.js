let sacola = JSON.parse(localStorage.getItem("sacolaDePietri")) || {};
let produtosGerais = [];
let paginaAtual = 0;
const itensPorPagina = 9; // Trava 3 colunas x 3 linhas


async function carregarProdutos() {
    try {
        const resposta = await fetch('/api/produtos?t=' + new Date().getTime());
        produtosGerais = await resposta.json();
        renderizarVitrine();
    } catch (erro) {
        console.error("Erro ao carregar vitrine:", erro);
    }
}

// Renderizar a Vitrine 
function renderizarVitrine() {
    const vitrine = document.querySelector('.vitrine');
    if (!vitrine) return;

    vitrine.innerHTML = ''; 

    // Calcula baseando-se na página
    const inicio = paginaAtual * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const produtosExibidos = produtosGerais.slice(inicio, fim);

    produtosExibidos.forEach(p => {
        vitrine.innerHTML += `
            <article class="produto">
                <img src="${p.imagem_url}?t=${new Date().getTime()}" alt="${p.nome}">
                <h3>${p.nome}</h3>
                <strong>R$ ${p.preco.toFixed(2).replace('.', ',')}</strong>
                <div class="opcoes">
                    <label>Tamanho</label>
                    <select id="tamanho-${p.id}">
                        ${p.tamanhos.split(',').map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="controle-quantidade">
                    <button onclick="removerDoCarrinho(${p.id})">-</button>
                    <span id="qtd-produto-${p.id}" class="qtd-item">0</span>
                    <button onclick="adicionarAoCarrinho(${p.id})">+</button>
                </div>
            </article>
        `;
    });
    
    atualizarTudo();
}

// Funções de Navegação (Setas)
function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(produtosGerais.length / itensPorPagina);
    paginaAtual += direcao;

    if (paginaAtual >= totalPaginas) paginaAtual = 0;
    if (paginaAtual < 0) paginaAtual = totalPaginas - 1;

    renderizarVitrine();
}

// Funções do Carrinho
function adicionarAoCarrinho(id) {
    let selectTamanho = document.getElementById("tamanho-" + id);
    if (!selectTamanho) return;
    
    let chaveUnica = id + "-" + selectTamanho.value;
    sacola[chaveUnica] = (sacola[chaveUnica] || 0) + 1;
    
    salvarEAtualizar();
}

function removerDoCarrinho(idOuChave) {
    let chave = idOuChave.toString();
    if (!chave.includes("-")) {
        let selectTamanho = document.getElementById("tamanho-" + idOuChave);
        if (selectTamanho) chave = idOuChave + "-" + selectTamanho.value;
    }

    if (sacola[chave] && sacola[chave] > 0) {
        sacola[chave] -= 1;
        if (sacola[chave] === 0) delete sacola[chave];
        salvarEAtualizar();
    }
}

function salvarEAtualizar() {
    localStorage.setItem("sacolaDePietri", JSON.stringify(sacola));
    window.dispatchEvent(new Event('storage')); 
    atualizarTudo();
}

function atualizarTudo() {
    let totalGeral = 0;
    document.querySelectorAll(".qtd-item").forEach(span => {
        let idProduto = span.id.replace("qtd-produto-", "");
        let somaModelo = 0;
        for (let chave in sacola) {
            if (chave.startsWith(idProduto + "-")) somaModelo += sacola[chave];
        }
        span.innerText = somaModelo;
    });
    for (let chave in sacola) totalGeral += sacola[chave];
    let contador = document.getElementById("cart-count");
    if (contador) contador.innerText = totalGeral;
}

// Eventos de Inicialização e Automáticos
document.addEventListener("DOMContentLoaded", carregarProdutos);

window.addEventListener('focus', carregarProdutos);

// Timer para trocar de página a cada 1 minuto (60000ms)
setInterval(() => {
    mudarPagina(1);
}, 120000);