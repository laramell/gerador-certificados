
    (function () {
    // px necessários para 1 "passo"
    const PX_PER_STEP = 5;

    document.querySelectorAll('.box-input-number').forEach(box => {
    const label = box.querySelector('.drag-label');
    const input = box.querySelector('.drag-number');

    if (!label || !input) return;

    let dragging = false;
    let startX = 0;
    let startValue = 0;

    const step = parseFloat(label.dataset.step || '1');
    const min  = label.dataset.min !== undefined ? parseFloat(label.dataset.min) : -Infinity;
    const max  = label.dataset.max !== undefined ? parseFloat(label.dataset.max) :  Infinity;
    const decimals = (step.toString().split('.')[1] || '').length;

    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

    label.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    startValue = parseFloat(input.value) || 0;
    document.body.style.cursor = 'ew-resize';
    label.classList.add('dragging');
    e.preventDefault(); // evita seleção de texto
});

    const onMouseMove = (e) => {
    if (!dragging) return;

    const deltaX = e.clientX - startX;

    // modificadores de velocidade (opcional, estilo Figma)
    // Shift = grosso (x10), Alt/Option = fino (x0.1)
    let factor = 1;
    if (e.shiftKey) factor = 10;
    if (e.altKey || e.metaKey) factor = 0.1;

    const steps = (deltaX / PX_PER_STEP) * factor; // quantos "steps" pelo deslocamento
    let value = startValue + steps * step;

    value = clamp(value, min, max);

    // mantém casas decimais coerentes com o step
    input.value = decimals ? value.toFixed(decimals) : Math.round(value);
};

    const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    document.body.style.cursor = '';
    label.classList.remove('dragging');
    // dispara evento de change/input p/ quem escuta mudanças
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
};

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // bônus: rolar sobre a label também ajusta
    label.addEventListener('wheel', (e) => {
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    let cur = parseFloat(input.value) || 0;
    let factor = e.shiftKey ? 10 : (e.altKey || e.metaKey ? 0.1 : 1);
    cur = clamp(cur + dir * step * factor, min, max);
    input.value = decimals ? cur.toFixed(decimals) : Math.round(cur);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
});
});
})();

