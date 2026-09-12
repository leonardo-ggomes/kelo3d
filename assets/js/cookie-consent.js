/**
 * cookie-consent.js — Kelo3D LGPD Cookie Consent Manager
 *
 * Conformidade: Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018
 *
 * Funcionalidades:
 *  - Exibe banner na primeira visita (sem consentimento gravado)
 *  - Aceitar todos / Rejeitar opcionais / Gerenciar por categoria
 *  - Persistência via localStorage
 *  - Dispara evento customizado `kelo:consentUpdate` para scripts de terceiros
 *  - Ativa scripts de Analytics e Marketing somente após consentimento
 */

(function () {
  'use strict';

  /* ── Configuração ─────────────────────────────────────────────── */
  const STORAGE_KEY = 'kelo3d_cookie_consent';
  const CONSENT_VERSION = 1; // Incremente ao alterar categorias de cookies

  /* ── Estado padrão ────────────────────────────────────────────── */
  const DEFAULT_CONSENT = {
    version: CONSENT_VERSION,
    timestamp: null,
    necessary: true,   // sempre ativo
    analytics: false,
    marketing: false,
  };

  /* ── Utilitários ──────────────────────────────────────────────── */
  function loadConsent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Invalida se versão mudou
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveConsent(consent) {
    consent.timestamp = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      // localStorage bloqueado (modo privado restrito)
    }
    dispatchConsentEvent(consent);
    applyConsent(consent);
  }

  function dispatchConsentEvent(consent) {
    window.dispatchEvent(
      new CustomEvent('kelo:consentUpdate', { detail: { consent } })
    );
  }

  /**
   * Aplica o consentimento: carrega scripts de terceiros somente
   * quando o usuário autoriza a categoria correspondente.
   */
  function applyConsent(consent) {
    // ── Analytics ────────────────────────────────────────────────
    if (consent.analytics) {
      loadAnalytics();
    }
    // ── Marketing ────────────────────────────────────────────────
    if (consent.marketing) {
      loadMarketing();
    }
  }

  function loadAnalytics() {
    // Substitua 'G-XXXXXXXXXX' pelo seu ID do Google Analytics 4
    if (window.__keloAnalyticsLoaded) return;
    window.__keloAnalyticsLoaded = true;
    /*
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
    */
    console.info('[Kelo3D] Analytics ativado.');
  }

  function loadMarketing() {
    if (window.__keloMarketingLoaded) return;
    window.__keloMarketingLoaded = true;
    // Adicione aqui pixels de marketing (Meta Pixel, Google Ads, etc.)
    console.info('[Kelo3D] Marketing ativado.');
  }

  /* ── UI ───────────────────────────────────────────────────────── */
  const banner   = document.getElementById('cookie-banner');
  const overlay  = document.getElementById('cookie-overlay');
  const categories = document.getElementById('cookie-categories');

  const btnAccept  = document.getElementById('cookie-accept-btn');
  const btnReject  = document.getElementById('cookie-reject-btn');
  const btnManage  = document.getElementById('cookie-manage-btn');

  const checkAnalytics = document.getElementById('cookie-analytics');
  const checkMarketing = document.getElementById('cookie-marketing');

  let panelOpen = false;

  function showBanner() {
    if (!banner || !overlay) return;
    // Remove o atributo hidden antes de animar
    banner.removeAttribute('hidden');
    overlay.removeAttribute('hidden');
    // Força reflow para que a transição funcione
    banner.getBoundingClientRect();
    overlay.getBoundingClientRect();
    banner.classList.add('cookie-visible');
    overlay.classList.add('cookie-visible');
    // Foca no primeiro botão interativo para acessibilidade
    btnManage && btnManage.focus();
    // Impede scroll da página enquanto o banner está visível
    document.body.style.overflow = 'hidden';
  }

  function hideBanner() {
    if (!banner || !overlay) return;
    banner.classList.remove('cookie-visible');
    overlay.classList.remove('cookie-visible');
    document.body.style.overflow = '';
    // Remove do DOM após transição
    banner.addEventListener('transitionend', () => {
      banner.setAttribute('hidden', '');
      overlay.setAttribute('hidden', '');
    }, { once: true });
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    if (panelOpen) {
      categories.removeAttribute('hidden');
      btnManage.textContent = 'Ocultar preferências';
    } else {
      categories.setAttribute('hidden', '');
      btnManage.textContent = 'Gerenciar preferências';
    }
  }

  function buildConsent(analyticsChecked, marketingChecked) {
    return {
      ...DEFAULT_CONSENT,
      analytics: analyticsChecked,
      marketing: marketingChecked,
    };
  }

  /* ── Sincroniza checkboxes com consentimento salvo ────────────── */
  function syncToggles(consent) {
    if (checkAnalytics) checkAnalytics.checked = consent.analytics;
    if (checkMarketing) checkMarketing.checked = consent.marketing;
  }

  /* ── Event listeners ──────────────────────────────────────────── */
  btnAccept && btnAccept.addEventListener('click', () => {
    const consent = buildConsent(true, true);
    saveConsent(consent);
    hideBanner();
  });

  btnReject && btnReject.addEventListener('click', () => {
    const consent = buildConsent(false, false);
    saveConsent(consent);
    hideBanner();
  });

  btnManage && btnManage.addEventListener('click', togglePanel);

  // Salva escolha granular ao fechar o painel via "Rejeitar opcionais"
  // (o usuário pode ter ajustado os toggles antes)
  // Para confirmar seleção granular, o usuário pode clicar em "Aceitar todos"
  // ou "Rejeitar opcionais" depois de ajustar os toggles.

  // Fechar ao clicar no overlay
  overlay && overlay.addEventListener('click', () => {
    // Salva como "somente necessários" se fechado sem escolha
    const consent = buildConsent(
      checkAnalytics ? checkAnalytics.checked : false,
      checkMarketing ? checkMarketing.checked : false
    );
    saveConsent(consent);
    hideBanner();
  });

  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && banner && !banner.hidden) {
      const consent = buildConsent(false, false);
      saveConsent(consent);
      hideBanner();
    }
  });

  /* ── Inicialização ────────────────────────────────────────────── */
  function init() {
    const saved = loadConsent();

    if (saved) {
      // Consentimento já registrado — aplica silenciosamente
      syncToggles(saved);
      applyConsent(saved);
    } else {
      // Primeira visita — exibe o banner após pequeno delay
      setTimeout(showBanner, 600);
    }
  }

  // Aguarda o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── API pública (window.KeloConsent) ─────────────────────────── */
  window.KeloConsent = {
    /** Retorna o consentimento atual gravado */
    get: loadConsent,
    /** Abre o banner novamente (útil no link da Política de Cookies) */
    reopen: showBanner,
    /** Verifica se uma categoria foi aceita */
    hasConsent: function (category) {
      const c = loadConsent();
      return c ? !!c[category] : false;
    },
    /** Revoga todo o consentimento e reexibe o banner */
    revoke: function () {
      localStorage.removeItem(STORAGE_KEY);
      if (checkAnalytics) checkAnalytics.checked = false;
      if (checkMarketing) checkMarketing.checked = false;
      if (categories) categories.setAttribute('hidden', '');
      panelOpen = false;
      showBanner();
    },
  };
})();
