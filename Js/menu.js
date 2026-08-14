document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.getElementById("menuOverlay");
    const toggles = document.querySelectorAll(".menu-toggle");
    const navLinks = document.querySelectorAll(".sidebar a");

    if (!sidebar) {
        return;
    }

    function setMenuState(isOpen) {
        sidebar.classList.toggle("open", isOpen);
        overlay?.classList.toggle("active", isOpen);
        document.body.classList.toggle("menu-open", isOpen);

        toggles.forEach((toggle) => {
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    function abrirMenu() {
        setMenuState(true);
    }

    function fecharMenu() {
        setMenuState(false);
    }

    toggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("open");
            if (isOpen) {
                fecharMenu();
            } else {
                abrirMenu();
            }
        });
    });

    overlay?.addEventListener("click", fecharMenu);

    navLinks.forEach((link) => {
        link.addEventListener("click", fecharMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            fecharMenu();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            fecharMenu();
        }
    });
});
