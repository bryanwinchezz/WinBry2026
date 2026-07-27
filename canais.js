/**
 * WINBRY - CENTRAL DE CANAIS DE TV & AGENDA ESPORTIVA
 * Estilo Minimalista e Nativo Oficial do WinBry
 * Base URL: https://reidosembeds.online/api
 */

const API_BASE = 'https://reidosembeds.online/api';

// Lista de Canais Backup de Alta Qualidade (Garantia de Zero Erros de Conexão)
const FALLBACK_CHANNELS = [
    { id: "tv-globo-sp", name: "TV Globo SP HD", category: "TV Aberta", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/globo.png", embed_url: "https://v2.rdse.site/tv-globo-sp" },
    { id: "tv-globo-rj", name: "TV Globo RJ HD", category: "TV Aberta", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/globo.png", embed_url: "https://v2.rdse.site/tv-globo-rj" },
    { id: "sportv", name: "SporTV HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/sportv.png", embed_url: "https://v2.rdse.site/sportv" },
    { id: "sportv-2", name: "SporTV 2 HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/sportv2.png", embed_url: "https://v2.rdse.site/sportv-2" },
    { id: "sportv-3", name: "SporTV 3 HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/sportv3.png", embed_url: "https://v2.rdse.site/sportv-3" },
    { id: "premiere-clubes", name: "Premiere Clubes HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/premiere.png", embed_url: "https://v2.rdse.site/premiere-clubes" },
    { id: "premiere-2", name: "Premiere 2 HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/premiere.png", embed_url: "https://v2.rdse.site/premiere-2" },
    { id: "espn", name: "ESPN HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/espn.png", embed_url: "https://v2.rdse.site/espn" },
    { id: "espn-2", name: "ESPN 2 HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/espn2.png", embed_url: "https://v2.rdse.site/espn-2" },
    { id: "cazetv", name: "CazéTV HD", category: "Esportes", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/cazetv.png", embed_url: "https://v2.rdse.site/cazetv" },
    { id: "sbt", name: "SBT HD", category: "TV Aberta", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/sbt.png", embed_url: "https://v2.rdse.site/sbt" },
    { id: "record", name: "Record TV HD", category: "TV Aberta", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/record.png", embed_url: "https://v2.rdse.site/record" },
    { id: "band", name: "Band HD", category: "TV Aberta", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/band.png", embed_url: "https://v2.rdse.site/band" },
    { id: "gloob", name: "Gloob", category: "Infantil", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/gloob.png", embed_url: "https://v2.rdse.site/gloob" },
    { id: "globonews", name: "GloboNews", category: "Variedades", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/globonews.png", embed_url: "https://v2.rdse.site/globonews" },
    { id: "multishow", name: "Multishow", category: "Variedades", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/multishow.png", embed_url: "https://v2.rdse.site/multishow" },
    { id: "hbo", name: "HBO HD", category: "Filmes & Séries", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/hbo.png", embed_url: "https://v2.rdse.site/hbo" },
    { id: "telecine-pipoca", name: "Telecine Pipoca", category: "Filmes & Séries", logo_url: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/channels/telecine.png", embed_url: "https://v2.rdse.site/telecine-pipoca" }
];

const FALLBACK_EVENTS = [
    {
        id: "flamengo-x-sao-paulo",
        title: "Flamengo x São Paulo",
        category: "Futebol",
        competition: "BRASILEIRÃO SÉRIE A",
        status: "live",
        start_time: new Date().toISOString(),
        visual_model: "versus",
        time1: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/team/7146.png",
        time2: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/team/4190.png",
        time1_name: "Flamengo",
        time2_name: "São Paulo",
        embeds: [
            { provider: "Premiere HD", embed_url: "https://v2.rdse.site/premiere-clubes" },
            { provider: "SporTV", embed_url: "https://v2.rdse.site/sportv" }
        ]
    },
    {
        id: "gremio-x-fluminense",
        title: "Grêmio x Fluminense",
        category: "Futebol",
        competition: "BRASILEIRÃO SÉRIE A",
        status: "upcoming",
        start_time: new Date(Date.now() + 3600000).toISOString(),
        visual_model: "versus",
        time1: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/team/7146.png",
        time2: "https://d1muf25xaso8hp.cloudfront.net/https://reidosembeds.online/img/team/4190.png",
        time1_name: "Grêmio",
        time2_name: "Fluminense",
        embeds: [
            { provider: "Premiere 2", embed_url: "https://v2.rdse.site/premiere-2" }
        ]
    }
];

// Estado Global da Seção de Canais
const canaisState = {
    currentTab: 'channels',     // 'channels', 'events'
    activeCategory: 'all',      // Categoria selecionada
    allChannels: [],            // Todos os canais da API
    allEvents: [],              // Todos os eventos da API
};

let canaisDom = {};

document.addEventListener('DOMContentLoaded', async () => {
    initCanaisDomReferences();
    initCanaisNavigation();
    initCanaisSearch();
    initCanaisModals();

    // Pré-carrega canais e eventos em segundo plano
    await preloadAllCanaisData();

    // Carrega a aba padrão (Canais)
    switchCanaisTab('channels');
});

function initCanaisDomReferences() {
    canaisDom = {
        contentGrid: document.getElementById('contentGrid'),
        categoryContainer: document.getElementById('categoryContainer'),
        categoryFilters: document.getElementById('categoryFilters'),
        searchInput: document.getElementById('search-input'),
        searchIcon: document.getElementById('search-icon'),
        playerModal: document.getElementById('playerModal'),
        modalBody: document.getElementById('modalBody'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        navTabs: document.querySelectorAll('.winbry-tab-btn'),
        sectionTitle: document.getElementById('sectionTitle'),
        sectionSubtitle: document.getElementById('sectionSubtitle')
    };
}

/**
 * SISTEMA RESILIENTE DE REQUISIÇÃO (Direto -> CORS Proxy -> Backup)
 */
async function fetchWithResilience(endpoint) {
    const urls = [
        `${API_BASE}${endpoint}`,
        `https://corsproxy.io/?${encodeURIComponent(API_BASE + endpoint)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(API_BASE + endpoint)}`
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const json = await res.json();
                const data = json.data || (Array.isArray(json) ? json : null);
                if (data && Array.isArray(data) && data.length > 0) return data;
            }
        } catch (e) {
            // Continua para a próxima alternativa
        }
    }
    return null;
}

async function preloadAllCanaisData() {
    try {
        const [channels, events] = await Promise.all([
            fetchWithResilience('/channels'),
            fetchWithResilience('/eventos')
        ]);

        canaisState.allChannels = channels || FALLBACK_CHANNELS;
        canaisState.allEvents = events || FALLBACK_EVENTS;
    } catch (e) {
        canaisState.allChannels = FALLBACK_CHANNELS;
        canaisState.allEvents = FALLBACK_EVENTS;
    }
}

/**
 * TROCA DE ABAS (Canais, Agenda)
 */
function initCanaisNavigation() {
    if (!canaisDom.navTabs) return;
    canaisDom.navTabs.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchCanaisTab(tab);
        });
    });
}

function switchCanaisTab(tab) {
    canaisState.currentTab = tab;
    canaisState.activeCategory = 'all';

    if (canaisDom.navTabs) {
        canaisDom.navTabs.forEach(b => {
            if (b.dataset.tab === tab) b.classList.add('active');
            else b.classList.remove('active');
        });
    }

    if (canaisDom.contentGrid) canaisDom.contentGrid.style.display = 'grid';
    if (canaisDom.categoryContainer) canaisDom.categoryContainer.style.display = 'block';

    if (tab === 'channels') {
        if (canaisDom.sectionTitle) canaisDom.sectionTitle.textContent = 'Canais de TV Ao Vivo';
        if (canaisDom.sectionSubtitle) canaisDom.sectionSubtitle.textContent = 'Transmissões ao vivo em HD organizadas por categoria.';
        renderChannelCategories();
        fetchCanaisChannels();
    } else if (tab === 'events') {
        if (canaisDom.sectionTitle) canaisDom.sectionTitle.textContent = 'Agenda Esportiva';
        if (canaisDom.sectionSubtitle) canaisDom.sectionSubtitle.textContent = 'Partidas organizadas por campeonato (Série A, Série B, Série C, Série D) e ordenadas por horário.';
        renderEventCategories();
        fetchCanaisEvents();
    }
}

/**
 * RENDERIZAÇÃO DAS CATEGORIAS DE CANAIS
 */
function renderChannelCategories() {
    const container = domCategoryFilters();
    if (!container) return;

    const channelCategories = [
        { id: 'all', name: 'Todos' },
        { id: 'esportes', name: '⚽ Esportes' },
        { id: 'abertos', name: '📺 TV Aberta' },
        { id: 'filmes', name: '🎬 Filmes & Séries' },
        { id: 'infantil', name: '🎨 Infantil' },
        { id: 'variedades', name: '⭐ Variedades' }
    ];

    container.innerHTML = '';
    channelCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `winbry-cat-btn ${cat.id === 'all' ? 'active' : ''}`;
        btn.dataset.category = cat.id;
        btn.textContent = cat.name;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.winbry-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            canaisState.activeCategory = cat.id;
            filterAndRenderChannels(cat.id);
        });

        container.appendChild(btn);
    });
}

/**
 * RENDERIZAÇÃO DAS CATEGORIAS DE AGENDA (SÉRIE A, SÉRIE B, SÉRIE C, SÉRIE D, ETC)
 */
function renderEventCategories() {
    const container = domCategoryFilters();
    if (!container) return;

    const eventCategories = [
        { id: 'all', name: 'Todos' },
        { id: 'live', name: '🔴 Ao Vivo' },
        { id: 'futebol', name: '⚽ Futebol' },
        { id: 'serie_a', name: '🏆 Série A' },
        { id: 'serie_b', name: '🥈 Série B' },
        { id: 'serie_c', name: '🥉 Série C' },
        { id: 'serie_d', name: '⚽ Série D' },
        { id: 'copa', name: '🇧🇷 Copas' },
        { id: 'basquete', name: '🏀 Basquete' }
    ];

    container.innerHTML = '';
    eventCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `winbry-cat-btn ${cat.id === 'all' ? 'active' : ''}`;
        btn.dataset.category = cat.id;
        btn.textContent = cat.name;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.winbry-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            canaisState.activeCategory = cat.id;
            filterAndRenderEvents(cat.id);
        });

        container.appendChild(btn);
    });
}

function domCategoryFilters() {
    return canaisDom.categoryFilters || document.getElementById('categoryFilters');
}

/**
 * BUSCA DE CANAIS DE TV
 */
async function fetchCanaisChannels() {
    if (!canaisState.allChannels || canaisState.allChannels.length === 0) {
        showCanaisLoader();
        const fetched = await fetchWithResilience('/channels');
        canaisState.allChannels = fetched || FALLBACK_CHANNELS;
    }
    filterAndRenderChannels(canaisState.activeCategory);
}

function filterAndRenderChannels(categoryKey) {
    if (!canaisState.allChannels) canaisState.allChannels = FALLBACK_CHANNELS;
    
    let filtered = canaisState.allChannels;
    if (categoryKey && categoryKey !== 'all') {
        const key = categoryKey.toLowerCase();
        filtered = canaisState.allChannels.filter(ch => {
            const cat = (ch.category || '').toLowerCase();
            const name = (ch.name || '').toLowerCase();
            return cat.includes(key) || name.includes(key);
        });
    }

    renderWinbryChannelsGrid(filtered);
}

/**
 * BUSCA DE EVENTOS E JOGOS ESPORTIVOS
 */
async function fetchCanaisEvents() {
    if (!canaisState.allEvents || canaisState.allEvents.length === 0) {
        showCanaisLoader();
        const fetched = await fetchWithResilience('/eventos');
        canaisState.allEvents = fetched || FALLBACK_EVENTS;
    }
    filterAndRenderEvents(canaisState.activeCategory);
}

function filterAndRenderEvents(categoryKey) {
    if (!canaisState.allEvents) canaisState.allEvents = FALLBACK_EVENTS;
    
    let filtered = filterEventsByCategory(canaisState.allEvents, categoryKey);
    
    // ORDENAÇÃO CRONOLÓGICA INTELIGENTE:
    filtered.sort((a, b) => {
        const isLiveA = a.status === 'live';
        const isLiveB = b.status === 'live';
        if (isLiveA && !isLiveB) return -1;
        if (!isLiveA && isLiveB) return 1;

        const timeA = new Date(a.start_time ? a.start_time.replace(' ', 'T') : 0).getTime();
        const timeB = new Date(b.start_time ? b.start_time.replace(' ', 'T') : 0).getTime();
        return timeA - timeB;
    });

    renderWinbryEventsGrid(filtered);
}

function filterEventsByCategory(allEvents, catKey) {
    if (!catKey || catKey === 'all') return allEvents;
    const lowerKey = catKey.toLowerCase();
    
    if (lowerKey === 'live' || lowerKey === 'ao vivo') {
        return allEvents.filter(ev => ev.status === 'live');
    }
    if (lowerKey === 'serie_a') {
        return allEvents.filter(ev => {
            const comp = (ev.competition || '').toLowerCase();
            const desc = (ev.description || '').toLowerCase();
            const title = (ev.title || '').toLowerCase();
            return comp.includes('série a') || comp.includes('serie a') || desc.includes('série a') || title.includes('série a');
        });
    }
    if (lowerKey === 'serie_b') {
        return allEvents.filter(ev => {
            const comp = (ev.competition || '').toLowerCase();
            const desc = (ev.description || '').toLowerCase();
            const title = (ev.title || '').toLowerCase();
            return comp.includes('série b') || comp.includes('serie b') || desc.includes('série b') || title.includes('série b');
        });
    }
    if (lowerKey === 'serie_c') {
        return allEvents.filter(ev => {
            const comp = (ev.competition || '').toLowerCase();
            const desc = (ev.description || '').toLowerCase();
            const title = (ev.title || '').toLowerCase();
            return comp.includes('série c') || comp.includes('serie c') || desc.includes('série c') || title.includes('série c');
        });
    }
    if (lowerKey === 'serie_d') {
        return allEvents.filter(ev => {
            const comp = (ev.competition || '').toLowerCase();
            const desc = (ev.description || '').toLowerCase();
            const title = (ev.title || '').toLowerCase();
            return comp.includes('série d') || comp.includes('serie d') || desc.includes('série d') || title.includes('série d');
        });
    }
    if (lowerKey === 'futebol') {
        return allEvents.filter(ev => {
            const cat = (ev.category || '').toLowerCase();
            const comp = (ev.competition || '').toLowerCase();
            return cat.includes('futebol') || comp.includes('futebol') || comp.includes('série') || comp.includes('copa') || comp.includes('liga');
        });
    }
    if (lowerKey === 'copa') {
        return allEvents.filter(ev => {
            const comp = (ev.competition || '').toLowerCase();
            const title = (ev.title || '').toLowerCase();
            return comp.includes('copa') || title.includes('copa');
        });
    }
    
    return allEvents.filter(ev => {
        const cat = (ev.category || '').toLowerCase();
        const comp = (ev.competition || '').toLowerCase();
        return cat.includes(lowerKey) || comp.includes(lowerKey);
    });
}

/**
 * AÇÃO DE ABRIR TRANSMISSÃO EM NOVA ABA (DIRETO)
 */
function openStreamDirectly(url, name) {
    if (!url) return;
    showWinbryToast(`Abrindo ${name}...`);
    window.open(url, '_blank');
}

/**
 * RENDERIZADORES EM ESTILO WINBRY
 */
function renderWinbryChannelsGrid(channels) {
    if (!canaisDom.contentGrid) return;
    canaisDom.contentGrid.innerHTML = '';
    
    if (!channels || channels.length === 0) {
        showCanaisEmptyState('Nenhum canal encontrado nesta categoria.');
        return;
    }

    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'winbry-channel-card';
        
        const title = ch.name || 'Canal';
        const category = ch.category || 'TV';
        const logoUrl = ch.logo_url || 'https://via.placeholder.com/300x150/111111/e50914?text=' + encodeURIComponent(title);

        card.innerHTML = `
            <div class="winbry-card-header">
                <img src="${logoUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x150/111111/ffffff?text=SEM+SINAL'">
                <div class="winbry-card-play-overlay">
                    <div class="winbry-play-btn"><i class="fas fa-play"></i></div>
                </div>
                <span class="winbry-badge live">AO VIVO</span>
            </div>
            <div class="winbry-card-body">
                <div class="winbry-card-cat">${category}</div>
                <div class="winbry-card-title">${title}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            const embedUrl = ch.embed_url || `https://v2.rdse.site/${ch.id}`;
            openStreamDirectly(embedUrl, title);
        });

        canaisDom.contentGrid.appendChild(card);
    });
}

function renderWinbryEventsGrid(events) {
    if (!canaisDom.contentGrid) return;
    canaisDom.contentGrid.innerHTML = '';
    
    if (!events || events.length === 0) {
        showCanaisEmptyState('Nenhum evento esportivo encontrado nesta categoria.');
        return;
    }

    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'winbry-channel-card';
        
        const title = ev.title || `${ev.time1_name} x ${ev.time2_name}`;
        const isVersus = ev.visual_model === 'versus' && (ev.time1 || ev.time2);
        const isLive = ev.status === 'live';
        const competition = ev.competition || ev.category || 'Esportes';
        const formattedDate = formatEventDateAndDay(ev.start_time);
        const embeds = ev.embeds || [];

        let headerHTML = '';
        if (isVersus) {
            headerHTML = `
                <div class="winbry-versus-box">
                    <div class="winbry-team">
                        <img src="${ev.time1}" class="winbry-team-logo" alt="${ev.time1_name}" onerror="this.src='https://via.placeholder.com/44/111111/ffffff?text=TIME'">
                        <span>${ev.time1_name || 'Time A'}</span>
                    </div>
                    <div class="winbry-vs-badge">VS</div>
                    <div class="winbry-team">
                        <img src="${ev.time2}" class="winbry-team-logo" alt="${ev.time2_name}" onerror="this.src='https://via.placeholder.com/44/111111/ffffff?text=TIME'">
                        <span>${ev.time2_name || 'Time B'}</span>
                    </div>
                </div>
            `;
        } else {
            const posterUrl = ev.poster || 'https://via.placeholder.com/300x150/111111/e50914?text=JOGO';
            headerHTML = `<img src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x150/111111/ffffff?text=EVENTO'">`;
        }

        card.innerHTML = `
            <div class="winbry-card-header">
                ${headerHTML}
                <div class="winbry-card-play-overlay">
                    <div class="winbry-play-btn"><i class="fas fa-play"></i></div>
                </div>
                ${isLive ? '<span class="winbry-badge live">AO VIVO</span>' : `<span class="winbry-badge">${formattedDate}</span>`}
            </div>
            <div class="winbry-card-body">
                <div class="winbry-card-cat">${ev.category || 'Jogo'} • ${competition}</div>
                <div class="winbry-card-title">${title}</div>
                <div style="font-size:0.75rem; color:var(--color-text-secondary); margin-top:0.25rem; display:flex; align-items:center; gap:0.4rem;">
                    <i class="far fa-clock" style="color:var(--color-primary);"></i> ${formattedDate}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            if (embeds.length > 1) {
                openWinbryEventModalOptions(ev);
            } else {
                const targetUrl = (embeds[0] && embeds[0].embed_url) || ev.play_event_url || `https://v2.rdse.site/e/${ev.slug}`;
                openStreamDirectly(targetUrl, title);
            }
        });

        canaisDom.contentGrid.appendChild(card);
    });
}

/**
 * MODAL SELETOR DE CANAIS DE TRANSMISSÃO
 */
async function openWinbryEventModalOptions(event) {
    if (!canaisDom.modalBody) return;
    canaisDom.modalBody.innerHTML = `
        <div class="loader-container" style="box-shadow:none; background:transparent; padding:1.5rem;">
            <div class="spinner"></div>
            <p>Carregando canais de transmissão...</p>
        </div>
    `;
    if (canaisDom.playerModal) canaisDom.playerModal.style.display = 'flex';

    let embeds = event.embeds || [];
    if (!embeds || embeds.length === 0) {
        try {
            const fetched = await fetchWithResilience(`/eventos/${event.id || event.slug}`);
            embeds = fetched?.embeds || [];
        } catch (e) {
            embeds = [];
        }
    }

    const title = event.title || `${event.time1_name} x ${event.time2_name}`;

    canaisDom.modalBody.innerHTML = `
        <div>
            <h2 class="winbry-modal-header-title"><i class="fas fa-trophy" style="color:var(--color-primary);"></i> ${title}</h2>
            <p class="winbry-modal-desc">Escolha um dos canais abaixo para abrir a transmissão ao vivo:</p>
            
            <div class="winbry-provider-grid">
                ${(embeds.length > 0 ? embeds : [{ provider: 'Opção HD', embed_url: `https://v2.rdse.site/e/${event.slug || event.id}` }]).map((emb, idx) => `
                    <button class="winbry-provider-btn" onclick="openStreamDirectly('${emb.embed_url}', '${emb.provider || 'Opção ' + (idx + 1)}')">
                        <i class="fas fa-play" style="font-size:0.8rem; color:var(--color-primary);"></i>
                        <span>${emb.provider || `Opção ${idx + 1}`}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * SISTEMA DE BUSCA RESILIENTE E CONTEXTUAL
 */
function initCanaisSearch() {
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    const searchBox = document.querySelector('.search-box');
    
    if (!searchInput) return;

    let debounceTimeout = null;

    const toggleMobileSearchBox = () => {
        if (!searchBox) return;
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
            searchInput.style.display = 'block';
            setTimeout(() => searchInput.focus(), 100);
        } else {
            setTimeout(() => { 
                if (window.innerWidth <= 768 && !searchInput.value.trim()) {
                    searchInput.style.display = 'none'; 
                }
            }, 300);
        }
    };

    const performSearch = async () => {
        const rawQuery = searchInput.value.trim();
        
        if (!rawQuery) {
            switchCanaisTab(canaisState.currentTab);
            return;
        }

        const queryNorm = rawQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (canaisDom.sectionTitle) canaisDom.sectionTitle.textContent = `Resultados para: "${rawQuery}"`;
        
        if (canaisState.currentTab === 'channels') {
            if (canaisDom.sectionSubtitle) canaisDom.sectionSubtitle.textContent = 'Busca em tempo real de canais de TV ao vivo.';

            const channelsSource = (canaisState.allChannels && canaisState.allChannels.length > 0) ? canaisState.allChannels : FALLBACK_CHANNELS;

            let matchedChannels = channelsSource.filter(ch => {
                const name = (ch.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const cat = (ch.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const desc = (ch.description || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return name.includes(queryNorm) || cat.includes(queryNorm) || desc.includes(queryNorm);
            });

            if (matchedChannels.length === 0) {
                showCanaisEmptyState(`Nenhum canal de TV encontrado para "${rawQuery}".`);
            } else {
                renderWinbryChannelsGrid(matchedChannels);
            }
        } else {
            if (canaisDom.sectionSubtitle) canaisDom.sectionSubtitle.textContent = 'Busca em tempo real da agenda de jogos esportivos.';

            const eventsSource = (canaisState.allEvents && canaisState.allEvents.length > 0) ? canaisState.allEvents : FALLBACK_EVENTS;

            let matchedEvents = eventsSource.filter(ev => {
                const title = (ev.title || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const t1 = (ev.time1_name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const t2 = (ev.time2_name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const comp = (ev.competition || ev.category || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return title.includes(queryNorm) || t1.includes(queryNorm) || t2.includes(queryNorm) || comp.includes(queryNorm);
            });

            if (matchedEvents.length === 0) {
                showCanaisEmptyState(`Nenhum jogo encontrado para "${rawQuery}".`);
            } else {
                renderWinbryEventsGrid(matchedEvents);
            }
        }
    };

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            performSearch();
        }
    }, true);

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            performSearch();
        }, 200);
    });

    if (searchIcon) {
        searchIcon.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && searchBox && !searchBox.classList.contains('active')) {
                toggleMobileSearchBox();
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            performSearch();
        });
    }
}

function initCanaisModals() {
    const closeModal = () => {
        if (canaisDom.playerModal) canaisDom.playerModal.style.display = 'none';
        if (canaisDom.modalBody) canaisDom.modalBody.innerHTML = '';
    };

    if (canaisDom.closeModalBtn) canaisDom.closeModalBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === canaisDom.playerModal) closeModal();
    });
}

function showCanaisLoader() {
    if (!canaisDom.contentGrid) return;
    canaisDom.contentGrid.innerHTML = `
        <div class="loader-container">
            <div class="spinner"></div>
            <p>Carregando...</p>
        </div>
    `;
}

function showCanaisError(msg) {
    if (!canaisDom.contentGrid) return;
    canaisDom.contentGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Falha de Conexão</h3>
            <p>${msg}</p>
        </div>
    `;
}

function showCanaisEmptyState(msg) {
    if (!canaisDom.contentGrid) return;
    canaisDom.contentGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-broadcast-tower"></i>
            <h3>Nenhum Resultado</h3>
            <p>${msg}</p>
        </div>
    `;
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showWinbryToast('Copiado!');
    });
};

function showWinbryToast(message) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color:var(--color-primary);"></i> ${message}`;
    
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function formatEventDateAndDay(startTimeStr) {
    if (!startTimeStr) return 'Horário N/A';
    try {
        const normalizedStr = startTimeStr.replace(' ', 'T');
        const date = new Date(normalizedStr);
        if (isNaN(date.getTime())) return startTimeStr;

        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear();

        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayLabel = isToday ? 'Hoje' : days[date.getDay()];

        const dayNum = String(date.getDate()).padStart(2, '0');
        const monthNum = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${dayLabel}, ${dayNum}/${monthNum} às ${hours}:${minutes}`;
    } catch {
        return startTimeStr;
    }
}
