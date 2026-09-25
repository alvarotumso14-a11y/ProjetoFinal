document.querySelectorAll(".faq-pergunta").forEach((botao) => {
    botao.addEventListener("click", () => {
        const resposta = document.getElementById(botao.getAttribute("aria-controls"));
        const item = botao.closest(".faq-item");
        const aberto = botao.getAttribute("aria-expanded") === "true";
        botao.setAttribute("aria-expanded", String(!aberto));
        resposta.hidden = aberto;
        item.classList.toggle("aberto", !aberto);
    });
});
