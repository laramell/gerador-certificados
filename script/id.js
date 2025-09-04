// SHA-256 em ArrayBuffer
async function sha256(buffer) {
    return await crypto.subtle.digest("SHA-256", buffer);
}

// Converte ArrayBuffer -> Base64 URL-safe (sem = + /)
function toBase64Url(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    // btoa -> Base64; depois normaliza para URL-safe
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Gera um código curto (12 chars) a partir de uma "semente".
 * A semente já inclui timestamp, contador e aleatório para reduzir ainda mais
 * a chance de colisão mesmo sem banco.
 */
export async function gerarCodigoCurto(seed = "") {
    // pedaços para entropia: timestamp, contador pseudo (rand) e seed externa
    const ts = Date.now().toString(36);
    const rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    const material = `${seed}|${ts}|${rand}`;

    const enc = new TextEncoder();
    const hashBuf = await sha256(enc.encode(material));
    const b64url = toBase64Url(hashBuf);

    // 12 caracteres: suficientemente curto e ainda muito seguro contra colisões
    return b64url.slice(0, 12);
}

/**
 * Gera N códigos únicos (12 chars) em um único pedido.
 * Garante unicidade **dentro do lote** usando um Set.
 * @param {number} n - quantidade de códigos
 * @param {string} [seedGlobal=""] - semente opcional para todo o lote (ex.: nome do evento)
 * @returns {Promise<string[]>}
 */
export async function gerarCodigosUnicos(n, seedGlobal = "") {
    const unicos = new Set();
    // contador para variar ainda mais o material de hash
    let counter = 0;

    while (unicos.size < n) {
        const code = await gerarCodigoCurto(`${seedGlobal}|${counter}`);
        unicos.add(code);
        counter++;
    }
    return Array.from(unicos);
}

