// preview.js

// ------------------------
// Estado local do preview
// ------------------------
let nomes = [];
let indiceAtual = 0;
let templateModelo = ""; // texto vindo do textarea

// Canvas do preview
const previewCanvas = document.getElementById("a4");
const previewCtx = previewCanvas.getContext("2d");

// ------------------------
// Textarea: modelo de texto
// ------------------------
const txtModelo = document.getElementById("modeloTexto");
templateModelo = txtModelo.value.trim(); // usa o que já tiver no textarea
txtModelo.addEventListener("input", () => {
    templateModelo = txtModelo.value.trim();
    desenhar();
});

// ------------------------
// Carregamento da lista .txt
// ------------------------
const inputTxt = document.getElementById("arquivoTxt");
const btnTxt = document.getElementById("btn-txt");

btnTxt.addEventListener("click", () => inputTxt.click());

inputTxt.addEventListener("change", async () => {
    if (!inputTxt.files.length) return;
    const arquivo = inputTxt.files[0];
    btnTxt.textContent = "Arquivo: " + arquivo.name;
    const conteudo = await arquivo.text();
    nomes = conteudo.split(",").map(n => n.trim()).filter(Boolean);
    indiceAtual = 0;
    desenhar();
});

// ------------------------
// Próximo nome (se quiser usar)
// ------------------------
function prevNome() {
    if (!nomes.length) return;
    indiceAtual = (indiceAtual + 1) % nomes.length;
    desenhar();
}

// ------------------------
// Redesenhar Preview
// ------------------------
function desenhar() {
    // precisa do fundo definido no seletor do PNG
    if (!imgFundo || !imgFundo.src) return;
    if (!previewCanvas.width || !previewCanvas.height) return;

    // limpa e redesenha o fundo no tamanho atual do canvas (preview)
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    previewCtx.drawImage(imgFundo, 0, 0, previewCanvas.width, previewCanvas.height);

    if (!nomes.length) return;
    if (!templateModelo) return;

    const nome = nomes[indiceAtual];

    // Entradas do usuário (unidades do preview)
    const posX = parseInt(document.getElementById("x").value, 10) || 0;
    const posY = parseInt(document.getElementById("y").value, 10) || 0;
    const maxWidth = parseInt(document.getElementById("w").value, 10) || 500;
    const fontSize = parseInt(document.getElementById("t").value, 10) || 16;

    // Texto final (substitui X pelo nome)
    const texto = templateModelo.replace(/X/g, nome);

    // “Runs” (trechos) com marcação de negrito para o nome
    const runs = buildRuns(texto, nome);

    // Desenha com wrap por PALAVRA, preservando o estilo do nome
    wrapWordsAndDraw(previewCtx, posX, posY, maxWidth, fontSize, runs);
}

// ------------------------
// Utilitários de desenho
// ------------------------

// Divide o texto em “runs” (trechos) que indicam se são parte do nome (bold) ou não.
function buildRuns(texto, nome) {
    if (!nome) return [{ text: texto, bold: false }];
    const re = new RegExp(`(${escapeRegExp(nome)})`, "gi");
    return texto
        .split(re)
        .filter(Boolean)
        .map(part => ({
            text: part,
            bold: part.toLowerCase() === nome.toLowerCase()
        }));
}

// Quebra por PALAVRAS respeitando a largura (W) e desenha mantendo o estilo
function wrapWordsAndDraw(ctx, x, y, maxWidth, fontSize, runs) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#000"; // cor do parágrafo

    let line = [];
    let lineWidth = 0;

    const pushLine = () => {
        let offsetX = 0;
        for (const seg of line) {
            ctx.font = `${seg.bold ? "bold " : ""}${fontSize}px Helvetica`;
            ctx.fillText(seg.text, x + offsetX, y);
            offsetX += ctx.measureText(seg.text).width;
        }
    };

    // percorre runs e quebra por palavras/espacos preservando estilo
    for (const run of runs) {
        // separa em palavras e espaços, preservando ambos
        const tokens = run.text.split(/(\s+)/); // ["palavra", " ", "outra", "   ", ...]
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const isSpace = /^\s+$/.test(token);

            // evita iniciar linha com espaço
            if (isSpace && line.length === 0) continue;

            ctx.font = `${run.bold ? "bold " : ""}${fontSize}px Helvetica`;
            const w = ctx.measureText(token).width;

            // se ultrapassa a largura e já há conteúdo na linha, quebra
            if (lineWidth + w > maxWidth && line.length > 0) {
                pushLine();
                y += fontSize * 1.4;
                line = [];
                lineWidth = 0;

                // não começa nova linha com espaços
                if (isSpace) continue;
            }

            // adiciona token à linha atual
            line.push({ text: token, bold: run.bold });
            lineWidth += w;
        }
    }

    if (line.length) {
        pushLine();
    }
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ------------------------
// Inputs X/Y/W/T atualizam o preview
// ------------------------
["x", "y", "w", "t"].forEach(id => {
    document.getElementById(id).addEventListener("input", desenhar);
});
