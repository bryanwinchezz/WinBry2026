# 🎬 WinBry

**WinBry** é uma plataforma de streaming completa de filmes, séries, animes e aplicativos — o projeto principal e definitivo, desenvolvido com JavaScript, HTML e CSS. Diferente do protótipo, o WinBry conta com backend real, autenticação, perfil de usuário, lista pessoal e manifesto PWA.

> ⚠️ **Nota:** O repositório [WinBryPrototipo](https://github.com/bryanwinchezz/WinBryPrototipo) é apenas o protótipo inicial deste projeto. Esta é a versão definitiva e em desenvolvimento ativo.

## 📋 Sobre o Projeto

O WinBry é uma plataforma de streaming completa inspirada em serviços como Netflix e Disney+. Com navegação por categorias (Filmes, Séries, Animes, Aplicativos), sistema de autenticação, perfil de usuário, lista pessoal e suporte a PWA (Progressive Web App), o projeto vai muito além de um simples protótipo estático.

## 🖥️ Tecnologias Utilizadas

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

- **JavaScript** — lógica principal, app.js, main.js
- **HTML5** — estrutura das páginas
- **CSS3** — estilização e responsividade
- **Node.js** — dependências e build (package.json)
- **PWA** — manifesto para instalação como app

## 📁 Estrutura do Projeto

```
WinBry/
├── index.html              # Página inicial / home
├── filmes.html             # Catálogo de filmes
├── series.html             # Catálogo de séries
├── animes.html             # Catálogo de animes
├── aplicativos.html        # Seção de aplicativos
├── detalhes.html           # Página de detalhes dinâmica
├── login.html              # Autenticação
├── cadastro.html           # Cadastro de usuário
├── perfil.html             # Perfil do usuário
├── minha-conta.html        # Configurações da conta
├── minha-lista.html        # Lista pessoal de títulos
├── formulario.html         # Formulário de contato
├── formulario-obrigado.html# Confirmação do formulário
├── app.js                  # Lógica principal da aplicação
├── main.js                 # Script de inicialização
├── find_lines.js           # Utilitários de busca
├── style.css               # Estilos globais
├── manifest.json           # Manifesto PWA
├── images/                 # Assets visuais
├── package.json            # Dependências do projeto
└── .gitignore              # Arquivos ignorados
```

## ✨ Funcionalidades

- **Catálogo completo** — Filmes, Séries, Animes e Aplicativos em categorias separadas
- **Página de detalhes dinâmica** — um único template para todos os títulos
- **Autenticação** — Login e Cadastro de usuários
- **Perfil de usuário** — personalização da conta
- **Minha lista** — salvamento de títulos favoritos
- **PWA** — instalável como aplicativo no celular e desktop
- **Formulário de contato** com confirmação
- **Design responsivo** para todos os dispositivos

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/bryanwinchezz/WinBry.git

# Acesse a pasta
cd WinBry

# Instale as dependências
npm install

# Inicie o projeto
npm start
```

Ou simplesmente abra `index.html` no navegador para a versão estática.

### Como instalar como PWA

1. Acesse o site no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. Confirme a instalação

## 📱 PWA — Progressive Web App

O WinBry suporta instalação como PWA, o que significa que pode ser adicionado à tela inicial do celular ou desktop e funcionar de forma semelhante a um aplicativo nativo, com ícone próprio e tela de abertura.

## 👨‍💻 Autor

**bryanwinchezz (Kauan Bryan)**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bryanwinchezz)
[![LinkedIn](https://img.shields.io/static/v1?message=LinkedIn&logo=linkedin&label=&color=0077B5&logoColor=white&labelColor=&style=for-the-badge)](https://www.linkedin.com/in/kauan-bryan-silveira-silva-416102350)
[![YouTube](https://img.shields.io/static/v1?message=YouTube&logo=youtube&label=&color=FF0000&logoColor=white&labelColor=&style=for-the-badge)](https://www.youtube.com/@bryanwinchez)

---

> Plataforma de streaming pessoal em desenvolvimento ativo — o projeto principal do portfólio de bryanwinchezz.
