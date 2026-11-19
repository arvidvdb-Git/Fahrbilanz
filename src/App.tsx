import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initHeroCanvas } from './webgl/heroCanvas';
import { initSpecsCanvas } from './webgl/specsCanvas';
import {
  CAR_PRESETS,
  GlobalAssumptions,
  POWERTRAIN_META,
  POWERTRAIN_ORDER,
  PowertrainId,
  calculateTco,
  createSlotFromPreset,
  formatEur,
  getBlendedElectricityPrice,
} from './data/cars';
import {
  LANGUAGE_LABELS,
  LANGUAGE_ORDER,
  Language,
  TRANSLATIONS,
} from './i18n/translations';
import { LiveFuelFeed, fetchLiveFuelFeed } from './services/fuelPrices';
import {
  SEO_PRESETS,
  type SeoPresetId,
  buildHreflangLinks,
  resolveSeoRoute,
} from './data/seoRoutes';
import { CarSketch } from './components/CarSketch';
import { ComparisonStudio } from './components/ComparisonStudio';
import { MethodologySection } from './components/MethodologySection';

import showcaseGasolineImg from './assets/images/showcase_gasoline_fixed_1794565586901.jpg';
import showcaseDieselImg from './assets/images/showcase_diesel_1794557659134.jpg';
import showcaseHybridImg from './assets/images/showcase_hybrid_1794557659368.jpg';
import showcaseElectricImg from './assets/images/showcase_electric_1794557661350.jpg';
import compareCombustionImg from './assets/images/compare_combustion_1794557659907.jpg';
import compareElectricImg from './assets/images/compare_electric_1794557661336.jpg';
import bentoCockpitImg from './assets/images/bento_cockpit_range_1794557661320.jpg';
import bentoChassisImg from './assets/images/bento_chassis_engineering_1794557661661.jpg';

gsap.registerPlugin(ScrollTrigger);

interface ShowcaseMedia {
  id: PowertrainId;
  src: string;
  alt: string;
}

const SHOWCASE_MEDIA: ShowcaseMedia[] = [
  {
    id: 'gasoline',
    src: showcaseGasolineImg,
    alt: 'Graphite-silver gasoline sport hatchback driving along a sunlit alpine mountain pass',
  },
  {
    id: 'diesel',
    src: showcaseDieselImg,
    alt: 'Dark basalt touring diesel estate wagon cruising on an open coastal viaduct at dusk',
  },
  {
    id: 'hybrid',
    src: showcaseHybridImg,
    alt: 'Mineral-silver hybrid crossover SUV parked beside a minimalist concrete lakeside pavilion',
  },
  {
    id: 'electric',
    src: showcaseElectricImg,
    alt: 'Matte sage-green full electric sedan parked beneath a timber solar charging canopy in morning mist',
  },
];

const HERO_BASE_ASSUMPTIONS: GlobalAssumptions = {
  comparisonMode: 'tco',
  annualKm: 15000,
  years: 5,
  gasolinePrice: 1.75,
  dieselPrice: 1.68,
  homeAcPrice: 0.3,
  publicAcPrice: 0.49,
  publicDcPrice: 0.69,
  homeAcShare: 70,
  publicAcShare: 20,
  publicDcShare: 10,
  monthlyChargingFee: 5,
  wallboxCost: 1200,
  rentWallboxElectric: true,
  rentWallboxHybrid: false,
  buyWallboxElectric: true,
  buyWallboxHybrid: false,
};

const LANG_DEFAULT_COUNTRY: Record<Language, string> = {
  en: 'EU',
  de: 'DE',
  nl: 'NL',
  fr: 'FR',
};

export default function App() {
  const [initialRoute] = useState(() =>
    typeof window !== 'undefined'
      ? resolveSeoRoute(window.location.pathname)
      : { lang: 'en' as Language, presetId: 'home' as SeoPresetId, canonicalPath: '/en/', isExplicitLangRoute: false }
  );
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [lang, setLang] = useState<Language>(initialRoute.lang);
  const [activePresetId, setActivePresetId] = useState<SeoPresetId>(
    initialRoute.presetId
  );
  const [langMenuOpen, setLangMenuOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [heroPowertrain, setHeroPowertrain] =
    useState<PowertrainId>('electric');
  const [activeStage, setActiveStage] = useState<number>(0);
  const [splitPct, setSplitPct] = useState<number>(50);
  const [splitAnimate, setSplitAnimate] = useState<boolean>(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [fuelFeed, setFuelFeed] = useState<LiveFuelFeed | null>(null);
  const [fuelFeedLoading, setFuelFeedLoading] = useState<boolean>(true);

  type PageView = 'home' | 'privacy' | 'imprint' | 'accessibility';

  const resolvePageView = (): PageView => {
    if (typeof window === 'undefined') return 'home';
    const hash = window.location.hash;
    const path = window.location.pathname;
    if (hash === '#/privacy' || hash === '#privacy' || path === '/privacy') {
      return 'privacy';
    }
    if (hash === '#/imprint' || hash === '#imprint' || path === '/imprint') {
      return 'imprint';
    }
    if (
      hash === '#/accessibility' ||
      hash === '#accessibility' ||
      path === '/accessibility'
    ) {
      return 'accessibility';
    }
    return 'home';
  };

  const [pageView, setPageView] = useState<PageView>(resolvePageView);
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !window.localStorage.getItem('fahrbilanz_cookie_notice');
    } catch {
      return true;
    }
  });

  const headerRef = useRef<HTMLElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const specsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroStageRef = useRef<HTMLDivElement | null>(null);
  const tiltWrapRef = useRef<HTMLDivElement | null>(null);
  const shadowRef = useRef<HTMLDivElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bentoGridRef = useRef<HTMLDivElement | null>(null);
  const compWrapRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const stageIdxRef = useRef<number>(0);
  const showcaseTouchRef = useRef<{ x: number; y: number } | null>(null);
  const heroSwatchesRef = useRef<HTMLDivElement | null>(null);
  const swatchBtnRefs = useRef<Partial<Record<PowertrainId, HTMLButtonElement | null>>>({});
  const [swatchSliderStyle, setSwatchSliderStyle] = useState<{
    transform: string;
    width: string;
    height: string;
    opacity: number;
  }>({
    transform: 'translate3d(0px, 0px, 0)',
    width: '0px',
    height: '0px',
    opacity: 0,
  });

  const t = TRANSLATIONS[lang];

  useLayoutEffect(() => {
    const updateSlider = () => {
      const container = heroSwatchesRef.current;
      const btn = swatchBtnRefs.current[heroPowertrain];
      if (!container || !btn) return;
      setSwatchSliderStyle({
        transform: `translate3d(${btn.offsetLeft}px, ${btn.offsetTop}px, 0)`,
        width: `${btn.offsetWidth}px`,
        height: `${btn.offsetHeight}px`,
        opacity: 1,
      });
    };
    updateSlider();
    const ro =
      typeof ResizeObserver !== 'undefined' && heroSwatchesRef.current
        ? new ResizeObserver(updateSlider)
        : null;
    if (ro && heroSwatchesRef.current) {
      ro.observe(heroSwatchesRef.current);
    }
    return () => {
      ro?.disconnect();
    };
  }, [heroPowertrain, lang, pageView]);

  useEffect(() => {
    let cancelled = false;
    fetchLiveFuelFeed().then((feed) => {
      if (cancelled) return;
      setFuelFeedLoading(false);
      if (!feed) return;
      setFuelFeed(feed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!langMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (
        langDropdownRef.current &&
        e.target instanceof Node &&
        !langDropdownRef.current.contains(e.target)
      ) {
        setLangMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [langMenuOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const presetCopy = SEO_PRESETS[activePresetId].meta[lang];
    const pageTitle = presetCopy.title;
    const pageDesc = presetCopy.description;
    document.documentElement.lang = lang;
    document.title = pageTitle;

    const origin = window.location.origin;
    const canonicalPath = SEO_PRESETS[activePresetId].paths[lang];
    const canonicalUrl = `${origin}${canonicalPath}`;
    const ogImgUrl = `${origin}/og-image.png`;
    const ogLocaleMap: Record<Language, string> = {
      en: 'en_IE',
      de: 'de_DE',
      nl: 'nl_NL',
      fr: 'fr_FR',
    };

    const setMetaContent = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };
    setMetaContent('meta[name="description"]', pageDesc);
    setMetaContent('meta[property="og:title"]', pageTitle);
    setMetaContent('meta[property="og:description"]', pageDesc);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:image"]', ogImgUrl);
    setMetaContent('meta[property="og:locale"]', ogLocaleMap[lang]);
    setMetaContent('meta[name="twitter:title"]', pageTitle);
    setMetaContent('meta[name="twitter:description"]', pageDesc);
    setMetaContent('meta[name="twitter:image"]', ogImgUrl);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    document
      .querySelectorAll('link[rel="alternate"][data-fbz-hreflang]')
      .forEach((node) => node.remove());
    for (const alt of buildHreflangLinks(origin, activePresetId)) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', alt.hreflang);
      link.setAttribute('href', alt.href);
      link.setAttribute('data-fbz-hreflang', 'true');
      document.head.appendChild(link);
    }
  }, [lang, activePresetId, t]);

  useEffect(() => {
    const syncRoute = () => {
      setPageView(resolvePageView());
      const nextSeo = resolveSeoRoute(window.location.pathname);
      setLang(nextSeo.lang);
      setActivePresetId(nextSeo.presetId);
      setMobileMenuOpen(false);
    };
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 768) setMobileMenuOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (
        headerRef.current &&
        e.target instanceof Node &&
        !headerRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (pageView !== 'home') {
      setActiveNav('');
      return () => {
        window.removeEventListener('scroll', onScroll);
      };
    }

    const sectionIds = ['showcase', 'energy-split', 'cost-drivers', 'compare'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: 0.05 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [pageView]);

  useEffect(() => {
    if (pageView !== 'home') return;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const cleanupHeroGl = initHeroCanvas(heroCanvasRef.current);
    const cleanupSpecsGl = initSpecsCanvas(specsCanvasRef.current);

    let lenis: InstanceType<typeof Lenis> | null = null;
    let lenisTicker: ((time: number) => void) | null = null;
    let tiltTicker: (() => void) | null = null;
    const heroStage = heroStageRef.current;

    let targetRotX = 0;
    let targetRotY = 0;
    let curRotX = 0;
    let curRotY = 0;
    let velX = 0;
    let velY = 0;

    const onHeroMove = (e: PointerEvent) => {
      if (!heroStage || e.pointerType !== 'mouse') return;
      const rect = heroStage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      targetRotY = nx * 10;
      targetRotX = -ny * 7;
    };
    const onHeroLeave = () => {
      targetRotX = 0;
      targetRotY = 0;
    };

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 769px)',
        isFinePointer: '(hover: hover) and (pointer: fine)',
      },
      (context) => {
        const { isDesktop, isFinePointer } = context.conditions as {
          isDesktop: boolean;
          isFinePointer: boolean;
        };

        // Ensure mobile has zero lingering inline transforms from hero tilt or GSAP showcase
        if (!isDesktop || !isFinePointer || prefersReduced) {
          if (tiltWrapRef.current) tiltWrapRef.current.style.transform = '';
          if (shadowRef.current) shadowRef.current.style.transform = '';
        }

        if (isDesktop && isFinePointer && !prefersReduced) {
          lenis = new Lenis({
            duration: 1.05,
            easing: (v: number) => Math.min(1, 1.001 - Math.pow(2, -10 * v)),
            smoothWheel: true,
          });
          lenis.on('scroll', ScrollTrigger.update);
          lenisTicker = (time: number) => {
            lenis?.raf(time * 1000);
          };
          gsap.ticker.add(lenisTicker);
          gsap.ticker.lagSmoothing(0);

          if (heroStage && tiltWrapRef.current) {
            heroStage.addEventListener('pointermove', onHeroMove);
            heroStage.addEventListener('pointerleave', onHeroLeave);
            tiltTicker = () => {
              const ax = (targetRotX - curRotX) * 0.08;
              const ay = (targetRotY - curRotY) * 0.08;
              velX = (velX + ax) * 0.82;
              velY = (velY + ay) * 0.82;
              curRotX += velX;
              curRotY += velY;
              if (tiltWrapRef.current) {
                tiltWrapRef.current.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
              }
              if (shadowRef.current) {
                shadowRef.current.style.transform = `translateX(${(-curRotY * 1.4).toFixed(1)}px) scale(${1 - Math.abs(curRotX) * 0.01})`;
              }
            };
            gsap.ticker.add(tiltTicker);
          }
        }

        if (isDesktop && !prefersReduced) {
          const frames = frameRefs.current.filter(
            (el): el is HTMLElement => el !== null
          );
          const captions = captionRefs.current.filter(
            (el): el is HTMLDivElement => el !== null
          );
          if (
            showcaseRef.current &&
            frames.length === 4 &&
            captions.length === 4
          ) {
            gsap.set(captions, { opacity: 0, x: 52, y: 0 });
            gsap.set(captions[0], { opacity: 1, x: 0, y: 0 });

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: showcaseRef.current,
                start: 'top top',
                end: '+=380%',
                pin: true,
                scrub: 1.25,
                onUpdate: (self: { progress: number }) => {
                  const prog = self.progress * 4.25;
                  let nextIdx = 0;
                  if (prog >= 3.25) nextIdx = 3;
                  else if (prog >= 2.1) nextIdx = 2;
                  else if (prog >= 0.95) nextIdx = 1;

                  if (nextIdx !== stageIdxRef.current) {
                    stageIdxRef.current = nextIdx;
                    setActiveStage(nextIdx);
                  }
                },
              },
            });

            const wipeStarts = [0.45, 1.65, 2.85];
            frames.forEach((frame, i) => {
              if (i === 0) return;
              tl.fromTo(
                frame,
                { clipPath: 'inset(0 0 0 100%)' },
                { clipPath: 'inset(0 0 0 0%)', ease: 'none', duration: 1.0 },
                wipeStarts[i - 1]
              );
            });

            tl.to(
              captions[0],
              { opacity: 0, x: -46, y: 0, ease: 'sine.inOut', duration: 0.65 },
              0.5
            )
              .to(
                captions[1],
                { opacity: 1, x: 0, y: 0, ease: 'sine.inOut', duration: 0.7 },
                0.85
              )
              .to(
                captions[1],
                {
                  opacity: 0,
                  x: -46,
                  y: 0,
                  ease: 'sine.inOut',
                  duration: 0.65,
                },
                1.7
              )
              .to(
                captions[2],
                { opacity: 1, x: 0, y: 0, ease: 'sine.inOut', duration: 0.7 },
                2.05
              )
              .to(
                captions[2],
                {
                  opacity: 0,
                  x: -46,
                  y: 0,
                  ease: 'sine.inOut',
                  duration: 0.65,
                },
                2.9
              )
              .to(
                captions[3],
                { opacity: 1, x: 0, y: 0, ease: 'sine.inOut', duration: 0.7 },
                3.25
              );

            tl.set({}, {}, 4.25);
          }

          if (bentoGridRef.current) {
            gsap.from('.reveal-tile', {
              y: 28,
              scale: 0.96,
              opacity: 0,
              duration: 0.65,
              stagger: 0.08,
              ease: 'power3.out',
              clearProps: 'transform,opacity',
              scrollTrigger: {
                trigger: bentoGridRef.current,
                start: 'top 82%',
                once: true,
              },
            });
          }
        }

        return () => {
          if (tiltTicker) {
            gsap.ticker.remove(tiltTicker);
            tiltTicker = null;
          }
          if (lenisTicker) {
            gsap.ticker.remove(lenisTicker);
            lenisTicker = null;
          }
          lenis?.destroy();
          lenis = null;
          heroStage?.removeEventListener('pointermove', onHeroMove);
          heroStage?.removeEventListener('pointerleave', onHeroLeave);
          if (tiltWrapRef.current) tiltWrapRef.current.style.transform = '';
          if (shadowRef.current) shadowRef.current.style.transform = '';
        };
      }
    );

    return () => {
      cleanupHeroGl();
      cleanupSpecsGl();
      mm.revert();
    };
  }, [pageView]);

  const navigateToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (pageView !== 'home') {
      window.history.replaceState(null, '', `#${sectionId}`);
      setPageView('home');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document
            .getElementById(sectionId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
      return;
    }
    window.history.replaceState(null, '', `#${sectionId}`);
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openLegalPage = (
    target: Exclude<PageView, 'home'>,
    e?: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e?.preventDefault();
    setMobileMenuOpen(false);
    const targetHash = `#/${target}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    setPageView(target);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const returnToHome = () => {
    setMobileMenuOpen(false);
    const targetUrl = `${SEO_PRESETS[activePresetId].paths[lang]}#hero`;
    window.history.replaceState(null, '', targetUrl);
    setPageView('home');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSelectLanguage = (nextLang: Language) => {
    setLang(nextLang);
    setLangMenuOpen(false);
    const nextPath = SEO_PRESETS[activePresetId].paths[nextLang];
    const hash = window.location.hash || '';
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', `${nextPath}${hash}`);
    }
  };

  const handleSelectPreset = (
    presetId: SeoPresetId,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setPageView('home');
    setActivePresetId(presetId);
    const nextPath = `${SEO_PRESETS[presetId].paths[lang]}#compare`;
    window.history.pushState(null, '', nextPath);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById('compare')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const handleCookieChoice = (choice: 'allowed' | 'essential') => {
    try {
      window.localStorage.setItem('fahrbilanz_cookie_notice', choice);
    } catch {
      // ignore storage errors in private / restricted contexts
    }
    setShowCookieBanner(false);
  };

  const selectStage = (idx: number) => {
    const wrapped = (idx + SHOWCASE_MEDIA.length) % SHOWCASE_MEDIA.length;
    stageIdxRef.current = wrapped;
    setActiveStage(wrapped);

    const isDesktop =
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 769px)').matches;

    if (!isDesktop) {
      frameRefs.current.forEach((frame) => {
        if (frame) frame.style.clipPath = '';
      });
      captionRefs.current.forEach((cap) => {
        if (cap) {
          cap.style.opacity = '';
          cap.style.transform = '';
        }
      });
      return;
    }

    frameRefs.current.forEach((frame, i) => {
      if (!frame) return;
      gsap.to(frame, {
        clipPath: i <= wrapped ? 'inset(0 0 0 0%)' : 'inset(0 0 0 100%)',
        duration: 0.55,
        ease: 'power2.out',
      });
    });
    captionRefs.current.forEach((cap, i) => {
      if (!cap) return;
      gsap.to(cap, {
        opacity: i === wrapped ? 1 : 0,
        x: i === wrapped ? 0 : i < wrapped ? -44 : 50,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
      });
    });
  };

  const handleShowcaseTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    showcaseTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleShowcaseTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = showcaseTouchRef.current;
    showcaseTouchRef.current = null;
    const touch = e.changedTouches[0];
    if (!start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      selectStage(stageIdxRef.current + (dx < 0 ? 1 : -1));
    }
  };

  const updateSplit = (pct: number, animate: boolean) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setSplitAnimate(animate);
    setSplitPct(clamped);
  };

  const handleCompPointerDown = (e: {
    currentTarget: HTMLDivElement;
    pointerId: number;
    clientX: number;
  }) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerMove = (e: {
    currentTarget: HTMLDivElement;
    clientX: number;
  }) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    updateSplit(((e.clientX - rect.left) / rect.width) * 100, false);
  };

  const handleCompPointerUp = () => {
    isDraggingRef.current = false;
  };

  const markBroken = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  const defaultCountryCode = LANG_DEFAULT_COUNTRY[lang];
  const liveRegionEntry = fuelFeed
    ? fuelFeed.countries.find((c) => c.countryCode === defaultCountryCode) ??
      fuelFeed.euAverage
    : null;

  const syncedAssumptions: GlobalAssumptions = {
    ...HERO_BASE_ASSUMPTIONS,
    gasolinePrice: liveRegionEntry
      ? Number(liveRegionEntry.petrolPrice.toFixed(2))
      : HERO_BASE_ASSUMPTIONS.gasolinePrice,
    dieselPrice: liveRegionEntry
      ? Number(liveRegionEntry.dieselPrice.toFixed(2))
      : HERO_BASE_ASSUMPTIONS.dieselPrice,
  };
  const syncedBlendedElec = getBlendedElectricityPrice(syncedAssumptions);

  const heroMeta = POWERTRAIN_META[heroPowertrain];
  const heroText = t.powertrains[heroPowertrain];
  const heroPreset = CAR_PRESETS[heroPowertrain].sedan;
  const heroTco = calculateTco(
    createSlotFromPreset('hero-preview', heroPowertrain, 'sedan', 5),
    syncedAssumptions
  );

  const sliderGasTco = calculateTco(
    createSlotFromPreset('slider-gas', 'gasoline', 'sedan', 5),
    { ...syncedAssumptions, comparisonMode: 'energy' }
  );
  const sliderEvTco = calculateTco(
    createSlotFromPreset('slider-ev', 'electric', 'sedan', 5),
    { ...syncedAssumptions, comparisonMode: 'energy' }
  );
  const sliderAnnualDiff = Math.max(
    0,
    Math.round((sliderGasTco.annualEnergyCost - sliderEvTco.annualEnergyCost) / 10) *
      10
  );

  const isDark = theme === 'dark';
  const heroAccent = isDark ? heroMeta.darkColor : heroMeta.color;

  const activeLegalDoc =
    pageView === 'privacy'
      ? t.privacy
      : pageView === 'imprint'
        ? t.imprint
        : pageView === 'accessibility'
          ? t.accessibility
          : null;

  return (
    <>
      <a href="#main-content" className="skip-link">
        {t.nav.skipToContent}
      </a>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Top Bar: Aero-Balance Logo left · Interactive scroll-spy nav center · Language + CTA top-right */}
      <header
        ref={headerRef}
        className={`site-header${isScrolled ? ' is-scrolled' : ''}`}
        id="site-header"
      >
        <div className="container header-inner">
          <a
            href="#hero"
            className="brand-lockup"
            aria-label="Fahrbilanz"
            onClick={(e) => navigateToSection(e, 'hero')}
          >
            <svg
              className="brand-logo-mark"
              width="36"
              height="36"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <rect width="40" height="40" rx="9" fill="#3D5740" />
              <line
                x1="13"
                y1="34"
                x2="27"
                y2="34"
                stroke="#F3F6F4"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <polygon points="16.5,34 20,25.5 23.5,34" fill="#9BC3A0" />
              <line
                x1="5.5"
                y1="26"
                x2="34.5"
                y2="22"
                stroke="#F3F6F4"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <rect
                x="6"
                y="13.5"
                width="6.2"
                height="9"
                rx="1.2"
                fill="#F3F6F4"
              />
              <rect
                x="7.3"
                y="15"
                width="3.6"
                height="2.4"
                rx="0.5"
                fill="#3D5740"
              />
              <path
                d="M12.2 15.8H14V21"
                stroke="#F3F6F4"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polygon
                points="31.5,8.5 26,15 29.8,15 28.2,20.5 34.5,13.5 30.6,13.5"
                fill="#9BC3A0"
              />
            </svg>
            <span>Fahrbilanz</span>
          </a>

          <nav className="header-nav" aria-label="Primary">
            <a
              href="#showcase"
              className={`nav-link${activeNav === 'showcase' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'showcase')}
            >
              {t.nav.powertrains}
            </a>
            <a
              href="#energy-split"
              className={`nav-link${activeNav === 'energy-split' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'energy-split')}
            >
              {t.nav.energySplit}
            </a>
            <a
              href="#cost-drivers"
              className={`nav-link${activeNav === 'cost-drivers' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'cost-drivers')}
            >
              {t.nav.costDrivers}
            </a>
            <a
              href="#compare"
              className={`nav-link${activeNav === 'compare' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'compare')}
            >
              {t.nav.compare}
            </a>
          </nav>

          <div className="header-action">
            <a
              href="#compare"
              className="btn btn-primary btn-sm header-cta"
              onClick={(e) => navigateToSection(e, 'compare')}
            >
              <span>{t.nav.cta}</span>
              <svg
                className="cta-arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>

            <button
              type="button"
              className="mobile-menu-btn"
              aria-expanded={mobileMenuOpen}
              aria-label={t.nav.menuLabel}
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </>
                )}
              </svg>
            </button>

            <div ref={langDropdownRef} className="lang-dropdown">
              <button
                type="button"
                className="lang-trigger"
                aria-expanded={langMenuOpen}
                aria-haspopup="menu"
                aria-label={t.nav.languageLabel}
                onClick={() => setLangMenuOpen((v) => !v)}
              >
                <span>{LANGUAGE_LABELS[lang].code}</span>
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className={`lang-chevron${langMenuOpen ? ' is-open' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {langMenuOpen && (
                <div
                  className="lang-menu"
                  role="menu"
                  aria-label={t.nav.languageLabel}
                >
                  {LANGUAGE_ORDER.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="menuitemradio"
                      aria-checked={lang === code}
                      className={`lang-menu-item${
                        lang === code ? ' is-active' : ''
                      }`}
                      onClick={() => handleSelectLanguage(code)}
                    >
                      <span className="lang-menu-code">
                        {LANGUAGE_LABELS[code].code}
                      </span>
                      <span className="lang-menu-name">
                        {LANGUAGE_LABELS[code].name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="mobile-nav-drawer" aria-label="Mobile navigation">
            <a
              href="#compare"
              className={`mobile-nav-link${activeNav === 'compare' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'compare')}
            >
              {t.nav.compare}
            </a>
            <a
              href="#energy-split"
              className={`mobile-nav-link${activeNav === 'energy-split' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'energy-split')}
            >
              {t.nav.energySplit}
            </a>
            <a
              href="#cost-drivers"
              className={`mobile-nav-link${activeNav === 'cost-drivers' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'cost-drivers')}
            >
              {t.nav.costDrivers}
            </a>
            <a
              href="#showcase"
              className={`mobile-nav-link${activeNav === 'showcase' ? ' is-active' : ''}`}
              onClick={(e) => navigateToSection(e, 'showcase')}
            >
              {t.nav.powertrains}
            </a>
            <a
              href="#compare"
              className="btn btn-primary btn-sm mobile-drawer-cta"
              onClick={(e) => navigateToSection(e, 'compare')}
            >
              {t.nav.cta}
            </a>
          </nav>
        )}
      </header>

      {activeLegalDoc ? (
        <main id="main-content" className="privacy-main">
          <section className="privacy-section" aria-labelledby="legal-heading">
            <div className="container">
              <div className="privacy-top-bar">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={returnToHome}
                >
                  ← {t.privacy.backBtn}
                </button>
                <span className="privacy-updated">{activeLegalDoc.updated}</span>
              </div>

              <p className="hero-kicker">{activeLegalDoc.kicker}</p>
              <h1 id="legal-heading" className="section-title">
                {activeLegalDoc.title}
              </h1>
              <p className="privacy-lead">{activeLegalDoc.lead}</p>

              <div className="privacy-grid">
                {activeLegalDoc.cards.map((card, idx) => (
                  <article key={idx} className="privacy-card">
                    <h2 className="privacy-card-title">{card.title}</h2>
                    <p className="privacy-card-body">{card.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main id="main-content">
        {/* SECTION 1: Asymmetric Split Hero with 3D-Tilting Car Sketch Stage */}
        <section id="hero" className="hero">
          <canvas
            ref={heroCanvasRef}
            id="hero-gl-canvas"
            className="hero-canvas"
            aria-hidden="true"
          />

          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="hero-kicker">{t.hero.kicker}</p>
              <h1 className="hero-title">{t.hero.title}</h1>
              <p className="hero-sub">{t.hero.sub}</p>

              <div className="hero-actions">
                <a href="#compare" className="btn btn-primary">
                  {t.hero.primaryCta}
                </a>
                <a href="#showcase" className="btn btn-ghost">
                  {t.hero.secondaryCta}
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 256 256"
                    fill="none"
                    aria-hidden="true"
                  >
                    <line
                      x1="64"
                      y1="64"
                      x2="192"
                      y2="192"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="88 192 192 192 192 88"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div className="hero-stage" ref={heroStageRef} id="hero-stage">
              <div
                className="sketch-tilt-wrap"
                ref={tiltWrapRef}
                id="sketch-tilt-wrap"
              >
                <div className="hero-sketch-card">
                  <div className="hero-sketch-head">
                    <span className="hero-sketch-name">{heroText.label}</span>
                    <span
                      className="hero-sketch-rate tabular-nums"
                      style={{ color: heroAccent }}
                    >
                      {heroPowertrain === 'hybrid'
                        ? t.studio.hybridShortCardNote(
                            String(heroPreset.hybridWeightedFuel ?? 1.6),
                            heroPreset.hybridElectricRangeKm ?? 65
                          )
                        : `${heroPreset.consumption} ${heroMeta.consumptionUnit}`}
                    </span>
                  </div>

                  <div className="hero-sketch-viewport">
                    <CarSketch
                      powertrain={heroPowertrain}
                      bodyClass="sedan"
                      accentColor={heroAccent}
                      className="hero-sketch-svg"
                    />
                  </div>

                  <p className="hero-sketch-tagline">{heroText.tagline}</p>

                  <div className="hero-sketch-metrics">
                    <div className="hero-metric">
                      <span className="hero-metric-val tabular-nums">
                        {formatEur(heroTco.energyCostPer100Km, 2, t.locale)}
                      </span>
                      <span className="hero-metric-label">
                        {t.hero.energyPer100}
                      </span>
                    </div>
                    <div className="hero-metric">
                      <span className="hero-metric-val tabular-nums">
                        {formatEur(heroTco.annualEnergyCost, 0, t.locale)}
                      </span>
                      <span className="hero-metric-label">
                        {t.hero.annualEnergy}
                      </span>
                    </div>
                    <div className="hero-metric">
                      <span className="hero-metric-val tabular-nums">
                        {formatEur(heroTco.monthlyTco, 0, t.locale)}
                      </span>
                      <span className="hero-metric-label">
                        {t.hero.monthlyTco5Yr}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flask-shadow" ref={shadowRef} aria-hidden="true" />

              <div
                ref={heroSwatchesRef}
                className="hero-swatches"
                role="radiogroup"
                aria-label={t.hero.swatchAriaLabel}
              >
                <span
                  className="swatch-slider"
                  aria-hidden="true"
                  style={swatchSliderStyle}
                />
                {POWERTRAIN_ORDER.map((ptId) => {
                  const meta = POWERTRAIN_META[ptId];
                  const isActive = heroPowertrain === ptId;
                  const dotColor = isDark ? meta.darkColor : meta.color;
                  return (
                    <button
                      key={ptId}
                      ref={(el) => {
                        swatchBtnRefs.current[ptId] = el;
                      }}
                      type="button"
                      role="radio"
                      className={`swatch-btn${isActive ? ' is-active' : ''}`}
                      aria-checked={isActive}
                      onClick={() => setHeroPowertrain(ptId)}
                    >
                      <span
                        className="swatch-dot"
                        style={{ background: dotColor }}
                      />
                      <span className="swatch-label">
                        {t.powertrains[ptId].shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Pinned 4-Angle Scrolling Motion Picture Carousel (swipeable on mobile) */}
        <section id="showcase" ref={showcaseRef} className="showcase-pin">
          <div
            className="showcase-viewport"
            id="showcase-viewport"
            onTouchStart={handleShowcaseTouchStart}
            onTouchEnd={handleShowcaseTouchEnd}
          >
            <div className="showcase-frames" id="showcase-frames">
              {SHOWCASE_MEDIA.map((stage, i) => (
                <figure
                  key={stage.id}
                  ref={(el: HTMLElement | null) => {
                    frameRefs.current[i] = el;
                  }}
                  className={`showcase-frame${activeStage === i ? ' is-active' : ''}`}
                  data-index={i}
                >
                  {brokenImages[stage.id] ? (
                    <div className="img-fallback-stage">
                      <CarSketch
                        powertrain={stage.id}
                        bodyClass="sedan"
                        className="fallback-sketch-svg"
                      />
                    </div>
                  ) : (
                    <img
                      src={stage.src}
                      alt={stage.alt}
                      referrerPolicy="no-referrer"
                      onError={() => markBroken(stage.id)}
                      className="showcase-img"
                    />
                  )}
                </figure>
              ))}
            </div>

            <div className="showcase-hud">
              <div className="showcase-caption-stack" id="showcase-caption">
                {SHOWCASE_MEDIA.map((stage, i) => {
                  const copy = t.showcase.stages[stage.id];
                  const isCurrent = activeStage === i;
                  return (
                    <div
                      key={stage.id}
                      ref={(el: HTMLDivElement | null) => {
                        captionRefs.current[i] = el;
                      }}
                      className={`showcase-caption${isCurrent ? ' is-current' : ''}`}
                      aria-hidden={!isCurrent}
                    >
                      <h2 className="caption-title">{copy.title}</h2>
                      <ul className="caption-list">
                        {copy.highlights.map((item, hIdx) => (
                          <li key={hIdx} className="caption-list-item">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="showcase-controls-bar">
                <button
                  type="button"
                  className="showcase-arrow-btn"
                  aria-label={t.showcase.prevLabel}
                  onClick={() => selectStage(activeStage - 1)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <div
                  className="showcase-dots"
                  role="tablist"
                  aria-label={t.showcase.ariaLabel}
                >
                  {SHOWCASE_MEDIA.map((stage, i) => (
                    <button
                      key={stage.id}
                      type="button"
                      role="tab"
                      aria-selected={activeStage === i}
                      className={`stage-dot${activeStage === i ? ' is-active' : ''}`}
                      aria-label={t.showcase.stages[stage.id].title}
                      onClick={() => selectStage(i)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="showcase-arrow-btn"
                  aria-label={t.showcase.nextLabel}
                  onClick={() => selectStage(activeStage + 1)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Interactive Combustion vs. Electric Energy Cost Slider */}
        <section id="energy-split" className="thermal-section">
          <div className="container thermal-grid">
            <div
              className="comparison-wrap"
              ref={compWrapRef}
              id="comparison-wrap"
              onPointerDown={handleCompPointerDown}
              onPointerMove={handleCompPointerMove}
              onPointerUp={handleCompPointerUp}
              onPointerCancel={handleCompPointerUp}
            >
              <div className="comparison-layer comparison-hot">
                {brokenImages.compCombustion ? (
                  <div className="img-fallback-stage" />
                ) : (
                  <img
                    src={compareCombustionImg}
                    alt="Fuel pump nozzle refueling a dark matte car at a station"
                    referrerPolicy="no-referrer"
                    onError={() => markBroken('compCombustion')}
                    className="comparison-img"
                  />
                )}
                <span className="comp-label comp-label-right tabular-nums">
                  {t.slider.gasLabel(
                    formatEur(sliderGasTco.energyCostPer100Km, 2, t.locale)
                  )}
                </span>
              </div>

              <div
                className="comparison-layer comparison-cold"
                id="comparison-cold"
                style={{
                  clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                  transition: splitAnimate
                    ? 'clip-path 380ms var(--ease-out)'
                    : 'none',
                }}
              >
                {brokenImages.compElectric ? (
                  <div className="img-fallback-stage" />
                ) : (
                  <img
                    src={compareElectricImg}
                    alt="Matte sage electric car plugged into an architectural home wallbox charger"
                    referrerPolicy="no-referrer"
                    onError={() => markBroken('compElectric')}
                    className="comparison-img"
                  />
                )}
                <span className="comp-label comp-label-left tabular-nums">
                  {t.slider.evLabel(
                    formatEur(sliderEvTco.energyCostPer100Km, 2, t.locale)
                  )}
                </span>
              </div>

              <div
                className={`comparison-handle${
                  splitPct <= 2 || splitPct >= 98 ? ' is-edge' : ''
                }`}
                id="comparison-handle"
                role="slider"
                tabIndex={0}
                aria-label={t.slider.ariaLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(splitPct)}
                style={{
                  left: `clamp(22px, ${splitPct}%, calc(100% - 22px))`,
                  transition: splitAnimate
                    ? 'left 380ms var(--ease-out)'
                    : 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') updateSplit(splitPct - 8, true);
                  if (e.key === 'ArrowRight') updateSplit(splitPct + 8, true);
                }}
              >
                <div className="handle-line" />
                <div className="handle-knob">
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 256 256"
                    fill="none"
                    aria-hidden="true"
                  >
                    <polyline
                      points="176 144 208 176 176 208"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="48"
                      y1="176"
                      x2="208"
                      y2="176"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                    <polyline
                      points="80 112 48 80 80 48"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="208"
                      y1="80"
                      x2="48"
                      y2="80"
                      stroke="currentColor"
                      strokeWidth="20"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="thermal-copy">
              <h2 className="section-title">{t.slider.title}</h2>
              <p className="section-sub">
                {t.slider.sub(formatEur(sliderAnnualDiff, 0, t.locale))}
              </p>

              <div
                className="segmented-control"
                role="tablist"
                aria-label={t.slider.tabListAria}
              >
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct >= 98 ? ' is-active' : ''}`}
                  aria-selected={splitPct >= 98}
                  onClick={() => updateSplit(100, true)}
                >
                  {t.slider.wallboxTab}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`seg-btn${splitPct <= 2 ? ' is-active' : ''}`}
                  aria-selected={splitPct <= 2}
                  onClick={() => updateSplit(0, true)}
                >
                  {t.slider.pumpTab}
                </button>
              </div>

              <div className="thermal-metrics">
                <div className="metric-item">
                  <span className="metric-value tabular-nums">
                    {formatEur(sliderEvTco.energyCostPer100Km, 2, t.locale)}
                  </span>
                  <span className="metric-label">{t.slider.evMetricLabel}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value tabular-nums">
                    {formatEur(sliderGasTco.energyCostPer100Km, 2, t.locale)}
                  </span>
                  <span className="metric-label">
                    {t.slider.gasMetricLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Asymmetric 3-Tile Editorial Bento of TCO Cost Drivers */}
        <section id="cost-drivers" className="bento-section">
          <div className="container">
            <div className="section-header-stack">
              <h2 className="section-title">{t.bento.title}</h2>
            </div>

            <div className="bento-grid" ref={bentoGridRef}>
              <article className="bento-tile bento-tall reveal-tile">
                {!brokenImages.bentoCockpit && (
                  <img
                    src={bentoCockpitImg}
                    alt="Minimalist car cockpit showing clean range instrumentation at twilight"
                    referrerPolicy="no-referrer"
                    onError={() => markBroken('bentoCockpit')}
                    className="bento-img"
                  />
                )}
                <div className="bento-footer">
                  <h3 className="bento-title">{t.bento.tile1Title}</h3>
                  <p className="bento-sub">{t.bento.tile1Sub}</p>
                </div>
              </article>

              <article className="bento-tile bento-top reveal-tile">
                {!brokenImages.bentoChassis && (
                  <img
                    src={bentoChassisImg}
                    alt="Precision machined alloy wheel, ventilated brake rotor, and matte sage body panel"
                    referrerPolicy="no-referrer"
                    onError={() => markBroken('bentoChassis')}
                    className="bento-img"
                  />
                )}
                <div className="bento-footer">
                  <h3 className="bento-title">{t.bento.tile2Title}</h3>
                  <p className="bento-sub">{t.bento.tile2Sub}</p>
                </div>
              </article>

              <article className="bento-tile bento-bottom reveal-tile">
                <canvas
                  ref={specsCanvasRef}
                  id="specs-gl-canvas"
                  className="specs-canvas"
                  aria-hidden="true"
                />
                <div className="bento-footer bento-footer-specs">
                  <div>
                    <h3 className="bento-title">{t.bento.tile3Title}</h3>
                    <p className="bento-sub">
                      {t.bento.tile3Sub(
                        formatEur(syncedAssumptions.gasolinePrice, 2, t.locale),
                        formatEur(syncedBlendedElec, 2, t.locale)
                      )}
                    </p>
                  </div>
                  <span className="spec-meta">{t.bento.tile3Meta}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* SECTION 5: Interactive 2-or-3 Car Energy & TCO Comparison Studio */}
        <ComparisonStudio
          isDark={isDark}
          lang={lang}
          fuelFeed={fuelFeed}
          fuelFeedLoading={fuelFeedLoading}
          activePresetId={activePresetId}
        />

        {/* SECTION 6: Methodology & Formula Transparency + Pre-Configured Comparison Guides */}
        <MethodologySection
          lang={lang}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
        />
      </main>
      )}

      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <span className="footer-brand">Fahrbilanz</span>
            <span className="footer-tag">{t.footer.tagline}</span>
            <div className="footer-actions">
              <button
                type="button"
                className="theme-switch-btn"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={t.footer.toggleThemeAria}
              >
                {theme === 'light' ? t.footer.darkMode : t.footer.lightMode}
              </button>
              <span className="footer-copy">© 2026 Fahrbilanz</span>
            </div>
          </div>

          <div className="footer-legal-bar">
            <div className="footer-disclaimer-stack">
              <p className="footer-disclaimer">{t.footer.disclaimer}</p>
              <p className="footer-attribution">
                <a
                  href="https://energy.ec.europa.eu/data-and-analysis/weekly-oil-bulletin_en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-legal-link"
                >
                  {t.footer.sourceAttribution}
                </a>
                <span aria-hidden="true" className="preset-sep">
                  {' '}
                  ·{' '}
                </span>
                <a
                  href="mailto:arvidvdbwbs@gmail.com"
                  className="footer-legal-link"
                >
                  arvidvdbwbs@gmail.com
                </a>
              </p>
            </div>
            <nav className="footer-legal-links" aria-label="Legal navigation">
              <a
                href="#/imprint"
                className="footer-legal-link"
                onClick={(e) => openLegalPage('imprint', e)}
              >
                {t.footer.imprintLink}
              </a>
              <span aria-hidden="true" className="preset-sep">
                ·
              </span>
              <a
                href="#/privacy"
                className="footer-legal-link"
                onClick={(e) => openLegalPage('privacy', e)}
              >
                {t.footer.privacyLink}
              </a>
              <span aria-hidden="true" className="preset-sep">
                ·
              </span>
              <a
                href="#/accessibility"
                className="footer-legal-link"
                onClick={(e) => openLegalPage('accessibility', e)}
              >
                {t.footer.accessibilityLink}
              </a>
              <span aria-hidden="true" className="preset-sep">
                ·
              </span>
              <button
                type="button"
                className="footer-legal-link"
                onClick={() => setShowCookieBanner(true)}
              >
                {t.footer.cookieSettings}
              </button>
            </nav>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <aside
          className="cookie-banner"
          role="dialog"
          aria-live="polite"
          aria-label={t.cookies.title}
        >
          <div className="cookie-banner-head">
            <span className="cookie-banner-title">{t.cookies.title}</span>
          </div>
          <p className="cookie-banner-body">
            {t.cookies.body}{' '}
            <a
              href="#/privacy"
              className="cookie-privacy-link"
              onClick={(e) => openLegalPage('privacy', e)}
            >
              {t.cookies.privacyLink}
            </a>
            .
          </p>
          <div className="cookie-banner-actions">
            <button
              type="button"
              className="btn btn-ghost cookie-btn"
              onClick={() => handleCookieChoice('essential')}
            >
              {t.cookies.essentialBtn}
            </button>
            <button
              type="button"
              className="btn btn-primary cookie-btn"
              onClick={() => handleCookieChoice('allowed')}
            >
              {t.cookies.allowBtn}
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
