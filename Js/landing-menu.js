document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".landing-nav");
    const toggle = document.querySelector(".landing-menu-toggle");
    const menu = document.querySelector(".landing-nav-actions");

    if (!nav || !toggle || !menu) {
        return;
    }

    const setMenuState = (isOpen) => {
        nav.classList.toggle("menu-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    };

    toggle.addEventListener("click", () => {
        setMenuState(!nav.classList.contains("menu-open"));
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuState(false);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            setMenuState(false);
        }
    });
});
