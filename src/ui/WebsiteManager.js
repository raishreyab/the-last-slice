export class WebsiteManager {
  constructor(options = {}) {
    this.landingContainer = document.getElementById('landing-page-container');
    this.gameContainer = document.getElementById('game-view-container');
    this.soundEngine = options.soundEngine || null;
    this.onStartGame = options.onStartGame || (() => {});
    this.onPlayIntro = options.onPlayIntro || (() => {});

    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindControlsTabs();
    this.bindGalleryLightbox();
  }

  bindNavigation() {
    // Play Now buttons from Website
    document.querySelectorAll('.btn-launch-game').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openGameView();
      });
    });

    // Watch Intro button from Website
    document.querySelectorAll('.btn-launch-intro').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.onPlayIntro();
      });
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          e.preventDefault();
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // Back to Website buttons inside in-game menu and pause menu
    document.querySelectorAll('.btn-back-to-website').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openWebsiteView();
      });
    });
  }

  bindControlsTabs() {
    const tabBtns = document.querySelectorAll('.guide-tab-btn');
    const tabPanes = document.querySelectorAll('.guide-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPaneId = btn.dataset.pane;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const activePane = document.getElementById(targetPaneId);
        if (activePane) activePane.classList.add('active');
      });
    });
  }

  bindGalleryLightbox() {
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');
    const closeBtn = document.getElementById('lightbox-close');

    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        if (!lightbox) return;
        const bgArt = item.querySelector('.gallery-art');
        const title = item.dataset.title || 'Pizzeria Chamber';
        const desc = item.dataset.desc || '';

        if (lightboxImg && bgArt) {
          lightboxImg.className = 'lightbox-art-display ' + (bgArt.dataset.artClass || '');
        }
        if (lightboxTitle) lightboxTitle.textContent = title;
        if (lightboxDesc) lightboxDesc.textContent = desc;

        lightbox.style.display = 'flex';
      });
    });

    closeBtn?.addEventListener('click', () => {
      if (lightbox) lightbox.style.display = 'none';
    });

    lightbox?.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.style.display = 'none';
      }
    });
  }

  openGameView() {
    if (this.landingContainer) this.landingContainer.style.display = 'none';
    if (this.gameContainer) this.gameContainer.style.display = 'block';

    // Scroll to top of game container
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Inform Game/UI to show in-game menu or start
    this.onStartGame();
  }

  openWebsiteView() {
    if (this.gameContainer) this.gameContainer.style.display = 'none';
    if (this.landingContainer) this.landingContainer.style.display = 'block';

    // Pause game if running
    if (window.game && window.game.isPlaying) {
      window.game.pauseGame();
    }

    // Scroll to top of website
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

