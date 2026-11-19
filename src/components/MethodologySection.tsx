import type React from 'react';
import {
  PROGRAMMATIC_PRESET_ORDER,
  SEO_PRESETS,
  type SeoPresetId,
} from '../data/seoRoutes';
import { METHODOLOGY_COPY } from '../i18n/methodologyCopy';
import type { Language } from '../i18n/translations';

interface MethodologySectionProps {
  lang: Language;
  activePresetId: SeoPresetId;
  onSelectPreset: (
    presetId: SeoPresetId,
    e: React.MouseEvent<HTMLAnchorElement>
  ) => void;
}

export function MethodologySection({
  lang,
  activePresetId,
  onSelectPreset,
}: MethodologySectionProps) {
  const copy = METHODOLOGY_COPY[lang];

  return (
    <section
      id="methodology"
      className="methodology-section"
      aria-labelledby="methodology-heading"
    >
      <div className="container">
        <div className="section-header-stack methodology-header">
          <p className="hero-kicker">{copy.kicker}</p>
          <h2 id="methodology-heading" className="section-title">
            {copy.title}
          </h2>
          <p className="section-sub">{copy.sub}</p>
        </div>

        <div className="methodology-grid">
          {copy.cards.map((card, idx) => (
            <article key={idx} className="methodology-card">
              <span className="methodology-tag">{card.tag}</span>
              <h3 className="methodology-card-title">{card.title}</h3>
              <p className="methodology-card-body">{card.body}</p>
              {card.formula && (
                <code className="methodology-formula">{card.formula}</code>
              )}
            </article>
          ))}
        </div>

        <div className="guides-block" aria-labelledby="guides-heading">
          <div className="guides-header">
            <p className="hero-kicker">{copy.guidesKicker}</p>
            <h3 id="guides-heading" className="guides-title">
              {copy.guidesTitle}
            </h3>
            <p className="guides-sub">{copy.guidesSub}</p>
          </div>

          <div className="guides-grid">
            {PROGRAMMATIC_PRESET_ORDER.map((presetId) => {
              const spec = SEO_PRESETS[presetId];
              const meta = spec.meta[lang];
              const isActive = activePresetId === presetId;
              return (
                <a
                  key={presetId}
                  href={spec.paths[lang]}
                  className={`guide-card${isActive ? ' is-active' : ''}`}
                  onClick={(e) => onSelectPreset(presetId, e)}
                >
                  <div className="guide-card-top">
                    <span className="guide-badge">{meta.badge}</span>
                    <span className="guide-action-label">
                      {isActive ? copy.activeGuideLabel : copy.openGuideLabel} →
                    </span>
                  </div>
                  <h4 className="guide-card-title">{meta.heading}</h4>
                  <p className="guide-card-desc">{meta.summary}</p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
