import React from 'react';
import { Github, Globe, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { ResumeData, SectionConfig, TemplateConfig } from '@/types';
import { getTemplateMeta, TemplateDefinition } from './registry';
import { PageShell, SectionRenderer } from './primitives';

interface TemplateProps {
  data: ResumeData;
  config: TemplateConfig;
  bare?: boolean;
}

const SIDEBAR_SECTION_TYPES = new Set(['skills', 'education', 'publications']);

function ContactLine({ data, centered = false }: { data: ResumeData; centered?: boolean }) {
  const { profile } = data;
  const items = [
    profile.email,
    profile.phone,
    profile.location,
    profile.website,
    profile.linkedin,
    profile.github,
    profile.orcid ? `ORCID: ${profile.orcid}` : undefined,
  ].filter(Boolean) as string[];

  return (
    <div
      className={`text-[0.88em] text-[var(--rv-muted)] flex flex-wrap gap-x-2.5 gap-y-0.5 ${
        centered ? 'justify-center' : ''
      }`}
    >
      {items.map((item, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="mr-2.5 opacity-50">•</span>}
          {item}
        </span>
      ))}
    </div>
  );
}

function TemplateHeader({
  data,
  headerStyle,
}: {
  data: ResumeData;
  headerStyle: NonNullable<TemplateDefinition['headerStyle']>;
}) {
  const headingStyle = { fontFamily: 'var(--rv-font-heading)' };
  const { profile } = data;

  if (headerStyle === 'banner') {
    return (
      <header
        className="mb-4 p-4 rounded-sm text-white"
        style={{ backgroundColor: 'var(--rv-accent)' }}
      >
        <h1 style={headingStyle} className="text-[1.9em] font-bold tracking-tight">
          {profile.fullName || 'Your Name'}
        </h1>
        {profile.headline && (
          <p className="text-[1.05em] opacity-90 mt-0.5">{profile.headline}</p>
        )}
        <div className="text-[0.86em] opacity-85 mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
          {[profile.email, profile.phone, profile.location, profile.website, profile.linkedin, profile.github]
            .filter(Boolean)
            .map((item, i) => (
              <span key={i}>{item}</span>
            ))}
        </div>
      </header>
    );
  }

  if (headerStyle === 'icon-centered') {
    const contactChips = [
      profile.email ? { icon: Mail, text: profile.email } : null,
      profile.phone ? { icon: Phone, text: profile.phone } : null,
      profile.location ? { icon: MapPin, text: profile.location } : null,
      profile.linkedin ? { icon: Linkedin, text: profile.linkedin } : null,
      profile.website ? { icon: Globe, text: profile.website } : null,
      profile.github ? { icon: Github, text: profile.github } : null,
      profile.orcid ? { icon: Globe, text: `ORCID: ${profile.orcid}` } : null,
    ].filter(Boolean) as Array<{ icon: React.ComponentType<{ className?: string }>; text: string }>;

    return (
      <header className="text-center pb-3 mb-3">
        <h1 style={headingStyle} className="text-[2em] font-bold tracking-tight">
          {profile.fullName || 'Your Name'}
        </h1>
        {profile.headline && (
          <p className="text-[1.1em] italic text-[var(--rv-text)] mt-0.5">{profile.headline}</p>
        )}
        <div className="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[0.86em] text-[var(--rv-text)]">
          {contactChips.map((chip, idx) => {
            const Icon = chip.icon;
            return (
              <span key={idx} className="inline-flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center shrink-0">
                  <Icon className="w-2.5 h-2.5" />
                </span>
                <span>{chip.text}</span>
              </span>
            );
          })}
        </div>
      </header>
    );
  }

  if (headerStyle === 'centered') {
    return (
      <header className="text-center border-b-2 border-[var(--rv-accent)] pb-3 mb-4">
        <h1 style={headingStyle} className="text-[1.85em] font-bold tracking-tight">
          {profile.fullName || 'Your Name'}
        </h1>
        {profile.headline && (
          <p className="text-[1.02em] text-[var(--rv-muted)] mt-0.5">{profile.headline}</p>
        )}
        <div className="mt-1.5">
          <ContactLine data={data} centered />
        </div>
      </header>
    );
  }

  if (headerStyle === 'split') {
    return (
      <header className="flex justify-between items-end border-b-2 border-[var(--rv-accent)] pb-3 mb-4 gap-4">
        <div>
          <h1 style={headingStyle} className="text-[1.8em] font-bold tracking-tight">
            {profile.fullName || 'Your Name'}
          </h1>
          {profile.headline && (
            <p className="text-[1.02em] text-[var(--rv-accent)] font-medium mt-0.5">
              {profile.headline}
            </p>
          )}
        </div>
        <div className="text-right text-[0.86em] text-[var(--rv-muted)] space-y-0.5 shrink-0">
          {profile.email && <div>{profile.email}</div>}
          {profile.phone && <div>{profile.phone}</div>}
          {profile.location && <div>{profile.location}</div>}
          {profile.linkedin && <div>{profile.linkedin}</div>}
        </div>
      </header>
    );
  }

  // Default: left
  return (
    <header className="border-b border-gray-300 pb-2.5 mb-3.5">
      <h1 style={headingStyle} className="text-[1.75em] font-bold tracking-tight">
        {profile.fullName || 'Your Name'}
      </h1>
      {profile.headline && (
        <p className="text-[1.02em] text-[var(--rv-accent)] font-medium mt-0.5">
          {profile.headline}
        </p>
      )}
      <div className="mt-1">
        <ContactLine data={data} />
      </div>
    </header>
  );
}

export const UnifiedTemplateRenderer: React.FC<TemplateProps> = React.memo(
  ({ data, config, bare = false }) => {
  const meta = getTemplateMeta(config.templateId);
  const orderedSections = [...config.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  const highlightName = meta.category === 'academic' ? data.profile.fullName : undefined;
  const effectiveVariant =
    config.style.headingVariant && config.style.headingVariant !== 'auto'
      ? config.style.headingVariant
      : meta.variant;
  const effectiveHeaderStyle =
    config.style.headerStyleOverride && config.style.headerStyleOverride !== 'auto'
      ? config.style.headerStyleOverride
      : meta.headerStyle || 'left';
  const effectiveEntryLayout =
    config.style.entryLayoutOverride && config.style.entryLayoutOverride !== 'auto'
      ? config.style.entryLayoutOverride
      : meta.entryLayout || 'stacked';
  const headingUppercase = config.style.headingUppercase ?? true;

  if (meta.layout === 'two-column-left' || meta.layout === 'two-column-right') {
    const sidebarSections: SectionConfig[] = [];
    const mainSections: SectionConfig[] = [];

    for (const sec of orderedSections) {
      if (SIDEBAR_SECTION_TYPES.has(sec.type) && meta.category !== 'academic') {
        sidebarSections.push(sec);
      } else if (meta.category === 'academic' && (sec.type === 'skills' || sec.type === 'education')) {
        sidebarSections.push(sec);
      } else {
        mainSections.push(sec);
      }
    }

    const isLeft = meta.layout === 'two-column-left';

    return (
      <PageShell config={config} bare={bare} className={`template-${meta.id}`}>
        <TemplateHeader data={data} headerStyle={effectiveHeaderStyle} />
        <div
          className="grid gap-5 items-start"
          style={{ gridTemplateColumns: meta.sidebarRatio || '32% 1fr' }}
        >
          {isLeft ? (
            <>
              <aside className="flex flex-col gap-[var(--rv-section-gap)] bg-gray-50/80 p-3 rounded">
                {sidebarSections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    data={data}
                    variant={effectiveVariant}
                    entryLayout={effectiveEntryLayout}
                    headingUppercase={headingUppercase}
                    highlightAuthorName={highlightName}
                  />
                ))}
              </aside>
              <main className="flex flex-col gap-[var(--rv-section-gap)]">
                {mainSections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    data={data}
                    variant={effectiveVariant}
                    entryLayout={effectiveEntryLayout}
                    headingUppercase={headingUppercase}
                    highlightAuthorName={highlightName}
                  />
                ))}
              </main>
            </>
          ) : (
            <>
              <main className="flex flex-col gap-[var(--rv-section-gap)]">
                {mainSections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    data={data}
                    variant={effectiveVariant}
                    entryLayout={effectiveEntryLayout}
                    headingUppercase={headingUppercase}
                    highlightAuthorName={highlightName}
                  />
                ))}
              </main>
              <aside className="flex flex-col gap-[var(--rv-section-gap)] border-l border-gray-200 pl-3.5">
                {sidebarSections.map((section) => (
                  <SectionRenderer
                    key={section.id}
                    section={section}
                    data={data}
                    variant={effectiveVariant}
                    entryLayout={effectiveEntryLayout}
                    headingUppercase={headingUppercase}
                    highlightAuthorName={highlightName}
                  />
                ))}
              </aside>
            </>
          )}
        </div>
        {config.style.footerText && (
          <footer className="mt-6 pt-2 border-t border-gray-200 text-center text-[0.8em] text-[var(--rv-muted)]">
            {config.style.footerText}
          </footer>
        )}
      </PageShell>
    );
  }

  // Single-column & banner-header
  return (
    <PageShell config={config} bare={bare} className={`template-${meta.id}`}>
      <TemplateHeader data={data} headerStyle={effectiveHeaderStyle} />
      <main className="flex flex-col gap-[var(--rv-section-gap)]">
        {orderedSections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            data={data}
            variant={effectiveVariant}
            entryLayout={effectiveEntryLayout}
            headingUppercase={headingUppercase}
            highlightAuthorName={highlightName}
          />
        ))}
      </main>
      {config.style.footerText && (
        <footer className="mt-6 pt-2 border-t border-gray-200 text-center text-[0.8em] text-[var(--rv-muted)]">
          {config.style.footerText}
        </footer>
      )}
    </PageShell>
  );
});

UnifiedTemplateRenderer.displayName = 'UnifiedTemplateRenderer';
