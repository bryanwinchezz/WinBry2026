// =================================================================
// SCRIPT.JS - VERSÃO AUTOMÁTICA PROFISSIONAL (CORRIGIDA)
// =================================================================

// ⚠️ CONFIGURAÇÕES
const API_KEY = "55b8ea4272d5e05ac8a517457a4303c4";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const BANNER_BASE = "https://image.tmdb.org/t/p/original";
const LANGUAGE = "&language=pt-BR";

const MOVIE_PLAYER_BASE = "https://playerflixapi.com/filme";
const TV_PLAYER_BASE = "https://playerflixapi.com/serie";

// --- MAPA DAS MARCAS (CORRIGIDO) ---
const BRAND_MAP = {
    // MARVEL: Usa | (ou) para pegar Marvel Studios (420) E Marvel Ent (7505)
    // Isso traz filmes do MCU, séries antigas e animações.
    'marvel': { type: 'company', id: '420|7505|19551', title: 'Universo Marvel' },

    // DC: Soma DC Entertainment (9993) com DC Films (128064)
    'dc': { type: 'company', id: '9993|128064', title: 'Universo DC' },

    // Estúdios e Canais (Mantidos)
    'cartoon': { type: 'network', id: '56', title: 'Cartoon Network' },
    'adult': { type: 'network', id: '80', title: 'Adult Swim' },
    'disney': { type: 'company', id: '2', title: 'Disney' },
    'illumination': { type: 'company', id: '6704', title: 'Illumination' },

    // Sagas Fechadas (Mantidas como Collection pois são sequências diretas)
    'star wars': { type: 'collection', id: '10', title: 'Coleção Star Wars' },
    'invocacao': { type: 'collection', id: '313086', title: 'Coleção Invocação do Mal' },
    'harry potter': { type: 'collection', id: '1241', title: 'Coleção Harry Potter' },
    'jurassic': { type: 'collection', id: '328', title: 'Coleção Jurassic Park' },
    'velozes': { type: 'collection', id: '9485', title: 'Saga Velozes e Furiosos' },
    'jogos': { type: 'collection', id: '131635', title: 'Jogos Vorazes' },
    'crepusculo': { type: 'collection', id: '33514', title: 'Saga Crepúsculo' },
    'transformers': { type: 'collection', id: '8650', title: 'Transformers' }
};

// Variáveis de Controle Global
let currentPage = 1;
let currentType = 'movie';
let currentBrand = null;
let currentSearchQuery = '';

// =================================================================
// 1. SISTEMA DE USUÁRIO (LOCALSTORAGE)
// =================================================================

function getActiveUser() {
    try {
        const session = localStorage.getItem('winbry_active_session');
        return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
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
// 2. INICIALIZAÇÃO E ROTEAMENTO
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
        setTimeout(() => {
            userActions.style.opacity = '1';
            userActions.style.visibility = 'visible';
        }, 100);
    }

    initTheme();
    initMenuMobile();
    initSearch();
    initVideoModal();
    initHeaderUser();
    initTransitionManager();

    if (document.getElementById("cadastroForm")) initCadastro(document.getElementById("cadastroForm"));
    if (document.getElementById("loginForm")) initLogin(document.getElementById("loginForm"));
    if (document.querySelector('.account-info-card')) initMinhaConta();

    // Roteamento
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const id = params.get('id');
    const type = params.get('type');

    // Verifica se veio do botão da Home (Hubs como Marvel, DC)
    const isHub = params.get('global') === 'true';

    // AQUI ESTÁ A CORREÇÃO: Removemos o ".html" das verificações
    if (path.includes('detalhes')) {
        if (id && type) loadDetails(type, id);
    }
    else if (path.includes('filmes')) {
        currentType = 'movie';
        if (search) handleSearchRouting(search, 'movie', isHub);
        else loadCatalog('movie', 1);
    }
    else if (path.includes('series')) {
        currentType = 'tv';
        if (search) loadSearch(search, 'tv', 1);
        else loadCatalog('tv', 1);
    }
    else if (path.includes('animes')) {
        currentType = 'anime';
        if (search) loadSearch(search, 'tv', 1);
        else loadAnimes(1);
    }
    else if (path.includes('minha-lista')) {
        initMinhaListaPage();
    }
    else if (path.includes('index') || path === '/' || path.endsWith('/')) {
        loadHome();
    }
});

// Função atualizada para diferenciar CLIQUE (Hub) de DIGITAÇÃO (Pesquisa)
function handleSearchRouting(query, defaultType, isHub) {
    const brandKey = query.toLowerCase();

    // Só carrega o layout especial da marca se:
    // 1. A marca existe no mapa (BRAND_MAP)
    // 2. E veio através de um clique no Hub (isHub é verdadeiro)
    if (isHub && BRAND_MAP[brandKey]) {
        currentType = 'brand';
        currentBrand = brandKey;
        loadBrandContent(brandKey, 1);
    } else {
        // Caso contrário (digitou na barra), faz uma pesquisa de texto normal
        currentType = 'search';
        currentSearchQuery = query;
        loadSearch(query, defaultType, 1);
    }
}

// =================================================================
// 3. INTEGRAÇÃO TMDB & LÓGICA DE CONTEÚDO
// =================================================================

async function fetchTMDB(endpoint) {
    try {
        const char = endpoint.includes('?') ? '&' : '?';
        const response = await fetch(`${BASE_URL}${endpoint}${char}api_key=${API_KEY}${LANGUAGE}`);
        return await response.json();
    } catch (error) { console.error("Erro TMDB:", error); return null; }
}

async function loadHome() {
    const movies = await fetchTMDB('/trending/movie/week');
    if (movies?.results) {
        setupHeroBanner(movies.results[0]);
        renderCarousel('filmes-populares-section', 'Filmes Populares', movies.results, 'movie');
    }
    const series = await fetchTMDB('/trending/tv/week');
    if (series?.results) renderCarousel('series-em-alta-section', 'Séries em Alta', series.results, 'tv');

    const animes = await fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc');
    if (animes?.results) renderCarousel('animes-recomendados-section', 'Animes Recomendados', animes.results, 'tv');
}

// --- FUNÇÕES DE CARREGAMENTO (COM TRAVA DE 500 PÁGINAS) ---

async function loadCatalog(type, page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const endpoint = `/discover/${type}?sort_by=popularity.desc&include_adult=false&page=${page}`;
    const data = await fetchTMDB(endpoint);

    const titulo = type === 'movie' ? 'Filmes' : 'Séries';

    // TRAVA DE SEGURANÇA: API do TMDB limita a 500 páginas para acesso público
    const totalPages = Math.min(data.total_pages, 500);

    renderGrid(data.results, type, titulo);
    renderPagination(totalPages, page, (p) => loadCatalog(type, p));
}

async function loadAnimes(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const endpoint = `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false&page=${page}`;
    const data = await fetchTMDB(endpoint);

    const totalPages = Math.min(data.total_pages, 500);

    renderGrid(data.results, 'tv', 'Animes');
    renderPagination(totalPages, page, (p) => loadAnimes(p));
}

async function loadSearch(query, type, page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const endpoint = `/search/${type}?query=${encodeURIComponent(query)}&page=${page}`;
    const data = await fetchTMDB(endpoint);

    const totalPages = Math.min(data.total_pages, 500);

    renderGrid(data.results, type, `Busca: "${query}"`);
    renderPagination(totalPages, page, (p) => loadSearch(query, type, p));
}

async function loadBrandContent(key, page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const brand = BRAND_MAP[key];
    if (!brand) return;

    // Lógica Especial para Coleções (Sagas)
    if (brand.type === 'collection') {
        // Coleções não têm paginação no TMDB, elas retornam tudo de uma vez
        const endpoint = `/collection/${brand.id}`;
        const data = await fetchTMDB(endpoint);

        if (data && data.parts) {
            // Filtra apenas os que têm poster e ordena por lançamento (opcional)
            const filmes = data.parts.filter(m => m.poster_path);

            // Renderiza tudo e esconde a paginação (passa 1 de 1)
            renderGrid(filmes, 'movie', brand.title);
            renderPagination(1, 1, null);
        }
        return;
    }

    // Lógica Padrão para Empresas e Keywords
    let endpoint = '';
    if (brand.type === 'company') endpoint = `/discover/movie?with_companies=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${page}`;
    else if (brand.type === 'network') endpoint = `/discover/tv?with_networks=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${page}`;
    else if (brand.type === 'keyword') endpoint = `/discover/movie?with_keywords=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${page}`;

    const data = await fetchTMDB(endpoint);

    // Trava de 500 páginas do TMDB
    const totalPages = Math.min(data.total_pages, 500);
    const mediaType = brand.type === 'network' ? 'tv' : 'movie';

    renderGrid(data.results, mediaType, brand.title);
    renderPagination(totalPages, page, (p) => loadBrandContent(key, p));
}

// =================================================================
// 4. RENDERIZAÇÃO E PAGINAÇÃO ESTÁTICA
// =================================================================

function renderGrid(items, type, title) {
    const container = document.getElementById('content-grid');
    if (!container) return;

    container.innerHTML = `<h1>${title}</h1><div class="content-grid" id="grid-items"></div>`;
    const gridItems = document.getElementById('grid-items');

    if (!items || items.length === 0) {
        gridItems.innerHTML = '<p class="empty-state">Nenhum resultado encontrado.</p>';
        return;
    }

    let html = '';
    items.forEach(item => {
        html += createCardHTML(item, type);
    });
    gridItems.innerHTML = html;
}

function createCardHTML(item, typeOverride) {
    const type = typeOverride || item.media_type || 'movie';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
    const titulo = item.title || item.name;
    const ano = (item.release_date || item.first_air_date || '????').substring(0, 4);

    return `
    <a href="detalhes.html?id=${item.id}&type=${type}" class="content-card">
        <img src="${poster}" alt="${titulo}" loading="lazy">
        <div class="card-info">
            <h3>${titulo}</h3>
            <p>${ano}</p>
        </div>
    </a>`;
}

// --- PAGINAÇÃO CORRIGIDA (ESTÁTICA E LIMITADA A 500) ---
function renderPagination(totalPages, currentPage, callback) {
    const container = document.getElementById('content-grid');

    const oldPag = document.querySelector('.pagination-container');
    if (oldPag) oldPag.remove();

    if (totalPages <= 1) return;

    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-container';

    // Botão Anterior
    const prevBtn = createPageButton('<i class="fas fa-chevron-left"></i>', () => callback(currentPage - 1));
    if (currentPage === 1) prevBtn.disabled = true;
    paginationDiv.appendChild(prevBtn);

    // Lógica para mostrar números (1 ... 4 5 6 ... 500)
    // Isso mantêm a barra estável

    let pagesToShow = [];

    if (totalPages <= 7) {
        // Se tem poucas páginas, mostra todas
        for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
        // Sempre mostra a primeira
        pagesToShow.push(1);

        if (currentPage > 3) {
            pagesToShow.push('...');
        }

        // Calcula intervalo ao redor da página atual
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        // Ajuste para não quebrar nos cantos
        if (currentPage <= 3) { end = 4; }
        if (currentPage >= totalPages - 2) { start = totalPages - 3; }

        for (let i = start; i <= end; i++) {
            if (i > 1 && i < totalPages) pagesToShow.push(i);
        }

        if (currentPage < totalPages - 2) {
            pagesToShow.push('...');
        }

        // Sempre mostra a última (Máximo 500)
        pagesToShow.push(totalPages);
    }

    // Renderiza os botões calculados
    pagesToShow.forEach(p => {
        if (p === '...') {
            paginationDiv.appendChild(createEllipsis());
        } else {
            const btn = createPageButton(p, () => callback(p));
            if (p === currentPage) btn.classList.add('active');
            paginationDiv.appendChild(btn);
        }
    });

    // Botão Próximo
    const nextBtn = createPageButton('<i class="fas fa-chevron-right"></i>', () => callback(currentPage + 1));
    if (currentPage >= totalPages) nextBtn.disabled = true;
    paginationDiv.appendChild(nextBtn);

    container.parentNode.appendChild(paginationDiv);
}

function createPageButton(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'page-btn';
    btn.innerHTML = text;
    btn.onclick = onClick;
    return btn;
}

function createEllipsis() {
    const span = document.createElement('span');
    span.innerText = '...';
    span.style.color = '#fff';
    span.style.padding = '0 5px';
    return span;
}

// =================================================================
// 5. DETALHES, CARROSSEL E HELPERS
// =================================================================

async function loadDetails(type, id) {
    const item = await fetchTMDB(`/${type}/${id}`);
    if (!item) return;
    const externalIds = await fetchTMDB(`/${type}/${id}/external_ids`);
    const imdbId = externalIds ? externalIds.imdb_id : null;

    let classificacao = "L";
    if (type === 'movie') {
        const releases = await fetchTMDB(`/movie/${id}/release_dates`);
        const br = releases?.results?.find(r => r.iso_3166_1 === 'BR');
        if (br) classificacao = br.release_dates.find(d => d.certification)?.certification || "L";
    } else {
        const ratings = await fetchTMDB(`/tv/${id}/content_ratings`);
        const br = ratings?.results?.find(r => r.iso_3166_1 === 'BR');
        if (br) classificacao = br.rating;
    }
    const corClass = getRatingColor(parseInt(classificacao) || 0, classificacao);

    const bg = item.backdrop_path ? `${BANNER_BASE}${item.backdrop_path}` : 'images/banner-filme.jpg';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
    const titulo = item.title || item.name;
    const ano = (item.release_date || item.first_air_date || '????').substring(0, 4);
    const nota = item.vote_average.toFixed(1);
    const duracaoTxt = formatDuration(item.runtime, item.number_of_seasons);

    const container = document.getElementById('details-container');
    if (container) {
        container.innerHTML = `
        <div class="details-header" style="background-image: url('${bg}');">
            <div class="overlay"></div>
            <div class="details-info container">
                <div class="details-poster">
                    <img src="${poster}" alt="${titulo}" style="view-transition-name: poster-morph;">
                </div>
                <div class="info-text">
                    <h1>${titulo}</h1>
                    <div class="star-rating" style="color:#ffd700; font-size:1.2rem; margin:10px 0;">
                        <i class="fas fa-star"></i> ${nota} 
                    </div>
                    <div class="meta-info">
                        <span class="classificacao" style="background-color:${corClass}; padding: 4px 8px; border-radius:4px; font-weight:bold; color:white;">${classificacao}</span>
                        <span>${ano}</span>
                        <span>${duracaoTxt}</span>
                        <span class="qualidade">HD</span>
                    </div>
                    <p>${item.overview || "Sinopse não disponível."}</p>
                    <div class="actions">
                        <button class="btn btn-play" id="btn-assistir-detalhes"><i class="fas fa-play"></i> Assistir</button>
                        <button class="btn btn-lista" id="btn-add-lista"><i class="fas fa-bookmark"></i> Minha Lista</button>
                    </div>
                    ${item.genres ? `<div class="elenco" style="margin-top:10px; color:#ccc;"><strong>Gêneros:</strong> ${item.genres.map(g => g.name).join(', ')}</div>` : ''}
                </div>
            </div>
        </div>`;
    }

    const btnAssistir = document.getElementById('btn-assistir-detalhes');
    if (btnAssistir) {
        btnAssistir.addEventListener('click', () => {
            let videoUrl = (type === 'movie') ? `${MOVIE_PLAYER_BASE}/${imdbId || id}` : `${TV_PLAYER_BASE}/${id}`;
            openVideoModal(videoUrl);
        });
    }

    const btnLista = document.getElementById('btn-add-lista');
    if (btnLista) {
        updateListaButton(btnLista, id);
        btnLista.addEventListener('click', () => toggleMinhaLista({ id, type, titulo, poster, ano }, btnLista));
    }
}

function setupHeroBanner(item) {
    const bannerImg = document.querySelector('.banner-img');
    const heroTitle = document.querySelector('.hero-content h1');
    const heroDesc = document.querySelector('.hero-content p');
    const heroLink = document.querySelector('.hero-content .btn-info');
    const heroBtn = document.getElementById('btn-open-player');

    if (bannerImg) bannerImg.src = `${BANNER_BASE}${item.backdrop_path}`;
    if (heroTitle) heroTitle.innerText = item.title || item.name;
    if (heroDesc) heroDesc.innerText = item.overview ? item.overview.substring(0, 150) + "..." : "";
    if (heroLink) heroLink.href = `detalhes.html?id=${item.id}&type=movie`;

    if (heroBtn) {
        heroBtn.onclick = () => {
            fetchTMDB(`/movie/${item.id}/external_ids`).then(ids => {
                const playId = ids.imdb_id || item.id;
                openVideoModal(`${MOVIE_PLAYER_BASE}/${playId}`);
            });
        };
    }
}

function renderCarousel(sectionId, title, items, type) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const container = section.querySelector('.container');
    container.innerHTML = `<h2>${title}</h2>`;
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    items.forEach(item => carousel.innerHTML += createCardHTML(item, type));

    const prev = document.createElement('button'); prev.className = 'carousel-btn prev'; prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });
    const next = document.createElement('button'); next.className = 'carousel-btn next'; next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(prev, carousel, next);
    container.appendChild(wrapper);
}

// --- HELPER FUNCTIONS ---

function formatDuration(minutes, seasons) {
    if (seasons) return seasons + (seasons === 1 ? " Temporada" : " Temporadas");
    if (!minutes) return "N/A";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}min`;
}

function getRatingColor(num, str) {
    if (str === 'L' || num === 0) return '#2ecc71';
    if (num >= 18) return '#000000';
    if (num >= 16) return '#db0000';
    if (num >= 14) return '#e67e22';
    if (num >= 12) return '#f1c40f';
    if (num >= 10) return '#0c94e2';
    return '#2ecc71';
}

function showToast(message, type = 'info') {
    const existingToast = document.getElementById('active-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'active-toast';
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initTransitionManager() {
    if (!document.startViewTransition) return;

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        if (link.href.includes('detalhes')) {
            const img = link.querySelector('img');
            if (img) img.style.viewTransitionName = 'poster-morph';
        }
    });
}

function toggleMinhaLista(itemData, btn) {
    const user = getActiveUser();
    if (!user) return showToast("Faça login para salvar!", "error");

    if (!user.minhaLista) user.minhaLista = [];
    const index = user.minhaLista.findIndex(i => String(i.id) === String(itemData.id));

    if (index !== -1) {
        user.minhaLista.splice(index, 1);
        showToast("Removido da Minha Lista", "info");
    } else {
        user.minhaLista.push(itemData);
        showToast("Adicionado à Minha Lista", "success");
    }

    updateActiveUser(user);
    if (btn) updateListaButton(btn, itemData.id);
}

function updateListaButton(btn, itemId) {
    const user = getActiveUser();
    if (!user) return;
    const exists = user.minhaLista?.some(i => String(i.id) === String(itemId));
    if (exists) {
        btn.innerHTML = '<i class="fas fa-check"></i> Na Lista';
        btn.classList.add('active');
        btn.style.backgroundColor = '#4CAF50';
    } else {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Minha Lista';
        btn.classList.remove('active');
        btn.style.backgroundColor = '';
    }
}

function initMinhaListaPage() {
    const container = document.getElementById('lista-container');
    if (!container) return;

    const user = getActiveUser();

    if (!user || !user.minhaLista || user.minhaLista.length === 0) {
        container.classList.remove('content-grid');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.minHeight = '300px';

        container.innerHTML = `
            <div class="empty-state" style="text-align: center;">
                <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 20px; color: #333;"></i>
                <h3>Sua lista está vazia.</h3>
                <p style="color: #666;">Adicione filmes e séries para assistir mais tarde.</p>
            </div>`;
        return;
    }

    container.classList.add('content-grid');
    container.style.display = 'grid';
    container.style.removeProperty('justify-content');
    container.style.removeProperty('align-items');

    let html = '';
    user.minhaLista.forEach(item => {
        html += `
        <div class="content-card-wrapper">
             <a href="detalhes.html?id=${item.id}&type=${item.type}" class="content-card">
                <img src="${item.poster}" alt="${item.titulo}">
                <div class="card-info">
                    <h3>${item.titulo}</h3>
                </div>
            </a>
            <button onclick="removeItemLista('${item.id}')" class="btn-remove-lista">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>`;
    });
    container.innerHTML = html;
}

window.removeItemLista = function (id) {
    const user = getActiveUser();
    if (!user) return;
    const index = user.minhaLista.findIndex(i => String(i.id) === String(id));
    if (index !== -1) {
        user.minhaLista.splice(index, 1);
        updateActiveUser(user);
        initMinhaListaPage();
        showToast("Item removido.", "info");
    }
}

function initCadastro(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const confirmar = document.getElementById('confirmar-senha').value;
        if (senha !== confirmar) return showToast("Senhas não conferem!", "error");
        const db = JSON.parse(localStorage.getItem('winbry_users_db')) || [];
        if (db.find(u => u.email === email)) return showToast("Email já cadastrado!", "error");
        db.push({ username: nome, email, password: senha, minhaLista: [] });
        localStorage.setItem('winbry_users_db', JSON.stringify(db));
        showToast("Conta criada com sucesso!", "success");
        setTimeout(() => window.location.href = 'login.html', 1500);
    });
}

function initLogin(form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const db = JSON.parse(localStorage.getItem('winbry_users_db')) || [];
        const user = db.find(u => u.email === email && u.password === senha);
        if (user) {
            updateActiveUser(user);
            showToast("Login realizado!", "success");
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            showToast("Dados incorretos.", "error");
        }
    });
}

function initSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-icon');

    const go = () => {
        if (input.value) {
            const path = window.location.pathname;
            let targetPage = 'filmes.html'; // Padrão (Home ou Filmes)

            // Detecta onde o usuário está e ajusta o destino
            if (path.includes('series')) {
                targetPage = 'series.html';
            } else if (path.includes('animes')) {
                targetPage = 'animes.html';
            }

            // Redireciona para a página certa mantendo a categoria
            window.location.href = `${targetPage}?search=${encodeURIComponent(input.value)}`;
        }
    };

    if (btn) btn.onclick = go;
    if (input) input.onkeypress = (e) => { if (e.key === 'Enter') go(); };
}

function initMinhaConta() {
    const user = getActiveUser();
    if (!user) return window.location.href = 'login.html';
    const elUser = document.getElementById('display-username');
    const elEmail = document.getElementById('display-email');
    const elImg = document.getElementById('profile-pic');
    if (elUser) elUser.innerText = user.username;
    if (elEmail) elEmail.innerText = user.email;
    if (elImg && user.profileImage) elImg.src = user.profileImage;
    const upload = document.getElementById('upload-pic');
    if (upload) upload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                user.profileImage = ev.target.result;
                updateActiveUser(user);
                elImg.src = ev.target.result;
                initHeaderUser();
                showToast("Foto atualizada!", "success");
            };
            reader.readAsDataURL(file);
        }
    };
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) btnLogout.onclick = () => {
        localStorage.removeItem('winbry_active_session');
        showToast("Saindo...", "info");
        setTimeout(() => window.location.href = 'login.html', 1000);
    };
}

function initHeaderUser() {
    const btn = document.getElementById('user-action');
    if (!btn) return;
    const user = getActiveUser();
    if (user) {
        const nome = user.username.split(' ')[0];
        const img = user.profileImage || 'images/favicon.png';
        btn.innerHTML = `<img src="${img}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;object-fit:cover;"> ${nome}`;
        btn.href = 'minha-conta.html';
        btn.classList.remove('btn-primary');
        btn.style.display = 'flex'; btn.style.alignItems = 'center'; btn.style.backgroundColor = 'transparent'; btn.style.border = '1px solid #333';
    } else {
        btn.innerHTML = 'Entrar'; btn.href = 'login.html'; btn.classList.add('btn-primary'); btn.style.backgroundColor = ''; btn.style.border = '';
    }
}

function openVideoModal(url) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    if (modal && iframe) { iframe.src = url; modal.classList.add('show'); }
}
function initVideoModal() {
    const modal = document.getElementById('video-modal');
    const close = document.getElementById('close-player');
    const iframe = document.getElementById('video-iframe');
    if (close) close.onclick = () => { modal.classList.remove('show'); iframe.src = ''; };
    if (modal) modal.onclick = (e) => { if (e.target === modal) { modal.classList.remove('show'); iframe.src = ''; } };
}
function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.onclick = () => { document.body.classList.toggle('light-mode'); localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark'); };
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
}
function initMenuMobile() {
    const btn = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.main-nav ul');
    if (btn && nav) btn.onclick = () => nav.classList.toggle('active');
}