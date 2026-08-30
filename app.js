
document.addEventListener('DOMContentLoaded', () => {
    let appData = {};
    const mainContent = document.getElementById('main-content');
    const editorJson = document.getElementById('editor-json');
    const panelSecreto = document.getElementById('panel-secreto');

    // 1. Cargar datos.json
    fetch('datos.json')
        .then(res => res.json())
        .then(datos => {
            appData = datos;
            construirMenu(datos.menu);
            construirFooter(datos.footer);
            cargarSeccion('Portfolio'); // Default
            editorJson.value = JSON.stringify(datos, null, 2);
        })
        .catch(err => console.error('Error:', err));

    function construirMenu(items) {
        const menuList = document.getElementById('menu-list');
        menuList.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = item;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                cargarSeccion(item);
            });
            li.appendChild(a);
            menuList.appendChild(li);
        });
    }

    function construirFooter(footerData) {
        document.getElementById('footer-copyright').textContent = footerData.copyright;
        const footerLinks = document.getElementById('footer-links');
        footerLinks.innerHTML = '';
        footerData.links.forEach((link, idx) => {
            const a = document.createElement('a');
            a.href = link.url;
            a.textContent = link.texto;
            a.target = '_blank';
            footerLinks.appendChild(a);
            
            if (idx < footerData.links.length - 1) {
                const span = document.createElement('span');
                span.textContent = ' | ';
                footerLinks.appendChild(span);
            }
        });
    }

    function cargarSeccion(nombreSeccion) {
        mainContent.innerHTML = '';
        // Normalizar nombre de sección a key de objeto (ej. "About me" -> "about_me")
        const key = nombreSeccion.toLowerCase().replace(/ /g, '_');
        const seccionDatos = appData.sections[key];

        if (!seccionDatos) return;

        if (seccionDatos.tipo === 'galeria') {
            const div = document.createElement('div');
            div.className = 'grid-container';
            seccionDatos.obras.forEach(obra => {
                // Usamos div con backgound para simular imagen si no carga
                const img = document.createElement('img');
                img.src = obra.imagen;
                img.alt = obra.titulo;
                img.title = obra.titulo;
                img.className = 'grid-item';
                div.appendChild(img);
            });
            mainContent.appendChild(div);
        } else if (seccionDatos.tipo === 'html') {
            const div = document.createElement('div');
            div.className = 'section-content';
            div.innerHTML = seccionDatos.contenido;
            mainContent.appendChild(div);
        }
    }

    document.getElementById('home-link').addEventListener('click', (e) => {
        e.preventDefault();
        cargarSeccion('Portfolio');
    });

    // 2. Huevo de pascua y Encriptado (SHA-256)
    const hashObjetivo = "897424edfed335f948c8b3c743bc08623c32c44cea9147b9e7afc76f2c78b782"; 
    let bufferTeclas = [];
    
    // Función para hashear la contraseña encriptada (SHA-256)
    async function hashearString(mensaje) {
        const encoder = new TextEncoder();
        const data = encoder.encode(mensaje);
        const hash = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    window.addEventListener('keydown', async (e) => {
        if (e.target.tagName.toLowerCase() === 'textarea') return;
        
        bufferTeclas.push(e.key.toLowerCase());
        if (bufferTeclas.length > 20) bufferTeclas.shift(); // Evitar memoria infinita
        
        // Comprobar las últimas teclas presionadas
        const cadenaPrueba = bufferTeclas.join('');
        // nagusi90 tiene 8 letras, comprobamos las ultimas 8
        const posiblePassword = cadenaPrueba.slice(-8);
        
        const hashCalculado = await hashearString(posiblePassword);
        
        if (hashCalculado === hashObjetivo) {
            panelSecreto.classList.remove('oculto');
            bufferTeclas = []; // Reset
        }
    });

    // 3. Descargar JSON
    document.getElementById('btn-descargar').addEventListener('click', () => {
        try {
            JSON.parse(editorJson.value); 
            const blob = new Blob([editorJson.value], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'datos.json';
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("El formato JSON no es válido.");
        }
    });

    // 4. Cerrar
    document.getElementById('btn-cerrar').addEventListener('click', () => {
        panelSecreto.classList.add('oculto');
        // Actualizamos datos en memoria si es válido al cerrar (opcional)
        try {
            appData = JSON.parse(editorJson.value);
            cargarSeccion('Portfolio'); 
            construirMenu(appData.menu);
            construirFooter(appData.footer);
        } catch(e) {}
    });
});
