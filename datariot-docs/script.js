/* Datariot docs: navigation, mobile contents and full-text section search. */
document.addEventListener('DOMContentLoaded', () => {
    const sections = [...document.querySelectorAll('.doc-section')];
    const sidebarLinks = [...document.querySelectorAll('.sidebar__link')];
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('mobileMenuBtn');
    const searchInput = document.getElementById('searchInput');
    const searchStatus = document.getElementById('searchStatus');

    function setActive(id) {
        sidebarLinks.forEach(link => {
            const active = link.dataset.section === id;
            link.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }

    function setMenu(open, returnFocus = false) {
        sidebar?.classList.toggle('open', open);
        if (overlay) overlay.hidden = !open;
        menuButton?.setAttribute('aria-expanded', String(open));
        if (open) searchInput?.focus();
        else if (returnFocus) menuButton?.focus();
    }

    menuButton?.addEventListener('click', () => {
        setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });
    overlay?.addEventListener('click', () => setMenu(false, true));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
            setMenu(false, true);
        }
    });
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => setMenu(false));

    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Keep native anchors, URL hashes and reduced-motion behavior.
            setActive(link.dataset.section);
            if (menuButton?.getAttribute('aria-expanded') === 'true') {
                setMenu(false);
                const section = document.getElementById(link.dataset.section);
                section?.setAttribute('tabindex', '-1');
                section?.focus({ preventScroll: true });
            }
        });
    });

    function updateActiveSection() {
        const visible = sections.filter(section => !section.hidden);
        const current = [...visible].reverse().find(section => section.getBoundingClientRect().top <= 140) || visible[0];
        if (current) setActive(current.id);
    }
    let scrollQueued = false;
    window.addEventListener('scroll', () => {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(() => {
            updateActiveSection();
            scrollQueued = false;
        });
    }, { passive: true });
    window.addEventListener('hashchange', updateActiveSection);

    searchInput?.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        let count = 0;
        sections.forEach(section => {
            const matches = !query || section.textContent.toLowerCase().includes(query);
            section.hidden = !matches;
            if (matches) count++;
            const link = sidebarLinks.find(item => item.dataset.section === section.id);
            if (link) link.parentElement.hidden = !matches;
        });
        if (searchStatus) {
            searchStatus.textContent = query
                ? (count ? `${count} matching section${count === 1 ? '' : 's'}` : 'No sections found. Try another word.')
                : '';
        }
        document.querySelectorAll('.sidebar__section').forEach(group => {
            group.hidden = ![...group.querySelectorAll('li')].some(item => !item.hidden);
        });
        updateActiveSection();
    });
    updateActiveSection();
});
