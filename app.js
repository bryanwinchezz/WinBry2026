// =================================================================
// SCRIPT.JS - VERSÃO AUTOMÁTICA PROFISSIONAL (CORRIGIDA)
// =================================================================

// ⚠️ CONFIGURAÇÕES
const API_KEY = "55b8ea4272d5e05ac8a517457a4303c4";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const BANNER_BASE = "https://image.tmdb.org/t/p/original";
const LANGUAGE = "&language=pt-BR";

const MOVIE_PLAYER_BASE = "https://myembed.biz/filme";
const TV_PLAYER_BASE = "https://myembed.biz/serie";

// ⚠️ CONFIGURAÇÕES FIREBASE (Suas Chaves)
const firebaseConfig = {
    apiKey: "AIzaSyAL4eejSiJU7xhg7etuydqlEGq5fGP9hMU",
    authDomain: "winbryplus.firebaseapp.com",
    projectId: "winbryplus",
    storageBucket: "winbryplus.firebasestorage.app",
    messagingSenderId: "754571772845",
    appId: "1:754571772845:web:ab12c0697aa14f35bc1724"
};

// Inicializa Firebase (Verifica se já existe para não dar erro)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Variáveis Globais de Usuário
let currentUser = null; // Usuário logado (Firebase Auth)
let userData = null;    // Dados do banco (Lista, Histórico)

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
    'invocacao': { type: 'collection', id: '313086|402074|968052', title: 'Coleção Invocação do Mal' },
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
let currentVideoContext = null; // Vai guardar qual filme está aberto no player

// =================================================================
// 1. SISTEMA DE USUÁRIO (AGORA NA NUVEM ☁️)
// =================================================================

auth.onAuthStateChanged(async (user) => {

    // Elementos dos botões flutuantes
    const bryiaBtn = document.getElementById('bryia-fab');
    const surpriseBtn = document.querySelector('.surpreenda-fab');

    if (user) {
        console.log("Usuário conectado:", user.email);
        currentUser = user;

        // --- MOSTRA OS BOTÕES FLUTUANTES ---
        if (bryiaBtn) bryiaBtn.style.display = 'flex';
        if (surpriseBtn) surpriseBtn.style.display = 'flex';

        // Pega os dados do banco (Minha Lista, etc) com tratamento robusto contra falhas
        try {
            const doc = await db.collection('users').doc(user.uid).get();
            if (doc.exists) {
                userData = doc.data();
                if (!userData.reviews) userData.reviews = [];
                if (!userData.favoritos) userData.favoritos = [];
                if (!userData.minhaLista) userData.minhaLista = [];
                if (!userData.history) userData.history = [];
            } else {
                // Se for novo usuário no banco, cria o documento inicial
                userData = {
                    username: user.displayName || "Usuário",
                    email: user.email,
                    minhaLista: [],
                    history: [],
                    reviews: [],
                    favoritos: []
                };
                await db.collection('users').doc(user.uid).set(userData);
            }
        } catch (dbError) {
            console.error("Erro ao carregar dados do usuário do banco (Firestore):", dbError);
            // Fallback resiliente em caso de falha de conexão/permissões temporárias
            userData = {
                username: user.displayName || "Usuário",
                email: user.email,
                minhaLista: [],
                history: [],
                reviews: [],
                favoritos: []
            };
        }
    } else {
        console.log("Nenhum usuário conectado.");
        currentUser = null;
        userData = null;

        // --- ESCONDE OS BOTÕES FLUTUANTES ---
        if (bryiaBtn) bryiaBtn.style.display = 'none';
        if (surpriseBtn) surpriseBtn.style.display = 'none';

        // --- REDIRECIONAMENTO DE SEGURANÇA SEGURO ---
        // Se estiver em uma página restrita que necessita de login, avisa e redireciona
        const path = window.location.pathname;
        if (path.includes('minha-conta') || path.includes('minha-lista')) {
            showToast("Você precisa fazer login para acessar esta página!", "warning");
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    }

    // Sinaliza que a autenticação foi resolvida (prevenindo travamento infinito)
    window.isAuthResolved = true;

    // Atualiza a interface (Botão de Perfil/Login)
    initHeaderUser();

    // Recarrega o histórico da BryIA correspondente ao perfil logado!
    if (typeof BryIA !== 'undefined' && typeof BryIA.loadLocalHistory === 'function') {
        BryIA.loadLocalHistory();
    }

    // Se estiver na página "Minha Lista", "Home" ou "Dashboard Perfil", recarrega
    if (document.getElementById('lista-container') && typeof initMinhaListaPage === 'function') initMinhaListaPage();
    if (document.getElementById('continue-watching-section') && typeof loadContinueWatching === 'function') loadContinueWatching();
    if (document.querySelector('.dashboard-wrapper') && typeof initMinhaConta === 'function') initMinhaConta();

    // Se estiver na página de detalhes, atualiza os botões ao resolver a autenticação (Verificação robusta pelo DOM)
    const btnLista = document.getElementById('btn-add-lista');
    const btnFavorito = document.getElementById('btn-add-favorito');
    if (btnLista || btnFavorito) {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');
        if (itemId) {
            if (btnLista && typeof updateListaButton === 'function') updateListaButton(btnLista, itemId);
            if (btnFavorito && typeof updateFavoritoButton === 'function') updateFavoritoButton(btnFavorito, itemId);
        }
    }
});

// Helper aprimorado para salvar dados no banco automaticamente de forma resiliente
async function saveUserDataToCloud() {
    if (!currentUser || !userData) return;
    try {
        // Usar .set com { merge: true } garante a criação do documento se não existir
        await db.collection('users').doc(currentUser.uid).set({
            minhaLista: userData.minhaLista || [],
            history: userData.history || [],
            profileImage: userData.profileImage || null,
            reviews: userData.reviews || [],
            favoritos: userData.favoritos || []
        }, { merge: true });
    } catch (error) {
        console.error("Erro ao salvar dados no Firestore:", error);
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

    initGlobalLoader();
    initTheme();
    initMenuMobile();
    initSearch();
    initVideoModal();
    initHeaderUser();
    initTransitionManager();
    initSaveButton();
    loadContinueWatching();
    initEsqueciSenha();

    if (document.getElementById("cadastroForm")) initCadastro(document.getElementById("cadastroForm"));
    if (document.getElementById("loginForm")) initLogin(document.getElementById("loginForm"));
    if (document.querySelector('.dashboard-wrapper')) initMinhaConta();

    // Roteamento
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    const id = params.get('id');
    const type = params.get('type');

    // Verifica se veio do botão da Home (Hubs como Marvel, DC)
    const isHub = params.get('global') === 'true';
    const isMulti = params.get('multi') === 'true';
    if (isMulti) {
        document.querySelectorAll('.main-nav ul li a, .bottom-nav a, .bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
    }

    // AQUI ESTÁ A CORREÇÃO: Removemos o ".html" das verificações
    const isEasterEgg = params.get('easteregg') === 'true';

    if (path.includes('detalhes')) {
        if (id && type) loadDetails(type, id);
    }
    else if (path.includes('filmes')) {
        currentType = isMulti ? 'search' : 'movie';
        const genre = params.get('genre');
        const lang = params.get('lang');
        if (isEasterEgg) {
            loadAdultEasterEgg(1);
        }
        else if (search) handleSearchRouting(search, isMulti ? 'multi' : 'movie', isHub);
        else if (genre) loadCatalog('movie', 1, genre, lang || null);
        else loadCatalog('movie', 1);
    }
    else if (path.includes('series')) {
        currentType = 'tv';
        const genre = params.get('genre');
        const lang = params.get('lang');
        if (search) loadSearch(search, 'tv', 1);
        else if (genre) loadCatalog('tv', 1, genre, lang || null);
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

// Filtra conteúdo adulto / hentai de animes para garantir segurança familiar
function filterAdultAnimes(results) {
    if (!results) return [];
    const blacklist = [
        'hentai', 'uncensored', 'erotic', 'erótica', 'erótico', 'sexy anime', 
        'adult anime', 'ecchi', 'orgasm', 'sex', 'sexual', 'sadomaso', 
        'blowjob', 'creampie', 'sensual', 'yuri', 'yaoi', 'hentai anime',
        'overflow', 'yosuga no sora', 'boku no pico', 'kiss x sis', 'valkyrie drive', 
        'redo of healer', 'kaifuku jutsushi', 'ishuzoku reviewers', 'shoujo ramune',
        'residence', 'front inn', 'under-content', 'kuroinu', 'disciplined',
        'overflow: tenkousei', 'overflowing'
    ];
    return results.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        const hasBlockedWord = blacklist.some(word => title.includes(word) || overview.includes(word));
        return !hasBlockedWord;
    });
}

// =================================================================
// ATUALIZAÇÃO DA HOME (Misto de Filmes e Séries)
// =================================================================

async function loadHome() {
    console.log("Iniciando carregamento da Home...");

    // 1. Destaque Principal + Top 10 (MISTO)
    // Usamos o endpoint /trending/all/day para pegar o que está bombando HOJE (Filmes + Séries)
    const trendingMixed = await fetchTMDB('/trending/all/day');

    if (trendingMixed && trendingMixed.results) {
        // --- MUDANÇA AQUI: Pega os 5 primeiros para o Banner Rotativo ---
        const top5 = trendingMixed.results.slice(0, 5);
        initHeroCarousel(top5);

        // O Top 10 pega os 10 primeiros misturados
        renderTop10('top10-section', 'Top 10 no Brasil Hoje', trendingMixed.results.slice(0, 10));
    }

    // 2. Carregar Categorias
    loadCategoriesCarousel();

    // 3. Filmes Populares (Mantivemos separado para quem quer só filme)
    const popularMovies = await fetchTMDB('/movie/popular');
    if (popularMovies && popularMovies.results) {
        renderCarousel('filmes-populares-section', 'Filmes Populares', popularMovies.results, 'movie');
    }

    // 4. Em Breve (MISTO - Já vamos conferir a função abaixo)
    loadUnlimitedUpcoming();

    // 5. Séries em Alta (Mantivemos separado para quem quer só série)
    const series = await fetchTMDB('/trending/tv/week');
    if (series && series.results) renderCarousel('series-em-alta-section', 'Séries em Alta', series.results, 'tv');

    // 6. Animes (com filtro estrito anti-hentai)
    const animes = await fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false&without_keywords=9819');
    if (animes && animes.results) {
        const animesFiltrados = filterAdultAnimes(animes.results);
        renderCarousel('animes-recomendados-section', 'Animes Recomendados', animesFiltrados, 'tv');
    }
}

// --- NOVA FUNÇÃO: CATEGORIAS COM SETAS - LÓGICA DE GÊNEROS REAIS ---
async function loadCategoriesCarousel() {
    const sectionId = 'categorias-section';
    const container = document.getElementById(sectionId);
    if (!container) return;

    // Estrutura do Carrossel
    container.querySelector('.container').innerHTML = `
        <h2>Navegar por Categorias</h2>
        <div class="carousel-wrapper">
            <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
            <div class="carousel" id="cat-carousel-inner"></div>
            <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
        </div>
    `;

    const carouselInner = document.getElementById('cat-carousel-inner');
    const btnPrev = container.querySelector('.prev');
    const btnNext = container.querySelector('.next');

    // Categorias com URLs de FILTRO POR GÊNERO (não pesquisa)
    // url usa ?genre=ID para filmes.html/series.html exibirem via loadCatalog
    const categorias = [
        { id: 28,    name: 'Ação',            type: 'movie', url: 'filmes.html?genre=28' },
        { id: 12,    name: 'Aventura',        type: 'movie', url: 'filmes.html?genre=12' },
        { id: 16,    name: 'Animes',          type: 'tv',    url: 'animes.html', endpoint: '/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false' },
        { id: 18,    name: 'Dorama',          type: 'tv',    url: 'series.html?genre=18&lang=ko', endpoint: '/discover/tv?with_original_language=ko&sort_by=popularity.desc' },
        { id: 35,    name: 'Comédia',         type: 'movie', url: 'filmes.html?genre=35' },
        { id: 80,    name: 'Crime',           type: 'movie', url: 'filmes.html?genre=80' },
        { id: 99,    name: 'Documentário',    type: 'movie', url: 'filmes.html?genre=99' },
        { id: 18,    name: 'Drama',           type: 'movie', url: 'filmes.html?genre=18' },
        { id: 10751, name: 'Família',         type: 'movie', url: 'filmes.html?genre=10751' },
        { id: 14,    name: 'Fantasia',        type: 'movie', url: 'filmes.html?genre=14' },
        { id: 36,    name: 'História',        type: 'movie', url: 'filmes.html?genre=36' },
        { id: 27,    name: 'Terror',          type: 'movie', url: 'filmes.html?genre=27' },
        { id: 10402, name: 'Música',          type: 'movie', url: 'filmes.html?genre=10402' },
        { id: 9648,  name: 'Mistério',        type: 'movie', url: 'filmes.html?genre=9648' },
        { id: 10749, name: 'Romance',         type: 'movie', url: 'filmes.html?genre=10749' },
        { id: 878,   name: 'Ficção Científica',type: 'movie', url: 'filmes.html?genre=878' },
        { id: 10752, name: 'Guerra',          type: 'movie', url: 'filmes.html?genre=10752' },
        { id: 37,    name: 'Faroeste',        type: 'movie', url: 'filmes.html?genre=37' }
    ];

    const usedIds = new Set();

    const promessas = categorias.map(async (cat) => {
        let endpoint = cat.endpoint;
        if (!endpoint) {
            const yearParam = cat.type === 'tv' ? 'first_air_date.gte=2020-01-01' : 'primary_release_date.gte=2020-01-01';
            endpoint = `/discover/${cat.type}?with_genres=${cat.id}&sort_by=popularity.desc&${yearParam}`;
        }

        const data = await fetchTMDB(endpoint);
        const results = (data && data.results) ? data.results : [];

        let selectedItem = results.find(item => item.backdrop_path && !usedIds.has(item.id));

        if (!selectedItem && results.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(10, results.length));
            selectedItem = results[randomIndex];
        }

        if (selectedItem) {
            usedIds.add(selectedItem.id);
        }

        const bg = (selectedItem && selectedItem.backdrop_path)
            ? `https://image.tmdb.org/t/p/w500${selectedItem.backdrop_path}`
            : 'images/banner-filme.jpg';

        return `
        <a href="${cat.url}" class="category-card">
            <img src="${bg}" loading="lazy" alt="${cat.name}">
            <div class="category-overlay">
                <h3>${cat.name}</h3>
            </div>
        </a>`;
    });

    const resultados = await Promise.all(promessas);
    carouselInner.innerHTML = resultados.join('');

    btnPrev.onclick = () => carouselInner.scrollBy({ left: -400, behavior: 'smooth' });
    btnNext.onclick = () => carouselInner.scrollBy({ left: 400, behavior: 'smooth' });
}


// --- FUNÇÃO: EM BREVE MISTO (FILMES E SÉRIES) ---
async function loadUnlimitedUpcoming() {
    const sectionId = 'em-breve-section';
    const section = document.getElementById(sectionId);
    if (!section) return;

    const hoje = new Date().toISOString().split('T')[0];
    const fimFuturo = '2026-12-31'; // Define até onde buscar

    // 1. Busca FILMES futuros
    const reqMovies = fetchTMDB(`/discover/movie?primary_release_date.gte=${hoje}&primary_release_date.lte=${fimFuturo}&sort_by=popularity.desc&page=1`);

    // 2. Busca SÉRIES futuras (Novas temporadas ou estreias)
    const reqTV = fetchTMDB(`/discover/tv?first_air_date.gte=${hoje}&first_air_date.lte=${fimFuturo}&sort_by=popularity.desc&page=1`);

    const [resMovies, resTV] = await Promise.all([reqMovies, reqTV]);

    // 3. Combina e normaliza os dados
    let combinados = [];

    if (resMovies && resMovies.results) {
        combinados = [...combinados, ...resMovies.results.map(i => ({
            ...i,
            media_type: 'movie',
            date_sort: i.release_date // Cria campo comum para ordenar
        }))];
    }

    if (resTV && resTV.results) {
        combinados = [...combinados, ...resTV.results.map(i => ({
            ...i,
            media_type: 'tv',
            date_sort: i.first_air_date // Cria campo comum para ordenar
        }))];
    }

    // 4. Ordena por DATA (do mais próximo para o mais distante)
    combinados.sort((a, b) => new Date(a.date_sort) - new Date(b.date_sort));

    // Filtra duplicados e itens sem imagem
    combinados = combinados.filter((item, index, self) =>
        item.poster_path &&
        index === self.findIndex((t) => (t.id === item.id))
    );

    const container = section.querySelector('.container');
    container.innerHTML = `<h2>Em Breve</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';

    let htmlAcumulado = ''; // 1. Cria variável

    combinados.forEach(item => {
        let dataFormatada = "EM BREVE";
        if (item.date_sort) {
            const [ano, mes, dia] = item.date_sort.split('-');
            dataFormatada = `${dia}/${mes}`;
        }

        const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        const titulo = item.title || item.name;

        // Badge diferenciado (opcional, mas ajuda a saber se é série ou filme)
        const typeLabel = item.media_type === 'tv' ? 'SÉRIE' : 'FILME';

        htmlAcumulado += `
    <a href="detalhes.html?id=${item.id}&type=${item.media_type}" class="content-card upcoming-card">
        <div style="position: relative; width: 100%; height: 100%;">
            <img src="${poster}" alt="${titulo}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">
            <div class="date-badge">${dataFormatada}</div>
        </div>
    </a>`;
    });

    // 3. Joga na tela UMA VEZ SÓ no final do loop
    carousel.innerHTML = htmlAcumulado;

    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(prev, carousel, next);
    container.appendChild(wrapper);
}

// --- FUNÇÃO TOP 10 CORRIGIDA (Layout Bonito) ---
function renderTop10(sectionId, title, items) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const container = section.querySelector('.container');
    container.innerHTML = `<h2>${title}</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper top10-wrapper';

    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';

    items.forEach((item, index) => {
        const rank = index + 1;
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'images/favicon.png';
        const link = `detalhes.html?id=${item.id}&type=${item.media_type || 'movie'}`;

        const html = `
        <div class="top10-card-container">
            <span class="rank-number">${rank}</span>
            <a href="${link}" class="content-card">
                <img src="${poster}" alt="${item.title}" loading="lazy">
            </a>
        </div>`;
        carousel.innerHTML += html;
    });

    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(prev, carousel, next);
    container.appendChild(wrapper);
}

// --- FUNÇÃO EM BREVE (Com Setas e Tamanho Normal) ---
function renderUpcomingCarousel(sectionId, title, items) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const container = section.querySelector('.container');
    container.innerHTML = `<h2>${title}</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    items.forEach(item => {
        let dataFormatada = "EM BREVE";
        if (item.release_date) {
            const parts = item.release_date.split('-');
            dataFormatada = `${parts[2]}/${parts[1]}`;
        }
        const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';

        // Removemos o style inline de margin-right e usamos classe CSS
        const html = `
        <a href="detalhes.html?id=${item.id}&type=movie" class="content-card upcoming-card">
            <div style="position: relative; width: 100%; height: 100%;">
                <img src="${poster}" alt="${item.title}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
                <div class="date-badge">ESTREIA: ${dataFormatada}</div>
            </div>
        </a>`;
        carousel.innerHTML += html;
    });

    // --- ADICIONANDO AS SETAS ---
    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });

    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.appendChild(prev);
    wrapper.appendChild(carousel);
    wrapper.appendChild(next);
    container.appendChild(wrapper);
}

// --- FUNÇÕES DE CARREGAMENTO (COM TRAVA DE 500 PÁGINAS) ---

async function loadCatalog(type, page, genreId, langFilter) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let results = [];
    let totalPages = 1;
    let gridType = type;

    let titulo = type === 'movie' ? 'Filmes' : 'Séries';
    if (genreId) {
        const generoNomes = {
            '28': 'Ação',
            '12': 'Aventura',
            '35': 'Comédia',
            '80': 'Crime',
            '99': 'Documentário',
            '18': langFilter === 'ko' ? 'Dorama' : 'Drama',
            '10751': 'Família',
            '14': 'Fantasia',
            '36': 'História',
            '27': 'Terror',
            '10402': 'Música',
            '9648': 'Mistério',
            '10749': 'Romance',
            '878': 'Ficão Científica',
            '10752': 'Guerra',
            '37': 'Faroeste'
        };
        const nomeGenero = generoNomes[String(genreId)];
        if (nomeGenero) {
            titulo = nomeGenero === 'Ficão Científica' ? 'Ficção Científica' : nomeGenero;
        }

        // Para categorias, carregamos filmes e séries juntos de forma premium!
        const tvGenreMap = {
            '28': '10759', '12': '10759', '35': '35', '80': '80', '99': '99',
            '18': '18', '10751': '10751', '14': '10765', '36': '10768',
            '27': '9648', '10402': '', '9648': '9648', '10749': '10749',
            '878': '10765', '10752': '10768', '37': '37'
        };

        const tvGenreId = tvGenreMap[String(genreId)];
        let extra = langFilter ? `&with_original_language=${langFilter}` : '';

        // Buscas paralelas para Cinema e TV
        const reqMovie = fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc&include_adult=false&page=${page}${extra}`);
        
        let reqTV;
        if (tvGenreId) {
            reqTV = fetchTMDB(`/discover/tv?with_genres=${tvGenreId}&sort_by=popularity.desc&include_adult=false&page=${page}${extra}`);
        } else {
            reqTV = Promise.resolve({ results: [], total_pages: 0 });
        }

        const [resMovie, resTV] = await Promise.all([reqMovie, reqTV]);

        const movies = (resMovie && resMovie.results) ? resMovie.results.map(i => { i.media_type = 'movie'; return i; }) : [];
        const tvs = (resTV && resTV.results) ? resTV.results.map(i => { i.media_type = 'tv'; return i; }) : [];

        results = [...movies, ...tvs];
        // Ordenação robusta baseada em popularidade
        results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        results = results.slice(0, 24);

        const totalItemsCombined = (resMovie ? resMovie.total_results || 0 : 0) + (resTV ? resTV.total_results || 0 : 0);
        totalPages = Math.min(Math.ceil(totalItemsCombined / 24), 500);
        gridType = 'multi';
    } else {
        const startIdx = (page - 1) * 24;
        const endIdx = page * 24;
        const pageA = Math.floor(startIdx / 20) + 1;
        const pageB = Math.floor((endIdx - 1) / 20) + 1;

        const endpointA = `/discover/${type}?sort_by=popularity.desc&include_adult=false&page=${pageA}`;
        const endpointB = `/discover/${type}?sort_by=popularity.desc&include_adult=false&page=${pageB}`;

        const [dataA, dataB] = await Promise.all([fetchTMDB(endpointA), fetchTMDB(endpointB)]);
        const resultsA = (dataA && dataA.results) ? dataA.results : [];
        const resultsB = (dataB && dataB.results) ? dataB.results : [];

        const allItems = [];
        const startOffset = startIdx % 20;
        allItems.push(...resultsA.slice(startOffset));
        allItems.push(...resultsB);

        results = allItems.slice(0, 24);
        const totalItemsTMDB = (dataA ? dataA.total_results || 0 : 0);
        totalPages = Math.min(Math.ceil(totalItemsTMDB / 24), 500);
    }

    renderGrid(results, gridType, titulo);
    renderPagination(totalPages, page, (p) => loadCatalog(type, p, genreId, langFilter));
}


async function loadAnimes(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const startIdx = (page - 1) * 24;
    const endIdx = page * 24;
    const pageA = Math.floor(startIdx / 20) + 1;
    const pageB = Math.floor((endIdx - 1) / 20) + 1;

    const endpointA = `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false&without_keywords=9819&page=${pageA}`;
    const endpointB = `/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=false&without_keywords=9819&page=${pageB}`;

    const [dataA, dataB] = await Promise.all([fetchTMDB(endpointA), fetchTMDB(endpointB)]);
    const resultsA = (dataA && dataA.results) ? dataA.results : [];
    const resultsB = (dataB && dataB.results) ? dataB.results : [];

    const allItems = [];
    const startOffset = startIdx % 20;
    allItems.push(...resultsA.slice(startOffset));
    allItems.push(...resultsB);

    const mergedAnimes = allItems.slice(0, 24);
    const animesFiltrados = filterAdultAnimes(mergedAnimes); // Bloqueia animes adultos no catálogo de animes

    const totalItemsTMDB = (dataA ? dataA.total_results || 0 : 0);
    const totalPages = Math.min(Math.ceil(totalItemsTMDB / 24), 500);

    renderGrid(animesFiltrados, 'tv', 'Animes');
    renderPagination(totalPages, page, (p) => loadAnimes(p));
}

async function loadSearch(query, type, page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const startIdx = (page - 1) * 24;
    const endIdx = page * 24;
    const pageA = Math.floor(startIdx / 20) + 1;
    const pageB = Math.floor((endIdx - 1) / 20) + 1;

    const endpointA = `/search/${type}?query=${encodeURIComponent(query)}&page=${pageA}`;
    const endpointB = `/search/${type}?query=${encodeURIComponent(query)}&page=${pageB}`;

    const [dataA, dataB] = await Promise.all([fetchTMDB(endpointA), fetchTMDB(endpointB)]);
    let resultsA = dataA.results || [];
    let resultsB = dataB.results || [];

    if (type === 'multi') {
        resultsA = resultsA.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        resultsB = resultsB.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    }

    const allItems = [];
    const startOffset = startIdx % 20;
    allItems.push(...resultsA.slice(startOffset));
    allItems.push(...resultsB);

    let results = allItems.slice(0, 24);

    const totalItemsTMDB = (dataA ? dataA.total_results || 0 : 0);
    const totalPages = Math.min(Math.ceil(totalItemsTMDB / 24), 500);

    const titleText = type === 'multi' 
        ? `<span class="pesquisa-destaque">Pesquisa Global:</span> "${query}"` 
        : `Busca: "${query}"`;

    renderGrid(results, type, titleText);
    renderPagination(totalPages, page, (p) => loadSearch(query, type, p));
}

async function loadBrandContent(key, page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const brand = BRAND_MAP[key];
    if (!brand) return;

    // Lógica Especial para Coleções (Sagas com suporte a múltiplos IDs de Coleções/Filmes por '|')
    if (brand.type === 'collection') {
        const parts = brand.id.split('|');
        const fetchPromises = parts.map(async (part) => {
            if (part.startsWith('movie:')) {
                const movieId = part.replace('movie:', '');
                const movieData = await fetchTMDB(`/movie/${movieId}`);
                return movieData ? [movieData] : [];
            } else {
                const data = await fetchTMDB(`/collection/${part}`);
                return (data && data.parts) ? data.parts : [];
            }
        });

        const resultsArray = await Promise.all(fetchPromises);
        let filmes = [];
        resultsArray.forEach(arr => {
            if (arr && arr.length > 0) filmes.push(...arr);
        });

        // Remove duplicatas baseadas no ID do TMDB
        const uniqueFilmes = [];
        const seenIds = new Set();
        filmes.forEach(f => {
            if (f && f.id && !seenIds.has(f.id)) {
                seenIds.add(f.id);
                uniqueFilmes.push(f);
            }
        });

        if (uniqueFilmes.length > 0) {
            let validFilmes = uniqueFilmes.filter(m => m.poster_path);

            // Ordena cronologicamente por lançamento para ficar perfeito
            validFilmes.sort((a, b) => {
                const dateA = a.release_date || '0000-00-00';
                const dateB = b.release_date || '0000-00-00';
                return dateA.localeCompare(dateB);
            });

            // =================================================================
            // 💡 COMO ADICIONAR FILMES MANUALMENTE NESTA FRANQUIA:
            // Você pode colocar IDs de coleções ou filmes individuais separados por '|'
            // diretamente na definição do BRAND_MAP no topo do arquivo app.js!
            // Exemplo: 'invocacao': { type: 'collection', id: '313086|movie:439079', ... }
            // =================================================================

            // Renderiza tudo junto na tela e esconde a paginação (passa 1 de 1)
            renderGrid(validFilmes, 'movie', brand.title);
            renderPagination(1, 1, null);
        } else {
            renderGrid([], 'movie', brand.title);
            renderPagination(1, 1, null);
        }
        return;
    }

    // Lógica Padrão para Empresas e Keywords (24 itens por página)
    const startIdx = (page - 1) * 24;
    const endIdx = page * 24;
    const pageA = Math.floor(startIdx / 20) + 1;
    const pageB = Math.floor((endIdx - 1) / 20) + 1;

    let endpointA = '';
    let endpointB = '';

    if (brand.type === 'company') {
        endpointA = `/discover/movie?with_companies=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageA}`;
        endpointB = `/discover/movie?with_companies=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageB}`;
    } else if (brand.type === 'network') {
        endpointA = `/discover/tv?with_networks=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageA}`;
        endpointB = `/discover/tv?with_networks=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageB}`;
    } else if (brand.type === 'keyword') {
        endpointA = `/discover/movie?with_keywords=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageA}`;
        endpointB = `/discover/movie?with_keywords=${brand.id}&sort_by=popularity.desc&include_adult=false&page=${pageB}`;
    }

    const [dataA, dataB] = await Promise.all([fetchTMDB(endpointA), fetchTMDB(endpointB)]);
    const resultsA = (dataA && dataA.results) ? dataA.results : [];
    const resultsB = (dataB && dataB.results) ? dataB.results : [];

    const allItems = [];
    const startOffset = startIdx % 20;
    allItems.push(...resultsA.slice(startOffset));
    allItems.push(...resultsB);

    const results = allItems.slice(0, 24);
    const totalItemsTMDB = (dataA ? dataA.total_results || 0 : 0);
    const totalPages = Math.min(Math.ceil(totalItemsTMDB / 24), 500);
    const mediaType = brand.type === 'network' ? 'tv' : 'movie';

    renderGrid(results, mediaType, brand.title);
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
    const type = (typeOverride && typeOverride !== 'multi') ? typeOverride : (item.media_type || 'movie');
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
    const titulo = item.title || item.name;
    const ano = (item.release_date || item.first_air_date || '????').substring(0, 4);

    return `
    <div class="content-card">
        <a href="detalhes.html?id=${item.id}&type=${type}" class="card-link">
            <img src="${poster}" alt="${titulo}" loading="lazy">
        </a>
        <div class="card-info">
            <h3>${titulo}</h3>
            <p>${ano}</p>
        </div>
    </div>`;
}

// Busca trailer via TMDB Videos endpoint e retorna URL embeddable (YouTube embed ou arquivo direto)
async function fetchTrailerUrl(type, id) {
    try {
        const data = await fetchTMDB(`/${type}/${id}/videos`);
        if (!data || !data.results || data.results.length === 0) return null;

        // Prioriza trailers oficiais do YouTube
        const ytTrailer = data.results.find(v => /trailer/i.test(v.type) && /YouTube/i.test(v.site));
        const anyTrailer = data.results.find(v => /trailer/i.test(v.type));

        const pick = ytTrailer || anyTrailer || data.results[0];
        if (!pick) return null;

        if (/YouTube/i.test(pick.site) && pick.key) {
            return `https://www.youtube.com/embed/${pick.key}?autoplay=1&rel=0`;
        }

        // Fallback: se vier com URL direta (pouco comum), retorna como está
        if (pick.url) return pick.url;

        return null;
    } catch (err) {
        console.error('Erro ao buscar trailer:', err);
        return null;
    }
}

// Delegação de clique para botões de trailer nos cards (apenas dentro de .card-actions)
document.addEventListener('click', async (e) => {
    const btn = e.target.closest && e.target.closest('.card-actions .btn-trailer');
    if (!btn) return;
    const id = btn.dataset.id;
    const type = btn.dataset.type || 'movie';
    if (!id) return; // segurança: requer data-id
    btn.disabled = true;
    const url = await fetchTrailerUrl(type, id);
    if (url) {
        openVideoModal(url);
        setupSaveProgress({ id, type, titulo: '', poster: '' });
    } else {
        showToast('Trailer não encontrado.', 'info');
    }
    btn.disabled = false;
});

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
    
    // Busca do elenco (créditos)
    const credits = await fetchTMDB(`/${type}/${id}/credits`);
    let atoresHtml = '';
    if (credits && credits.cast && credits.cast.length > 0) {
        const mainCast = credits.cast.filter(actor => actor.profile_path).slice(0, 6);
        const finalCast = mainCast.length > 0 ? mainCast : credits.cast.slice(0, 6);
        
        const castItemsHtml = finalCast.map(actor => {
            const actorPic = actor.profile_path ? `${IMG_BASE}${actor.profile_path}` : 'images/foto-generica.jpg';
            const cleanName = actor.name.replace(/'/g, "\\'");
            return `
            <div class="cast-card" onclick="showFamousWorks('${actor.id}', '${cleanName}')" title="Clique para ver produções com ${actor.name}">
                <div class="cast-avatar-wrapper">
                    <img src="${actorPic}" alt="${actor.name}" loading="lazy" />
                </div>
                <div class="cast-info-name">
                    <span class="cast-actor">${actor.name}</span>
                    <span class="cast-character">${actor.character || ''}</span>
                </div>
            </div>
            `;
        }).join('');

        atoresHtml = `
        <div class="details-cast-section" style="margin-top: 25px;">
            <h3 style="font-size: 1.1rem; color: #fff; margin-bottom: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-users" style="color: #e50914;"></i> Elenco Principal
            </h3>
            <div class="cast-grid">
                ${castItemsHtml}
            </div>
        </div>
        `;
    }

    let classificacao = "L";

    if (type === 'movie') {
        // Lógica para FILMES
        const releases = await fetchTMDB(`/movie/${id}/release_dates`);
        if (releases && releases.results) {
            const br = releases.results.find(r => r.iso_3166_1 === 'BR');
            if (br && br.release_dates) {
                const cert = br.release_dates.find(d => d.certification);
                if (cert) classificacao = cert.certification;
            }
        }
    } else {
        // Lógica para SÉRIES (Corrigido erro de variável)
        const ratings = await fetchTMDB(`/tv/${id}/content_ratings`);

        // Antes você usava "releases" aqui, o que dava erro. Agora está "ratings".
        if (ratings && ratings.results) {
            const br = ratings.results.find(r => r.iso_3166_1 === 'BR');
            if (br) classificacao = br.rating;
        }
    }

    const corClass = getRatingColor(parseInt(classificacao) || 0, classificacao);

    const bg = item.backdrop_path ? `${BANNER_BASE}${item.backdrop_path}` : 'images/banner-filme.jpg';
    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
    const titulo = item.title || item.name;
    const ano = (item.release_date || item.first_air_date || '????').substring(0, 4);
    const nota = item.vote_average.toFixed(1);
    const duracaoTxt = formatDuration(item.runtime, item.number_of_seasons);

    // Lógica da tag de qualidade dinâmica (HD vs CINEMA)
    const qualidadeVal = getQualityBadge(item, type);
    const qualidadeHtml = qualidadeVal === 'CINEMA'
        ? `<span class="qualidade cinema" title="Filme lançado recentemente nos cinemas. Imagem gravada de tela."><i class="fas fa-video"></i> CINEMA</span>`
        : `<span class="qualidade hd" title="Imagem digital em alta definição."><i class="fas fa-compact-disc"></i> HD</span>`;

    // --- LÓGICA DO LER MAIS (Threshold aumentado para 350 caracteres) ---
    const sinopseTexto = item.overview || "Sinopse não disponível.";
    const isLongText = sinopseTexto.length > 350;
    const sinopseHtml = `
        <p class="synopsis-text ${isLongText ? 'clamped' : ''}" id="synopsis-content">${sinopseTexto}</p>
        ${isLongText ? '<button id="btn-read-more" class="btn-read-more">Ler mais</button>' : ''}
    `;

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
                        <span class="separator">•</span>
                        <span>${ano}</span>
                        <span class="separator">•</span>
                        <span>${duracaoTxt}</span>
                        <span class="separator">•</span>
                        ${qualidadeHtml}
                    </div>
                    
                    ${sinopseHtml} 
                    <div class="actions">
                        <button class="btn btn-play" id="btn-assistir-detalhes"><i class="fas fa-play"></i> Assistir</button>
                        <button class="btn btn-trailer" id="btn-trailer-detalhes"><i class="fas fa-film"></i> Trailer</button>
                        <button class="btn btn-lista" id="btn-add-lista"><i class="fas fa-bookmark"></i> Minha Lista</button>
                        <button class="btn btn-favorito" id="btn-add-favorito"><i class="far fa-heart"></i> Favoritar</button>
                        <button class="btn btn-resenha" id="btn-resenha-detalhes"><i class="fas fa-edit"></i> Resenha</button>
                        <button class="btn btn-compartilhar" id="btn-compartilhar-detalhes"><i class="fas fa-share-alt"></i> Compartilhar</button>
                    </div>
                    ${item.genres ? `<div class="elenco" style="margin-top:10px; color:#ccc; font-size: 0.95rem;"><strong>Gêneros:</strong> ${item.genres.map(g => g.name).join(', ')}</div>` : ''}
                    ${atoresHtml}
                </div>
            </div>
        </div>`;
    }

    // --- REATIVA OS BOTÕES (Ler Mais, Assistir, Lista) ---
    const btnReadMore = document.getElementById('btn-read-more');
    if (btnReadMore) {
        btnReadMore.addEventListener('click', () => {
            const textEl = document.getElementById('synopsis-content');
            const isClamped = textEl.classList.contains('clamped');

            if (isClamped) {
                textEl.classList.remove('clamped');
                textEl.classList.add('expanded');
                btnReadMore.innerText = "Ler menos";
            } else {
                textEl.classList.remove('expanded');
                textEl.classList.add('clamped');
                btnReadMore.innerText = "Ler mais";
            }
        });
    }

    const btnAssistir = document.getElementById('btn-assistir-detalhes');
    if (btnAssistir) {
        btnAssistir.addEventListener('click', () => {
            // 1. PREPARA A URL DO VÍDEO
            let videoUrl = (type === 'movie') ? `${MOVIE_PLAYER_BASE}/${imdbId || id}` : `${TV_PLAYER_BASE}/${id}`;

            // 2. ABRE O PLAYER PRIMEIRO (Prioridade Visual)
            // Isso garante que o usuário veja a tela preta do player abrindo antes de ser redirecionado
            openVideoModal(videoUrl);

            // 3. SALVA O PROGRESSO NO BANCO
            setupSaveProgress({
                id: item.id,
                type: type,
                titulo: titulo,
                poster: poster
            });

        });
    }

    // Configura botão Trailer na página de detalhes
    const btnTrailerDetalhes = document.getElementById('btn-trailer-detalhes');
    if (btnTrailerDetalhes) {
        // Busca trailer e habilita o botão se encontrado
        (async () => {
            const trailerUrl = await fetchTrailerUrl(type, id);
            if (trailerUrl) {
                btnTrailerDetalhes.onclick = () => {
                    openVideoModal(trailerUrl);
                    setupSaveProgress({ id: item.id, type: type, titulo: titulo, poster: poster });
                };
            } else {
                // Se não há trailer, oculta botão
                btnTrailerDetalhes.style.display = 'none';
            }
        })();
    }

    const btnLista = document.getElementById('btn-add-lista');
    if (btnLista) {
        updateListaButton(btnLista, id);
        btnLista.addEventListener('click', () => toggleMinhaLista({ id, type, titulo, poster, ano }, btnLista));
    }

    const btnFavorito = document.getElementById('btn-add-favorito');
    if (btnFavorito) {
        updateFavoritoButton(btnFavorito, id);
        btnFavorito.addEventListener('click', () => toggleFavorito({ id, type, titulo, poster, ano }, btnFavorito));
    }

    const btnResenha = document.getElementById('btn-resenha-detalhes');
    if (btnResenha) {
        btnResenha.addEventListener('click', () => {
            if (!currentUser || !userData) {
                return showToast("Faça login para resenhar!", "error");
            }
            const encodedTitle = encodeURIComponent(titulo);
            const encodedPoster = encodeURIComponent(poster);
            window.location.href = `minha-conta.html?action=review&id=${id}&title=${encodedTitle}&poster=${encodedPoster}&type=${type}&year=${ano}`;
        });
    }

    const btnCompartilhar = document.getElementById('btn-compartilhar-detalhes');
    if (btnCompartilhar) {
        btnCompartilhar.addEventListener('click', () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?id=${id}&type=${type}&title=${encodeURIComponent(titulo)}`;
            const shareText = `Assista a "${titulo}" no WinBry! 🎬🍿`;
            
            if (navigator.share) {
                navigator.share({
                    title: titulo,
                    text: shareText,
                    url: shareUrl
                }).then(() => {
                    showToast("Compartilhado com sucesso!", "success");
                }).catch((err) => {
                    if (err.name !== 'AbortError') {
                        showToast("Erro ao compartilhar.", "error");
                    }
                });
            } else {
                navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`)
                    .then(() => {
                        showToast("Link copiado para a área de transferência!", "success");
                    })
                    .catch(() => {
                        showToast("Erro ao copiar o link.", "error");
                    });
            }
        });
    }

    // --- CONTEÚDO RELACIONADO E SEÇÕES DE STREAMINGS ORDENADOS EM DETALHES ---
    try {
        const phrases = [
            "Assista também", "Títulos semelhantes", "Porque você assistiu...",
            "Clientes também assistiram", "Filmes relacionados",
            "Sugestões para você", "Conteúdo relacionado",
            "Você também pode gostar", "Mais como este",
            "Mais para explorar", "Se você gostou disso...",
            "Programas relacionados",
            "Você pode gostar", "Veja também",
            "Recomendado para você"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        // Busca conteúdo recomendado
        const recData = await fetchTMDB(`/${type}/${id}/recommendations`);
        let similarItems = (recData && recData.results) ? recData.results : [];

        // Fallback para similares se não houver recomendações
        if (similarItems.length === 0) {
            const simData = await fetchTMDB(`/${type}/${id}/similar`);
            similarItems = (simData && simData.results) ? simData.results : [];
        }

        // Filtro anti-hentai/adulto para animes
        if (type === 'tv' && item.genres && item.genres.some(g => g.id === 16)) {
            similarItems = filterAdultAnimes(similarItems);
        }

        if (similarItems && similarItems.length > 0) {
            const container = document.getElementById('details-container');
            if (container) {
                // Remove qualquer carrossel de recomendados já existente para evitar duplicatas
                const existingSimilar = container.querySelector('.similar-section-wrapper');
                if (existingSimilar) {
                    existingSimilar.remove();
                }
                const carouselInner = similarItems.slice(0, 15).map(sim => {
                    const simType = sim.media_type || type;
                    const simPoster = sim.poster_path ? `${IMG_BASE}${sim.poster_path}` : 'images/favicon.png';
                    const simTitle = sim.title || sim.name;
                    const simAno = (sim.release_date || sim.first_air_date || '????').substring(0, 4);
                    return `
                    <a href="detalhes.html?id=${sim.id}&type=${simType}" class="content-card" style="flex-shrink:0; width: 170px;">
                        <img src="${simPoster}" alt="${simTitle}" loading="lazy">
                        <div class="card-info">
                            <h3>${simTitle}</h3>
                            <p>${simAno}</p>
                        </div>
                    </a>`;
                }).join('');

                const similarHtml = `
                <div class="similar-section-wrapper container" style="margin-top: 50px; margin-bottom: 70px; padding: 0 20px;">
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; color: #fff;">${randomPhrase}</h2>
                    <div class="carousel-wrapper" style="position:relative;">
                        <button class="carousel-btn prev" style="left: -15px;"><i class="fas fa-chevron-left"></i></button>
                        <div class="carousel similar-carousel" style="display:flex; gap:15px; overflow-x:auto; scrollbar-width:none; padding:10px 0;">
                            ${carouselInner}
                        </div>
                        <button class="carousel-btn next" style="right: -15px;"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                `;

                const wrapperDiv = document.createElement('div');
                wrapperDiv.innerHTML = similarHtml;
                container.appendChild(wrapperDiv.firstElementChild);

                const carouselEl = container.querySelector('.similar-carousel');
                const prevBtn = container.querySelector('.similar-section-wrapper .prev');
                const nextBtn = container.querySelector('.similar-section-wrapper .next');
                if (carouselEl && prevBtn && nextBtn) {
                    prevBtn.onclick = () => carouselEl.scrollBy({ left: -340, behavior: 'smooth' });
                    nextBtn.onclick = () => carouselEl.scrollBy({ left: 340, behavior: 'smooth' });
                }
            }
        }
    } catch (simError) {
        console.error("Erro ao carregar conteúdo recomendado:", simError);
    }
}

function setupHeroBanner(item) {
    const bannerImg = document.querySelector('.banner-img');
    const heroTitle = document.querySelector('.hero-content h1');
    const heroDesc = document.querySelector('.hero-content p');
    const heroLink = document.querySelector('.hero-content .btn-info');
    const heroBtn = document.getElementById('btn-open-player');

    // Detecta se é filme ou série (o endpoint 'trending/all' traz essa info)
    const type = item.media_type || 'movie';

    if (bannerImg) bannerImg.src = `${BANNER_BASE}${item.backdrop_path}`;
    if (heroTitle) heroTitle.innerText = item.title || item.name;
    if (heroDesc) heroDesc.innerText = item.overview ? item.overview.substring(0, 150) + "..." : "";

    // Link "Mais Informações" corrigido com o tipo certo
    if (heroLink) heroLink.href = `detalhes.html?id=${item.id}&type=${type}`;

    if (heroBtn) {
        heroBtn.onclick = () => {
            fetchTMDB(`/${type}/${item.id}/external_ids`).then(ids => {
                const playId = ids.imdb_id || item.id;
                // Define a URL base correta dependendo do tipo
                const playerBase = (type === 'tv') ? TV_PLAYER_BASE : MOVIE_PLAYER_BASE;
                openVideoModal(`${playerBase}/${playId}`);
            });
        };
    }
}

function renderCarousel(sectionId, title, items, type) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const container = section.querySelector('.container');

    // 1. Limpa e coloca o título
    container.innerHTML = `<h2>${title}</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';

    // --- A CORREÇÃO MÁGICA AQUI ---
    // Criamos uma variável na memória para guardar todo o HTML
    let htmlAcumulado = '';

    items.forEach(item => {
        // Soma o HTML na variável (super rápido)
        htmlAcumulado += createCardHTML(item, type);
    });

    // Joga na tela UMA VEZ SÓ (a TV agradece!)
    carousel.innerHTML = htmlAcumulado;
    // -----------------------------

    // Botões de Navegação
    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });

    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(prev, carousel, next);
    container.appendChild(wrapper);
}

// --- HELPER FUNCTIONS ---

function getQualityBadge(item, type) {
    if (type !== 'movie') return 'HD';
    
    const releaseDateStr = item.release_date;
    if (!releaseDateStr) return 'HD';
    
    const releaseDate = new Date(releaseDateStr);
    const today = new Date();
    
    // Diferença em milissegundos convertida para dias
    const diffTime = today - releaseDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Se lançado há menos de 90 dias (ou lançamento futuro), é considerado qualidade de CINEMA
    if (diffDays <= 90) {
        return 'CINEMA';
    }
    return 'HD';
}

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

// =================================================================
// LOGIN COM GOOGLE
// ================================================================

function initGoogleLogin() {
    const btn = document.getElementById('btn-google-login');
    if (!btn) return;

    btn.onclick = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();

        try {
            showToast("Conectando ao Google...", "info");

            // Abre o Popup do Google
            const result = await auth.signInWithPopup(provider);
            const user = result.user;

            // Verifica/Cria usuário no Banco
            const userDoc = await db.collection('users').doc(user.uid).get();

            if (!userDoc.exists) {
                await db.collection('users').doc(user.uid).set({
                    username: user.displayName,
                    email: user.email,
                    profileImage: user.photoURL,
                    minhaLista: [],
                    history: [],
                    reviews: [],
                    favoritos: []
                });
                showToast("Conta criada! Redirecionando...", "success");
            } else {
                showToast(`Bem-vindo, ${user.displayName}!`, "success");
            }

            // Animação de saída antes de redirecionar
            const box = document.querySelector('.auth-box');
            if (box) box.style.transform = "scale(0.9) translateY(-20px)";
            if (box) box.style.opacity = "0";

            setTimeout(() => window.location.href = 'index.html', 1500);

        } catch (error) {
            console.error("ERRO DETALHADO GOOGLE:", error);

            // TRADUÇÃO DE ERROS COMUNS DO GOOGLE AUTH
            let msg = "Erro ao entrar com Google.";

            if (error.code === 'auth/popup-closed-by-user') {
                msg = "Você fechou a janela do Google antes de terminar.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                msg = "Muitas janelas abertas. Tente de novo.";
            } else if (error.code === 'auth/popup-blocked') {
                msg = "O navegador bloqueou o Popup. Permita popups para este site.";
            } else if (error.code === 'auth/unauthorized-domain') {
                msg = "Domínio não autorizado no Firebase. Configure no Console.";
            } else if (error.code === 'auth/operation-not-allowed') {
                msg = "Login Google não está ativado no painel do Firebase.";
            }

            showToast(msg, "error");
        }
    };
}

function initMinhaConta() {
    if (window.isMinhaContaInitialized) {
        console.log("Dashboard Minha Conta já inicializado. Ignorando escuta redundante.");
        return;
    }
    window.isMinhaContaInitialized = true;
    console.log("Iniciando Dashboard Minha Conta...");

    // 1. NAVEGAÇÃO DE ABAS DO DASHBOARD
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const tabs = document.querySelectorAll('.dashboard-tab');

    if (tabButtons.length > 0 && tabs.length > 0) {
        tabButtons.forEach(btn => {
            btn.onclick = () => {
                const targetTab = btn.getAttribute('data-tab');
                if (!targetTab) return; // Caso seja o botão de logout

                // Remove active de todos
                tabButtons.forEach(b => b.classList.remove('active'));
                tabs.forEach(t => t.classList.remove('active'));

                // Adiciona active no selecionado
                btn.classList.add('active');
                const targetTabEl = document.getElementById(targetTab);
                if (targetTabEl) targetTabEl.classList.add('active');
            };
        });
    }

    // Botão de atalho para ir para resenhas a partir do dashboard
    const btnGoToReviews = document.querySelector('.btn-go-to-reviews');
    if (btnGoToReviews) {
        btnGoToReviews.onclick = () => {
            const reviewsTabBtn = document.querySelector('.nav-tab-btn[data-tab="tab-reviews"]');
            if (reviewsTabBtn) reviewsTabBtn.click();
        };
    }

    // Botão de Compartilhar Resenhas do Perfil
    const btnShareProfileReviews = document.getElementById('btn-share-profile-reviews');
    if (btnShareProfileReviews) {
        btnShareProfileReviews.onclick = () => {
            if (!currentUser) {
                showToast("Faça login para compartilhar suas resenhas!", "warning");
                return;
            }
            const basePath = window.location.href.split('minha-conta.html')[0];
            const shareUrl = `${basePath}perfil.html?uid=${currentUser.uid}`;
            const shareText = `Confira meu perfil de resenhas no WinBry! 🎬🍿`;

            if (navigator.share) {
                navigator.share({
                    title: `Perfil Cinéfilo - WinBry`,
                    text: shareText,
                    url: shareUrl
                }).then(() => {
                    showToast("Perfil compartilhado com sucesso!", "success");
                }).catch((err) => {
                    if (err.name !== 'AbortError') {
                        showToast("Erro ao compartilhar.", "error");
                    }
                });
            } else {
                navigator.clipboard.writeText(`${shareText}\nLink: ${shareUrl}`)
                    .then(() => {
                        showToast("Link do seu perfil copiado com sucesso! Compartilhe com seus amigos. 🍿", "success");
                    })
                    .catch(() => {
                        showToast("Erro ao copiar o link do perfil.", "error");
                    });
            }
        };
    }

    // Logout do usuário
    const logoutBtnMinhaConta = document.querySelector('.btn-logout-danger') || document.querySelector('.btn-logout-dashboard');
    if (logoutBtnMinhaConta) {
        logoutBtnMinhaConta.onclick = () => {
            auth.signOut();
            showToast("Saiu da conta.", "info");
            setTimeout(() => window.location.href = 'login.html', 1000);
        };
    }

    // 2. ATUALIZAÇÃO DA TELA (UI) COM OS DADOS REAIS DO USUÁRIO
    const updateUI = () => {
        if (currentUser && userData) {
            // Textos originais e novos da Sidebar
            const nomeEl = document.getElementById('display-username');
            const nomeSidebar = document.getElementById('sidebar-username');
            const emailEl = document.getElementById('display-email');
            
            const imgEl = document.getElementById('profile-pic');
            const imgSidebar = document.getElementById('sidebar-profile-pic');

            const username = userData.username || currentUser.displayName || "Usuário";
            const profileImg = userData.profileImage || currentUser.photoURL || 'images/foto-generica.jpg';

            if (nomeEl) nomeEl.innerText = username;
            if (nomeSidebar) nomeSidebar.innerText = username;
            if (emailEl) emailEl.innerText = currentUser.email || "";
            
            if (imgEl) imgEl.src = profileImg;
            if (imgSidebar) imgSidebar.src = profileImg;

            // Atualiza estatísticas do dashboard
            updateStats();
            // Renderiza as resenhas
            renderReviews();
            // Renderiza os favoritos
            renderFavoritos();

            // Oculta/Exibe o card de boas-vindas com base nas resenhas do usuário
            const welcomeCard = document.querySelector('.overview-welcome-card');
            if (welcomeCard) {
                if (userData && userData.reviews && userData.reviews.length > 0) {
                    welcomeCard.style.display = 'none';
                } else {
                    welcomeCard.style.display = 'block';
                }
            }
        } else if (window.isAuthResolved && !currentUser) {
            console.log("Autenticação resolvida como deslogado. Cancelando atualização recursiva da UI do perfil.");
        } else {
            // Se ainda não carregou os dados da nuvem, tenta novamente em 200ms recursivamente
            // Isso evita travamento em "Carregando..." caso haja qualquer atraso na busca da nuvem
            setTimeout(updateUI, 200);
        }
    };

    updateUI();

    // 3. ATUALIZAR ESTATÍSTICAS DO DASHBOARD
    const updateStats = () => {
        const statCount = document.getElementById('stat-reviews-count');
        const statAverage = document.getElementById('stat-reviews-average');
        const statFavorites = document.getElementById('stat-favorites-count');
        const statWatchlist = document.getElementById('stat-watchlist-count');

        // Total de Resenhas
        const reviewsCount = userData && userData.reviews ? userData.reviews.length : 0;
        if (statCount) statCount.innerText = reviewsCount;

        // Média de Notas das Resenhas
        if (statAverage) {
            if (reviewsCount > 0) {
                const totalRating = userData.reviews.reduce((acc, curr) => acc + curr.rating, 0);
                const avg = totalRating / reviewsCount;
                statAverage.innerText = avg.toFixed(1);
            } else {
                statAverage.innerText = "0.0";
            }
        }

        // Total de Favoritos (Minhas Curtidas)
        const favoritesCount = userData && userData.favoritos ? userData.favoritos.length : 0;
        if (statFavorites) statFavorites.innerText = favoritesCount;

        // Total de Itens na Lista (Watchlist)
        const watchlistCount = userData && userData.minhaLista ? userData.minhaLista.length : 0;
        if (statWatchlist) statWatchlist.innerText = watchlistCount;
    };

    // 4. LÓGICA DE GERENCIAMENTO DE RESENHAS (CRUD LETTERBOXD)
    
    // Auxiliar: Gera o HTML estático das estrelas para a listagem (10 estrelas inteiras)
    const generateStaticStarsHTML = (nota) => {
        let html = '';
        for (let index = 1; index <= 10; index++) {
            if (index <= Math.floor(nota)) {
                html += '<i class="fas fa-star" style="font-size: 0.72rem; margin-right: 1px; color: #ffd700;"></i>';
            } else {
                html += '<i class="far fa-star" style="font-size: 0.72rem; margin-right: 1px; color: rgba(255,255,255,0.15);"></i>';
            }
        }
        return html;
    };

    // Alterna o texto de "Ver mais" / "Ver menos" de resenhas longas globalmente
    window.toggleReadMore = function(btn) {
        const container = btn.parentNode;
        const shortText = container.querySelector('.review-short-text');
        const fullText = container.querySelector('.review-full-text');
        if (shortText && fullText) {
            if (shortText.style.display === 'none') {
                shortText.style.display = 'inline';
                fullText.style.display = 'none';
                btn.innerText = 'Ver mais';
            } else {
                shortText.style.display = 'none';
                fullText.style.display = 'inline';
                btn.innerText = 'Ver menos';
            }
        }
    };

    // Renderiza a lista de resenhas na aba
    const renderReviews = () => {
        const listContainer = document.getElementById('reviews-list-container');
        if (!listContainer) return;

        if (!userData || !userData.reviews || userData.reviews.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-reviews-state">
                    <i class="fas fa-comment-slash"></i>
                    <h3>Sua estante de resenhas está vazia.</h3>
                    <p>Comece a resenhar seus filmes favoritos clicando em "Escrever Resenha"!</p>
                </div>
            `;
            return;
        }

        // Ordena por data mais recente
        const sortedReviews = [...userData.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        listContainer.innerHTML = sortedReviews.map(review => {
            const date = new Date(review.createdAt);
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const starsHtml = generateStaticStarsHTML(review.rating);
            
            const isLong = review.reviewBody && review.reviewBody.length > 280;
            const bodyHtml = isLong ? `<span class="review-short-text">${review.reviewBody.substring(0, 260)}...</span><span class="review-full-text" style="display:none;">${review.reviewBody}</span> <button type="button" class="btn-read-more" onclick="toggleReadMore(this)" style="background:none; border:none; color:#e50914; font-weight:bold; cursor:pointer; padding:0; font-size:0.82rem; display:inline; outline:none; text-transform:uppercase; letter-spacing:0.5px; margin-left:5px;">Ver mais</button>` : `<span>${review.reviewBody || ''}</span>`;

            return `
                <div class="review-card" data-id="${review.id}">
                    <div class="review-card-movie-poster">
                        <img src="${review.moviePoster}" alt="${review.movieTitle}" onerror="this.src='images/favicon.png'" />
                    </div>
                    <div class="review-card-content">
                        <h3 class="review-card-movie-title">
                            ${review.movieTitle}
                        </h3>
                        <div class="review-card-rating">
                            <span class="review-card-stars">${starsHtml}</span>
                            <span class="score-text" style="font-size:0.75rem; margin-left:5px;">${review.rating.toFixed(1)}</span>
                            <span class="review-card-date">• ${dateStr}</span>
                        </div>
                        <h4 class="review-card-title">"${review.reviewTitle}"</h4>
                        <p class="review-card-body" style="font-size: 0.92rem; color: #bbb; line-height: 1.6; white-space: pre-wrap;">${bodyHtml}</p>
                        <div class="review-card-actions" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
                            <a href="detalhes.html?id=${review.movieId}&type=${review.movieType || 'movie'}" class="btn btn-primary btn-review-action" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none; padding: 6px 14px; font-size: 0.8rem; height: auto; font-weight: bold; background: #e50914; border: 1px solid #e50914; border-radius: 4px; color: #fff;">
                                <i class="fas fa-play"></i> Assistir Agora
                            </a>
                            <button class="btn-review-action btn-edit-review" onclick="editReview('${review.id}')" style="height: auto; padding: 6px 14px;">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-review-action btn-delete-review" onclick="deleteReview('${review.id}')" style="height: auto; padding: 6px 14px;">
                                <i class="fas fa-trash-alt"></i> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Renderiza a lista de favoritos na aba Visão Geral
    const renderFavoritos = () => {
        const listContainer = document.getElementById('favoritos-list-container');
        if (!listContainer) return;

        if (!userData || !userData.favoritos || userData.favoritos.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-favoritos-state" style="grid-column: 1 / -1; text-align:center; padding:30px 20px; color:#555; background:rgba(255,255,255,0.01); border: 1px dashed #222; border-radius:8px; width: 100%;">
                    <p style="margin:0; font-size:0.9rem;">Nenhuma produção favoritada ainda. Acesse os detalhes e clique no ❤️!</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = userData.favoritos.map(item => `
            <div class="favorito-card" style="position:relative; width:120px; flex-shrink:0; transition: transform 0.3s;" onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'">
                <a href="detalhes.html?id=${item.id}&type=${item.type}" style="text-decoration:none; display:block;">
                    <img src="${item.poster}" alt="${item.titulo}" style="width:100%; height:170px; object-fit:cover; border-radius:6px; border:1px solid #282828; box-shadow:0 8px 20px rgba(0,0,0,0.5);" onerror="this.src='images/favicon.png'" />
                    <h4 style="font-size:0.8rem; color:#fff; margin-top:8px; font-weight:600; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%;">${item.titulo}</h4>
                </a>
                <button class="btn-remove-favorito" onclick="removeFavorito('${item.id}')" style="position:absolute; top:-5px; right:-5px; background:#e50914; border:none; color:#fff; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 8px rgba(0,0,0,0.4); transition: transform 0.2s;" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform='scale(1)'" title="Remover dos Favoritos">
                    <i class="fas fa-times" style="font-size: 0.75rem;"></i>
                </button>
            </div>
        `).join('');
    };

    // --- PESQUISA TMDB E SELEÇÃO DE PRODUÇÃO NO MODAL ---
    const reviewSearchInput = document.getElementById('review-movie-search');
    const searchDropdown = document.getElementById('search-results-dropdown');
    let searchTimeout;

    if (reviewSearchInput && searchDropdown) {
        reviewSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length < 2) {
                searchDropdown.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(async () => {
                // Busca geral de filmes/séries no TMDB usando pesquisa múltipla
                const data = await fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
                if (data && data.results) {
                    // Filtra apenas resultados válidos de filme ou tv que possuam título ou nome
                    const items = data.results.filter(item => 
                        (item.media_type === 'movie' || item.media_type === 'tv') && 
                        (item.title || item.name)
                    );

                    if (items.length > 0) {
                        searchDropdown.innerHTML = items.slice(0, 5).map(item => {
                            const title = item.title || item.name;
                            const date = item.release_date || item.first_air_date || '';
                            const year = date ? date.substring(0, 4) : '????';
                            const typeTxt = item.media_type === 'movie' ? 'Filme' : 'Série';
                            const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
                            
                            return `
                                <div class="search-result-item" 
                                     data-id="${item.id}" 
                                     data-title="${title}" 
                                     data-poster="${poster}" 
                                     data-type="${item.media_type}" 
                                     data-year="${year}">
                                    <img src="${poster}" class="search-result-poster" onerror="this.src='images/favicon.png'" />
                                    <div class="search-result-info">
                                        <span class="search-result-title">${title} (${year})</span>
                                        <span class="search-result-year">${typeTxt}</span>
                                    </div>
                                </div>
                            `;
                        }).join('');
                        searchDropdown.style.display = 'block';

                        // Configura clique de seleção para os resultados listados
                        searchDropdown.querySelectorAll('.search-result-item').forEach(el => {
                            el.onclick = () => {
                                const id = el.getAttribute('data-id');
                                const title = el.getAttribute('data-title');
                                const poster = el.getAttribute('data-poster');
                                const type = el.getAttribute('data-type');
                                const year = el.getAttribute('data-year');

                                selectMovie(id, title, poster, type, year);
                            };
                        });
                    } else {
                        searchDropdown.innerHTML = `<div style="padding:15px; color:#666; font-size:0.9rem; text-align:center;">Nenhum resultado encontrado</div>`;
                        searchDropdown.style.display = 'block';
                    }
                }
            }, 300);
        });

        // Fecha a caixa flutuante ao clicar em qualquer outra parte da página
        document.addEventListener('click', (e) => {
            if (!reviewSearchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });
    }

    // Define a produção selecionada no formulário de resenha
    const selectMovie = (id, title, poster, type, year) => {
        document.getElementById('review-movie-id').value = id;
        document.getElementById('review-movie-title').value = title;
        document.getElementById('review-movie-poster').value = poster;
        document.getElementById('review-movie-type').value = type;

        document.getElementById('selected-movie-poster-img').src = poster;
        document.getElementById('selected-movie-title-txt').innerText = title;
        document.getElementById('selected-movie-year').innerText = year || '';

        document.getElementById('movie-search-section').style.display = 'none';
        document.getElementById('selected-movie-container').style.display = 'flex';
        
        if (searchDropdown) searchDropdown.style.display = 'none';
        if (reviewSearchInput) reviewSearchInput.value = '';
    };

    // Desmarca a produção selecionada para permitir nova pesquisa
    const deselectMovie = () => {
        document.getElementById('review-movie-id').value = '';
        document.getElementById('review-movie-title').value = '';
        document.getElementById('review-movie-poster').value = '';
        document.getElementById('review-movie-type').value = 'movie';

        document.getElementById('movie-search-section').style.display = 'block';
        document.getElementById('selected-movie-container').style.display = 'none';
    };

    const btnRemoveSelected = document.getElementById('btn-remove-selected-movie');
    if (btnRemoveSelected) {
        btnRemoveSelected.onclick = deselectMovie;
    }

    // --- ESTRELAS INTERATIVAS (0 a 10) ---
    const starsContainer = document.getElementById('star-rating-interactive');
    const ratingInput = document.getElementById('review-rating-val');
    const ratingText = document.getElementById('rating-display-value');

    const drawInteractiveStars = (nota) => {
        if (!starsContainer) return;
        const stars = starsContainer.querySelectorAll('i');
        stars.forEach(star => {
            const index = parseInt(star.getAttribute('data-index'));
            if (index <= nota) {
                star.className = 'fas fa-star';
            } else {
                star.className = 'far fa-star';
            }
        });
    };

    if (starsContainer) {
        const stars = starsContainer.querySelectorAll('i');
        
        stars.forEach(star => {
            // Hover: preenche as estrelas inteiras com base no index
            star.addEventListener('mousemove', () => {
                const index = parseInt(star.getAttribute('data-index'));
                drawInteractiveStars(index);
                if (ratingText) ratingText.innerText = `${index}.0 Estrelas`;
            });

            // Clique: fixa o valor da nota inteira (1 a 10) no input e atualiza
            star.addEventListener('click', () => {
                const index = parseInt(star.getAttribute('data-index'));
                if (ratingInput) ratingInput.value = index;
                if (ratingText) ratingText.innerText = `${index}.0 Estrelas`;
                drawInteractiveStars(index);
            });
        });

        // Retorno: quando o cursor sai do painel de estrelas, exibe a nota que foi clicada/salva
        starsContainer.addEventListener('mouseleave', () => {
            const currentVal = parseFloat(ratingInput ? ratingInput.value : 0);
            drawInteractiveStars(currentVal);
            if (ratingText) {
                ratingText.innerText = `${currentVal.toFixed(1)} Estrelas`;
            }
        });

        // Botão para Zerar a Nota (0 Estrelas)
        const btnZeroRating = document.getElementById('btn-zero-rating');
        if (btnZeroRating) {
            btnZeroRating.onclick = () => {
                if (ratingInput) ratingInput.value = "0";
                if (ratingText) ratingText.innerText = "0.0 Estrelas";
                drawInteractiveStars(0);
            };
        }
    }

    // --- FUNÇÕES GLOBAIS DO CRUD (WINDOW) ---

    // Abertura do formulário preenchido no modo Edição
    window.editReview = (id) => {
        const review = userData.reviews.find(r => r.id === id);
        if (!review) return;

        const modal = document.getElementById('review-modal');
        if (!modal) return;

        // Define o estado visual para Edição
        document.getElementById('review-modal-title').innerText = "Editar Resenha";
        document.getElementById('review-edit-id').value = review.id;
        
        // Define e renderiza a produção selecionada
        selectMovie(review.movieId, review.movieTitle, review.moviePoster, review.movieType || 'movie', '');

        // Preenche a nota selecionada e redesenha as estrelas
        const ratingVal = parseFloat(review.rating);
        document.getElementById('review-rating-val').value = ratingVal;
        if (ratingText) ratingText.innerText = `${ratingVal.toFixed(1)} Estrelas`;
        drawInteractiveStars(ratingVal);

        // Preenche os textos de título e descrição
        document.getElementById('review-title').value = review.reviewTitle;
        document.getElementById('review-body').value = review.reviewBody;

        modal.classList.add('active');
    };

    // Exclusão definitiva de resenha
    window.deleteReview = async (id) => {
        if (!confirm("Deseja realmente remover esta resenha cinéfila definitivamente?")) return;

        userData.reviews = userData.reviews.filter(r => r.id !== id);
        showToast("Resenha removida com sucesso!", "info");
        
        await saveUserDataToCloud();
        renderReviews();
        updateStats();
    };

    // --- CONTROLE DE SUBMIT E FECHAMENTO DO MODAL DE RESENHAS ---
    const reviewForm = document.getElementById('reviewForm');
    const reviewModal = document.getElementById('review-modal');
    
    // Abre formulário para criação (modo Nova Resenha)
    const btnOpenReview = document.getElementById('btn-open-review-form');
    if (btnOpenReview && reviewModal) {
        btnOpenReview.onclick = () => {
            document.getElementById('review-modal-title').innerText = "Nova Resenha";
            document.getElementById('review-edit-id').value = "";
            
            // Reseta produção selecionada
            deselectMovie();

            // Reseta nota e estrelas
            if (ratingInput) ratingInput.value = "0";
            if (ratingText) ratingText.innerText = "0.0 Estrelas";
            drawInteractiveStars(0);

            // Reseta formulário de textos
            reviewForm.reset();

            reviewModal.classList.add('active');
        };
    }

    // Fechar modal
    const closeReviewModal = () => {
        if (reviewModal) reviewModal.classList.remove('active');
    };

    const btnCloseReview = document.getElementById('btn-close-review-modal');
    const btnCancelReview = document.getElementById('btn-cancel-review');

    if (btnCloseReview) btnCloseReview.onclick = closeReviewModal;
    if (btnCancelReview) btnCancelReview.onclick = closeReviewModal;

    // Envio do formulário (Criação e Edição no Firestore)
    if (reviewForm) {
        reviewForm.onsubmit = async (e) => {
            e.preventDefault();

            const movieId = document.getElementById('review-movie-id').value;
            const ratingVal = parseFloat(document.getElementById('review-rating-val').value || 0);

            // Validações básicas de segurança
            if (!movieId) {
                return showToast("Por favor, pesquise e selecione um filme/série!", "error");
            }
            if (ratingVal < 0) {
                return showToast("Por favor, atribua uma nota válida!", "error");
            }

            const editId = document.getElementById('review-edit-id').value;
            const title = document.getElementById('review-title').value.trim();
            const body = document.getElementById('review-body').value.trim();

            showToast("Salvando resenha...", "info");

            try {
                if (editId) {
                    // Modo Edição (Update)
                    const index = userData.reviews.findIndex(r => r.id === editId);
                    if (index !== -1) {
                        userData.reviews[index].rating = ratingVal;
                        userData.reviews[index].reviewTitle = title;
                        userData.reviews[index].reviewBody = body;
                        
                        // Atualiza a produção caso ela tenha sido trocada
                        userData.reviews[index].movieId = movieId;
                        userData.reviews[index].movieTitle = document.getElementById('review-movie-title').value;
                        userData.reviews[index].moviePoster = document.getElementById('review-movie-poster').value;
                        userData.reviews[index].movieType = document.getElementById('review-movie-type').value;
                    }
                    showToast("Resenha editada com sucesso!", "success");
                } else {
                    // Modo Criação (Create)
                    const reviewObj = {
                        id: 'review_' + Date.now(),
                        movieId: movieId,
                        movieTitle: document.getElementById('review-movie-title').value,
                        moviePoster: document.getElementById('review-movie-poster').value,
                        movieType: document.getElementById('review-movie-type').value,
                        rating: ratingVal,
                        reviewTitle: title,
                        reviewBody: body,
                        createdAt: new Date().toISOString()
                    };

                    userData.reviews.unshift(reviewObj);
                    showToast("Resenha publicada com sucesso!", "success");
                }

                // Salva na nuvem Firebase
                await saveUserDataToCloud();
                
                // Fecha modal e atualiza telas
                closeReviewModal();
                updateUI();

            } catch (error) {
                console.error("Erro ao salvar resenha:", error);
                showToast("Erro ao processar resenha.", "error");
            }
        };
    }

    // --- LÓGICA ORIGINAL DE UPLOAD DE FOTO, SAIR E MODAL EDITAR PERFIL ---
    
    // Upload de Foto
    const upload = document.getElementById('upload-pic');
    if (upload) {
        upload.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const base64 = ev.target.result;
                    // Salva no Firestore e atualiza
                    userData.profileImage = base64;
                    await db.collection('users').doc(currentUser.uid).update({
                        profileImage: base64
                    });
                    updateUI();
                    initHeaderUser();
                    showToast("Foto de perfil atualizada!", "success");
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // Modal de Edição (Apenas Nome)
    const btnEdit = document.getElementById('btn-edit-profile');
    const modal = document.getElementById('edit-profile-modal');
    const btnCancel = document.getElementById('btn-cancel-edit');
    const formEdit = document.getElementById('editProfileForm');

    if (btnEdit && modal) {
        btnEdit.onclick = () => {
            const nomeSalvo = (userData && userData.username) ? userData.username : "";
            document.getElementById('edit-name').value = nomeSalvo || currentUser.displayName || "";
            modal.classList.add('active');
        };

        btnCancel.onclick = () => modal.classList.remove('active');

        formEdit.onsubmit = async (e) => {
            e.preventDefault();
            const newName = document.getElementById('edit-name').value.trim();

            if (newName === (userData.username || currentUser.displayName)) {
                return showToast("Nenhuma alteração detectada.", "info");
            }

            showToast("Atualizando nome...", "info");

            try {
                await db.collection('users').doc(currentUser.uid).update({
                    username: newName
                });
                try { await currentUser.updateProfile({ displayName: newName }); } catch (err) { console.log("Google Auth display name sync skipped"); }

                userData.username = newName;
                updateUI();
                initHeaderUser();
                modal.classList.remove('active');
                showToast("Nome de perfil atualizado!", "success");

            } catch (error) {
                console.error(error);
                showToast("Erro ao atualizar nome.", "error");
            }
        };
    }

    // Botão Limpar Histórico do Player
    const btnClearHistory = document.getElementById('btn-clear-history');
    if (btnClearHistory) {
        btnClearHistory.onclick = async () => {
            if (!currentUser || !userData) return showToast("Faça login para gerenciar dados!", "error");
            if (!confirm("Deseja realmente limpar todo o seu histórico do player (Continuar Assistindo) definitivamente?")) return;
            
            showToast("Limpando histórico...", "info");
            userData.history = [];
            
            try {
                await saveUserDataToCloud();
                showToast("Histórico de reprodução limpo!", "success");
                
                // Recarrega a aba se ela estiver aberta em alguma tela
                loadContinueWatching();
            } catch (err) {
                console.error("Erro ao salvar limpeza do histórico:", err);
                showToast("Erro ao sincronizar dados na nuvem.", "error");
            }
        };
    }

    // Botão Sair original
    const btnLogout = document.querySelector('.btn-logout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            auth.signOut();
            showToast("Saiu da conta.", "info");
            setTimeout(() => window.location.href = 'login.html', 1000);
        };
    }

    // --- ATIVAÇÃO AUTOMÁTICA DE MODAL DE RESENHA VIA QUERY PARAM (Kauan - WinBry) ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'review') {
        const id = urlParams.get('id');
        const title = urlParams.get('title');
        const poster = urlParams.get('poster');
        const type = urlParams.get('type') || 'movie';
        const year = urlParams.get('year') || '';

        // Limpa os parâmetros de URL para evitar disparos repetidos no refresh
        window.history.replaceState({}, document.title, window.location.pathname);

        // 1. Alterna a visualização para a aba de Resenhas no Dashboard
        const tabResenhasBtn = document.querySelector('.nav-tab-btn[data-tab="tab-reviews"]');
        if (tabResenhasBtn) {
            tabResenhasBtn.click(); // Simula o clique para abrir a aba correspondente
        }

        // 2. Abre o modal e pré-seleciona a obra usando selectMovie
        if (id && title && poster && reviewModal) {
            document.getElementById('review-modal-title').innerText = "Nova Resenha";
            document.getElementById('review-edit-id').value = "";
            
            // Reseta antes e pré-seleciona o filme desejado
            deselectMovie();
            selectMovie(id, title, poster, type, year);

            // Reseta nota e estrelas
            if (ratingInput) ratingInput.value = "0";
            if (ratingText) ratingText.innerText = "0.0 Estrelas";
            drawInteractiveStars(0);

            // Reseta formulário de textos
            reviewForm.reset();

            // Abre o modal
            reviewModal.classList.add('active');
        }
    }
}

function initHeaderUser() {
    const btn = document.getElementById('user-action');
    if (!btn) return;
    if (currentUser) {
        // Verifica se userData existe antes de pegar a foto
        const img = (userData && userData.profileImage) ? userData.profileImage : 'images/favicon.png';

        // Verifica se userData existe antes de pegar o nome e fazer o split
        const nome = (userData && userData.username) ? userData.username.split(' ')[0] : 'Perfil';
        btn.innerHTML = `<img src="${img}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;object-fit:cover;"> ${nome}`;
        btn.href = 'minha-conta.html';
        btn.classList.remove('btn-primary');
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
    } else {
        btn.innerHTML = 'Entrar';
        btn.href = 'login.html';
        btn.classList.add('btn-primary');
        btn.style.display = '';
    }
}

function initSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-icon');
    const searchBox = document.querySelector('.search-box');

    // Função para abrir/fechar
    const toggleSearch = () => {
        searchBox.classList.toggle('active'); // Adiciona/Remove classe 'active'

        if (searchBox.classList.contains('active')) {
            input.style.display = 'block'; // Garante que o input apareça
            setTimeout(() => input.focus(), 100); // Foca para digitar
        } else {
            setTimeout(() => { input.style.display = 'none'; }, 300); // Esconde depois da animação
        }
    };

    // Função de pesquisar (Enter ou clicar na lupa se já estiver aberto)
    const go = () => {
        if (input.value) {
            const path = window.location.pathname;
            let targetPage = 'filmes.html';
            let extra = '';
            if (path.includes('series')) targetPage = 'series.html';
            else if (path.includes('animes')) targetPage = 'animes.html';
            else {
                extra = '&multi=true';
            }

            window.location.href = `${targetPage}?search=${encodeURIComponent(input.value)}${extra}`;
        }
    };

    if (btn) {
        btn.onclick = (e) => {
            // Se for mobile, alterna a barra. Se for PC, mantém comportamento padrão
            if (window.innerWidth <= 768) {
                // Se já estiver aberto e tiver texto, pesquisa. Senão, alterna.
                if (searchBox.classList.contains('active') && input.value) {
                    go();
                } else {
                    toggleSearch();
                }
            } else {
                go();
            }
        };
    }

    if (input) {
        input.onkeypress = (e) => { if (e.key === 'Enter') go(); };
    }
}

function openVideoModal(url) {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    if (modal && iframe) { 
        iframe.src = url; 
        modal.classList.add('show'); 
        
        // Oculta os botões flutuantes para não cobrir a tela do player
        const bryiaBtn = document.getElementById('bryia-fab');
        const surpriseBtn = document.querySelector('.surpreenda-fab');
        if (bryiaBtn) bryiaBtn.style.display = 'none';
        if (surpriseBtn) surpriseBtn.style.display = 'none';

        // Injeta dinamicamente o botão de Picture-in-Picture premium
        injectPipButton();
    }
}
function togglePictureInPicture() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    if (!modal || !iframe) return;

    // 1. SUPORTE A REAL PICTURE-IN-PICTURE (OS-LEVEL - DRAGGABLE & RESIZABLE)
    // Funciona perfeitamente em Chrome, Edge, Opera e Opera GX
    if ('documentPictureInPicture' in window) {
        try {
            // Se já tiver uma janela PiP aberta, fecha ela
            if (window.pipWindowInstance) {
                window.pipWindowInstance.close();
                return;
            }

            // O video-wrapper é o container do iframe
            const videoWrapper = iframe.parentNode || iframe;
            const parent = videoWrapper.parentNode;
            
            // Cria um placeholder na DOM original para guardar o lugar do player
            const placeholder = document.createElement('div');
            placeholder.id = 'video-placeholder';
            parent.insertBefore(placeholder, videoWrapper);

            // Abre a janela PiP flutuante nativa do sistema operacional (Draggable & Resizable)
            documentPictureInPicture.requestWindow({
                width: 720,
                height: 405,
            }).then(pipWindow => {
                window.pipWindowInstance = pipWindow;

                // Move o container do iframe para a janela PiP
                pipWindow.document.body.appendChild(videoWrapper);
                
                // Estiliza a janela PiP para ficar preenchida e perfeita
                const style = pipWindow.document.createElement('style');
                style.textContent = `
                    body { margin: 0; padding: 0; background: #000; overflow: hidden; height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .video-wrapper { width: 100vw !important; height: 100vh !important; padding-bottom: 0 !important; }
                    iframe { width: 100% !important; height: 100% !important; border: none; }
                `;
                pipWindow.document.head.appendChild(style);

                // Fecha o modal original temporariamente para ficar limpo
                modal.classList.remove('show');

                // Quando a janela PiP for fechada pelo usuário, restaura o player no modal original
                pipWindow.addEventListener('pagehide', () => {
                    const backPlaceholder = document.getElementById('video-placeholder');
                    if (backPlaceholder) {
                        backPlaceholder.parentNode.insertBefore(videoWrapper, backPlaceholder);
                        backPlaceholder.remove();
                    }
                    window.pipWindowInstance = null;
                    
                    // Reabre o modal de volta
                    modal.classList.add('show');
                });
                
                showToast("Picture-in-Picture ativado! Arraste e redimensione como desejar na sua tela.", "success");
            }).catch(err => {
                console.error(err);
                fallbackInAppPiP(modal);
            });
        } catch (err) {
            console.error(err);
            fallbackInAppPiP(modal);
        }
    } else {
        // 2. FALLBACK PARA NAVEGADORES SEM DPip (Firefox / Safari)
        fallbackInAppPiP(modal);
    }
}
function fallbackInAppPiP(modal) {
    modal.classList.toggle('pip-active');
    if (modal.classList.contains('pip-active')) {
        showToast("Picture-in-Picture embutido ativado! Para flutuar fora do navegador, use a função nativa do Firefox.", "success");
    } else {
        showToast("Picture-in-Picture desativado.", "info");
    }
}
function injectPipButton() {
    const modalContent = document.querySelector('.video-modal-content');
    if (!modalContent || document.getElementById('btn-pip-global')) return;

    const pipBtn = document.createElement('button');
    pipBtn.id = 'btn-pip-global';
    pipBtn.className = 'btn-pip-custom';
    pipBtn.title = "Picture in Picture (Minimizar Tela)";
    pipBtn.innerHTML = '<i class="fas fa-window-restore"></i>';
    
    modalContent.appendChild(pipBtn);
    pipBtn.onclick = togglePictureInPicture;
}
function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('video-iframe');
    if (modal && iframe) { 
        // Fecha janela PiP nativa do OS se estiver aberta
        if (window.pipWindowInstance) {
            window.pipWindowInstance.close();
        }

        modal.classList.remove('show'); 
        modal.classList.remove('pip-active'); // Desativa o PiP in-app ao fechar
        iframe.src = ''; 
        
        // Reexibe os botões flutuantes se o usuário estiver logado
        const bryiaBtn = document.getElementById('bryia-fab');
        const surpriseBtn = document.querySelector('.surpreenda-fab');
        if (currentUser) {
            if (bryiaBtn) bryiaBtn.style.display = 'flex';
            if (surpriseBtn) surpriseBtn.style.display = 'flex';
        }
    }
}
function initVideoModal() {
    const close = document.getElementById('close-player');
    if (close) close.onclick = () => { closeVideoModal(); };
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

// =================================================================
// 6. LÓGICA DE CONTINUAR ASSISTINDO
// =================================================================

function setupSaveProgress(itemData) {
    // Guarda os dados do filme atual na variável global quando abre o player
    currentVideoContext = itemData;

    // Se for série ou anime, mostra inputs de temp/ep. Se filme, esconde.
    const serieInputs = document.getElementById('serie-inputs');
    if (serieInputs) {
        serieInputs.style.display = (itemData.type === 'tv' || itemData.type === 'anime') ? 'flex' : 'none';
    }

    // Tenta preencher os inputs se já tiver progresso salvo antes no Firestore
    if (userData && userData.history) {
        const saved = userData.history.find(h => String(h.id) === String(itemData.id));
        if (saved) {
            document.getElementById('stop-hour').value = saved.progress.h || 0;
            document.getElementById('stop-min').value = saved.progress.m || 0;
            if (itemData.type === 'tv' || itemData.type === 'anime') {
                document.getElementById('current-season').value = saved.progress.s || 1;
                document.getElementById('current-episode').value = saved.progress.ep || 1;
            }
        } else {
            document.getElementById('stop-hour').value = '';
            document.getElementById('stop-min').value = '';
            if (itemData.type === 'tv' || itemData.type === 'anime') {
                document.getElementById('current-season').value = 1;
                document.getElementById('current-episode').value = 1;
            }
        }
    } else {
        document.getElementById('stop-hour').value = '';
        document.getElementById('stop-min').value = '';
        if (itemData.type === 'tv' || itemData.type === 'anime') {
            document.getElementById('current-season').value = 1;
            document.getElementById('current-episode').value = 1;
        }
    }
}

// Funções Atualizadas para Cloud

function toggleMinhaLista(item, btn) {
    if (!currentUser || !userData) return showToast("Faça login para salvar!", "error");

    const list = userData.minhaLista || [];
    const exists = list.find(i => String(i.id) === String(item.id));

    if (exists) {
        userData.minhaLista = list.filter(i => String(i.id) !== String(item.id));
        showToast("Removido da Lista", "info");
    } else {
        userData.minhaLista.push(item);
        showToast("Adicionado à Lista", "success");
    }

    updateListaButton(btn, item.id);
    saveUserDataToCloud(); // Salva na nuvem
}

function updateListaButton(btn, id) {
    if (!userData || !btn) return;
    const exists = (userData.minhaLista && userData.minhaLista.some(i => String(i.id) === String(id)));
    if (exists) {
        btn.innerHTML = '<i class="fas fa-check"></i> Na Lista';
        btn.classList.add('active');
        btn.style.backgroundColor = '#2ecc71';
        btn.style.borderColor = '#2ecc71';
        btn.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.4)';
        btn.style.color = '#ffffff';
    } else {
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Minha Lista';
        btn.classList.remove('active');
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = 'rgba(255, 140, 0, 0.4)';
        btn.style.boxShadow = '0 0 10px rgba(255, 140, 0, 0.15)';
        btn.style.color = '#ffffff';
    }
}


function initMinhaListaPage() {
    const container = document.getElementById('lista-container');
    if (!container) return;

    // Se o Firebase concluiu a autenticação e os dados do Firestore estão carregados
    if (currentUser && userData) {
        if (!userData.minhaLista || !userData.minhaLista.length) {
            container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-film" style="font-size: 3rem; margin-bottom: 20px; color: #555;"></i>
                <h3 style="font-size: 1.3rem; color: #aaa; font-weight: 500;">Sua lista está vazia.</h3>
                <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Adicione filmes e séries clicando no botão "Minha Lista" na página de detalhes!</p>
            </div>`;
            return;
        }

        container.innerHTML = userData.minhaLista.map(item => `
        <div class="content-card-wrapper" style="animation: fadeInUp 0.4s ease-out;">
            <a href="detalhes.html?id=${item.id}&type=${item.type}" class="content-card">
                <img src="${item.poster}" loading="lazy" onerror="this.src='images/favicon.png'">
                <div class="card-info"><h3>${item.titulo}</h3></div>
            </a>
            <button onclick="removeItemLista('${item.id}')" class="btn-remove-lista" title="Remover da Lista"><i class="fas fa-trash"></i> Remover</button>
        </div>`).join('');
    } 
    // Se a autenticação foi resolvida mas não há usuário conectado (deslogado)
    else if (window.isAuthResolved && !currentUser) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <i class="fas fa-sign-in-alt" style="font-size: 3rem; margin-bottom: 20px; color: #e50914;"></i>
            <h3 style="font-size: 1.3rem; color: #aaa; font-weight: 500;">Você precisa fazer login para acessar sua lista.</h3>
            <a href="login.html" class="btn btn-primary" style="margin-top: 20px; display: inline-flex; align-items: center; gap: 8px;">
                <i class="fas fa-user"></i> Entrar
            </a>
        </div>`;
    } 
    // Se ainda está autenticando ou carregando dados da nuvem (Firestore)
    else {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 80px 20px;">
            <i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 20px; color: #e50914;"></i>
            <h3 style="font-size: 1.3rem; color: #aaa; font-weight: 500;">Buscando sua lista na nuvem...</h3>
        </div>`;
        // Tenta renderizar novamente em 200ms assim que os dados estiverem disponíveis
        setTimeout(initMinhaListaPage, 200);
    }
}

window.removeItemLista = function (id) {
    if (!userData) return;
    userData.minhaLista = userData.minhaLista.filter(i => String(i.id) !== String(id));
    saveUserDataToCloud();
    initMinhaListaPage();
    showToast("Item removido da lista.", "info");

    // Sincroniza dinamicamente a contagem no Dashboard de perfil
    const statWatchlist = document.getElementById('stat-watchlist-count');
    if (statWatchlist) statWatchlist.innerText = userData.minhaLista.length;
};

function toggleFavorito(item, btn) {
    if (!currentUser || !userData) return showToast("Faça login para favoritar!", "error");

    if (!userData.favoritos) userData.favoritos = [];
    const list = userData.favoritos;
    const exists = list.find(i => String(i.id) === String(item.id));

    if (exists) {
        userData.favoritos = list.filter(i => String(i.id) !== String(item.id));
        showToast("Removido dos Favoritos", "info");
    } else {
        userData.favoritos.push(item);
        showToast("Adicionado aos Favoritos", "success");
    }

    updateFavoritoButton(btn, item.id);
    saveUserDataToCloud();
}

function updateFavoritoButton(btn, id) {
    if (!userData || !btn) return;
    const exists = (userData.favoritos && userData.favoritos.some(i => String(i.id) === String(id)));
    if (exists) {
        btn.innerHTML = '<i class="fas fa-heart"></i> Favoritado';
        btn.classList.add('active');
        btn.style.backgroundColor = '#ff2a3b';
        btn.style.borderColor = '#ff2a3b';
        btn.style.boxShadow = '0 0 15px rgba(255, 42, 59, 0.5)';
        btn.style.color = '#ffffff';
    } else {
        btn.innerHTML = '<i class="far fa-heart"></i> Favoritar';
        btn.classList.remove('active');
        btn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        btn.style.borderColor = 'rgba(255, 42, 59, 0.4)';
        btn.style.boxShadow = '0 0 10px rgba(255, 42, 59, 0.15)';
        btn.style.color = '#ffffff';
    }
}

window.removeFavorito = async (id) => {
    if (!userData) return;
    userData.favoritos = userData.favoritos.filter(i => String(i.id) !== String(id));
    await saveUserDataToCloud();
    showToast("Favorito removido.", "info");
    
    // Atualiza estatísticas do dashboard e favoritos se estiver em minha-conta.html
    const statFavorites = document.getElementById('stat-favorites-count');
    if (statFavorites) statFavorites.innerText = userData.favoritos.length;
    
    // Dispara a renderização dos favoritos dinamicamente
    const listContainer = document.getElementById('favoritos-list-container');
    if (listContainer) {
        // Se a função renderFavoritos existir (ela é local do escopo initMinhaConta), mas podemos disparar atualizando a UI
        // Para que funcione de forma limpa, criamos um CustomEvent ou podemos simplesmente fazer uma busca e recarregar
        // Como o removeFavorito é global (window.removeFavorito), o melhor é disparar um evento customizado ou fazer a renderização direta.
        // Espere! A função renderFavoritos() é exposta ou local?
        // Ela é local no initMinhaConta(). Mas no removeFavorito, podemos simplesmente achar e deletar o card .favorito-card da DOM!
        // Sim! Remover o card diretamente do DOM é super limpo, rápido e não precisa recarregar nada!
        const cardBtn = listContainer.querySelector('.favorito-card button[onclick*="' + id + '"]');
        const card = cardBtn ? cardBtn.closest('.favorito-card') : null;
        if (card) {
            card.style.transform = 'scale(0)';
            card.style.transition = 'transform 0.3s ease-out';
            setTimeout(() => {
                card.remove();
                if (userData.favoritos.length === 0) {
                    listContainer.innerHTML = `
                        <div class="empty-favoritos-state" style="grid-column: 1 / -1; text-align:center; padding:30px 20px; color:#555; background:rgba(255,255,255,0.01); border: 1px dashed #222; border-radius:8px; width: 100%;">
                            <p style="margin:0; font-size:0.9rem;">Nenhuma produção favoritada ainda. Acesse os detalhes e clique no ❤️!</p>
                        </div>
                    `;
                }
            }, 300);
        }
    }
};

function initSaveButton() {
    const btn = document.getElementById('save-progress-btn');
    if (!btn) return;
    btn.onclick = () => {
        if (!currentUser) return showToast("Faça login!", "error");

        const h = document.getElementById('stop-hour').value || 0;
        const m = document.getElementById('stop-min').value || 0;
        const s = document.getElementById('current-season').value || 1;
        const ep = document.getElementById('current-episode').value || 1;

        if (!userData.history) userData.history = [];
        // Remove anterior e adiciona novo no topo
        userData.history = userData.history.filter(i => String(i.id) !== String(currentVideoContext.id));
        userData.history.unshift({ ...currentVideoContext, progress: { h, m, s, ep } });

        saveUserDataToCloud();
        showToast("Progresso salvo na nuvem!", "success");

        // Fecha o modal do player de vídeo automaticamente com suporte a reexibição dos FABs
        closeVideoModal();

        loadContinueWatching();
    };
}

function loadContinueWatching() {
    const section = document.getElementById('continue-watching-section');
    // Verificação manual completa
    if (!section || !userData || !userData.history || !userData.history.length) {
        if (section) section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    
    const container = section.querySelector('.container');
    if (!container) return;

    container.innerHTML = `<h2>Continuar Assistindo</h2>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    
    carousel.innerHTML = userData.history.map(item => {
        const h = parseInt(item.progress.h) || 0;
        const m = parseInt(item.progress.m) || 0;
        const progMin = (h * 60) + m;
        const duracaoEstimada = (item.type === 'tv' || item.type === 'anime') ? 45 : 120;
        let pct = Math.min(Math.max(Math.round((progMin / duracaoEstimada) * 100), 15), 90);
        
        return `
        <div class="history-item-wrapper">
            <button onclick="removeFromHistory('${item.id}')" class="btn-remove-history" title="Remover do histórico"><i class="fas fa-times"></i></button>
            <a href="detalhes.html?id=${item.id}&type=${item.type}" class="content-card history-card">
                <img src="${item.poster}" loading="lazy">
                <div class="history-progress-overlay">
                    <span class="history-time-info">
                        ${(item.type === 'tv' || item.type === 'anime') ? `T${item.progress.s} EP${item.progress.ep} • ` : ''}${h > 0 ? `${h}h ` : ''}${m}m
                    </span>
                    <div class="history-progress-track">
                        <div class="history-progress-bar" style="width: ${pct}%;"></div>
                    </div>
                </div>
            </a>
        </div>`;
    }).join('');

    // Botões do Carrossel (Padrão)
    const prev = document.createElement('button');
    prev.className = 'carousel-btn prev';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.onclick = () => carousel.scrollBy({ left: -300, behavior: 'smooth' });

    const next = document.createElement('button');
    next.className = 'carousel-btn next';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.onclick = () => carousel.scrollBy({ left: 300, behavior: 'smooth' });

    wrapper.append(prev, carousel, next);
    container.appendChild(wrapper);
}

window.removeFromHistory = function (id) {
    if (!userData) return;
    userData.history = userData.history.filter(i => String(i.id) !== String(id));
    saveUserDataToCloud();
    loadContinueWatching();
    showToast("Removido do histórico.", "info");
};

// =================================================================
// LÓGICA DO CARROSSEL HERO (COM BARRAS DE PROGRESSO)
// =================================================================

let heroInterval; // Variável global para controlar o timer

function initHeroCarousel(items) {
    const sliderContainer = document.getElementById('hero-slider');
    const indicatorsContainer = document.getElementById('hero-indicators'); // Pegamos o container das barras
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    if (!sliderContainer || items.length === 0) return;

    // 1. Gera o HTML dos Slides
    let slidesHTML = '';
    let indicatorsHTML = '';

    items.forEach((item, index) => {
        const type = item.media_type || 'movie';
        const titulo = item.title || item.name;
        const sinopse = item.overview ? item.overview.substring(0, 150) + "..." : "";
        const bg = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : 'images/banner-filme.jpg';

        const activeClass = index === 0 ? 'active' : '';

        // Cria o Slide
        slidesHTML += `
        <div class="hero-slide ${activeClass}" data-index="${index}">
            <img src="${bg}" alt="${titulo}">
            <div class="container hero-content">
                <h1>${titulo}</h1>
                <p>${sinopse}</p>
                <div class="hero-actions">
                    <button class="btn btn-play" onclick="playHeroMovie('${item.id}', '${type}')">
                        <i class="fas fa-play"></i> Assistir Agora
                    </button>
                    <a href="detalhes.html?id=${item.id}&type=${type}" class="btn btn-info">
                        <i class="fas fa-info-circle"></i> Mais Informações
                    </a>
                </div>
            </div>
        </div>`;

        // Cria a Barrinha de Progresso
        // A div "indicator-fill" é quem vai animar
        indicatorsHTML += `
            <div class="indicator-bar ${activeClass}" onclick="goToSlide(${index})">
                <span class="indicator-fill"></span>
            </div>
        `;
    });

    sliderContainer.innerHTML = slidesHTML;

    // Se existir o container de indicadores, coloca o HTML lá
    if (indicatorsContainer) {
        indicatorsContainer.innerHTML = indicatorsHTML;
    }

    // 2. Lógica de Navegação
    const slides = document.querySelectorAll('.hero-slide');
    const bars = document.querySelectorAll('.indicator-bar');
    let currentIndex = 0;
    const totalSlides = slides.length;

    // Função que muda visualmente o slide e a barra
    const showSlide = (index) => {
        // Remove active de todos (Slides e Barras)
        slides.forEach(s => s.classList.remove('active'));
        bars.forEach(b => {
            b.classList.remove('active');
            // Hack para reiniciar a animação CSS: clonar o elemento fill
            // Isso força o navegador a começar a barra do zero sempre que muda
            const fill = b.querySelector('.indicator-fill');
            if (fill) {
                fill.style.animation = 'none';
                void fill.offsetWidth; // Força reflow (reinicia o render)
                fill.style.animation = ''; // Remove o override para o CSS voltar a valer
            }
        });

        // Adiciona no atual
        slides[index].classList.add('active');

        // Pequeno delay para garantir que o CSS entenda que mudou e inicie a animação
        setTimeout(() => {
            if (bars[index]) bars[index].classList.add('active');
        }, 10);
    };

    const nextSlide = () => {
        currentIndex = (currentIndex + 1) % totalSlides;
        showSlide(currentIndex);
    };

    const prevSlide = () => {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        showSlide(currentIndex);
    };

    // Nova função global para clicar na barrinha e ir direto pro filme
    window.goToSlide = (index) => {
        currentIndex = index;
        showSlide(currentIndex);
        resetTimer();
    };

    // 3. Eventos dos Botões
    if (nextBtn) nextBtn.onclick = () => {
        nextSlide();
        resetTimer();
    };

    if (prevBtn) prevBtn.onclick = () => {
        prevSlide();
        resetTimer();
    };

    // 4. Timer Automático (Sincronizado com o CSS de 5s)
    const startTimer = () => {
        // Limpa qualquer timer anterior para não encavalar
        if (heroInterval) clearInterval(heroInterval);
        heroInterval = setInterval(nextSlide, 5000); // 5000ms = 5 segundos
    };

    const resetTimer = () => {
        clearInterval(heroInterval);
        startTimer();
    };

    // Inicia tudo
    startTimer();
}

// Função auxiliar para o botão assistir dentro do HTML gerado da Home
window.playHeroMovie = async function (id, type) {
    // 1. Busca os dados completos da obra no TMDB para salvar o progresso
    const item = await fetchTMDB(`/${type}/${id}`);
    if (!item) return;

    const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
    const titulo = item.title || item.name;

    // 2. Prepara a URL correta (TMDB ID para TV/Anime, IMDB ID para Filmes)
    let playId = id;
    if (type === 'movie') {
        const ids = await fetchTMDB(`/movie/${id}/external_ids`);
        playId = (ids && ids.imdb_id) ? ids.imdb_id : id;
    }

    const playerBase = (type === 'tv' || type === 'anime') ? TV_PLAYER_BASE : MOVIE_PLAYER_BASE;
    const videoUrl = `${playerBase}/${playId}`;

    // 3. Abre o player e configura o progresso para o Continuar Assistindo
    openVideoModal(videoUrl);
    setupSaveProgress({
        id: item.id,
        type: type,
        titulo: titulo,
        poster: poster
    });
};

// =================================================================
//  MÓDULO DE SISTEMA (Gerencia Chaves e Configurações)
// =================================================================
const System = {
    saveKey(key) {
        if (!key || key.trim() === "") return false;
        // Sanitiza aspas simples, duplas e espaços extras colados
        const cleanKey = key.trim().replace(/^["']|["']$/g, '').trim();
        localStorage.setItem('winbry_gemini_key', cleanKey);
        return true;
    },

    getKey() {
        let key = localStorage.getItem('winbry_gemini_key');
        if (key) {
            // Sanitiza aspas simples, duplas e espaços extras recuperados
            key = key.trim().replace(/^["']|["']$/g, '').trim();
        }
        return key || 'AIzaSyBWfVHxvx0sAZLsHcOPvmtPVqE6PYhdIh4';
    },

    initSettings() {
        const input = document.getElementById('user-api-key');
        const btn = document.getElementById('btn-save-key');

        if (input && btn) {
            const current = this.getKey();
            if (current) input.value = current;

            btn.onclick = () => {
                if (this.saveKey(input.value)) {
                    showToast("Chave API salva com sucesso!", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast("Por favor, insira uma chave válida.", "error");
                }
            };
        }
    }
};

// =================================================================
//  MÓDULO BRY.IA (CORREÇÃO DE FILMES ANTIGOS/REMAKES)
// =================================================================
const BryIA = {
    // Guarda: { role: 'user'|'bot', type: 'text'|'card', text: string, data: object, timestamp: number }
    chatHistory: [],

    elements: {},

    init() {
        // Resolve os elementos dinamicamente para garantir que não estejam nulos após o carregamento do DOM
        this.elements = {
            fab: document.getElementById('bryia-fab'),
            window: document.getElementById('bryia-window'),
            close: document.getElementById('close-bryia'),
            send: document.getElementById('bryia-send'),
            input: document.getElementById('bryia-input'),
            msgs: document.getElementById('bryia-messages'),
            header: document.querySelector('.bryia-header')
        };

        if (!this.elements.fab) {
            console.log("BryIA: Elemento 'bryia-fab' não encontrado nesta página. Chat não inicializado.");
            return;
        }

        // 1. Carrega histórico salvo
        this.loadLocalHistory();

        // 2. Botão de Limpar (Lixeira)
        if (!document.getElementById('clear-bryia')) {
            const actionsContainer = document.createElement('div');
            actionsContainer.style.display = 'flex';
            actionsContainer.style.alignItems = 'center';
            actionsContainer.style.gap = '8px';

            const clearBtn = document.createElement('button');
            clearBtn.id = 'clear-bryia';
            clearBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            clearBtn.style.cssText = 'background:transparent; border:none; color:white; cursor:pointer; font-size:1rem; opacity:0.7; padding:5px;';
            clearBtn.title = "Apagar histórico";

            clearBtn.onmouseover = () => clearBtn.style.opacity = '1';
            clearBtn.onmouseout = () => clearBtn.style.opacity = '0.7';
            clearBtn.onclick = () => this.confirmDeleteUI();

            const closeBtn = this.elements.close;
            if (closeBtn && closeBtn.parentNode) {
                closeBtn.parentNode.insertBefore(actionsContainer, closeBtn);
                actionsContainer.appendChild(clearBtn);
                actionsContainer.appendChild(closeBtn);
            }
        }

        this.elements.fab.onclick = () => {
            this.elements.window.classList.toggle('active');
            setTimeout(() => this.scrollToBottom(), 100);
        };
        if (this.elements.close) this.elements.close.onclick = () => this.elements.window.classList.remove('active');
        if (this.elements.send) this.elements.send.onclick = () => this.sendMessage();
        if (this.elements.input) {
            this.elements.input.onkeypress = (e) => { if (e.key === 'Enter') this.sendMessage(); };
        }
    },

    loadLocalHistory() {
        const key = (typeof currentUser !== 'undefined' && currentUser) ? `bryia_chat_history_${currentUser.uid}` : 'bryia_chat_history_guest';
        const saved = localStorage.getItem(key);
        if (saved) {
            this.chatHistory = JSON.parse(saved);
            this.renderFullHistory();
        } else {
            this.chatHistory = [];
            this.elements.msgs.innerHTML = '';
        }
    },

    saveLocalHistory() {
        const key = (typeof currentUser !== 'undefined' && currentUser) ? `bryia_chat_history_${currentUser.uid}` : 'bryia_chat_history_guest';
        localStorage.setItem(key, JSON.stringify(this.chatHistory));
    },

    renderFullHistory() {
        this.elements.msgs.innerHTML = '';
        let lastDateString = null;

        this.chatHistory.forEach(msg => {
            const dateObj = new Date(msg.timestamp);
            const dateStr = dateObj.toLocaleDateString();

            if (dateStr !== lastDateString) {
                this.appendDateSeparator(msg.timestamp);
                lastDateString = dateStr;
            }

            if (msg.type === 'card') {
                this.createCardHtml(msg.data, false);
            } else {
                let textToDisplay = msg.text;
                if (msg.role === 'bot') {
                    // Formata tags [BUSCA:...] e markdown para exibição
                    const searchRegex = /\[BUSCA:(.*?)\]/g;
                    textToDisplay = msg.text
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(searchRegex, "<b>$1</b>");
                }
                this.appendMsg(textToDisplay, msg.role, false, false);
            }
        });
        this.scrollToBottom();
    },

    appendDateSeparator(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        const label = isToday ? "HOJE" : date.toLocaleDateString('pt-BR');

        const div = document.createElement('div');
        div.style.cssText = 'text-align:center; font-size:0.7rem; color:#666; margin:20px 0 10px 0; font-weight:bold; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #222; line-height:0.1em;';
        div.innerHTML = `<span style="background:#1a1a1a; padding:0 10px;">${label}</span>`;
        this.elements.msgs.appendChild(div);
    },

    confirmDeleteUI() {
        if (document.getElementById('bryia-confirm-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'bryia-confirm-overlay';
        overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:100; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(3px); animation:fadeIn 0.2s ease;';

        const box = document.createElement('div');
        box.style.cssText = 'background:#1a1a1a; padding:25px; border-radius:12px; border:1px solid #333; text-align:center; width:85%; box-shadow:0 10px 40px rgba(0,0,0,1);';

        const text = document.createElement('p');
        text.innerText = "Deseja limpar todo o histórico?";
        text.style.cssText = 'color:white; margin-bottom:20px; font-size:1rem;';

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex; justify-content:center; gap:10px;';

        const btnCancel = document.createElement('button');
        btnCancel.innerText = "Cancelar";
        btnCancel.style.cssText = 'padding:10px 20px; border:1px solid #444; background:transparent; color:#ccc; border-radius:6px; cursor:pointer;';
        btnCancel.onclick = () => overlay.remove();

        const btnConfirm = document.createElement('button');
        btnConfirm.innerText = "Limpar";
        btnConfirm.style.cssText = 'padding:10px 20px; border:none; background:#e50914; color:white; border-radius:6px; cursor:pointer; font-weight:bold;';

        btnConfirm.onclick = () => {
            this.chatHistory = [];
            const key = (typeof currentUser !== 'undefined' && currentUser) ? `bryia_chat_history_${currentUser.uid}` : 'bryia_chat_history_guest';
            localStorage.removeItem(key);
            this.elements.msgs.innerHTML = `<div class="message bot"><div class="msg-text">Histórico limpo! Tudo pronto. 🎬🍿</div></div>`;
            overlay.remove();
        };

        btnContainer.append(btnCancel, btnConfirm);
        box.append(text, btnContainer);
        overlay.appendChild(box);
        this.elements.window.appendChild(overlay);
    },

    async sendMessage() {
        const text = this.elements.input.value.trim();
        if (!text) return;

        const now = Date.now();
        const lastMsg = this.chatHistory[this.chatHistory.length - 1];
        if (!lastMsg || new Date(lastMsg.timestamp).toDateString() !== new Date(now).toDateString()) {
            this.appendDateSeparator(now);
        }

        this.appendMsg(text, 'user', true);
        this.elements.input.value = '';

        const key = System.getKey();
        if (!key) {
            const tutorialMsg = `
            🔒 <b>Configuração Necessária</b><br><br>
            1️⃣ Acesse o <a href='https://aistudio.google.com/app/apikey' target='_blank' style='color:#ff4444;text-decoration:underline;'>Google AI Studio</a>.<br>
            2️⃣ Clique em <b>Create API Key</b>.<br>
            3️⃣ Copie e cole na aba <b>Minha Conta</b>.<br><br>
            É grátis! 🚀
            `;
            this.appendMsg(tutorialMsg, 'bot', false);
            return;
        }

        const loadingEl = this.appendMsg("Digitando...", 'bot', false, true);

        try {
            const reply = await this.callGemini(key);
            if (loadingEl && loadingEl.parentNode) {
                loadingEl.remove();
            }
            await this.processResponse(reply);

        } catch (error) {
            if (loadingEl && loadingEl.parentNode) {
                loadingEl.remove();
            }

            if (this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].role === 'user') {
                this.chatHistory.pop();
                this.saveLocalHistory();
            }

            let friendlyError = "Ocorreu um erro na comunicação.";
            const errString = error.message.toLowerCase();

            if (errString.includes('quota') || errString.includes('429') || errString.includes('limit')) {
                friendlyError = `🚦 <b>Limite de Requisições</b><br><br>Sua chave atingiu o limite por minuto. ⏳ Aguarde alguns segundos e tente novamente. Se persistir, verifique os limites da sua API Key no <a href='https://aistudio.google.com' target='_blank' style='color:#ff6666'>AI Studio</a>.<br><br><small style="opacity: 0.65; font-size: 0.72rem; display: block; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 6px; margin-top: 4px; font-family: monospace; word-break: break-word;"><b>Erro do Servidor:</b> ${error.message}</small>`;
            } else if (errString.includes('key')) {
                friendlyError = `🔑 <b>Chave Inválida:</b> Verifique sua API Key.<br><br><small style="opacity: 0.65; font-size: 0.72rem; display: block; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 6px; margin-top: 4px; font-family: monospace; word-break: break-word;"><b>Erro do Servidor:</b> ${error.message}</small>`;
            } else {
                friendlyError = `❌ <b>Erro na Comunicação</b><br><br>Não foi possível obter resposta da BryIA.<br><br><small style="opacity: 0.65; font-size: 0.72rem; display: block; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 6px; margin-top: 4px; font-family: monospace; word-break: break-word;"><b>Erro do Servidor:</b> ${error.message}</small>`;
            }

            this.appendMsg(friendlyError, 'bot', false);
        }
    },

    async callGemini(key) {
        let contextoPagina = "";
        const tituloNaTela = document.querySelector('.info-text h1');
        if (tituloNaTela) contextoPagina = `O usuário está vendo: "${tituloNaTela.innerText}".`;
        else if (window.location.pathname.includes('minha-lista')) contextoPagina = "O usuário está na 'Minha Lista'.";

        const historyForGemini = this.chatHistory
            .slice(-6) // Reduzido para 6 mensagens para latência mínima e resposta imediata
            .map(msg => {
                let textContent = msg.text || "";
                if (msg.type === 'card' && msg.data) {
                    const title = msg.data.title || msg.data.name || "Obra";
                    const year = (msg.data.release_date || msg.data.first_air_date || "????").substring(0, 4);
                    textContent = `[Sistema: Card de assistir exibido na tela para a obra: "${title} (${year})"]`;
                }
                return {
                    role: msg.role === 'bot' ? 'model' : 'user',
                    parts: [{ text: textContent }]
                };
            })
            .filter(msg => msg.parts[0].text.trim() !== "");

        // --- INJEÇÃO INVISÍVEL À PROVA DE FALHAS (CORREÇÃO DE TAGS E RECOMENDAÇÕES) ---
        if (historyForGemini.length > 0 && historyForGemini[historyForGemini.length - 1].role === 'user') {
            const lastMsg = historyForGemini[historyForGemini.length - 1];
            lastMsg.parts[0].text = `[INSTRUÇÃO CRÍTICA DE SISTEMA (BRYIA 2026): Responda em no MÁXIMO 2 ou 3 linhas curtas. NUNCA repita indicações anteriores da conversa! Varie as sugestões de acordo com o histórico. Se o usuário pediu 1 filme (singular), indique apenas UM filme (ex: [BUSCA:Devoradores de Estrelas 2026], [BUSCA:Coerência 2013], [BUSCA:Interestelar 2014]) com a tag '[BUSCA:Nome exato da Obra Ano]'. Use a frase exata "Aqui está:" para 1 indicação ou "Aqui estão algumas opções incríveis:" para listas.]\n\nPergunta do Usuário: ${lastMsg.parts[0].text}`;
        }

        const systemInstruction = `
        Você é a BryIA, assistente cinéfila oficial do WinBry. 🎬✨
        
        SUA MISSÃO & REGRAS DE DINAMISMO (VITAL):
        - Responda SEMPRE com textos ultra curtos, objetivos e diretos (máximo de 2 ou 3 linhas). Evite sinopses longas e apresentações repetitivas.
        - VARIE SEMPRE as indicações: consulte o histórico do chat e NUNCA recomende o mesmo filme em turnos consecutivos. Se o usuário pedir outra opção ou insistir no tema, mude obrigatoriamente a obra indicada!
        - Entenda perfeitamente o número solicitado pelo usuário:
          1. Se o usuário pedir "um filme", "uma indicação", "um anime", "uma série" (no singular), retorne estritamente apenas UMA indicação!
          2. Indique filmes/séries/animes interessantes, com personalidade cinéfila e "Lado B" (evite indicar sempre apenas blockbusters manjados como Duna ou Vingadores. Indique joias como [BUSCA:Devoradores de Estrelas 2026], [BUSCA:Coerência 2013], [BUSCA:Sunshine - Alerta Solar 2007], [BUSCA:Pandorum 2009]).
          3. Toda indicação no singular DEVE ser de uma obra cadastrada no TMDB (já lançada ou confirmada) para que a interface carregue a capa certa e o botão Assistir funcione.
          4. Se o usuário pedir listas, tops, ordem ou múltiplos filmes (ex: "indique 3 filmes", "filmes em ordem"), retorne as indicações em lista numerada compacta contendo as tags de busca.
        - Você está rodando em 2026. Tem conhecimento de lançamentos futuros até 2028. Se o usuário pedir explicitamente lançamentos futuros de 2026-2028, traga variedade (como Devoradores de Estrelas, Supergirl, Vingadores: Doomsday, Duna: Parte Três).
        
        📚 BANCO DE DADOS DE LANÇAMENTOS FUTUROS CONFIRMADOS (2026-2028):
        - Devoradores de Estrelas (Project Hail Mary - Ryan Gosling, ficção científica intergaláctica): Lançamento em 2026.
        - Supergirl: Woman of Tomorrow (2026)
        - Dune: Part Three (2026)
        - Avengers: Doomsday (2026)
        - Star Wars: Starfighter (2027)
        - Man of Tomorrow (2027)
        - The Batman - Part II (2027)
        - Avengers: Secret Wars (2027)
        - Dynamic Duo (2028)
        
        ⚠️ REGRA CRÍTICA E ABSOLUTAMENTE OBRIGATÓRIA DA TAG [BUSCA]:
        - Sempre que você citar, indicar, recomendar, sugerir ou fizer menção a QUALQUER filme, série, anime ou obra de ficção, você DEVE obrigatoriamente usar a tag especial [BUSCA:Nome exato da Obra Ano] imediatamente após ou no lugar do nome da obra.
        - O nome na tag deve ser o nome oficial da produção em português (ou como é amplamente conhecida no Brasil) e o ano deve ser o ano de lançamento original dela (ex: [BUSCA:A Viagem de Chihiro 2001], [BUSCA:Interestelar 2014]).
        
        Exemplos de formato de resposta obrigatório (respostas curtas):
        - Usuário: "indique um filme de ficção científica" -> Resposta: "Aqui está uma excelente indicação de viagem no tempo e ficção científica para você! 🚀🌌🍿\n[BUSCA:Interestelar 2014] - Uma obra-prima sobre exploração de buracos negros e amor familiar."
        - Usuário: "Qual o top 3 do Ghibli?" -> Resposta: "Aqui estão as 3 maiores obras-primas do Studio Ghibli! 🌌✨🍿\n1. [BUSCA:A Viagem de Chihiro 2001] - Uma fantástica jornada espiritual.\n2. [BUSCA:Meu Amigo Totoro 1988] - Um clássico doce e poético.\n3. [BUSCA:O Castelo Animado 2004] - Uma magia deslumbrante."
        
        ⚠️ MEMÓRIA DE CARDS NA TELA (MUITO IMPORTANTE):
        - No histórico da conversação, você receberá mensagens do sistema no formato: "[Sistema: Card de assistir exibido na tela para a obra: 'Nome (Ano)']".
        - Utilize essa informação para manter o contexto cinéfilo perfeito da conversa.
        
        Contexto atual da página: ${contextoPagina}
        `;

        const payload = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: historyForGemini
        };

        const models = [
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-1.5-flash"
        ];

        let lastError = null;

        for (const modelName of models) {
            try {
                console.log(`🤖 Tentando obter resposta com o modelo: ${modelName}...`);
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.status === 429) {
                    throw new Error("Limite de quota atingido (429)");
                }

                if (!response.ok) {
                    throw new Error((data.error && data.error.message) ? data.error.message : `Erro API: ${response.status}`);
                }

                if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                    const blockReason = (data.promptFeedback && data.promptFeedback.blockReason) ? data.promptFeedback.blockReason : null;
                    throw new Error(blockReason ? `Bloqueado: ${blockReason}` : "Sem resposta do modelo.");
                }

                const resultText = data.candidates[0].content.parts[0].text;
                console.log(`✅ Sucesso com o modelo: ${modelName}!`);
                return resultText;

            } catch (e) {
                console.warn(`⚠️ Falha ao chamar o modelo ${modelName}: ${e.message}`);
                lastError = e;
                if (e.message.toLowerCase().includes('key') || e.message.toLowerCase().includes('400')) {
                    break;
                }
                // Aguarda 150ms antes de tentar o próximo modelo (folga rápida para o servidor)
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }

        throw lastError || new Error("Falha ao se comunicar com os servidores do Gemini após tentar múltiplos modelos.");
    },


    async processResponse(text) {
        const searchRegex = /\[BUSCA:(.*?)\]/g;
        const termos = new Set();
        
        // 1. Captura termos com a tag explícita [BUSCA:...]
        let match;
        searchRegex.lastIndex = 0;
        while ((match = searchRegex.exec(text)) !== null) {
            const termo = match[1].trim();
            if (termo) termos.add(termo);
        }

        // 2. Fallbacks Inteligentes de Segurança: Entra em ação apenas se nenhuma tag [BUSCA:...] for gerada
        if (termos.size === 0) {
            console.log("🔍 Nenhum termo com [BUSCA] encontrado. Iniciando análise de fallback inteligente...");
            
            // Fallback A: Processamento linha por linha para listas de texto simples (ex: "1. Duna: Parte Três 2026 - O encerramento...")
            const linhas = text.split(/\r?\n/);
            linhas.forEach(linha => {
                const listMatch = linha.trim().match(/^(?:\d+\.\s+|-\s+|\*\s+)(.+)$/);
                if (listMatch) {
                    const conteudoLinha = listMatch[1].trim();
                    const anoMatch = conteudoLinha.match(/\b(19\d{2}|20\d{2})\b/);
                    if (anoMatch) {
                        const ano = anoMatch[1];
                        const partes = conteudoLinha.split(ano);
                        const possivelTitulo = partes[0].trim();
                        // Limpa caracteres residuais comuns no fim do título (como dois pontos, hífens, parênteses e negritos)
                        const tituloLimpo = possivelTitulo
                            .replace(/[\s\-:\(\)\*]+$/, '')
                            .replace(/^\*\*|\*\*$/g, '')
                            .trim();
                        
                        if (tituloLimpo && tituloLimpo.length > 1 && tituloLimpo.length < 60) {
                            console.log(`✨ Fallback de Lista detectou: "${tituloLimpo}" (${ano})`);
                            termos.add(`${tituloLimpo} ${ano}`);
                        }
                    }
                }
            });

            // Fallback B: Captura geral no texto de recomendações em negrito (ex: "**Divertidamente 2** (2024)" ou "**Deadpool** 2024")
            const negritoAnoRegex = /\*\*([^*]+?)\*\*\s*\(?(\d{4})\)?/g;
            let negritoMatch;
            negritoAnoRegex.lastIndex = 0;
            while ((negritoMatch = negritoAnoRegex.exec(text)) !== null) {
                const nome = negritoMatch[1].trim();
                const ano = negritoMatch[2].trim();
                if (nome && nome.length > 1 && nome.length < 60) {
                    console.log(`✨ Fallback de Negrito detectou: "${nome}" (${ano})`);
                    termos.add(`${nome} ${ano}`);
                }
            }
        }

        // Formata o texto final com quebras de linha e negritos para renderização no balão
        let formattedText = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(searchRegex, "<b>$1</b>");
        
        // Cria o balão de texto da IA e captura a div correspondente (salvamos o texto original com as tags intactas)
        const messageEl = this.appendMsg(formattedText, 'bot', true, false, text);

        // Realiza as requisições em paralelo no TMDB e monta os cards proativos
        const promessas = [];
        termos.forEach(termo => {
            promessas.push(this.searchAndCreateCard(termo, true, messageEl));
        });

        if (promessas.length > 0) {
            await Promise.all(promessas);
        }
    },

    async searchAndCreateCard(query, shouldSave = false, targetMessageElement = null) {
        try {
            // 1. Tenta extrair um ano da busca (ex: "Resident Evil 2002")
            const yearMatch = query.match(/(.*?)\s?(\d{4})$/);

            let searchTerm = query;
            let targetYear = null;

            if (yearMatch) {
                searchTerm = yearMatch[1].trim(); // "Resident Evil"
                targetYear = yearMatch[2];        // "2002"
                console.log(`🔍 Filtro Inteligente: Buscando "${searchTerm}" do ano ${targetYear}`);
            }

            // Realiza a busca no TMDB (primeiro como filme, pois é mais assertivo para subtítulos e nomes completos)
            let data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(searchTerm)}`);

            // Se não achar nada, tenta buscar como série/show de TV
            if (!data || !data.results || data.results.length === 0) {
                data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(searchTerm)}`);
            }

            // Se a busca principal falhou e o termo contém delimitadores, tenta simplificar o título
            if (!data || !data.results || data.results.length === 0) {
                let simplificado = searchTerm;
                if (searchTerm.includes(':')) {
                    simplificado = searchTerm.split(':')[0].trim();
                } else if (searchTerm.includes('–')) { // travessão unicode
                    simplificado = searchTerm.split('–')[0].trim();
                } else if (searchTerm.includes('-')) { // hífen
                    simplificado = searchTerm.split('-')[0].trim();
                } else {
                    const palavras = searchTerm.split(/\s+/);
                    if (palavras.length > 2) {
                        simplificado = palavras.slice(0, 2).join(' '); // tenta as 2 primeiras palavras
                    }
                }
                if (simplificado !== searchTerm) {
                    console.log(`🔍 Tentando busca por termo simplificado: "${simplificado}"`);
                    data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(simplificado)}`);
                    if (!data || !data.results || data.results.length === 0) {
                        data = await fetchTMDB(`/search/tv?query=${encodeURIComponent(simplificado)}`);
                    }
                }
            }

            // Se ainda assim falhou, tenta buscar apenas pela primeira palavra do título
            if (!data || !data.results || data.results.length === 0) {
                const primeiraPalavra = searchTerm.split(/\s+/)[0];
                if (primeiraPalavra && primeiraPalavra.length > 2) {
                    console.log(`🔍 Tentando busca por primeira palavra: "${primeiraPalavra}"`);
                    data = await fetchTMDB(`/search/movie?query=${encodeURIComponent(primeiraPalavra)}`);
                }
            }

            let bestMatch = null;

            if (data && data.results && data.results.length > 0) {
                // 2. Se temos um ano alvo, tenta filtrar os resultados que batem com tolerância fuzzy de +/- 1 ano
                if (targetYear) {
                    const targetYearNum = parseInt(targetYear, 10);
                    bestMatch = data.results.find(i => {
                        const date = i.release_date || i.first_air_date || "";
                        if (!date) return false;
                        const year = parseInt(date.substring(0, 4), 10);
                        return Math.abs(year - targetYearNum) <= 1 && i.poster_path;
                    });
                }

                // 3. Se não achou com o ano correspondente (ou não tinha ano), pega o primeiro resultado com poster
                if (!bestMatch) {
                    bestMatch = data.results.find(i => i.poster_path);
                }

                // 4. Fallback final: pega o primeiro resultado geral da busca
                if (!bestMatch && data.results.length > 0) {
                    bestMatch = data.results[0];
                }
            }

            // 5. Garantia Absoluta: se a busca falhar ou o TMDB não encontrar o filme, gera um card de fallback mockado
            if (!bestMatch) {
                console.log(`⚠️ Obra "${searchTerm}" não encontrada no TMDB. Gerando card de fallback local...`);
                bestMatch = {
                    title: searchTerm,
                    release_date: targetYear ? `${targetYear}-01-01` : '2026-01-01',
                    poster_path: null,
                    media_type: 'movie',
                    id: 0 // Indica card de fallback local
                };
            }

            this.createCardHtml(bestMatch, shouldSave, targetMessageElement);
        } catch (e) { console.error(e); }
    },

    createCardHtml(item, shouldSave, targetMessageElement = null) {
        let container = targetMessageElement;

        // Se não foi fornecido um elemento alvo (ex: ao renderizar o histórico),
        // busca o último balão bot ativo de texto
        if (!container) {
            const botMessages = this.elements.msgs.querySelectorAll('.message.bot');
            if (botMessages.length > 0) {
                container = botMessages[botMessages.length - 1];
            }
        }

        const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '????').substring(0, 4);
        const type = item.media_type || 'movie';

        const isMocked = item.id === 0;
        const cardHtml = `
            <div class="bryia-card" ${isMocked ? 'style="border-color: rgba(229, 9, 20, 0.3) !important;"' : ''}>
                <img src="${poster}" onerror="this.src='images/favicon.png'">
                <div class="bryia-card-info">
                    <h4>${title} <small>(${year})</small></h4>
                    <a href="${isMocked ? '#' : `detalhes.html?id=${item.id}&type=${type}`}" 
                       class="btn-play-mini" 
                       ${isMocked ? 'style="opacity:0.55; cursor:not-allowed; background:#333; box-shadow:none; pointer-events:none;" onclick="return false;"' : ''}>
                        <i class="fas ${isMocked ? 'fa-calendar-alt' : 'fa-play'}"></i> ${isMocked ? 'Em Breve' : 'Assistir'}
                    </a>
                </div>
            </div>`;

        let cardsContainer;
        if (container) {
            // Verifica se a div do container de cards já existe na mensagem bot
            cardsContainer = container.querySelector('.bryia-cards-container');
            if (!cardsContainer) {
                cardsContainer = document.createElement('div');
                cardsContainer.className = 'bryia-cards-container';
                cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 10px; margin-top: 10px; width: 100%;";
                container.appendChild(cardsContainer);
            }
            cardsContainer.insertAdjacentHTML('beforeend', cardHtml);
        } else {
            // Fallback se não encontrar nenhuma mensagem bot (segurança)
            cardsContainer = this.elements.msgs.querySelector('.bryia-fallback-container');
            if (!cardsContainer) {
                const div = document.createElement('div');
                div.className = 'message bot';
                div.style.cssText = "background:transparent; padding:0; margin-top:5px; max-width:90%;";
                div.innerHTML = `<div class="bryia-cards-container bryia-fallback-container" style="display: flex; flex-direction: column; gap: 10px; width: 100%;"></div>`;
                this.elements.msgs.appendChild(div);
                cardsContainer = div.querySelector('.bryia-fallback-container');
            }
            cardsContainer.insertAdjacentHTML('beforeend', cardHtml);
        }

        // Se houver mais de um card no container, ativamos o grid-layout e limpamos estilos de flex inline
        if (cardsContainer) {
            if (cardsContainer.children.length > 1) {
                cardsContainer.classList.add('grid-layout');
                cardsContainer.style.display = "";
                cardsContainer.style.flexDirection = "";
            } else {
                cardsContainer.classList.remove('grid-layout');
                cardsContainer.style.display = "flex";
                cardsContainer.style.flexDirection = "column";
            }
        }

        this.scrollToBottom();

        if (shouldSave) {
            this.chatHistory.push({ role: 'bot', type: 'card', data: item, timestamp: Date.now() });
            this.saveLocalHistory();
        }
    },

    appendMsg(text, sender, shouldSave = false, isLoading = false, textToSave = null) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        if (isLoading) div.id = 'loading-msg';

        div.innerHTML = isLoading
            ? `<div class="msg-text"><i class="fas fa-circle-notch fa-spin"></i></div>`
            : `<div class="msg-text">${text}</div>`;

        this.elements.msgs.appendChild(div);
        this.scrollToBottom();

        if (shouldSave) {
            const finalSaveText = textToSave !== null ? textToSave : text;
            this.chatHistory.push({ role: sender, type: 'text', text: finalSaveText, timestamp: Date.now() });
            this.saveLocalHistory();
        }

        return div;
    },

    scrollToBottom() {
        this.elements.msgs.scrollTop = this.elements.msgs.scrollHeight;
    }
};

// =================================================================
//  FUNÇÃO SURPREENDA-ME (Botão da Esquerda)
// =================================================================
async function surpreendaMe() {
    try {
        // Pega uma página aleatória (1 a 50)
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const data = await fetchTMDB(`/movie/popular?page=${randomPage}`);

        if (data && data.results && data.results.length > 0) {
            const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
            if (randomMovie && randomMovie.id) {
                // Redireciona
                window.location.href = `detalhes.html?id=${randomMovie.id}&type=movie`;
            }
        } else {
            showToast("Tente novamente...", "error");
        }
    } catch (e) {
        console.error("Erro Shuffle:", e);
    }
}

// =================================================================
//  INICIALIZADOR MESTRE (LIGA TUDO NO FINAL)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("WinBry Mestre Iniciado 🚀");

    // 1. Inicializações Visuais
    if (typeof initTheme === 'function') initTheme();
    if (typeof initMenuMobile === 'function') initMenuMobile();
    if (typeof initSearch === 'function') initSearch();
    if (typeof initVideoModal === 'function') initVideoModal();
    if (typeof initHeaderUser === 'function') initHeaderUser();
    if (typeof initTransitionManager === 'function') initTransitionManager();
    if (typeof initSaveButton === 'function') initSaveButton();
    if (typeof loadContinueWatching === 'function') loadContinueWatching();

    // 2. Formulários
    const cadastroForm = document.getElementById("cadastroForm");
    if (cadastroForm && typeof initCadastro === 'function') initCadastro(cadastroForm);

    const loginForm = document.getElementById("loginForm");
    if (loginForm && typeof initLogin === 'function') initLogin(loginForm);

    if (document.querySelector('.dashboard-wrapper') && typeof initMinhaConta === 'function') {
        initMinhaConta();
    }

    // 3. Inicializa IA e Sistema
    try {
        if (typeof System !== 'undefined') System.initSettings();
        if (typeof BryIA !== 'undefined') BryIA.init();
    } catch (e) { console.error("Erro IA:", e); }

    // 4. Header Fade In
    const userActions = document.querySelector('.user-actions');
    if (userActions) {
        setTimeout(() => {
            userActions.style.opacity = '1';
            userActions.style.visibility = 'visible';
        }, 100);
    }

    // 5. Roteamento Inteligente
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = params.get('type');
    const search = params.get('search');
    const isHub = params.get('global') === 'true';
    const isMulti = params.get('multi') === 'true';

    // Seletor de Página
    if (path.includes('detalhes') && id && type) {
        if (typeof loadDetails === 'function') loadDetails(type, id);
    }
    else if (path.includes('filmes')) {
        currentType = isMulti ? 'search' : 'movie';
        if (search && typeof handleSearchRouting === 'function') handleSearchRouting(search, isMulti ? 'multi' : 'movie', isHub);
        else if (typeof loadCatalog === 'function') loadCatalog('movie', 1);
    }
    else if (path.includes('series')) {
        currentType = 'tv';
        if (search && typeof loadSearch === 'function') loadSearch(search, 'tv', 1);
        else if (typeof loadCatalog === 'function') loadCatalog('tv', 1);
    }
    else if (path.includes('animes')) {
        currentType = 'anime';
        if (search && typeof loadSearch === 'function') loadSearch(search, 'tv', 1);
        else if (typeof loadAnimes === 'function') loadAnimes(1);
    }
    else if (path.includes('minha-lista')) {
        if (typeof initMinhaListaPage === 'function') initMinhaListaPage();
    }
    else if (path.includes('index') || path === '/' || path.endsWith('/')) {
        if (typeof loadHome === 'function') loadHome();
    }
});

// --- FUNÇÃO ESQUECI MINHA SENHA (CORRIGIDA E MELHORADA) ---
function initEsqueciSenha() {
    const btn = document.getElementById('btn-esqueci-senha');
    if (!btn) return;

    btn.onclick = async (e) => {
        e.preventDefault(); // Impede a página de pular ou recarregar

        // 1. Tenta pegar o e-mail do campo de login
        let email = document.getElementById('email').value.trim();

        // 2. Se o campo estiver vazio, PERGUNTA ao usuário via Prompt
        if (!email) {
            email = prompt("Por favor, digite seu e-mail para recuperar a senha:");
        }

        // 3. Se ainda assim estiver vazio (usuário cancelou), para tudo
        if (!email) return;

        // 4. Manda o Firebase enviar o e-mail
        try {
            showToast("Enviando e-mail de recuperação...", "info");
            await auth.sendPasswordResetEmail(email);
            showToast(`E-mail enviado para: ${email}. Verifique sua caixa de entrada e spam!`, "success");
        } catch (error) {
            console.error(error);
            const msg = (typeof getFirebaseErrorMessage === 'function')
                ? getFirebaseErrorMessage(error)
                : "Erro ao enviar e-mail. Verifique se o endereço está correto.";
            showToast(msg, "error");
        }
    };
}

// --- TRADUTOR DE ERROS COMPLETO (PORTUGUÊS) ---
function getFirebaseErrorMessage(error) {
    const code = error.code || "";

    switch (code) {
        // --- PROBLEMAS COM E-MAIL E SENHA ---
        case 'auth/email-already-in-use':
            return "Este e-mail já está sendo usado por outra pessoa. Tente fazer login.";

        case 'auth/invalid-email':
            return "O e-mail digitado não é válido. Verifique se digitou corretamente.";

        case 'auth/weak-password':
            return "Sua senha é muito fraca. Ela precisa ter pelo menos 6 caracteres.";

        case 'auth/wrong-password':
            return "Senha incorreta. Tente novamente ou redefina sua senha.";

        case 'auth/user-not-found':
            return "Não encontramos nenhuma conta com esse e-mail.";

        case 'auth/invalid-credential':
            return "E-mail ou senha incorretos. Verifique seus dados.";

        // --- SEGURANÇA E BLOQUEIOS ---
        case 'auth/user-disabled':
            return "Esta conta foi desativada por segurança. Entre em contato com o suporte.";

        case 'auth/too-many-requests':
            return "Muitas tentativas falhas seguidas! O acesso foi bloqueado temporariamente. Espere alguns minutos.";

        case 'auth/requires-recent-login':
            return "Por segurança, faça logout e login novamente antes de excluir sua conta.";

        // --- RECUPERAÇÃO DE SENHA ---
        case 'auth/missing-email':
            return "Por favor, digite o e-mail no campo acima para recuperar a senha.";

        // --- ERROS TÉCNICOS ---
        case 'auth/network-request-failed':
            return "Sem conexão com a internet. Verifique seu Wi-Fi/Dados.";

        case 'auth/operation-not-allowed':
            return "Erro no sistema (Login não habilitado no Firebase). Avise o administrador.";

        case 'auth/popup-closed-by-user':
            return "O login foi cancelado.";

        // --- ERRO DESCONHECIDO ---
        default:
            return "Ocorreu um erro inesperado: " + error.message;
    }
}

if (document.getElementById("btn-google-login")) {
    initGoogleLogin();
}

// =================================================================
// LOADER DE TRANSIÇÃO (FLUIDO E SÓLIDO)
// =================================================================

function initGlobalLoader() {
    // 1. Injeta o HTML na página se não existir
    if (!document.getElementById('global-loader')) {
        const loaderHTML = `
            <div id="global-loader">
                <div class="spinner-ring"></div>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', loaderHTML);
    }

    const loader = document.getElementById('global-loader');

    // Funções de Controle
    const showLoader = () => loader && loader.classList.add('visible');
    const hideLoader = () => loader && loader.classList.remove('visible');

    // --- EVENTOS ---

    // 1. Ao carregar a página: Esconde o loader (Fade Out)
    window.addEventListener('load', () => setTimeout(hideLoader, 300));

    // 2. Correção para botão "Voltar" (Safari/Mobile)
    window.addEventListener('pageshow', hideLoader);

    // 3. Interceptar Cliques - COM TRANSIÇÃO DE POSTER PARA DETALHES
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        // Se o link aponta para detalhes.html, faz a transição da capa sem loader
        if (link.href && link.href.includes('detalhes')) {
            const img = link.querySelector('img');
            if (img) {
                img.style.viewTransitionName = 'poster-morph';
            }
            // Deixa a navegação natural acontecer. O navegador fará a View Transition
            // cruzada de documentos de forma nativa e extremamente fluida graças ao CSS!
            return;
        }

        // Para outros links internos, usa o loader escuro
        if (link.href &&
            link.href.includes(window.location.hostname) &&
            !link.target &&
            !link.href.includes('#') &&
            !link.getAttribute('download') &&
            !link.href.includes('javascript')) {

            e.preventDefault();
            showLoader();

            setTimeout(() => {
                window.location.href = link.href;
            }, 600);
        }
    });
}


// --- FUNÇÕES DE AUTH QUE FALTAVAM ---

function initLogin(form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const btn = form.querySelector('button');

        try {
            btn.disabled = true;
            btn.innerText = "Entrando...";
            await auth.signInWithEmailAndPassword(email, senha);
            window.location.href = 'index.html';
        } catch (error) {
            btn.disabled = false;
            btn.innerText = "Entrar";
            const msg = (typeof getFirebaseErrorMessage === 'function') ? getFirebaseErrorMessage(error) : error.message;
            showToast(msg, "error");
        }
    }
}

function initCadastro(form) {
    form.onsubmit = async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confSenha = document.getElementById('confirmar-senha').value;

        if (senha !== confSenha) return showToast("As senhas não coincidem", "error");

        try {
            showToast("Criando conta...", "info");
            const userCred = await auth.createUserWithEmailAndPassword(email, senha);

            // Salva nome
            await userCred.user.updateProfile({ displayName: nome });

            // Cria no Banco
            await db.collection('users').doc(userCred.user.uid).set({
                username: nome,
                email: email,
                minhaLista: [],
                history: [],
                reviews: [],
                favoritos: []
            });

            showToast("Conta criada com sucesso!", "success");
            setTimeout(() => window.location.href = 'index.html', 1500);

        } catch (error) {
            const msg = (typeof getFirebaseErrorMessage === 'function') ? getFirebaseErrorMessage(error) : error.message;
            showToast(msg, "error");
        }
    }
}

// =================================================================
// 7. MODAL DE PRODUÇÕES DO FAMOSO (ELENCO PRINCIPAL)
// =================================================================

window.showFamousWorks = async function(personId, personName) {
    showToast(`Buscando produções de ${personName}...`, "info");
    try {
        const data = await fetchTMDB(`/person/${personId}/combined_credits`);
        if (!data || !data.cast || data.cast.length === 0) {
            return showToast("Nenhuma obra encontrada para este famoso.", "error");
        }

        // Filtra todas as obras válidas que tenham capa
        let allWorks = data.cast
            .filter(item => item.poster_path && (item.title || item.name))
            .sort((a, b) => b.popularity - a.popularity);

        if (allWorks.length === 0) {
            return showToast("Nenhuma obra relevante encontrada.", "error");
        }

        // Divide o array: as primeiras 12 mais populares são exibidas inicialmente
        let primaryWorks = allWorks.slice(0, 12);
        let remainingWorks = allWorks.slice(12);

        // Cria o elemento do modal se ele não existir
        let modal = document.getElementById('famous-works-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'famous-works-modal';
            modal.className = 'famous-modal';
            document.body.appendChild(modal);
        }

        // Helper de HTML do card de obra do famoso
        const getWorkCardHtml = (work) => {
            const title = work.title || work.name;
            const poster = `${IMG_BASE}${work.poster_path}`;
            let typeTxt = work.media_type === 'movie' ? 'Filme' : 'Série';
            const isAnime = (work.original_language === 'ja' && work.genre_ids && work.genre_ids.includes(16)) || (work.media_type === 'tv' && work.original_language === 'ja');
            if (isAnime) typeTxt = 'Anime';
            const date = work.release_date || work.first_air_date || '';
            const year = date ? ` (${date.substring(0, 4)})` : '';
            const rating = work.vote_average ? work.vote_average.toFixed(1) : 'N/A';

            return `
            <a href="detalhes.html?id=${work.id}&type=${work.media_type}" class="famous-work-card" onclick="document.getElementById('famous-works-modal').classList.remove('show')">
                <div class="famous-work-poster">
                    <img src="${poster}" alt="${title}" loading="lazy" />
                    <span class="famous-work-rating"><i class="fas fa-star"></i> ${rating}</span>
                </div>
                <div class="famous-work-info">
                    <h4>${title}${year}</h4>
                    <span class="famous-work-type">${typeTxt}</span>
                </div>
            </a>
            `;
        };

        const worksHtml = primaryWorks.map(getWorkCardHtml).join('');

        modal.innerHTML = `
        <div class="famous-modal-content">
            <div class="famous-modal-header">
                <h3><i class="fas fa-film" style="color: #e50914; margin-right: 8px;"></i> Obras de ${personName}</h3>
                <button id="close-famous-modal" class="close-famous-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="famous-modal-body">
                <div class="famous-works-grid" id="famous-grid">
                    ${worksHtml}
                </div>
                ${remainingWorks.length > 0 ? `
                <div class="famous-expand-container" id="expand-container" style="text-align: center; margin-top: 25px;">
                    <button id="btn-expand-works" class="btn-expand-famous">
                        Ver Todas as Obras (+${remainingWorks.length})
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
        `;

        modal.classList.add('show');

        // Configuração do clique no botão de expandir (Ver Todas)
        if (remainingWorks.length > 0) {
            const btnExpand = document.getElementById('btn-expand-works');
            btnExpand.onclick = () => {
                const grid = document.getElementById('famous-grid');
                const expandContainer = document.getElementById('expand-container');

                const remainingHtml = remainingWorks.map(work => {
                    const title = work.title || work.name;
                    const poster = `${IMG_BASE}${work.poster_path}`;
                    let typeTxt = work.media_type === 'movie' ? 'Filme' : 'Série';
                    const isAnime = (work.original_language === 'ja' && work.genre_ids && work.genre_ids.includes(16)) || (work.media_type === 'tv' && work.original_language === 'ja');
                    if (isAnime) typeTxt = 'Anime';
                    const date = work.release_date || work.first_air_date || '';
                    const year = date ? ` (${date.substring(0, 4)})` : '';
                    const rating = work.vote_average ? work.vote_average.toFixed(1) : 'N/A';

                    return `
                    <a href="detalhes.html?id=${work.id}&type=${work.media_type}" class="famous-work-card remaining-card" style="opacity: 0; transform: translateY(15px); transition: all 0.4s ease;" onclick="document.getElementById('famous-works-modal').classList.remove('show')">
                        <div class="famous-work-poster">
                            <img src="${poster}" alt="${title}" loading="lazy" />
                            <span class="famous-work-rating"><i class="fas fa-star"></i> ${rating}</span>
                        </div>
                        <div class="famous-work-info">
                            <h4>${title}${year}</h4>
                            <span class="famous-work-type">${typeTxt}</span>
                        </div>
                    </a>
                    `;
                }).join('');

                grid.insertAdjacentHTML('beforeend', remainingHtml);

                // Dispara animação escalonada (cascade/staggered)
                setTimeout(() => {
                    const remainingCards = grid.querySelectorAll('.remaining-card');
                    remainingCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, index * 30); // Intervalo de 30ms cria um belo efeito dinâmico
                    });
                }, 50);

                // Desaparecimento suave do botão
                expandContainer.style.opacity = '0';
                expandContainer.style.transform = 'scale(0.9)';
                expandContainer.style.transition = 'all 0.3s ease';
                setTimeout(() => expandContainer.remove(), 300);
            };
        }

        // Fecha o modal ao clicar no botão de fechar
        document.getElementById('close-famous-modal').onclick = () => {
            modal.classList.remove('show');
        };

        // Fecha o modal ao clicar fora do conteúdo
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        };

    } catch (error) {
        console.error("Erro ao carregar obras do ator:", error);
        showToast("Erro ao buscar produções do famoso.", "error");
    }
};

// =================================================================
// 🔞 EASTER EGG: MULTIVERSO ADULTO (30 CLIQUES EM INÍCIO)
// =================================================================
function initEasterEgg() {
    document.addEventListener('click', (e) => {
        // Intercepta cliques no botão de mudar tema (alternar cor do site)
        const toggleBtn = e.target.closest('#theme-toggle');
        if (toggleBtn) {
            let clicks = parseInt(localStorage.getItem('winbry_ee_clicks')) || 0;
            clicks++;
            localStorage.setItem('winbry_ee_clicks', clicks);
            console.log(`🥚 Clicks Easter Egg (Tema): ${clicks}/20`);

            if (clicks >= 20) {
                // Zera o contador
                localStorage.setItem('winbry_ee_clicks', '0');
                // Dispara o Multiverso Adulto Secreto!
                window.location.href = 'filmes.html?easteregg=true';
            }
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEasterEgg);
} else {
    initEasterEgg();
}

async function loadAdultEasterEgg(page) {
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showToast("🔞 Carregando o Multiverso Adulto Secreto (18+)...", "info");

    // 1. IDs estáticos consagrados (Garantia de carregamento dos melhores clássicos)
    const staticObras = [
        { id: 98042, type: 'tv' },      // Overflow (Anime Hentai)
        { id: 112836, type: 'tv' },     // Redo of Healer (Anime Adulto)
        { id: 43406, type: 'tv' },      // Yosuga no Sora (Anime Adulto)
        { id: 64188, type: 'tv' },      // Valkyrie Drive: Mermaid (Anime Adulto)
        { id: 324291, type: 'movie' },  // Love (Filme Adulto Gaspar Noé)
        { id: 635302, type: 'movie' },  // 365 Dias (Filme Adulto / Erótico)
        { id: 216015, type: 'movie' },  // Cinquenta Tons de Cinza (Erótico)
        { id: 190859, type: 'movie' },  // Ninfomaníaca: Volume 1 (Erótico)
        { id: 242095, type: 'movie' },  // Ninfomaníaca: Volume 2 (Erótico)
        { id: 85341, type: 'tv' },      // Domestic Girlfriend (Anime Adulto)
        { id: 32976, type: 'tv' },      // Kiss x Sis (Anime Adulto)
        { id: 345, type: 'movie' },     // De Olhos Bem Fechados (Clássico Erótico)
        { id: 402, type: 'movie' },     // Instinto Selvagem (Clássico Erótico)
        { id: 5822, type: 'movie' },    // Império dos Sentidos (Erótico)
        { id: 100412, type: 'tv' },     // Kuroinu: Kedamono-tachi no Moriawase (Hentai Famoso)
        { id: 115222, type: 'tv' }      // Harem in the Labyrinth of Another World (Anime Adulto)
    ];

    try {
        // 2. Dispara a busca síncrona/paralela dos clássicos estáticos
        const staticPromises = staticObras.map(async (obra) => {
            try {
                const data = await fetchTMDB(`/${obra.type}/${obra.id}`);
                if (data && data.poster_path) {
                    data.media_type = obra.type;
                    return data;
                }
            } catch (e) {
                console.error(`Erro ao obter obra estática ${obra.id}:`, e);
            }
            return null;
        });

        // 3. Dispara buscas dinâmicas no TMDB por todos os termos adultos, de hentai e pornô solicitados
        const searchTerms = [
            'hentai', 'uncensored', 'erotic', 'erótica', 'erótico', 'sexy anime', 
            'adult anime', 'ecchi', 'orgasm', 'sex', 'sexual', 'sadomaso', 
            'blowjob', 'creampie', 'sensual', 'yuri', 'yaoi', 'hentai anime',
            'overflow', 'yosuga no sora', 'boku no pico', 'kiss x sis', 'valkyrie drive', 
            'redo of healer', 'kaifuku jutsushi', 'ishuzoku reviewers', 'shoujo ramune',
            'residence', 'front inn', 'under-content', 'kuroinu', 'disciplined',
            'overflow: tenkousei', 'overflowing',
            'porn', 'pornography', 'pornstar', 'hardcore', 'softcore', 'xxx', 'sex movie', 'erotic movie', 'erotismo'
        ];
        const dynamicPromises = [];

        searchTerms.forEach(term => {
            // Busca multi (filmes, séries e animes juntos) para otimização extrema e velocidade
            dynamicPromises.push(fetchTMDB(`/search/multi?query=${encodeURIComponent(term)}&include_adult=true&page=1`));
        });

        // Discover de Animes Adultos adicionais para entupir a lista
        dynamicPromises.push(fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=true&page=1'));
        dynamicPromises.push(fetchTMDB('/discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&include_adult=true&page=2'));

        // Discover de Filmes Adultos Reais (Pornô e Eróticos de Carne e Osso 18+ do TMDB)
        dynamicPromises.push(fetchTMDB('/discover/movie?include_adult=true&sort_by=popularity.desc&page=1'));
        dynamicPromises.push(fetchTMDB('/discover/movie?include_adult=true&sort_by=popularity.desc&page=2'));
        dynamicPromises.push(fetchTMDB('/discover/movie?include_adult=true&sort_by=popularity.desc&page=3'));

        // Resolve tudo de forma ultrarrápida em paralelo
        const [staticResults, ...dynamicResults] = await Promise.all([
            Promise.all(staticPromises),
            ...dynamicPromises
        ]);

        // Junta todos os itens em uma lista única
        let allItems = [...staticResults.filter(r => r !== null)];

        dynamicResults.forEach((res) => {
            if (res && res.results) {
                res.results.forEach(item => {
                    if (item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv')) {
                        allItems.push(item);
                    }
                });
            }
        });

        // 4. Filtra duplicados pelo ID do TMDB de forma eficiente com Set
        const seenIds = new Set();
        let uniqueAdultItems = [];
        allItems.forEach(item => {
            if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                uniqueAdultItems.push(item);
            }
        });

        // 5. Ordena por popularidade para destacar os melhores no topo
        uniqueAdultItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

        if (uniqueAdultItems.length > 0) {
            // Renderiza a grande grade dinâmica adulta com sucesso absoluto!
            renderGrid(uniqueAdultItems, 'multi', '🔞 Multiverso Adulto Secreto (18+)');
            renderPagination(1, 1, null); // Exibe tudo em página única contínua premium
        } else {
            showToast("⚠️ Não foi possível carregar o catálogo secreto. Tente novamente.", "error");
        }

    } catch (error) {
        console.error("Erro geral no Multiverso Adulto:", error);
        showToast("⚠️ Erro ao carregar o Multiverso Adulto.", "error");
    }
}