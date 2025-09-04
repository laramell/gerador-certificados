
const inputPng = document.getElementById("arquivoPng");
const btnSelecionarPng = document.getElementById("btn-png");
const canvasA4 = document.getElementById("a4");
const ctxA4 = canvasA4.getContext("2d");

let imgFundo = new Image();
let realWidth = 0;
let realHeight = 0;

btnSelecionarPng.addEventListener("click", () => {
    inputPng.click();
});

inputPng.addEventListener("change", () => {
    if (inputPng.files.length > 0) {
        const arquivo = inputPng.files[0];
        btnSelecionarPng.textContent = "Arquivo: " + arquivo.name;

        const url = URL.createObjectURL(arquivo);
        imgFundo = new Image();
        imgFundo.onload = () => {
            // salva dimensões reais
            realWidth = imgFundo.width;
            realHeight = imgFundo.height;

            // define um tamanho de preview proporcional (ex.: largura máxima de 900px)
            const maxPreviewWidth = 900;
            const scale = maxPreviewWidth / realWidth;
            const previewWidth = realWidth * scale;
            const previewHeight = realHeight * scale;

            // ajusta o canvas para o preview
            canvasA4.width = previewWidth;
            canvasA4.height = previewHeight;

            // desenha a imagem redimensionada
            ctxA4.drawImage(imgFundo, 0, 0, previewWidth, previewHeight);
        };
        imgFundo.src = url;
    } else {
        btnSelecionarPng.textContent = "Selecionar arquivo";
        ctxA4.clearRect(0, 0, canvasA4.width, canvasA4.height);
    }
});
