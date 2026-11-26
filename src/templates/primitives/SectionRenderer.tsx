import React from 'react';
import { ResumeData, SectionConfig } from '@/types';
import { TemplateDefinition } from '../registry';

interface SectionRendererProps {
  section: SectionConfig;
  data: ResumeData;
  variant: TemplateDefinition['variant'];
  highlightAuthorName?: string;
}

function SectionHeading({
  title,
  variant,
}: {
  title: string;
  variant: TemplateDefinition['variant'];
}) {
  const baseClass = 'rv-section-heading break-after-avoid font-bold tracking-wide uppercase mb-1.5';
  const styleHeading = { fontFamily: 'var(--rv-font-heading)' };

  if (variant === 'ats-minimal') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} text-[1.02em] border-b border-gray-300 pb-0.5 text-[var(--rv-text)]`}
      >
        {title}
      </h2>
    );
  }
  if (variant === 'academic-ruled') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} text-[1.05em] border-b-2 border-[var(--rv-accent)] pb-0.5 text-[var(--rv-accent)]`}
      >
        {title}
      </h2>
    );
  }
  if (variant === 'executive-bold') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} text-[1.08em] text-[var(--rv-accent)] border-l-4 border-[var(--rv-accent)] pl-2`}
      >
        {title}
      </h2>
    );
  }
  if (variant === 'creative-pill') {
    return (
      <div className="break-after-avoid mb-2">
        <h2
          style={styleHeading}
          className="inline-block text-[0.92em] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--rv-accent)] text-white"
        >
          {title}
        </h2>
      </div>
    );
  }
  // modern-accent
  return (
    <h2
      style={styleHeading}
      className={`${baseClass} text-[1.02em] text-[var(--rv-accent)] border-b border-gray-200 pb-0.5`}
    >
      {title}
    </h2>
  );
}

export const SectionRenderer: React.FC<SectionRendererProps> = React.memo(
  ({ section, data, variant, highlightAuthorName }) => {
    if (!section.visible) return null;

    switch (section.type) {
      case 'summary': {
        if (!data.summary.trim()) return null;
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <p className="text-[0.96em] text-[var(--rv-text)] leading-relaxed">{data.summary}</p>
          </section>
        );
      }

      case 'experience': {
        const visibleItems = data.experience.filter((e) => e.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <div className="flex flex-col gap-2.5">
              {visibleItems.map((item) => (
                <article key={item.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div>
                      <span className="font-semibold text-[1em]">{item.role}</span>
                      {item.company && (
                        <span className="text-[var(--rv-muted)]"> — {item.company}</span>
                      )}
                    </div>
                    <span className="text-[0.88em] text-[var(--rv-muted)] whitespace-nowrap">
                      {item.startDate} – {item.current ? 'Present' : item.endDate}
                    </span>
                  </div>
                  {item.location && (
                    <div className="text-[0.86em] text-[var(--rv-muted)]">{item.location}</div>
                  )}
                  {item.bullets.length > 0 && (
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[0.95em]">
                      {item.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      }

      case 'education': {
        const visibleItems = data.education.filter((e) => e.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <div className="flex flex-col gap-2">
              {visibleItems.map((item) => (
                <article key={item.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div>
                      <span className="font-semibold">{item.degree}</span>
                      {item.fieldOfStudy && <span>, {item.fieldOfStudy}</span>}
                    </div>
                    <span className="text-[0.88em] text-[var(--rv-muted)] whitespace-nowrap">
                      {item.startDate} – {item.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-[0.92em] text-[var(--rv-muted)]">
                    <span>
                      {item.institution}
                      {item.location ? `, ${item.location}` : ''}
                    </span>
                    {item.gpa && <span>GPA: {item.gpa}</span>}
                  </div>
                  {item.thesisTitle && (
                    <p className="text-[0.9em] italic mt-0.5">
                      Thesis: {item.thesisTitle}
                      {item.advisor ? ` (Advisor: ${item.advisor})` : ''}
                    </p>
                  )}
                  {item.honors && item.honors.length > 0 && (
                    <p className="text-[0.88em] text-[var(--rv-muted)] mt-0.5">
                      Honors: {item.honors.join(' • ')}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      }

      case 'publications': {
        const visibleItems = data.publications.filter((p) => p.visible);
        if (visibleItems.length === 0) return null;
        const normalizedMe = highlightAuthorName?.toLowerCase().replace(/^dr\.\s*/i, '').replace(/,.*$/, '').trim();
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <ol className="list-decimal pl-4 space-y-1.5 text-[0.94em]">
              {visibleItems.map((pub) => (
                <li key={pub.id} className="rv-entry break-inside-avoid">
                  <span>
                    {pub.authors.map((author, idx) => {
                      const isMe =
                        normalizedMe &&
                        author.toLowerCase().includes(normalizedMe);
                      return (
                        <React.Fragment key={idx}>
                          {idx > 0 && ', '}
                          <span className={isMe ? 'font-semibold underline decoration-[var(--rv-accent)]' : ''}>
                            {author}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </span>{' '}
                  ({pub.year}). <span className="font-medium">&ldquo;{pub.title}&rdquo;</span>.{' '}
                  <span className="italic">{pub.venue}</span>.
                  {pub.doiOrUrl && (
                    <span className="text-[0.88em] text-[var(--rv-muted)]"> [{pub.doiOrUrl}]</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        );
      }

      case 'projects': {
        const visibleItems = data.projects.filter((p) => p.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <div className="flex flex-col gap-2">
              {visibleItems.map((proj) => (
                <article key={proj.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="font-semibold">
                      {proj.name}
                      {proj.url && (
                        <span className="font-normal text-[0.88em] text-[var(--rv-muted)] ml-2">
                          ({proj.url})
                        </span>
                      )}
                    </div>
                    {(proj.startDate || proj.endDate) && (
                      <span className="text-[0.88em] text-[var(--rv-muted)] whitespace-nowrap">
                        {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ''}
                      </span>
                    )}
                  </div>
                  {proj.technologies.length > 0 && (
                    <div className="text-[0.88em] text-[var(--rv-muted)]">
                      Stack: {proj.technologies.join(', ')}
                    </div>
                  )}
                  {proj.bullets.length > 0 && (
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[0.94em]">
                      {proj.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      }

      case 'skills': {
        const visibleItems = data.skills.filter((s) => s.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section break-inside-avoid">
            <SectionHeading title={section.title} variant={variant} />
            {variant === 'creative-pill' ? (
              <div className="flex flex-col gap-1.5">
                {visibleItems.map((grp) => (
                  <div key={grp.id} className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-[0.9em] mr-1">{grp.category}:</span>
                    {grp.items.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[0.85em] rounded-full border border-gray-300 bg-gray-50"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-[0.94em]">
                {visibleItems.map((grp) => (
                  <div key={grp.id}>
                    <span className="font-semibold">{grp.category}: </span>
                    <span>{grp.items.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      }

      case 'custom': {
        const customSec = data.customSections[section.id];
        if (!customSec) return null;
        const visibleEntries = customSec.entries.filter((e) => e.visible);
        if (visibleEntries.length === 0) return null;
        return (
          <section className="rv-section">
            <SectionHeading title={section.title} variant={variant} />
            <div className="flex flex-col gap-2">
              {visibleEntries.map((entry) => (
                <article key={entry.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div>
                      <span className="font-semibold">{entry.title}</span>
                      {entry.subtitle && (
                        <span className="text-[var(--rv-muted)]"> — {entry.subtitle}</span>
                      )}
                    </div>
                    {entry.dateRange && (
                      <span className="text-[0.88em] text-[var(--rv-muted)] whitespace-nowrap">
                        {entry.dateRange}
                      </span>
                    )}
                  </div>
                  {entry.bullets.length > 0 && (
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[0.94em]">
                      {entry.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      }
    }
  }
);

SectionRenderer.displayName = 'SectionRenderer';
