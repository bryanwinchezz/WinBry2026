(function() {
    // =================================================================
    // MULTIVERSO.JS - RENDERIZAÇÃO E PERSONALIZAÇÃO DAS FRANQUIAS (V17)
    // =================================================================

    // Constantes locais isoladas na IIFE para evitar conflitos de redeclaração (SyntaxError) no Chromium
    const API_KEY = "55b8ea4272d5e05ac8a517457a4303c4";
    const BASE_URL = "https://api.themoviedb.org/3";
    const IMG_BASE = "https://image.tmdb.org/t/p/w500";
    const BANNER_BASE = "https://image.tmdb.org/t/p/original";
    const LANGUAGE = "&language=pt-BR";

    // Blacklist rígida e extensiva de termos adultos/impróprios/paródias eróticas
    const ADULT_BLACKLIST = [
        'lesbian', 'porn', 'erotic', 'erotica', 'xxx', 'hentai', 'sexy', 'naked', 'nudity', 'nude', 
        'slut', 'bitch', 'ass ', 'asses', 'kinky', 'orgasm', 'sexo', 'erótico', 'sensual', 'adulto', 
        'porno', 'pornô', 'putaria', 'safadeza', 'adult', 'anal', 'hardcore', 'milf', 'swinger', 
        'peituda', 'peitudas', 'bundas', 'bunduda', 'buceta', 'pica', 'caralho', 'foder', 'trepar', 
        'transar', 'gozo', 'gozada', 'leite', 'novinha', 'novinhas', 'safada', 'safadas', 'gostosa', 
        'gostosas', 'tarada', 'prostituta', 'puta', 'putas', 'vagabunda', 'hot ', 'parody', 'paródia', 
        'parodia', 'boobs', 'tits', 'pussy', 'dick', 'blowjob', 'suck', 'sex'
    ];

    // Função auxiliar para casamento preciso de palavras-chave, evitando falsos-positivos
    function matchesKeyword(text, keyword) {
        if (!text) return false;
        
        // Palavras-chave críticas que precisam de correspondência de palavra inteira (evita 'marvelous' etc.)
        if (keyword === 'marvel') {
            return /\bmarvel\b/i.test(text);
        }
        if (keyword === 'dc') {
            return /\bdc\b/i.test(text);
        }
        if (keyword === 'thor') {
            return /\bthor\b/i.test(text);
        }
        if (keyword === 'loki') {
            return /\bloki\b/i.test(text);
        }
        if (keyword === 'hulk') {
            return /\bhulk\b/i.test(text);
        }
        
        return text.includes(keyword);
    }

    // Função de busca assíncrona TMDB local e autônoma
    async function fetchTMDBLocal(endpoint) {
        try {
            const char = endpoint.includes('?') ? '&' : '?';
            const response = await fetch(`${BASE_URL}${endpoint}${char}api_key=${API_KEY}${LANGUAGE}`);
            return await response.json();
        } catch (error) {
            console.error("Erro TMDB Local:", error);
            return null;
        }
    }

    // Mapa das marcas local para busca no catálogo (Enriquecido com séries e lançamentos futuros aguardados)
    const BRAND_MAP = {
        'marvel': { type: 'company', id: '420|7505|19551', title: 'Universo Marvel' },
        'dc': { type: 'company', id: '9993|128064', title: 'Universo DC' },
        'cartoon': { type: 'network', id: '56', title: 'Cartoon Network' },
        'adult': { type: 'network', id: '80', title: 'Adult Swim' },
        'disney': { type: 'company', id: '2', title: 'Disney' },
        'illumination': { type: 'company', id: '6704', title: 'Illumination' },
        'star wars': { type: 'collection', id: '10|tv:82856|tv:84773|tv:83867|tv:67419|tv:61159|tv:115036|tv:60574|tv:118228|tv:124430|movie:1228710', title: 'Coleção Star Wars' },
        'invocacao': { type: 'collection', id: '313086|402074|968052|movie:1148020', title: 'Coleção Invocação do Mal' },
        'harry potter': { type: 'collection', id: '1241|movie:899082|tv:224377', title: 'Coleção Harry Potter' },
        'jurassic': { type: 'collection', id: '328|tv:93741|tv:243004|movie:1234821', title: 'Coleção Jurassic Park' },
        'velozes': { type: 'collection', id: '9485|tv:89427', title: 'Saga Velozes e Furiosos' },
        'jogos': { type: 'collection', id: '131635|movie:1283344', title: 'Jogos Vorazes' },
        'crepusculo': { type: 'collection', id: '33514', title: 'Saga Crepúsculo' },
        'transformers': { type: 'collection', id: '8650|tv:33215|tv:203248|tv:93427|tv:4247|movie:698687', title: 'Transformers' }
    };

    // Configurações visuais, imagens de fundo locais e ordens cronológicas para cada marca
    const BRAND_CONFIGS = {
        'marvel': {
            title: 'Universo Marvel',
            logo: 'images/logo-marvel.png',
            bgImage: 'images/background/marvel.jpg',
            colors: {
                '--brand-primary': '#e50914',
                '--brand-primary-rgb': '229, 9, 20',
                '--brand-shadow': 'rgba(229, 9, 20, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #141414 0%, #1c0003 100%)',
                '--brand-glow': '0 0 20px rgba(229, 9, 20, 0.8)'
            },
            chronologyIds: [
                { id: 18823, type: 'movie' },  // Capitão América: O Primeiro Vingador
                { id: 299537, type: 'movie' }, // Capitã Marvel
                { id: 1726, type: 'movie' },   // Homem de Ferro
                { id: 10138, type: 'movie' },  // Homem de Ferro 2
                { id: 1724, type: 'movie' },   // O Incrível Hulk
                { id: 10195, type: 'movie' },  // Thor
                { id: 24428, type: 'movie' },  // Os Vingadores
                { id: 68721, type: 'movie' },  // Homem de Ferro 3
                { id: 76338, type: 'movie' },  // Thor: O Mundo Sombrio
                { id: 100402, type: 'movie' }, // Capitão América: O Soldado Invernal
                { id: 118340, type: 'movie' }, // Guardiões da Galáxia
                { id: 283995, type: 'movie' }, // Guardiões da Galáxia Vol. 2
                { id: 99861, type: 'movie' },  // Vingadores: Era de Ultron
                { id: 102899, type: 'movie' }, // Homem-Formiga
                { id: 271110, type: 'movie' }, // Capitão América: Guerra Civil
                { id: 497698, type: 'movie' }, // Viúva Negra
                { id: 284054, type: 'movie' }, // Pantera Negra
                { id: 315635, type: 'movie' }, // Homem-Aranha: De Volta ao Lar
                { id: 284052, type: 'movie' }, // Doutor Estranho
                { id: 284053, type: 'movie' }, // Thor: Ragnarok
                { id: 363088, type: 'movie' }, // Homem-Formiga e a Vespa
                { id: 299536, type: 'movie' }, // Vingadores: Guerra Infinita
                { id: 299534, type: 'movie' }, // Vingadores: Ultimato
                { id: 429617, type: 'movie' }, // Homem-Aranha: Longe de Casa
                { id: 566525, type: 'movie' }, // Shang-Chi e a Lenda dos Dez Anéis
                { id: 524434, type: 'movie' }, // Eternos
                { id: 634649, type: 'movie' }, // Homem-Aranha: Sem Volta Para Casa
                { id: 453395, type: 'movie' }, // Doutor Estranho no Multiverso da Loucura
                { id: 616037, type: 'movie' }, // Thor: Amor e Trovão
                { id: 505642, type: 'movie' }, // Pantera Negra: Wakanda Para Sempre
                { id: 640146, type: 'movie' }, // Homem-Formiga e a Vespa: Quantumania
                { id: 447365, type: 'movie' }, // Guardiões da Galáxia Vol. 3
                { id: 609681, type: 'movie' }, // As Marvels
                { id: 533535, type: 'movie' }, // Deadpool & Wolverine
                // FUTUROS LANÇAMENTOS (Com IDs oficiais mapeados do TMDB)
                { id: 550988, type: 'movie' }, // Capitão América: Admirável Mundo Novo (2025)
                { id: 974575, type: 'movie' }, // Thunderbolts* (2025)
                { id: 202555, type: 'tv' },     // Daredevil: Born Again (2025)
                { id: 617126, type: 'movie' }, // The Fantastic Four: First Steps (2025)
                { id: 1003596, type: 'movie' } // Avengers: Doomsday (2026)
            ]
        },
        'dc': {
            title: 'Universo DC',
            logo: 'images/logo-dc.png',
            bgImage: 'images/background/dc.jpg',
            colors: {
                '--brand-primary': '#0078f2',
                '--brand-primary-rgb': '0, 120, 242',
                '--brand-shadow': 'rgba(0, 120, 242, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #141414 0%, #001226 100%)',
                '--brand-glow': '0 0 20px rgba(0, 120, 242, 0.8)'
            },
            chronologyIds: [
                { id: 297762, type: 'movie' }, // Mulher-Maravilha
                { id: 464052, type: 'movie' }, // Mulher-Maravilha 1984
                { id: 49521, type: 'movie' },  // Homem de Aço
                { id: 209112, type: 'movie' }, // Batman vs Superman: A Origem da Justiça
                { id: 297761, type: 'movie' }, // Esquadrão Suicida
                { id: 791373, type: 'movie' }, // Liga da Justiça de Zack Snyder
                { id: 297802, type: 'movie' }, // Aquaman
                { id: 460465, type: 'movie' }, // Shazam!
                { id: 495764, type: 'movie' }, // Aves de Rapina
                { id: 436969, type: 'movie' }, // O Esquadrão Suicida (CORRIGIDO: de 536554 para 436969)
                { id: 436270, type: 'movie' }, // Adão Negro
                { id: 594767, type: 'movie' }, // Shazam! Fúria dos Deuses
                { id: 298618, type: 'movie' }, // The Flash
                { id: 565770, type: 'movie' }, // Besouro Azul
                { id: 572802, type: 'movie' }, // Aquaman 2: O Reino Perdido
                // FUTUROS LANÇAMENTOS (Com IDs oficiais mapeados do TMDB)
                { id: 219543, type: 'tv' },     // Creature Commandos (2024 - Série Animação)
                { id: 1061474, type: 'movie' },// Superman (2025)
                { id: 1081003, type: 'movie' },// Supergirl: Woman of Tomorrow (2026)
                { id: 1111871, type: 'movie' } // The Batman Part II (2027)
            ]
        },
        'star wars': {
            title: 'Coleção Star Wars',
            logo: 'images/logo-star-wars.png',
            bgImage: 'images/background/star-wars.png',
            colors: {
                '--brand-primary': '#ffe81f',
                '--brand-primary-rgb': '255, 232, 31',
                '--brand-shadow': 'rgba(255, 232, 31, 0.5)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #141414 100%)',
                '--brand-glow': '0 0 20px rgba(255, 232, 31, 0.8)'
            },
            chronologyIds: [
                { id: 1893, type: 'movie' },   // Star Wars: Episódio I - A Ameaça Fantasma
                { id: 1894, type: 'movie' },   // Star Wars: Episódio II - Ataque dos Clones
                { id: 61159, type: 'tv' },     // Star Wars: The Clone Wars (Animação)
                { id: 1895, type: 'movie' },   // Star Wars: Episódio III - A Vingança dos Sith
                { id: 118228, type: 'tv' },    // Star Wars: The Bad Batch (Animação)
                { id: 348350, type: 'movie' }, // Han Solo: Uma História Star Wars
                { id: 83867, type: 'tv' },     // Obi-Wan Kenobi (Série)
                { id: 60574, type: 'tv' },     // Star Wars Rebels (Animação)
                { id: 84773, type: 'tv' },     // Andor (Série)
                { id: 330459, type: 'movie' }, // Rogue One: Uma História Star Wars
                { id: 11, type: 'movie' },     // Star Wars: Episódio IV - Uma Nova Esperança
                { id: 1891, type: 'movie' },   // Star Wars: Episódio V - O Império Contra-Ataca
                { id: 1892, type: 'movie' },   // Star Wars: Episódio VI - O Retorno de Jedi
                { id: 82856, type: 'tv' },     // The Mandalorian (Série)
                { id: 115036, type: 'tv' },    // O Livro de Boba Fett (Série)
                { id: 67419, type: 'tv' },     // Ahsoka (Série)
                { id: 124430, type: 'tv' },    // The Acolyte (Série)
                // FUTUROS LANÇAMENTOS
                { id: 1228710, type: 'movie' },// Star Wars: The Mandalorian and Grogu (2026)
                { id: 140607, type: 'movie' }, // Star Wars: Episódio VII - O Despertar da Força
                { id: 181808, type: 'movie' }, // Star Wars: Episódio VIII - Os Últimos Jedi
                { id: 181812, type: 'movie' }  // Star Wars: Episódio IX - A Ascensão Skywalker
            ]
        },
        'harry potter': {
            title: 'Coleção Harry Potter',
            logo: 'images/logo-harry-potter.png',
            bgImage: 'images/background/harry-potter.jpg',
            colors: {
                '--brand-primary': '#d4af37',
                '--brand-primary-rgb': '212, 175, 55',
                '--brand-shadow': 'rgba(212, 175, 55, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #120e08 0%, #1c140a 100%)',
                '--brand-glow': '0 0 20px rgba(212, 175, 55, 0.8)'
            },
            chronologyIds: [
                { id: 259316, type: 'movie' }, // Animais Fantásticos e Onde Habitam
                { id: 338952, type: 'movie' }, // Animais Fantásticos: Os Crimes de Grindelwald
                { id: 338953, type: 'movie' }, // Animais Fantásticos: Os Segredos de Dumbledore
                { id: 671, type: 'movie' },    // Harry Potter e a Pedra Filosofal
                { id: 672, type: 'movie' },    // Harry Potter e a Câmara Secreta
                { id: 673, type: 'movie' },    // Harry Potter e o Prisioneiro de Azkaban
                { id: 674, type: 'movie' },    // Harry Potter e o Cálice de Fogo
                { id: 675, type: 'movie' },    // Harry Potter e a Ordem da Fênix
                { id: 767, type: 'movie' },    // Harry Potter e o Enigma do Príncipe (CORRIGIDO: de 676 para 767)
                { id: 12444, type: 'movie' },  // Harry Potter e as Relíquias da Morte - Parte 1
                { id: 12445, type: 'movie' },  // Harry Potter e as Relíquias da Morte - Parte 2
                { id: 899082, type: 'movie' }, // Comemoração de 20 Anos de Harry Potter: De Volta a Hogwarts
                // FUTUROS LANÇAMENTOS
                { id: 224377, type: 'tv' }     // Harry Potter: HBO Series (2026)
            ]
        },
        'cartoon': {
            title: 'Cartoon Network',
            logo: 'images/logo-cn.png',
            bgImage: 'images/background/cartoon-network.jpg',
            colors: {
                '--brand-primary': '#00ffcc',
                '--brand-primary-rgb': '0, 255, 204',
                '--brand-shadow': 'rgba(0, 255, 204, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
                '--brand-glow': '0 0 20px rgba(0, 255, 204, 0.8)'
            }
        },
        'adult': {
            title: 'Adult Swim',
            logo: 'images/logo-adult-swim.png',
            bgImage: 'images/background/rick-and-morty.png',
            colors: {
                '--brand-primary': '#ffffff',
                '--brand-primary-rgb': '255, 255, 255',
                '--brand-shadow': 'rgba(255, 255, 255, 0.5)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #050505 0%, #111111 100%)',
                '--brand-glow': '0 0 15px rgba(255, 255, 255, 0.7)'
            }
        },
        'jurassic': {
            title: 'Coleção Jurassic Park',
            logo: 'images/logo-jurassic-world.png',
            bgImage: 'images/background/jurassic-world.jpg',
            colors: {
                '--brand-primary': '#00a2ff',
                '--brand-primary-rgb': '0, 162, 255',
                '--brand-shadow': 'rgba(0, 162, 255, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #081017 0%, #0d1e2e 100%)',
                '--brand-glow': '0 0 20px rgba(0, 162, 255, 0.8)'
            },
            chronologyIds: [
                { id: 329, type: 'movie' },    // Jurassic Park
                { id: 330, type: 'movie' },    // O Mundo Perdido: Jurassic Park
                { id: 331, type: 'movie' },    // Jurassic Park III
                { id: 135397, type: 'movie' }, // Jurassic World
                { id: 93741, type: 'tv' },     // Jurassic World: Acampamento Jurássico (Série Animação)
                { id: 351286, type: 'movie' }, // Jurassic World: Reino Ameaçado
                { id: 243004, type: 'tv' },    // Jurassic World: Teoria do Caos (Série Animação)
                { id: 507086, type: 'movie' }, // Jurassic World: Domínio
                // FUTUROS LANÇAMENTOS
                { id: 1234821, type: 'movie' } // Jurassic World Rebirth (2025)
            ]
        },
        'velozes': {
            title: 'Saga Velozes e Furiosos',
            logo: 'images/logo-fast-furious.png',
            bgImage: 'images/background/velozes-e-furiosos.jpg',
            colors: {
                '--brand-primary': '#ff5f00',
                '--brand-primary-rgb': '255, 95, 0',
                '--brand-shadow': 'rgba(255, 95, 0, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #141414 0%, #260d00 100%)',
                '--brand-glow': '0 0 20px rgba(255, 95, 0, 0.8)'
            },
            chronologyIds: [
                { id: 3856, type: 'movie' },    // Velozes e Furiosos
                { id: 584, type: 'movie' },     // + Velozes + Furiosos
                { id: 13804, type: 'movie' },    // Velozes e Furiosos 4
                { id: 51497, type: 'movie' },    // Velozes e Furiosos 5: Operação Rio
                { id: 116977, type: 'movie' },   // Velozes e Furiosos 6
                { id: 9615, type: 'movie' },     // Velozes e Furiosos: Desafio em Tóquio
                { id: 168259, type: 'movie' },   // Velozes e Furiosos 7
                { id: 337339, type: 'movie' },   // Velozes e Furiosos 8
                { id: 384018, type: 'movie' },   // Velozes e Furiosos: Hobbs & Shaw
                { id: 385128, type: 'movie' },   // Velozes e Furiosos 9
                { id: 89427, type: 'tv' },       // Velozes & Furiosos: Espiões do Asfalto (Série Animação)
                { id: 385687, type: 'movie' }    // Velozes e Furiosos 10
            ]
        },
        'jogos': {
            title: 'Jogos Vorazes',
            logo: 'images/logo-hunger-games.png',
            bgImage: 'images/background/jogos-vorazes.jpg',
            colors: {
                '--brand-primary': '#ff7b00',
                '--brand-primary-rgb': '255, 123, 0',
                '--brand-shadow': 'rgba(255, 123, 0, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #120902 0%, #1e1003 100%)',
                '--brand-glow': '0 0 20px rgba(255, 123, 0, 0.8)'
            },
            chronologyIds: [
                { id: 695721, type: 'movie' }, // Jogos Vorazes: A Cantiga dos Pássaros e das Serpentes
                // FUTUROS LANÇAMENTOS (Cronologicamente se passa aqui - 50º Hunger Games)
                { id: 1283344, type: 'movie' },// Jogos Vorazes: O Amanhecer da Colheita (2026)
                { id: 70160, type: 'movie' },  // Jogos Vorazes
                { id: 101299, type: 'movie' }, // Jogos Vorazes: Em Chamas (CORRIGIDO: de 10193 para 101299)
                { id: 131631, type: 'movie' }, // Jogos Vorazes: A Esperança - Parte 1
                { id: 131634, type: 'movie' }  // Jogos Vorazes: A Esperança - Parte 2
            ]
        },
        'crepusculo': {
            title: 'Saga Crepúsculo',
            logo: 'images/logo-twilight.png',
            bgImage: 'images/background/crepusculo.jpg',
            colors: {
                '--brand-primary': '#9c27b0',
                '--brand-primary-rgb': '156, 39, 176',
                '--brand-shadow': 'rgba(156, 39, 176, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #0b070f 0%, #160e1f 100%)',
                '--brand-glow': '0 0 15px rgba(156, 39, 176, 0.8)'
            },
            chronologyIds: [
                { id: 15602, type: 'movie' },  // Crepúsculo
                { id: 18239, type: 'movie' },  // A Saga Crepúsculo: Lua Nova
                { id: 24021, type: 'movie' },  // A Saga Crepúsculo: Eclipse
                { id: 50619, type: 'movie' },  // A Saga Crepúsculo: Amanhecer - Parte 1
                { id: 50620, type: 'movie' }   // A Saga Crepúsculo: Amanhecer - Parte 2
            ]
        },
        'transformers': {
            title: 'Transformers',
            logo: 'images/logo-transformers.png',
            bgImage: 'images/background/transformers.jpg',
            colors: {
                '--brand-primary': '#00d2ff',
                '--brand-primary-rgb': '0, 210, 255',
                '--brand-shadow': 'rgba(0, 210, 255, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #090f14 0%, #121c26 100%)',
                '--brand-glow': '0 0 20px rgba(0, 210, 255, 0.8)'
            },
            chronologyIds: [
                // FUTUROS LANÇAMENTOS (Se passa no passado em Cybertron)
                { id: 698687, type: 'movie' }, // Transformers One (2024 - Animação)
                { id: 424785, type: 'movie' }, // Bumblebee
                { id: 667538, type: 'movie' }, // Transformers: O Despertar das Feras
                { id: 1858, type: 'movie' },   // Transformers
                { id: 8373, type: 'movie' },   // Transformers: A Vingança dos Derrotados
                { id: 1885, type: 'movie' },   // Transformers: O Lado Oculto da Lua
                { id: 91314, type: 'movie' },  // Transformers: A Era da Extinção
                { id: 283949, type: 'movie' }, // Transformers: O Último Cavaleiro
                { id: 33215, type: 'tv' },     // Transformers: Prime (Série Animação)
                { id: 93427, type: 'tv' },     // Transformers: Guerra por Cybertron (Série Animação)
                { id: 203248, type: 'tv' },    // Transformers: O Centelha (Série Animação)
                { id: 4247, type: 'tv' }       // Transformers Animated (Série Animação)
            ]
        },
        'disney': {
            title: 'Disney',
            logo: 'images/logo-disney.png',
            bgImage: 'images/background/disney.jpg',
            colors: {
                '--brand-primary': '#00ccff',
                '--brand-primary-rgb': '0, 204, 255',
                '--brand-shadow': 'rgba(0, 204, 255, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #000c1c 0%, #001f40 100%)',
                '--brand-glow': '0 0 20px rgba(0, 204, 255, 0.8)'
            }
        },
        'illumination': {
            title: 'Illumination',
            logo: 'images/logo-illumination.png',
            bgImage: 'images/background/illumination.jpg',
            colors: {
                '--brand-primary': '#ffcc00',
                '--brand-primary-rgb': '255, 204, 0',
                '--brand-shadow': 'rgba(255, 204, 0, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #1a1600 0%, #332b00 100%)',
                '--brand-glow': '0 0 20px rgba(255, 204, 0, 0.8)'
            }
        },
        'invocacao': {
            title: 'Coleção Invocação do Mal',
            logo: 'images/logo-invocacao-do-mal.png',
            bgImage: 'images/background/invocacao-do-mal.jpg',
            colors: {
                '--brand-primary': '#7f0000',
                '--brand-primary-rgb': '127, 0, 0',
                '--brand-shadow': 'rgba(127, 0, 0, 0.6)',
                '--brand-bg-gradient': 'linear-gradient(135deg, #080000 0%, #170000 100%)',
                '--brand-glow': '0 0 15px rgba(127, 0, 0, 0.8)'
            },
            chronologyIds: [
                { id: 439079, type: 'movie' }, // A Freira
                { id: 396535, type: 'movie' }, // Annabelle 2: A Criação do Mal (CORRIGIDO: de 396422 para 396535)
                { id: 968051, type: 'movie' }, // A Freira 2
                { id: 250546, type: 'movie' }, // Annabelle
                { id: 138843, type: 'movie' }, // Invocação do Mal
                { id: 522688, type: 'movie' }, // Annabelle 3: De Volta Para Casa (CORRIGIDO: de 521029 para 522688)
                { id: 517454, type: 'movie' }, // A Maldição da Chorona (CORRIGIDO: de 485813 para 517454)
                { id: 259693, type: 'movie' }, // Invocação do Mal 2
                { id: 632478, type: 'movie' }, // Invocação do Mal 3: A Ordem do Demônio (CORRIGIDO: de 423108 para 632478)
                // FUTUROS LANÇAMENTOS
                { id: 1148020, type: 'movie' } // Invocação do Mal 4: Últimos Ritos (2025)
            ]
        }
    };

    // Obter parâmetro da url
    const urlParams = new URLSearchParams(window.location.search);
    const brandParam = (urlParams.get('brand') || 'marvel').toLowerCase();

    // Configurações de Paginação Virtual e Filtros (Layout normal de cada página com 24 obras)
    const ITEMS_PER_PAGE = 24;
    let currentPage = 1;
    let activeTab = 'destaque'; // abas: 'destaque', 'todos', 'filmes', 'series'
    let activeSort = 'lancamento'; // ordenação: 'lancamento', 'cronologia'
    let searchFilterText = '';

    // Contêineres de dados estruturados
    let apiFetchedItems = []; // Itens crus retornados do TMDB
    let processedData = {
        destaque: [],
        todos: [],
        filmes: [],
        series: []
    };

    // Inicialização da Página
    document.addEventListener('DOMContentLoaded', async () => {
        const brandConfig = BRAND_CONFIGS[brandParam] || BRAND_CONFIGS['marvel'];
        const brandTMDBConfig = BRAND_MAP[brandParam] || BRAND_MAP['marvel'];
        
        applyBrandTheme(brandConfig);
        setupTabsAndControls();
        
        // Iniciar carregamento dos dados do TMDB
        await loadBrandMultiverseData(brandParam, brandConfig, brandTMDBConfig);
    });

    // Aplica as cores, logotipo, título e a imagem de fundo local da pasta images/background
    function applyBrandTheme(config) {
        const root = document.documentElement;

        // Injeta as cores da marca nas variáveis CSS
        if (config.colors) {
            for (const [key, value] of Object.entries(config.colors)) {
                root.style.setProperty(key, value);
            }
        }

        // Configura o logotipo central
        const brandLogoImg = document.getElementById('brand-logo');
        if (brandLogoImg) {
            brandLogoImg.src = config.logo;
            brandLogoImg.alt = `Logo de ${config.title}`;
        }

        // Configura o título descritivo para leitores de tela
        const brandTitleEl = document.getElementById('brand-title');
        if (brandTitleEl) {
            brandTitleEl.innerText = config.title;
        }

        // Define a imagem de fundo local da pasta images/background
        const wallpaperEl = document.getElementById('hero-wallpaper');
        if (wallpaperEl && config.bgImage) {
            wallpaperEl.style.backgroundImage = `url('${config.bgImage}')`;
        }
        
        document.title = `WinBry | ${config.title}`;
    }

    // Configura os botões de abas, filtros e ordenação
    function setupTabsAndControls() {
        // 1. Setup Abas de Filtros Principais
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeTab = btn.getAttribute('data-tab');
                currentPage = 1; // Reset da página ao mudar de aba
                renderContent();
            });
        });

        // 2. Setup Botões de Ordenação (Lançamento vs Cronologia)
        const sortButtons = document.querySelectorAll('.sort-btn');
        sortButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sortButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeSort = btn.getAttribute('data-sort');
                currentPage = 1; // Reset da página ao mudar ordenação
                sortProcessedData();
                renderContent();
            });
        });

        // 3. Setup Barra de Pesquisa Local (Filtro na aba em tempo real)
        const localSearchInput = document.getElementById('local-search-input');
        if (localSearchInput) {
            localSearchInput.addEventListener('input', (e) => {
                searchFilterText = e.target.value.toLowerCase().trim();
                currentPage = 1; // Reset da página ao filtrar
                renderContent();
            });
        }
    }

    // Funções auxiliares para filtragem robusta e curadoria de conteúdo
    function hasAnyGenre(item, genreIds) {
        if (item.genre_ids && item.genre_ids.some(id => genreIds.includes(id))) return true;
        if (item.genres && item.genres.some(g => genreIds.includes(g.id))) return true;
        return false;
    }

    // Faz chamadas assíncronas ao TMDB para popular o catálogo da marca com filtro de relevância
    async function loadBrandMultiverseData(brandKey, config, tmdbConfig) {
        try {
            let rawItems = [];

            // 1. LÓGICA DE COLEÇÃO (Sagas Lineares / Mistas com Filmes e Séries)
            if (tmdbConfig.type === 'collection') {
                const partsIds = tmdbConfig.id.split('|');
                const promises = partsIds.map(async (part) => {
                    if (part.startsWith('movie:')) {
                        const movieId = part.replace('movie:', '');
                        const movieData = await fetchTMDBLocal(`/movie/${movieId}`);
                        if (movieData) {
                            movieData.media_type = 'movie';
                            return [movieData];
                        }
                        return [];
                    } else if (part.startsWith('tv:')) {
                        const tvId = part.replace('tv:', '');
                        const tvData = await fetchTMDBLocal(`/tv/${tvId}`);
                        if (tvData) {
                            tvData.media_type = 'tv';
                            return [tvData];
                        }
                        return [];
                    } else {
                        const data = await fetchTMDBLocal(`/collection/${part}`);
                        if (data && data.parts) {
                            data.parts.forEach(p => p.media_type = 'movie');
                            return data.parts;
                        }
                        return [];
                    }
                });

                const resultsArray = await Promise.all(promises);
                resultsArray.forEach(arr => {
                    if (arr && arr.length > 0) rawItems.push(...arr);
                });
            } 
            // 2. LÓGICA DE EMPRESAS OU REDES (Grandes Estúdios e Canais de TV)
            // Agora traz Filmes E Séries produzidos pelas produtoras de forma dinâmica
            else {
                const numPages = 3;
                let promises = [];
                
                if (tmdbConfig.type === 'company') {
                    // Filmes da Produtora
                    for (let i = 1; i <= numPages; i++) {
                        promises.push(fetchTMDBLocal(`/discover/movie?with_companies=${encodeURIComponent(tmdbConfig.id)}&sort_by=popularity.desc&include_adult=false&page=${i}`).then(data => {
                            if (data && data.results) {
                                data.results.forEach(item => item.media_type = 'movie');
                                return data.results;
                            }
                            return [];
                        }));
                    }
                    // Séries de TV da Produtora
                    for (let i = 1; i <= numPages; i++) {
                        promises.push(fetchTMDBLocal(`/discover/tv?with_companies=${encodeURIComponent(tmdbConfig.id)}&sort_by=popularity.desc&include_adult=false&page=${i}`).then(data => {
                            if (data && data.results) {
                                data.results.forEach(item => item.media_type = 'tv');
                                return data.results;
                            }
                            return [];
                        }));
                    }
                    
                    const results = await Promise.all(promises);
                    results.forEach(list => {
                        if (list && list.length > 0) rawItems.push(...list);
                    });
                } else if (tmdbConfig.type === 'network') {
                    for (let i = 1; i <= 5; i++) {
                        promises.push(fetchTMDBLocal(`/discover/tv?with_networks=${encodeURIComponent(tmdbConfig.id)}&sort_by=popularity.desc&include_adult=false&page=${i}`).then(data => {
                            if (data && data.results) {
                                data.results.forEach(item => item.media_type = 'tv');
                                return data.results;
                            }
                            return [];
                        }));
                    }
                    const results = await Promise.all(promises);
                    results.forEach(list => {
                        if (list && list.length > 0) rawItems.push(...list);
                    });
                }
            }

            // Remover duplicatas baseadas no ID do TMDB
            const seen = new Set();
            let uniqueItems = rawItems.filter(item => {
                if (!item || !(item.title || item.name) || !item.poster_path) return false;
                const uniqueKey = `${item.media_type || 'movie'}_${item.id}`;
                if (seen.has(uniqueKey)) return false;
                seen.add(uniqueKey);
                return true;
            });

            // --- FILTRO DE RELEVÂNCIA: Remover títulos intrusivos e incoerentes ---
            apiFetchedItems = uniqueItems.filter(item => {
                const title = (item.title || item.name || '').toLowerCase();
                const originalTitle = (item.original_title || item.original_name || '').toLowerCase();
                const overview = (item.overview || '').toLowerCase();

                // 1. FILTRAGEM RÍGIDA CONTRA CONTEÚDO ADULTO/PORNÔ (E FILTRAGEM DO CAMPO ADULT DA API)
                if (item.adult === true) {
                    return false;
                }

                const hasAdultTerm = ADULT_BLACKLIST.some(term => {
                    // Para termos curtos ou com colisões (ex: 'sex'), exigimos limites de palavra inteira
                    if (term === 'sex' || term === 'adult') {
                        const regex = new RegExp('\\b' + term + '\\b', 'i');
                        return regex.test(title) || regex.test(originalTitle) || regex.test(overview);
                    }
                    return title.includes(term) || originalTitle.includes(term) || overview.includes(term);
                });
                if (hasAdultTerm) {
                    return false;
                }

                // Se o item pertence à lista de IDs cronológicos curados, mantemos de qualquer forma
                if (config.chronologyIds && config.chronologyIds.some(c => c.id === item.id)) {
                    return true;
                }

                if (brandKey === 'marvel') {
                    const marvelKeywords = [
                        'marvel', 'vingadores', 'avengers', 'homem de ferro', 'iron man', 'capitão américa', 'captain america', 
                        'thor', 'hulk', 'viúva negra', 'black widow', 'arqueiro', 'hawkeye', 'homem-aranha', 'spider-man', 
                        'pantera negra', 'black panther', 'doutor estranho', 'doctor strange', 'guardiões da galáxia', 
                        'guardians of the galaxy', 'homem-formiga', 'ant-man', 'eternos', 'eternals', 'shang-chi', 'deadpool', 
                        'wolverine', 'x-men', 'mutantes', 'quarteto fantástico', 'fantastic four', 'demolidor', 'daredevil', 
                        'punho de ferro', 'iron fist', 'luke cage', 'jessica jones', 'motoqueiro fantasma', 'ghost rider', 
                        'carnificina', 'carnage', 'morbius', 'madame teia', 'madame web', 'feiticeira escarlate', 'scarlet witch', 
                        'she-hulk', 'mulher-hulk', 'moon knight', 'cavaleiro da lua', 'ms. marvel', 'what if', 'invasão secreta', 
                        'secret invasion', 'agatha', 'ironheart', 'the marvels', 'as marvels', 'civil war', 'guerra civil', 
                        'ultimato', 'endgame', 'infinity war', 'guerra infinita', 'ultron', 'loki', 'wandavision', 'thunderbolts'
                    ];
                    return marvelKeywords.some(kw => 
                        matchesKeyword(title, kw) || 
                        matchesKeyword(originalTitle, kw) || 
                        (matchesKeyword(overview, kw) && kw.length > 4)
                    );
                }

                if (brandKey === 'dc') {
                    const dcKeywords = [
                        'justice league', 'liga da justiça', 'batman', 'superman', 'super-homem', 'mulher-maravilha', 
                        'wonder woman', 'the flash', 'aquaman', 'shazam', 'adão negro', 'black adam', 'esquadrão suicida', 
                        'suicide squad', 'coringa', 'joker', 'arlequina', 'harley quinn', 'lanterna verde', 'green lantern', 
                        'nightwing', 'asa noturna', 'titãs', 'titans', 'mulher-gato', 'catwoman', 'sandman', 'watchmen', 
                        'constantine', 'supergirl', 'batwoman', 'pacificador', 'peacemaker', 'monstro do pântano', 'swamp thing', 
                        'besouro azul', 'blue beetle', 'patrulha do destino', 'doom patrol', 'jovens titãs', 'man of steel', 
                        'homem de aço', 'krypton', 'gotham', 'smallville', 'lois & clark', 'v de vingança', 'v for vendetta', 'commandos'
                    ];
                    return dcKeywords.some(kw => 
                        matchesKeyword(title, kw) || 
                        matchesKeyword(originalTitle, kw) || 
                        (matchesKeyword(overview, kw) && kw.length > 4)
                    );
                }

                if (brandKey === 'cartoon') {
                    return hasAnyGenre(item, [16]);
                }

                if (brandKey === 'adult') {
                    const adultSwimKeywords = ['adult swim', 'rick', 'morty', 'smiling friends', 'primal', 'samurai jack', 'robot chicken', 'aqua teen'];
                    return hasAnyGenre(item, [16]) || adultSwimKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'disney') {
                    const disneyKeywords = [
                        'disney', 'mickey', 'donald', 'pateta', 'toy story', 'pixar', 'enrolados', 'tangled', 'frozen', 
                        'rei leão', 'lion king', 'hannah', 'waverly', 'phineas', 'gravity falls', 'ducktales', 'jessie', 
                        'zack', 'cody', 'violetta', 'soy luna', 'descendentes', 'descendants', 'camp rock', 'high school musical'
                    ];
                    return hasAnyGenre(item, [16, 10751, 14, 12]) || disneyKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'illumination') {
                    return hasAnyGenre(item, [16]);
                }

                if (brandKey === 'invocacao') {
                    const invocKeywords = ['invocação', 'conjuring', 'annabelle', 'freira', 'nun', 'chorona', 'la llorona', 'rites', 'ritos'];
                    return invocKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'star wars') {
                    const swKeywords = ['star wars', 'solo:', 'rogue one', 'skywalker', 'jedi', 'sith', 'império', 'empire', 'clones', 'mandalorian', 'boba fett', 'andor', 'ahsoka', 'acolyte', 'bad batch', 'grogu'];
                    return swKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'harry potter') {
                    const hpKeywords = ['harry potter', 'animais fantásticos', 'fantastic beasts', 'grindelwald', 'dumbledore', 'pedra filosofal', 'filosofal', 'câmara secreta', 'prisioneiro', 'azkaban', 'cálice', 'fênix', 'enigma', 'relíquias', 'hogwarts'];
                    return hpKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'jurassic') {
                    const jurassicKeywords = ['jurassic', 'dinossauro', 'dinosaur', 'mundo perdido', 'lost world', 'cretaceous', 'caos', 'chaos', 'rebirth', 'renascimento'];
                    return jurassicKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'velozes') {
                    const velozesKeywords = ['velozes', 'furiosos', 'fast & furious', 'fast and furious', 'hobbs', 'shaw', 'tokyo drift', 'tóquio', 'espiões', 'racers'];
                    return velozesKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'jogos') {
                    const hungerKeywords = ['jogos vorazes', 'hunger games', 'pássaros', 'songbirds', 'serpentes', 'em chamas', 'catching fire', 'esperança', 'mockingjay', 'reaping', 'colheita', 'amanhecer'];
                    return hungerKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'crepusculo') {
                    const twilightKeywords = ['crepúsculo', 'twilight', 'lua nova', 'new moon', 'eclipse', 'amanhecer', 'breaking dawn'];
                    return twilightKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                if (brandKey === 'transformers') {
                    const transKeywords = ['transformers', 'bumblebee', 'beast wars', 'feras', 'cybertron', 'optimus', 'megatron', 'animated', 'spark'];
                    return transKeywords.some(kw => title.includes(kw) || originalTitle.includes(kw));
                }

                return true;
            });

            // Se a marca tiver uma ordem cronológica fixa com IDs específicos, buscamos também
            // os dados de qualquer obra que porventura não tenha vindo na busca inicial
            if (config.chronologyIds && config.chronologyIds.length > 0) {
                const missingChronPromises = config.chronologyIds.map(async (cItem) => {
                    // Se já temos o item na busca inicial, apenas o reusamos
                    const exists = apiFetchedItems.find(x => x.id === cItem.id && (x.media_type === cItem.type || x.release_date));
                    if (exists) return exists;

                    // Caso contrário, busca na API do TMDB
                    const data = await fetchTMDBLocal(`/${cItem.type}/${cItem.id}`);
                    if (data) {
                        data.media_type = cItem.type;
                        return data;
                    }
                    return null;
                });

                const extraItems = await Promise.all(missingChronPromises);
                extraItems.forEach(item => {
                    if (item && item.poster_path) {
                        const exists = apiFetchedItems.find(x => x.id === item.id);
                        if (!exists) {
                            apiFetchedItems.push(item);
                        }
                    }
                });
            }

            // Dividir e estruturar os dados nas categorias de abas
            buildProcessedData(config);
            
            // Renderizar conteúdo na tela
            renderContent();

        } catch (error) {
            console.error("Erro ao carregar os dados:", error);
            const container = document.getElementById('grid-items');
            if (container) {
                container.innerHTML = '<p class="empty-state">⚠️ Ocorreu um erro ao carregar o multiverso. Tente reiniciar a página.</p>';
            }
        }
    }

    // Organiza o catálogo original nas categorias de abas principais
    function buildProcessedData(config) {
        // 1. Aba TODOS
        processedData.todos = [...apiFetchedItems];

        // 2. Aba FILMES (Apenas movies)
        processedData.filmes = apiFetchedItems.filter(item => item.media_type === 'movie');

        // 3. Aba SÉRIES (Apenas tv/séries)
        processedData.series = apiFetchedItems.filter(item => item.media_type === 'tv');

        // Ordenar os dados conforme a ordenação ativa
        sortProcessedData(config);

        // 4. Aba DESTAQUE: Traz exatamente 12 obras de destaque (mais aclamadas/boas de nota)
        // Primeiro, ordenamos por popularidade e pegamos as 40 mais relevantes para evitar itens obscuros
        const top40Popular = [...apiFetchedItems]
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 40);

        // Depois, ordenamos essas 40 por avaliação (nota/crítica) decrescente e pegamos as 12 melhores
        processedData.destaque = top40Popular
            .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
            .slice(0, 12);
    }

    // Ordena as listas (Todos, Filmes, Séries) de acordo com a escolha Lançamento vs Cronologia
    function sortProcessedData(configOverride) {
        const config = configOverride || BRAND_CONFIGS[brandParam] || BRAND_CONFIGS['marvel'];

        if (activeSort === 'cronologia' && config.chronologyIds && config.chronologyIds.length > 0) {
            // --- ORDENAÇÃO CRONOLÓGICA ---
            const chronoMap = new Map();
            config.chronologyIds.forEach((item, index) => {
                chronoMap.set(`${item.type}_${item.id}`, index);
            });

            const sortChrono = (arr) => {
                return arr.sort((a, b) => {
                    const posA = chronoMap.has(`${a.media_type}_${a.id}`) ? chronoMap.get(`${a.media_type}_${a.id}`) : 9999;
                    const posB = chronoMap.has(`${b.media_type}_${b.id}`) ? chronoMap.get(`${b.media_type}_${b.id}`) : 9999;
                    
                    if (posA === 9999 && posB === 9999) {
                        const dateA = a.release_date || a.first_air_date || '0000-00-00';
                        const dateB = b.release_date || b.first_air_date || '0000-00-00';
                        return dateA.localeCompare(dateB);
                    }
                    return posA - posB;
                });
            };

            processedData.todos = sortChrono(processedData.todos);
            processedData.filmes = sortChrono(processedData.filmes);
            processedData.series = sortChrono(processedData.series);

        } else {
            // --- ORDENAÇÃO POR DATA DE LANÇAMENTO (Mais Antigo ao Mais Recente) ---
            const sortRelease = (arr) => {
                return arr.sort((a, b) => {
                    const dateA = a.release_date || a.first_air_date || '0000-00-00';
                    const dateB = b.release_date || b.first_air_date || '0000-00-00';
                    return dateA.localeCompare(dateB);
                });
            };

            processedData.todos = sortRelease(processedData.todos);
            processedData.filmes = sortRelease(processedData.filmes);
            processedData.series = sortRelease(processedData.series);
        }
    }

    // Renderiza no grid com paginação virtual e aplicando filtros
    function renderContent() {
        const gridItems = document.getElementById('grid-items');
        if (!gridItems) return;

        let items = processedData[activeTab] || [];

        // 1. Aplica o filtro de texto de pesquisa local
        if (searchFilterText) {
            items = items.filter(item => {
                const title = (item.title || item.name || '').toLowerCase();
                return title.includes(searchFilterText);
            });
        }

        const totalItems = items.length;
        
        // A aba destaque sempre exibe no máximo 12 itens e não faz sentido paginar
        const limitPerPage = (activeTab === 'destaque') ? 12 : ITEMS_PER_PAGE;
        const totalPages = Math.ceil(totalItems / limitPerPage);

        // Ajusta a página atual se estiver fora do limite
        if (currentPage > totalPages) {
            currentPage = 1;
        }

        // 2. Caso a lista resultante esteja vazia
        if (totalItems === 0) {
            gridItems.innerHTML = '<p class="empty-state">Nenhuma obra encontrada para os filtros selecionados.</p>';
            renderPaginationControls(0);
            return;
        }

        // 3. Fatiar dados para a página selecionada
        const startIndex = (currentPage - 1) * limitPerPage;
        const endIndex = Math.min(startIndex + limitPerPage, totalItems);
        const paginatedItems = items.slice(startIndex, endIndex);

        // 4. Renderizar os cards
        let html = '';
        paginatedItems.forEach(item => {
            const type = item.media_type || 'movie';
            const poster = item.poster_path ? `${IMG_BASE}${item.poster_path}` : 'images/favicon.png';
            const titulo = item.title || item.name;
            const ano = (item.release_date || item.first_air_date || '????').substring(0, 4);

            html += `
            <div class="content-card brand-card">
                <a href="detalhes.html?id=${item.id}&type=${type}" class="card-link">
                    <img src="${poster}" alt="${titulo}" loading="lazy">
                </a>
                <div class="card-info">
                    <h3>${titulo}</h3>
                    <p>${ano}</p>
                </div>
            </div>`;
        });

        gridItems.innerHTML = html;

        // 5. Renderizar controles de paginação (apenas se não for a aba Destaque)
        if (activeTab === 'destaque') {
            renderPaginationControls(0);
        } else {
            renderPaginationControls(totalPages);
        }
    }

    // Renderiza a paginação numerada clássica do site (ex: 1, 2, 3, 4, 5) caso ultrapasse
    function renderPaginationControls(totalPages) {
        const container = document.getElementById('pagination-container');
        if (!container) return;

        container.innerHTML = '';

        // Se tiver no máximo 1 página, não há necessidade de paginar
        if (totalPages <= 1) {
            return;
        }

        // Botão Anterior
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        if (currentPage === 1) {
            prevBtn.disabled = true;
        } else {
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderContent();
                scrollToGridTop();
            });
        }
        container.appendChild(prevBtn);

        // Botões Numerados de 1 a totalPages (exibe páginas 1, 2, 3, 4, 5...)
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
            pageBtn.innerText = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderContent();
                scrollToGridTop();
            });
            container.appendChild(pageBtn);
        }

        // Botão Próximo
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        if (currentPage === totalPages) {
            nextBtn.disabled = true;
        } else {
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderContent();
                scrollToGridTop();
            });
        }
        container.appendChild(nextBtn);
    }

    // Rolagem suave de volta para o início do grid de conteúdo ao trocar de página
    function scrollToGridTop() {
        const target = document.getElementById('content-grid');
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }
})();
