/* ===========================================
   DATARIOT DOCS — Interactivity
   =========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // === Active sidebar link tracking ===
    const sections = document.querySelectorAll('.doc-section');
    const sidebarLinks = document.querySelectorAll('.sidebar__link');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                sidebarLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-section') === id);
                });
            }
        });
    }, { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));

    // === Smooth scroll ===
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(link.getAttribute('data-section'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }

            // Close mobile sidebar
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    });

    // === Mobile menu ===
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    // === Search ===
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            sidebarLinks.forEach(link => {
                const text = link.textContent.toLowerCase();
                const li = link.parentElement;
                if (!query || text.includes(query)) {
                    li.style.display = '';
                } else {
                    li.style.display = 'none';
                }
            });

            // Also highlight matching sections in content
            sections.forEach(section => {
                const text = section.textContent.toLowerCase();
                if (!query || text.includes(query)) {
                    section.style.opacity = '1';
                } else {
                    section.style.opacity = '0.3';
                }
            });
        });
    }
});
