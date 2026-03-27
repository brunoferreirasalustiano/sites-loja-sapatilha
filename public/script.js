let sacola = JSON.parse(localStorage.getItem("sacolaDePietri")) || {};
let produtosGerais = [];
let paginaAtual = 0;
const itensPorPagina = 9; 

async function carregarProdutos() {
    try {
        const resposta = await fetch('/api/produtos?t=' + new Date().getTime());
        produtosGerais = await resposta.json();
        renderizarVitrine();
    } catch (erro) {
        console.error("Erro ao carregar vitrine:", erro);
    }
}

function renderizarVitrine() {
    const vitrine = document.querySelector('.vitrine');
    if (!vitrine) return;

    vitrine.innerHTML = ''; 

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


function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(produtosGerais.length / itensPorPagina);
    paginaAtual += direcao;
    if (paginaAtual >= totalPaginas) paginaAtual = 0;
    if (paginaAtual < 0) paginaAtual = totalPaginas - 1;
    renderizarVitrine();
}

// --- FUNÇÕES DA SACOLA ---

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

// ITEM 2: Função para excluir o item INTEIRO (lixeira)
function excluirItemTotal(chave) {
    if (confirm("Remover este item da sacola?")) {
        delete sacola[chave];
        salvarEAtualizar();
        // Se existir a função de listar o checkout, ela é chamada aqui
        if (typeof exibirCheckout === 'function') exibirCheckout(); 
    }
}

// ITEM 2: Função para limpar a sacola toda
function limparSacola() {
    if (confirm("Deseja limpar toda a sua sacola?")) {
        sacola = {};
        salvarEAtualizar();
        if (typeof exibirCheckout === 'function') exibirCheckout();
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

// --- EVENTOS ---

document.addEventListener("DOMContentLoaded", carregarProdutos);
window.addEventListener('focus', carregarProdutos);

setInterval(() => {
    mudarPagina(1);
}, 120000);

// ITEM 1: Zoom no clique
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'IMG' && e.target.closest('.produto')) {
        const img = e.target;
        if (img.classList.contains('img-zoom-clicada')) {
            img.classList.remove('img-zoom-clicada');
            img.style.cursor = 'zoom-in';
        } else {
            document.querySelectorAll('.img-zoom-clicada').forEach(el => el.classList.remove('img-zoom-clicada'));
            img.classList.add('img-zoom-clicada');
            img.style.cursor = 'zoom-out';
        }
    }
});