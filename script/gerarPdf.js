// gerar-pdfs.js
import { gerarCodigosUnicos } from "./id.js";

document.getElementById("btnpdf").addEventListener("click", gerarPDFs);

async function gerarPDFs() {

    // um ID por certificado (seed opcional, ex.: nome do evento)
    const codigos = await gerarCodigosUnicos(nomes.length, "certificados");


    if (!imgFundo || !imgFundo.src) {
        alert("Selecione o PNG do certificado antes de gerar.");
        return;
    }
    if (!Array.isArray(nomes) || nomes.length === 0) {
        alert("Carregue a lista de nomes (.txt) antes de gerar.");
        return;
    }
    if (!templateModelo || !templateModelo.trim()) {
        alert("Digite o texto do certificado no campo de modelo (use X para o nome).");
        return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Erro: jsPDF não foi carregado.");
        return;
    }

    const jsPDF = window.jspdf.jsPDF;

    // --- valores do preview ---
    const posX_preview = parseFloat(document.getElementById("x").value) || 0;
    const posY_preview = parseFloat(document.getElementById("y").value) || 0;
    const maxW_preview = parseFloat(document.getElementById("w").value) || 500;
    const font_preview = parseFloat(document.getElementById("t").value) || 16;

    const previewCanvas = document.getElementById("a4");
    const previewCtx = previewCanvas.getContext("2d");
    const scale = previewCanvas.width / realWidth;

    const xReal = posX_preview / scale;
    const yReal = posY_preview / scale;
    const maxWReal = maxW_preview / scale;
    const fontRealBase = font_preview / scale;

    // --- calibração de fonte (igual você já tem) ---
    const sample = "AaBbCcDdEeFf GgHhIiJjKk LlMmNnOoPp QqRrSsTtUu VvWwXxYyZz 0123456789";

    previewCtx.textBaseline = "alphabetic";
    previewCtx.font = `${font_preview}px Helvetica`;
    const wCanvasNormal_prev = previewCtx.measureText(sample).width;
    previewCtx.font = `bold ${font_preview}px Helvetica`;
    const wCanvasBold_prev = previewCtx.measureText(sample).width;

    const probe = new jsPDF({ unit: "px", format: [realWidth, realHeight] });
    probe.setFont("helvetica", "normal");
    probe.setFontSize(fontRealBase);
    const wPdfNormal = probe.getTextWidth(sample);
    probe.setFont("helvetica", "bold");
    probe.setFontSize(fontRealBase);
    const wPdfBold = probe.getTextWidth(sample);

    const factorNormal = (wCanvasNormal_prev / scale) / (wPdfNormal || 1);
    const factorBold   = (wCanvasBold_prev   / scale) / (wPdfBold   || 1);

    const fontRealNormal = fontRealBase * factorNormal;
    const fontRealBold   = fontRealBase * factorBold;

    // --- altura de linha vinda do canvas + ajuste manual ---
    const lhCanvasNormal = measureCanvasLineHeight(previewCtx, font_preview, false);
    const lhCanvasBold   = measureCanvasLineHeight(previewCtx, font_preview, true);
    const lhCanvas = Math.max(lhCanvasNormal, lhCanvasBold);

    const LINE_HEIGHT_FACTOR = 1.50; // seu ajuste manual
    const lineHeightReal = (lhCanvas / scale) * LINE_HEIGHT_FACTOR;

    const landscape = realWidth >= realHeight ? "landscape" : "portrait";
    const color = { r: 0, g: 0, b: 0 };

    // === NOVO: preparar o ZIP ===
    const zip = new JSZip();

    for (let i = 0; i < nomes.length; i++) {
        const nome = nomes[i];
        const codigo = codigos[i];

        const doc = new jsPDF({
            unit: "px",
            format: [realWidth, realHeight],
            orientation: landscape,
            compress: true
        });

        // fundo + texto (tudo igual ao seu código atual)
        doc.addImage(imgFundo, "PNG", 0, 0, realWidth, realHeight);

        const texto = templateModelo.replace(/X/g, nome);
        const runs = buildRuns(texto, nome);

        wrapWordsAndDrawPDF(
            doc,
            xReal,
            yReal,
            maxWReal,
            fontRealNormal,
            fontRealBold,
            lineHeightReal,
            runs,
            color
        );

        // >>> desenhar ID no canto inferior esquerdo (preto, 10pt)
        const margin = 24;                 // margem visual em px
        doc.setFont("helvetica", "normal");
        doc.setFontSize(40);               // 10pt conforme pedido
        doc.setTextColor(0, 0, 0);         // preto
        doc.text(`${codigo}`, margin, realHeight - margin);

        // ZIP (como você já implementou)
        const safeName = nome
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s.-]/g, "")
            .trim();

        const pdfBlob = doc.output("blob");
        zip.file(`certificado - ${safeName}.pdf`, pdfBlob);
    }

    // === NOVO: gerar e baixar o ZIP ===
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificados.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* helpers que você já tem (mantidos iguais) */
function measureCanvasLineHeight(ctx, fontPx, bold) {
    ctx.save();
    ctx.font = `${bold ? "bold " : ""}${fontPx}px Helvetica`;
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText("Mg");
    const ascent  = m.actualBoundingBoxAscent  ?? fontPx * 0.8;
    const descent = m.actualBoundingBoxDescent ?? fontPx * 0.2;
    ctx.restore();
    return ascent + descent;
}
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildRuns(texto, nome) {
    if (!nome) return [{ text: texto, bold: false }];
    const re = new RegExp(`(${escapeRegExp(nome)})`, "gi");
    return texto.split(re).filter(Boolean).map(part => ({
        text: part,
        bold: part.toLowerCase() === nome.toLowerCase()
    }));
}
function measureTokenPDF(doc, text, fNorm, fBold, isBold) {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? fBold : fNorm);
    return doc.getTextWidth(text);
}
function wrapWordsAndDrawPDF(doc, x, y, maxWidth, fNorm, fBold, lineHeight, runs, color) {
    let line = [], lineWidth = 0;
    const pushLine = () => {
        let offsetX = 0;
        for (const seg of line) {
            doc.setFont("helvetica", seg.bold ? "bold" : "normal");
            doc.setFontSize(seg.bold ? fBold : fNorm);
            doc.setTextColor(color.r, color.g, color.b);
            doc.text(seg.text, x + offsetX, y);
            offsetX += measureTokenPDF(doc, seg.text, fNorm, fBold, seg.bold);
        }
    };
    for (const run of runs) {
        const tokens = run.text.split(/(\s+)/);
        for (const token of tokens) {
            const isSpace = /^\s+$/.test(token);
            if (isSpace && line.length === 0) continue;
            const w = measureTokenPDF(doc, token, fNorm, fBold, run.bold);
            if (lineWidth + w > maxWidth && line.length > 0) {
                pushLine();
                y += lineHeight;
                line = []; lineWidth = 0;
                if (isSpace) continue;
            }
            line.push({ text: token, bold: run.bold });
            lineWidth += w;
        }
    }
    if (line.length) pushLine();
}
