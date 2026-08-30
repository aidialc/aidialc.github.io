async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AppState = {
    passwordHash: 'SETUP_NAGUSI90',
    footerText: '',
    socials: {},
    sections: []
};

const App = {
    async init() {
        document.getElementById('logo-link').addEventListener('click', (e) => {
            e.preventDefault();
            const firstSectionId = AppState.sections.sort((a, b) => a.order - b.order)[0].id;
            window.location.hash = firstSectionId;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        try {
            const response = await fetch('portfolio_data.json');
            if (response.ok) {
                const loadedData = await response.json();
                Object.assign(AppState, loadedData);
            } else {
                console.warn("No se encontró portfolio_data.json.");
            }
        } catch (error) {
            console.warn("Error cargando JSON. Abre el proyecto en un servidor local.", error);
        }

        this.render();
    },
    
    render() {
        AppState.sections.sort((a, b) => a.order - b.order);
        this.renderNav();
        this.renderSections();
        this.renderFooter();
    },

    renderNav() {
        const navContainer = document.getElementById('main-nav');
        navContainer.innerHTML = '';
        AppState.sections.forEach(sec => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#${sec.id}" class="hover:text-brand-accent transition-colors pb-1 border-b-2 border-transparent hover:border-brand-accent">${sec.title}</a>`;
            navContainer.appendChild(li);
        });
    },

    renderSections() {
        const mainContainer = document.getElementById('main-content');
        mainContainer.innerHTML = '';
        AppState.sections.forEach((sec, index) => {
            const sectionEl = document.createElement('section');
            sectionEl.id = sec.id;
            sectionEl.className = 'pt-24 pb-16 min-h-[50vh] border-b border-brand-light last:border-0';
            
            const titleHtml = index !== 0 
                ? `<h2 class="text-4xl font-serif text-brand-text mb-6 text-center">${sec.title}</h2>` 
                : `<h2 class="sr-only">${sec.title}</h2>`;

            let imagesHtml = '';
            if (sec.images && sec.images.length > 0) {
                imagesHtml = `<div class="masonry-grid mt-10">`;
                sec.images.forEach(imgUrl => {
                    imagesHtml += `<div class="masonry-item rounded-xl overflow-hidden shadow-sm"><img src="${imgUrl}" class="w-full h-auto block" loading="lazy"></div>`;
                });
                imagesHtml += `</div>`;
            }

            sectionEl.innerHTML = `${titleHtml} ${sec.text ? `<p class="text-lg text-center max-w-3xl mx-auto text-gray-600 mb-8 leading-relaxed">${sec.text}</p>` : ''} ${imagesHtml}`;
            mainContainer.appendChild(sectionEl);
        });
    },

    renderFooter() {
        document.getElementById('footer-text-display').innerText = AppState.footerText;
        const socialsContainer = document.getElementById('social-links-container');
        socialsContainer.innerHTML = '';
        if (AppState.socials.instagram) socialsContainer.innerHTML += `<a href="${AppState.socials.instagram}" target="_blank" class="hover:text-brand-accent transition-transform hover:-translate-y-1"><i class="fab fa-instagram"></i></a>`;
        if (AppState.socials.behance) socialsContainer.innerHTML += `<a href="${AppState.socials.behance}" target="_blank" class="hover:text-brand-accent transition-transform hover:-translate-y-1"><i class="fab fa-behance"></i></a>`;
        if (AppState.socials.email) socialsContainer.innerHTML += `<a href="mailto:${AppState.socials.email}" class="hover:text-brand-accent transition-transform hover:-translate-y-1"><i class="fas fa-envelope"></i></a>`;
    },

    async loginAdmin() {
        const pwdInput = prompt('Introduce la contraseña:');
        if (pwdInput === null) return;
        
        const hashedInput = await hashPassword(pwdInput);
        
        if (hashedInput === AppState.passwordHash || (AppState.passwordHash === 'SETUP_NAGUSI90' && pwdInput === 'nagusi90')) {
            document.getElementById('public-view').classList.add('hidden-view');
            document.getElementById('admin-view').classList.remove('hidden-view');
            
            if (AppState.passwordHash === 'SETUP_NAGUSI90') {
                AppState.passwordHash = await hashPassword('nagusi90');
            }
            AdminUI.init();
        } else {
            alert('Contraseña incorrecta.');
        }
    },

    logoutAdmin() {
        document.getElementById('admin-view').classList.add('hidden-view');
        document.getElementById('public-view').classList.remove('hidden-view');
        this.render(); 
        window.scrollTo(0,0);
    }
};

const AdminUI = {
    currentGallerySectionId: null,

    init() {
        this.switchTab('tab-structure');
        this.renderStructureEditor();
        this.populateSettings();
        this.populateGallerySelector();
    },

    switchTab(tabId) {
        document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden-view'));
        document.querySelectorAll('.admin-tab-btn').forEach(el => {
            el.classList.remove('text-brand-accent', 'bg-brand-light');
            el.classList.add('text-gray-600', 'hover:bg-gray-50');
        });
        document.getElementById(tabId).classList.remove('hidden-view');
        const activeBtn = document.getElementById('btn-' + tabId);
        activeBtn.classList.remove('text-gray-600', 'hover:bg-gray-50');
        activeBtn.classList.add('text-brand-accent', 'bg-brand-light');
    },

    renderStructureEditor() {
        const container = document.getElementById('admin-sections-list');
        container.innerHTML = '';
        AppState.sections.sort((a, b) => a.order - b.order).forEach((sec, index) => {
            const isFirst = index === 0;
            const isLast = index === AppState.sections.length - 1;
            container.innerHTML += `
                <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-start">
                    <div class="flex md:flex-col gap-2 mt-1">
                        <button onclick="AdminUI.moveSection(${index}, -1)" class="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-accent transition-colors" ${isFirst ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-chevron-up"></i></button>
                        <button onclick="AdminUI.moveSection(${index}, 1)" class="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-brand-accent transition-colors" ${isLast ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-chevron-down"></i></button>
                    </div>
                    <div class="flex-grow w-full">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">Orden: ${sec.order}</span>
                            <h4 class="font-bold text-lg text-gray-800">${sec.title}</h4>
                        </div>
                        <textarea id="txt-${sec.id}" class="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent outline-none text-sm h-20 resize-none">${sec.text}</textarea>
                    </div>
                </div>
            `;
        });
    },

    moveSection(currentIndex, direction) {
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= AppState.sections.length) return;
        const tempOrder = AppState.sections[currentIndex].order;
        AppState.sections[currentIndex].order = AppState.sections[newIndex].order;
        AppState.sections[newIndex].order = tempOrder;
        this.saveStructureTextsToState();
        this.renderStructureEditor();
        this.populateGallerySelector(); 
    },

    saveStructureTextsToState() {
        AppState.sections.forEach(sec => {
            const el = document.getElementById(`txt-${sec.id}`);
            if(el) sec.text = el.value;
        });
    },

    populateGallerySelector() {
        const selector = document.getElementById('admin-gallery-selector');
        const prevVal = selector.value;
        selector.innerHTML = '';
        AppState.sections.sort((a, b) => a.order - b.order).forEach(sec => {
            selector.innerHTML += `<option value="${sec.id}">${sec.title}</option>`;
        });
        if (prevVal && AppState.sections.find(s => s.id === prevVal)) selector.value = prevVal;
        this.renderGalleryEditor();
    },

    renderGalleryEditor() {
        const sectionId = document.getElementById('admin-gallery-selector').value;
        if(!sectionId) return;
        this.currentGallerySectionId = sectionId;
        const section = AppState.sections.find(s => s.id === sectionId);
        const container = document.getElementById('admin-image-list');
        container.innerHTML = '';

        if (!section.images || section.images.length === 0) {
            container.innerHTML = `<div class="text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">Aún no hay fotos.</div>`;
            return;
        }
        section.images.forEach((url, index) => {
            const isFirst = index === 0;
            const isLast = index === section.images.length - 1;
            container.innerHTML += `
                <div class="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <img src="${url}" class="w-16 h-16 object-cover rounded bg-gray-100" onerror="this.src='https://placehold.co/100x100?text=Error'">
                    <input type="text" id="img-${sectionId}-${index}" value="${url}" class="flex-grow w-full p-2 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-brand-accent outline-none">
                    <div class="flex gap-1 md:border-l pl-2 border-gray-200 w-full md:w-auto justify-end">
                        <button onclick="AdminUI.moveImage(${index}, -1)" class="p-2 text-gray-400 hover:text-brand-accent" ${isFirst ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-arrow-up"></i></button>
                        <button onclick="AdminUI.moveImage(${index}, 1)" class="p-2 text-gray-400 hover:text-brand-accent" ${isLast ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-arrow-down"></i></button>
                        <button onclick="AdminUI.deleteImage(${index})" class="p-2 text-red-400 hover:text-red-600 ml-2"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
        });
    },

    saveCurrentGalleryUrlsToState() {
        const section = AppState.sections.find(s => s.id === this.currentGallerySectionId);
        if(!section || !section.images) return;
        section.images = section.images.map((_, index) => {
            const input = document.getElementById(`img-${section.id}-${index}`);
            return input ? input.value : '';
        });
    },

    moveImage(index, direction) {
        this.saveCurrentGalleryUrlsToState();
        const section = AppState.sections.find(s => s.id === this.currentGallerySectionId);
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= section.images.length) return;
        const temp = section.images[index];
        section.images[index] = section.images[newIndex];
        section.images[newIndex] = temp;
        this.renderGalleryEditor();
    },

    deleteImage(index) {
        if(confirm('¿Eliminar esta imagen?')) {
            this.saveCurrentGalleryUrlsToState();
            const section = AppState.sections.find(s => s.id === this.currentGallerySectionId);
            section.images.splice(index, 1);
            this.renderGalleryEditor();
        }
    },

    addImageInput() {
        this.saveCurrentGalleryUrlsToState();
        const section = AppState.sections.find(s => s.id === this.currentGallerySectionId);
        if(!section.images) section.images = [];
        section.images.push(''); 
        this.renderGalleryEditor();
    },

    populateSettings() {
        document.getElementById('admin-social-ig').value = AppState.socials.instagram;
        document.getElementById('admin-social-be').value = AppState.socials.behance;
        document.getElementById('admin-social-mail').value = AppState.socials.email;
        document.getElementById('admin-footer-text').value = AppState.footerText;
    },

    async saveSettingsToState() {
        AppState.socials.instagram = document.getElementById('admin-social-ig').value;
        AppState.socials.behance = document.getElementById('admin-social-be').value;
        AppState.socials.email = document.getElementById('admin-social-mail').value;
        AppState.footerText = document.getElementById('admin-footer-text').value;

        const newPwd = document.getElementById('admin-password').value;
        if(newPwd.trim() !== '') {
            AppState.passwordHash = await hashPassword(newPwd);
            document.getElementById('admin-password').value = '';
        }
    },

    async saveAll() {
        this.saveStructureTextsToState();
        if(this.currentGallerySectionId) this.saveCurrentGalleryUrlsToState();
        await this.saveSettingsToState();

        const dataStr = JSON.stringify(AppState, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio_data.json';
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const btn = document.querySelector('button[onclick="AdminUI.saveAll()"]');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-file-download"></i> ¡JSON Descargado!`;
        btn.classList.add('bg-green-600');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('bg-green-600');
        }, 3000);
    }
};

window.addEventListener('DOMContentLoaded', () => { App.init(); });