// =================================================================================
// SCRIPT.JS - VERSÃO STARK TECH (CORRIGIDO)
// =================================================================================

// --- SISTEMA DE BANCO DE DADOS SIMULADO ---
function getActiveUser() {
    return JSON.parse(localStorage.getItem('winbry_active_session'));
}

function updateActiveUser(userData) {
    localStorage.setItem('winbry_active_session', JSON.stringify(userData));
    const db = JSON.parse(localStorage.getItem('winbry_users_db')) || [];
    const index = db.findIndex(u => u.email === userData.email);

    if (index !== -1) {
        db[index] = userData;
        localStorage.setItem('winbry_users_db', JSON.stringify(db));
    }
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("Sistema WinBry+ Iniciado (Multi-Conta).");

    // Verificação de Segurança (Data.js)
    if (typeof conteudos === 'undefined') {
        console.error("ERRO CRÍTICO: Banco de dados (data.js) não encontrado ou carregado depois do script.js.");
        // Opcional: Mostrar alerta na tela
        // alert("Erro: data.js não carregado. Verifique o console.");
    }

    initTheme();
    initMenuMobile();
    initHeaderUser();

    setTimeout(() => {
        const userActions = document.querySelector('.user-actions');
        if (userActions) userActions.classList.add('auth-loaded');
    }, 50);

    initSearch();
    initVideoModal();

    // ROTEAMENTO DE PÁGINAS
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const isGlobalSearch = urlParams.get('global') === 'true';

    // Roteamento Lógico
    if (path.includes('index.html') || path.endsWith('/') || path.endsWith('principal/')) {
        initHomePage();
    }
    else if (path.includes('filmes.html')) {
        // Verifica se é busca global ou listagem normal
        isGlobalSearch ? initContentPage('todos', 'Resultados da Busca') : initContentPage('filme', 'Filmes');
    }
    else if (path.includes('series.html')) {
        initContentPage('serie', 'Séries');
    }
    else if (path.includes('animes.html')) {
        initContentPage('anime', 'Animes');
    }
    else if (path.includes('minha-lista.html')) {
        initMinhaLista();
    }
    else if (path.includes('detalhes.html')) {
        initDetalhesPage();
    }
    else if (path.includes('minha-conta.html')) {
        initMinhaConta();
    }

    // Formulários
    const cadastroForm = document.getElementById("cadastroForm");
    if (cadastroForm) initCadastro(cadastroForm);

    const loginForm = document.getElementById("loginForm");
    if (loginForm) initLogin(loginForm);
});

// =================================================================
// SISTEMA DE CONTA (LOGIN, CADASTRO, PERFIL)
// =================================================================

function initCadastro(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const confirmar = document.getElementById('confirmar-senha').value;

        if (senha !== confirmar) {
            showToast("As senhas não coincidem!", "error");
            return;
        }

        const db = JSON.parse(localStorage.getItem('winbry_users_db')) || [];
        const userExists = db.find(u => u.email === email);
        if (userExists) {
            showToast("Este email já está cadastrado!", "error");
            return;
        }

        const newUser = {
            username: nome,
            email: email,
            password: senha,
            plan: 'Gratuito',
            profileImage: null,
            minhaLista: [],
            watchHistory: []
        };

        db.push(newUser);
        localStorage.setItem('winbry_users_db', JSON.stringify(db));
        showToast("Conta criada! Faça login para continuar.", "success");
        setTimeout(() => window.location.href = 'login.html', 2000);
    });
}

function initLogin(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email').value.trim();
        const passInput = document.getElementById('senha').value;

        const db = JSON.parse(localStorage.getItem('winbry_users_db')) || [];
        const user = db.find(u => u.email === emailInput && u.password === passInput);

        if (user) {
            localStorage.setItem('winbry_active_session', JSON.stringify(user));
            showToast(`Bem-vindo de volta, ${user.username}!`, "success");
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            showToast("Email ou senha incorretos.", "error");
        }
    });
}

function logout() {
    localStorage.removeItem('winbry_active_session');
    showToast("Desconectando...", "info");
    setTimeout(() => window.location.href = 'login.html', 1000);
}

function initMinhaConta() {
    const user = getActiveUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const elUsername = document.getElementById('display-username');
    const elEmail = document.getElementById('display-email');
    const elImg = document.getElementById('profile-pic');
    const elInput = document.getElementById('upload-pic');
    const btnLogout = document.querySelector('.btn-logout');

    if (elUsername) elUsername.textContent = user.username;
    if (elEmail) elEmail.textContent = user.email;
    if (elImg) elImg.src = user.profileImage || 'images/foto-generica.jpg';

    if (elInput) {
        elInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 0.5 * 1024 * 1024) {
                showToast("Imagem muito grande! Use uma menor que 500KB.", "error");
                return;
            }

            const reader = new FileReader();
            reader.onload = function (readerEvent) {
                const base64String = readerEvent.target.result;
                if (elImg) elImg.src = base64String;
                user.profileImage = base64String;
                updateActiveUser(user);
                showToast("Foto atualizada!", "success");
                initHeaderUser();
            }
            reader.readAsDataURL(file);
        });
    }

    if (btnLogout) {
        btnLogout.onclick = (e) => { e.preventDefault(); logout(); };
    }
}

function initHeaderUser() {
    const btn = document.getElementById('user-action');
    if (!btn) return;
    const user = getActiveUser();

    if (user) {
        const primeiroNome = user.username.split(' ')[0];
        const foto = user.profileImage || 'images/foto-generica.jpg';
        btn.innerHTML = `
            <img src="${foto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid var(--color-primary);margin-right:8px;"> 
            ${primeiroNome}
        `;
        btn.href = 'minha-conta.html';
        btn.classList.remove('btn-primary');
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
    } else {
        btn.innerHTML = 'Entrar';
        btn.href = 'login.html';
        btn.classList.add('btn-primary');
    }
}

// =================================================================
// LÓGICA DE DADOS E BUSCA (CORRIGIDA PARA ACENTOS)
// =================================================================

function searchContent(termo, tipo = 'todos') {
    if (typeof conteudos === 'undefined') return [];
    
    const termoNorm = termo.toLowerCase().trim();
    // Normaliza o tipo para garantir (ex: 'Série' vira 'série')
    const tipoNorm = tipo.toLowerCase().trim();

    return conteudos.filter(item => {
        const itemTipo = item.tipo ? item.tipo.toLowerCase() : '';
        
        // Verifica se o tipo bate (considerando que no data.js pode estar 'serie' ou 'filme')
        const tipoMatch = tipoNorm === 'todos' || itemTipo === tipoNorm;
        
        const termoMatch = !termoNorm ||
            item.titulo.toLowerCase().includes(termoNorm) ||
            (item.categoria && item.categoria.toLowerCase().includes(termoNorm)) ||
            item.genero.toLowerCase().includes(termoNorm);
            
        return tipoMatch && termoMatch;
    });
}

function getContentById(id) {
    if (typeof conteudos === 'undefined') return undefined;
    return conteudos.find(item => item.id === id);
}

// =================================================================
// UI HELPERS
// =================================================================

function showToast(message, type = 'info') {
    const existingToast = document.getElementById('active-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'active-toast';
    toast.classList.add('toast', type);
    toast.textContent = message;

    document.body.appendChild(toast);
    void toast.offsetWidth; // Força reflow
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    const icon = toggle.querySelector('i');

    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        if (icon) icon.className = 'fas fa-moon';
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

function initMenuMobile() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav');
    if (btn && nav) {
        btn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = btn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
}

function initSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-icon');
    if (!input || !btn) return;

    const go = () => {
        const val = input.value.trim();
        if (!val) return;
        const path = window.location.pathname;

        // Redirecionamento inteligente baseado na página atual
        if (path.includes('series.html')) {
            window.location.href = `series.html?search=${encodeURIComponent(val)}`;
        } else if (path.includes('animes.html')) {
            window.location.href = `animes.html?search=${encodeURIComponent(val)}`;
        } else if (path.includes('filmes.html') && !new URLSearchParams(window.location.search).get('global')) {
            window.location.href = `filmes.html?search=${encodeURIComponent(val)}`;
        } else {
            // Se estiver na Home, tenta adivinhar o contexto ou manda para busca global
            const resultados = searchContent(val, 'todos');
            const tipos = [...new Set(resultados.map(i => i.tipo))];
            
            if (tipos.length === 1 && tipos[0] === 'anime') {
                window.location.href = `animes.html?search=${encodeURIComponent(val)}`;
            } else if (tipos.length === 1 && tipos[0] === 'serie') {
                window.location.href = `series.html?search=${encodeURIComponent(val)}`;
            } else {
                window.location.href = `filmes.html?search=${encodeURIComponent(val)}&global=true`;
            }
        }
    };
    btn.addEventListener('click', go);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') go(); });
}

// =================================================================
// PÁGINA HOME & CARROSSEL
// =================================================================

function initHomePage() {
    if (typeof conteudos === 'undefined') return;

    const sectionHistory = document.getElementById('continue-watching-section');
    const user = getActiveUser();
    const historicoData = user ? (user.watchHistory || []) : [];

    // Mapeia histórico
    const listaHistorico = historicoData
        .map(h => {
            const filme = conteudos.find(c => c.id === h.id);
            if (filme) {
                return {
                    ...filme,
                    progressoReal: h.progresso,
                    savedSeason: h.temporada,
                    savedEpisode: h.episodio,
                    savedHour: h.horaParada,
                    savedMin: h.minutoParada
                };
            }
            return null;
        })
        .filter(item => item !== null);

    if (listaHistorico.length > 0 && sectionHistory) {
        sectionHistory.style.display = 'block';
        renderCarousel('continue-watching-section', 'Continuar Assistindo', listaHistorico, true);
    } else if (sectionHistory) {
        sectionHistory.style.display = 'none';
    }

    const filmes = searchContent('', 'filme');
    const series = searchContent('', 'serie');
    const animes = searchContent('', 'anime');

    renderCarousel('filmes-populares-section', 'Filmes Populares', filmes.slice(0, 12));
    renderCarousel('series-em-alta-section', 'Séries em Alta', series.slice(0, 12));
    renderCarousel('animes-recomendados-section', 'Animes Recomendados', animes.slice(0, 12));

    const btnHero = document.getElementById('btn-open-player');
    if (btnHero) {
        const idHero = btnHero.getAttribute('data-id');
        btnHero.addEventListener('click', function () {
            window.openVideoModal(this.getAttribute('data-video-url'), idHero);
        });
    }
}

function renderCarousel(sectionId, title, list, isHistory = false) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const container = section.querySelector('.container');
    container.innerHTML = `<h2>${title}</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    if (list.length === 0) {
        carousel.innerHTML = '<p class="empty-message">Em breve.</p>';
    } else {
        // Concatenando HTML de forma eficiente
        carousel.innerHTML = list.map(item => createContentCard(item, isHistory)).join('');
    }

    const btnPrev = document.createElement('button');
    btnPrev.className = 'carousel-btn prev';
    btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    btnPrev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });

    const btnNext = document.createElement('button');
    btnNext.className = 'carousel-btn next';
    btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
    btnNext.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(btnPrev, carousel, btnNext);
    container.appendChild(wrapper);
}

function createContentCard(item, isHistory = false) {
    let overlayHTML = '';

    if (isHistory) {
        let tempoTexto = '';
        if (item.savedHour > 0) tempoTexto += `${item.savedHour}h `;
        if (item.savedMin >= 0) tempoTexto += `${item.savedMin}m`;
        
        if (item.savedSeason && item.savedEpisode) {
            overlayHTML = `
                <div class="episode-badge">
                    T${item.savedSeason}:E${item.savedEpisode}
                </div>
                <div class="progress-container"><div class="progress-bar-fill" style="width: ${item.progressoReal || 5}%"></div></div>
            `;
        }
        else if (item.progressoReal !== undefined) {
            overlayHTML = `
                <div class="episode-badge" style="justify-content: center;">
                    <span class="badge-time" style="color:#fff; margin:0;">${tempoTexto}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar-fill" style="width: ${item.progressoReal || 5}%"></div>
                </div>
            `;
        }
    }

    return `
        <a href="detalhes.html?id=${item.id}" class="content-card" onclick="event.preventDefault(); window.location.href='detalhes.html?id=${item.id}'">
            <img src="${item.poster}" alt="${item.titulo}" loading="lazy">
            ${overlayHTML}
            <div class="card-info">
                <h3>${item.titulo}</h3>
                <p>${item.ano}</p>
            </div>
        </a>
    `;
}

// =================================================================
// PÁGINA DE LISTAGEM (Filmes/Séries/Animes)
// =================================================================

function initContentPage(tipo, tituloPadrao) {
    const container = document.getElementById('content-grid');
    if (!container) {
        console.error(`Erro: Elemento #content-grid não encontrado na página ${window.location.pathname}`);
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    
    // Busca conteúdo
    const lista = searchContent(search || '', tipo);
    const titulo = search ? `Resultados para: "${search}"` : tituloPadrao;

    let html = `<h1>${titulo}</h1><div class="content-grid">`;
    if (lista.length === 0) {
        // Mensagem de erro amigável se o banco estiver vazio
        if (typeof conteudos === 'undefined') {
            html += `<div class="empty-message" style="width:100%;text-align:center;color:red;">Erro: Banco de Dados não carregado.</div>`;
        } else {
            html += `<div class="empty-message" style="width:100%;text-align:center;">Nenhum conteúdo encontrado.</div>`;
        }
    } else {
        lista.forEach(item => html += createContentCard(item));
    }
    html += '</div>';
    container.innerHTML = html;
}

// =================================================================
// PÁGINA DETALHES
// =================================================================

function initDetalhesPage() {
    const id = new URLSearchParams(window.location.search).get('id');
    const item = getContentById(id);
    const container = document.querySelector('main');

    if (!item) {
        container.innerHTML = '<div class="container" style="padding-top:150px;text-align:center;"><h1>Conteúdo não encontrado.</h1><a href="index.html" class="btn btn-primary">Voltar</a></div>';
        return;
    }

    document.title = `WinBry+ | ${item.titulo}`;
    const bg = `background-image: url('${item.banner}');`;

    const corClass = item.classificacaoNum >= 18 ? '#000000' :
        item.classificacaoNum >= 16 ? '#db0000' :
            item.classificacaoNum >= 14 ? '#e67e22' :
                item.classificacaoNum >= 12 ? '#f1c40f' :
                    item.classificacaoNum >= 10 ? '#0099ff' :
                        '#2ecc71';

    const estrelasHTML = gerarEstrelasHTML(item.popularidade);

    container.innerHTML = `
        <div class="details-header" style="${bg}">
            <div class="overlay"></div>
            <div class="details-info container">
                <div class="details-poster">
                    <img src="${item.poster}" alt="${item.titulo}">
                </div>
                <div class="info-text">
                    <h1>${item.titulo}</h1>
                    ${estrelasHTML}
                    <div class="meta-info">
                        <span class="classificacao" style="background:${corClass}">${item.classificacao}</span>
                        <span>${item.ano}</span>
                        <span>${item.duracao}</span>
                        <span class="qualidade">${item.qualidade}</span>
                    </div>
                    <p>${item.sinopse}</p>
                    <div class="actions">
                        <button class="btn btn-play" onclick="window.openVideoModal('${item.videoUrl}', '${item.id}')"><i class="fas fa-play"></i> Assistir</button>
                        <button class="btn btn-trailer" onclick="window.openVideoModal('${item.trailerUrl}')"><i class="fas fa-film"></i> Trailer</button>
                        <button class="btn btn-lista" id="btn-add-lista" data-id="${item.id}"><i class="fas fa-bookmark"></i> Minha Lista</button>
                    </div>
                    <div class="elenco"><strong>Elenco:</strong> ${item.elenco.join(', ')}</div>
                </div>
            </div>
        </div>
    `;

    const btnLista = document.getElementById('btn-add-lista');
    if (btnLista) {
        updateListaButton(btnLista, item);
        btnLista.addEventListener('click', () => toggleMinhaLista(item, btnLista));
    }
}

// =================================================================
// MINHA LISTA
// =================================================================

function updateListaButton(btn, item) {
    const user = getActiveUser();
    if (!user) {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Minha Lista';
        btn.classList.remove('active');
        return;
    }

    const minhaLista = user.minhaLista || [];
    const exists = minhaLista.some(i => i.id === item.id);

    if (exists) {
        btn.innerHTML = '<i class="fas fa-check"></i> Na Lista';
        btn.classList.add('active');
    } else {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Minha Lista';
        btn.classList.remove('active');
    }
}

function toggleMinhaLista(item, btn) {
    const user = getActiveUser();
    if (!user) {
        showToast("Faça login para salvar.", "error");
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (!user.minhaLista) user.minhaLista = [];
    const index = user.minhaLista.findIndex(i => i.id === item.id);

    if (index !== -1) {
        user.minhaLista.splice(index, 1);
        showToast("Removido da Minha Lista.", "info");
        if (btn) {
            btn.innerHTML = '<i class="fas fa-bookmark"></i> Minha Lista';
            btn.classList.remove('active');
        }
    } else {
        user.minhaLista.push({
            id: item.id,
            titulo: item.titulo,
            poster: item.poster,
            ano: item.ano,
            tipo: item.tipo
        });
        showToast("Adicionado à Minha Lista!", "success");
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Salvo';
            btn.classList.add('active');
        }
    }
    updateActiveUser(user);
}

function initMinhaLista() {
    const grid = document.getElementById('lista-container');
    if (!grid) {
        console.error("Erro: #lista-container não encontrado em minha-lista.html");
        return;
    }

    const user = getActiveUser();

    if (!user) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lock" style="font-size: 3rem; margin-bottom: 20px; color: var(--color-text-secondary);"></i>
                <h3>Faça login para ver sua lista</h3>
                <a href="login.html" class="btn btn-primary" style="margin-top: 20px;">Entrar Agora</a>
            </div>`;
        return;
    }

    const lista = user.minhaLista || [];

    if (lista.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bookmark" style="font-size: 3rem; margin-bottom: 20px; color: var(--color-text-secondary);"></i>
                <h3>Sua lista está vazia</h3>
                <p>Adicione filmes e séries para assistir mais tarde.</p>
                <a href="index.html" class="btn btn-secondary" style="margin-top: 20px;">Explorar Conteúdo</a>
            </div>`;
        return;
    }

    renderizarGridLista(lista, grid);

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const listaFiltrada = lista.filter(item =>
                item.titulo.toLowerCase().includes(termo)
            );
            renderizarGridLista(listaFiltrada, grid);
        });
    }
}

function renderizarGridLista(lista, container) {
    if (lista.length === 0) {
        container.innerHTML = '<p class="empty-message">Nenhum título encontrado na sua lista.</p>';
        return;
    }

    let html = '';
    lista.forEach(item => {
        html += `
            <div class="content-card-wrapper" style="position: relative;">
                <a href="detalhes.html?id=${item.id}" class="content-card">
                    <img src="${item.poster}" alt="${item.titulo}" loading="lazy">
                    <div class="card-info">
                        <h3>${item.titulo}</h3>
                        <p>${item.ano}</p>
                    </div>
                </a>
                <button class="btn-remove-lista" onclick="removerItemLista('${item.id}')">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.removerItemLista = function (id) {
    const user = getActiveUser();
    if (!user) return;

    const index = user.minhaLista.findIndex(i => i.id === id);
    if (index !== -1) {
        user.minhaLista.splice(index, 1);
        updateActiveUser(user);
        initMinhaLista();
        showToast("Item removido.", "info");
    }
};

// =================================================================
// PLAYER DE VÍDEO
// =================================================================

let conteudoAtualID = null;

function initVideoModal() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    const close = document.getElementById('close-player');

    const serieInputs = document.getElementById('serie-inputs');
    const inSeason = document.getElementById('current-season');
    const inEpisode = document.getElementById('current-episode');
    const inHour = document.getElementById('stop-hour');
    const inMin = document.getElementById('stop-min');
    const btnSave = document.getElementById('save-progress-btn');

    window.openVideoModal = (url, idDoConteudo = null) => {
        if (!url) return showToast("Vídeo indisponível.", "error");

        if (iframe) iframe.src = url;
        if (modal) modal.classList.add('show');
        conteudoAtualID = idDoConteudo;

        if (inHour) inHour.value = '';
        if (inMin) inMin.value = '';
        if (inSeason) inSeason.value = 1;
        if (inEpisode) inEpisode.value = 1;

        if (idDoConteudo) {
            const user = getActiveUser();
            const historico = user ? (user.watchHistory || []) : [];
            const salvo = historico.find(h => h.id === idDoConteudo);
            const item = getContentById(idDoConteudo);

            if (salvo) {
                if (salvo.horaParada) inHour.value = salvo.horaParada;
                if (salvo.minutoParada) inMin.value = salvo.minutoParada;
                if (salvo.temporada) inSeason.value = salvo.temporada;
                if (salvo.episodio) inEpisode.value = salvo.episodio;
            }

            if (item && (item.tipo === 'serie' || item.tipo === 'anime')) {
                if (serieInputs) serieInputs.style.display = 'flex';
            } else {
                if (serieInputs) serieInputs.style.display = 'none';
            }
        }
    };

    const fechar = () => {
        if (iframe) iframe.src = '';
        if (modal) modal.classList.remove('show');
        conteudoAtualID = null;
    };

    const salvarManual = () => {
        const user = getActiveUser();
        if (!user) {
            showToast("Faça login para salvar progresso.", "error");
            return;
        }

        if (!conteudoAtualID) return;
        const item = getContentById(conteudoAtualID);
        if (!item) return;

        const h = parseInt(inHour.value) || 0;
        const m = parseInt(inMin.value) || 0;
        const minutosAssistidos = (h * 60) + m;

        let duracaoTotal = converterDuracaoParaMinutos(item.duracao);
        if (item.tipo === 'serie' || item.tipo === 'anime') duracaoTotal = 9999;

        let porcentagem = 0;
        if (duracaoTotal > 0 && duracaoTotal !== 9999) {
            porcentagem = (minutosAssistidos / duracaoTotal) * 100;
        }
        if (porcentagem > 100) porcentagem = 100;

        let temp = null;
        let ep = null;
        if (item.tipo === 'serie' || item.tipo === 'anime') {
            temp = inSeason.value;
            ep = inEpisode.value;
        }

        salvarHistorico(conteudoAtualID, porcentagem, h, m, temp, ep);
        showToast("Progresso salvo!", "success");
        fechar();
    };

    if (close) close.addEventListener('click', fechar);
    if (btnSave) btnSave.addEventListener('click', salvarManual);
}

function salvarHistorico(id, porcentagem, hora, minuto, temporada, episodio) {
    const user = getActiveUser();
    if (!user) return;

    if (!user.watchHistory) user.watchHistory = [];
    user.watchHistory = user.watchHistory.filter(item => item.id !== id);

    const novo = {
        id: id,
        progresso: Math.floor(porcentagem),
        horaParada: hora,
        minutoParada: minuto,
        timestamp: Date.now()
    };

    if (temporada && episodio) {
        novo.temporada = temporada;
        novo.episodio = episodio;
    }

    user.watchHistory.unshift(novo);
    if (user.watchHistory.length > 20) user.watchHistory.pop();
    updateActiveUser(user);

    if (document.getElementById('continue-watching-section')) {
        initHomePage();
    }
}

function converterDuracaoParaMinutos(duracaoStr) {
    if (!duracaoStr) return 0;
    if (duracaoStr.toLowerCase().includes('temporada')) return 0;
    let minutos = 0;
    const horasMatch = duracaoStr.match(/(\d+)h/);
    if (horasMatch) minutos += parseInt(horasMatch[1]) * 60;
    const minMatch = duracaoStr.match(/(\d+)m/);
    if (minMatch) minutos += parseInt(minMatch[1]);
    return minutos > 0 ? minutos : 120;
}

function gerarEstrelasHTML(nota0a10) {
    const nota = parseFloat(nota0a10) || 0;
    const estrelas = nota / 2;
    let html = '<div class="star-rating" title="Nota: ' + nota + '">';
    for (let i = 1; i <= 5; i++) {
        if (estrelas >= i) html += '<i class="fas fa-star"></i>';
        else if (estrelas >= i - 0.5) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    html += ` <span class="score-text">${nota.toFixed(1)}</span></div>`;
    return html;
}

// =================================================================
// GERENCIADOR DE TRANSIÇÕES 2.0 (MPA Support) - CORRIGIDO
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        if (link.href.startsWith(window.location.origin)) {
            if (link.href.includes('detalhes.html')) {
                const img = link.querySelector('img');
                if (img) {
                    img.style.viewTransitionName = 'poster-morph';
                }
            }
        }
    });
});
// Removida a chave } extra que existia aqui e quebrava o script