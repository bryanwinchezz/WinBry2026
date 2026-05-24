// =================================================================
// MAIN.JS - ARQUIVO PRINCIPAL DO APLICATIVO DESKTOP (ELECTRON)
// =================================================================
// Este arquivo gerencia o ciclo de vida da aplicação desktop e cria
// a janela nativa do sistema operacional (Windows) para rodar o WinBry.

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    // 🖥️ Cria a janela principal do aplicativo com dimensões otimizadas
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        title: "WinBry Streaming",
        icon: path.join(__dirname, 'images', 'favicon.png'), // Ícone nativo
        backgroundColor: '#141414', // Evita o flash branco ao abrir
        webPreferences: {
            nodeIntegration: false,    // Segurança: Desativa integração do Node no renderizador
            contextIsolation: true,     // Segurança: Mantém contextos de JS isolados
            sandbox: true               // Segurança: Executa a página em ambiente isolado
        }
    });

    // ⛔ Remove a barra de menu padrão do Chromium para dar visual limpo e profissional
    mainWindow.removeMenu();

    // ⚡ Define o Modo de Execução:
    // Se passarmos a flag "--dev" no terminal (npm run dev), rodamos localmente.
    // Sem a flag (npm start), rodamos apontando para a nuvem.
    const isDev = process.argv.includes('--dev');

    if (isDev) {
        console.log("🚀 Rodando em MODO DESENVOLVIMENTO (Arquivos Locais + Hot-Reload)");
        
        // Carrega o arquivo index.html da sua pasta local
        mainWindow.loadFile(path.join(__dirname, 'index.html'));

        // Opcional: Abre as ferramentas de desenvolvedor (F12) automaticamente
        // mainWindow.webContents.openDevTools();

        // 🔄 WATCHER NATIVO (HOT-RELOAD):
        // Monitora seus arquivos locais e atualiza o app desktop instantaneamente sempre que salvar!
        const filesToWatch = [
            'index.html', 'style.css', 'app.js', 'animes.html', 
            'filmes.html', 'series.html', 'cadastro.html', 
            'detalhes.html', 'login.html', 'minha-conta.html', 'minha-lista.html'
        ];

        filesToWatch.forEach(file => {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                fs.watchFile(filePath, { interval: 500 }, (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        console.log(`[Hot-Reload] Arquivo alterado: ${file}. Atualizando janela...`);
                        if (mainWindow && !mainWindow.isDestroyed()) {
                            mainWindow.reload();
                        }
                    }
                });
            }
        });
    } else {
        console.log("🌐 Rodando em MODO PRODUÇÃO (Sincronizado com o Servidor Web)");
        
        // Carrega a versão online do seu site (Netlify)
        // Isso garante que QUALQUER atualização que você subir para a web
        // será refletida AUTOMATICAMENTE no executável de todos os usuários!
        mainWindow.loadURL('https://winbry.netlify.app/');
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Inicializa a aplicação assim que o Electron estiver pronto
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Fecha o aplicativo quando todas as janelas forem fechadas (exceto no macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
