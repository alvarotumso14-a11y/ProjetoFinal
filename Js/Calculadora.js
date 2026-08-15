function calcularInsulina() {
    const hgt = parseFloat(document.getElementById('hgt').value);
    const resultado = document.getElementById('resultado');

    if (isNaN(hgt) || hgt <= 0) {
        resultado.textContent = "Por favor, insira um valor válido para o HGT.";
        resultado.style.color = "red";
        return;
    }

    // Fórmula para cálculo de insulina
    let insulina = 0;
    if (hgt > 180) {
        insulina = (hgt - 100) / 30; // Exemplo de cálculo
    } else {
        insulina = 0; // Não é necessário insulina
    }

    resultado.style.color = "#0d9e6e"; // Verde para resultado positivo
    resultado.textContent = `A quantidade de insulina recomendada é: ${insulina.toFixed(1)} unidades.`;
}