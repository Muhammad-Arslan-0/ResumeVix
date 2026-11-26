import React from 'react';
import { ExternalLink } from 'lucide-react';
import { ResumeData, SectionConfig, TemplateConfig } from '@/types';
import { TemplateDefinition } from '../registry';

interface SectionRendererProps {
  section: SectionConfig;
  data: ResumeData;
  variant: TemplateDefinition['variant'];
  entryLayout?: TemplateDefinition['entryLayout'];
  headingUppercase?: boolean;
  dateFormat?: TemplateConfig['style']['dateFormat'];
  sectionCustomizations?: TemplateConfig['style']['sectionCustomizations'];
  highlightAuthorName?: string;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatResumeDate(
  raw: string | undefined,
  format: TemplateConfig['style']['dateFormat'] = 'YYYY/MM'
): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/present|current|now/i.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{4})(?:[-/](\d{1,2})(?:[-/](\d{1,2}))?)?$/);
  if (!match) return trimmed;
  const [, yyyy, mmRaw, ddRaw] = match;
  if (!mmRaw) return yyyy;
  const mm = mmRaw.padStart(2, '0');
  const dd = (ddRaw || '01').padStart(2, '0');
  switch (format) {
    case 'YYYY/MM/DD':
      return `${yyyy}/${mm}/${dd}`;
    case 'MM/YYYY':
      return `${mm}/${yyyy}`;
    case 'MMM YYYY': {
      const idx = Math.max(0, Math.min(11, parseInt(mm, 10) - 1));
      return `${MONTHS_SHORT[idx]} ${yyyy}`;
    }
    case 'YYYY':
      return yyyy;
    case 'YYYY/MM':
    default:
      return `${yyyy}/${mm}`;
  }
}

function SectionHeading({
  title,
  variant,
  uppercase = true,
}: {
  title: string;
  variant: TemplateDefinition['variant'];
  uppercase?: boolean;
}) {
  const caseClass = uppercase ? 'uppercase' : 'normal-case';
  const baseClass = `rv-section-heading break-after-avoid font-bold tracking-wide ${caseClass} mb-1.5`;
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
  if (variant === 'flowcv-banner') {
    return (
      <h2
        style={{ ...styleHeading, color: 'var(--rv-heading-color)' }}
        className={`rv-section-heading break-after-avoid font-bold tracking-wider ${caseClass} text-center text-[0.95em] bg-slate-100 py-1 px-3 rounded-[2px] mb-2.5`}
      >
        {title}
      </h2>
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
  ({
    section,
    data,
    variant,
    entryLayout = 'stacked',
    headingUppercase = true,
    dateFormat = 'YYYY/MM',
    sectionCustomizations,
    highlightAuthorName,
  }) => {
    if (!section.visible) return null;
    const sc = sectionCustomizations || {};
    const expCompanyFirst = sc.experienceTitleOrder === 'company-first';
    const eduSchoolFirst = sc.educationTitleOrder === 'school-first';
    const showSummaryHeading = sc.showSummaryHeading ?? true;

    switch (section.type) {
      case 'page_break':
        return <div className="break-before-page h-0" aria-hidden="true" />;

      case 'summary': {
        if (!data.summary.trim()) return null;
        return (
          <section className="rv-section">
            {showSummaryHeading && (
              <SectionHeading
                title={section.title}
                variant={variant}
                uppercase={headingUppercase}
              />
            )}
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
            <div className="flex flex-col gap-3">
              {visibleItems.map((item) =>
                entryLayout === 'date-left-rail' ? (
                  <article
                    key={item.id}
                    className="rv-entry break-inside-avoid grid grid-cols-[24%_1fr] gap-4 items-start"
                  >
                    <div className="text-[0.88em] text-[var(--rv-muted)] leading-snug">
                      <div>
                        {formatResumeDate(item.startDate, dateFormat)} –{' '}
                        {item.current ? 'Present' : formatResumeDate(item.endDate, dateFormat)}
                      </div>
                      {item.location && <div className="mt-0.5">{item.location}</div>}
                    </div>
                    <div>
                      <div className="text-[1em]">
                        {expCompanyFirst ? (
                          <>
                            <span className="font-bold">{item.company}</span>
                            {item.role && <span className="italic">, {item.role}</span>}
                          </>
                        ) : (
                          <>
                            <span className="font-bold">{item.role}</span>
                            {item.company && <span className="italic">, {item.company}</span>}
                          </>
                        )}
                      </div>
                      {item.bullets.length > 0 && (
                        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[0.94em]">
                          {item.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ) : (
                  <article key={item.id} className="rv-entry break-inside-avoid">
                    <div className="flex justify-between items-baseline gap-2">
                      <div>
                        <span className="font-semibold text-[1em]">{item.role}</span>
                        {item.company && (
                          <span className="text-[var(--rv-muted)]"> — {item.company}</span>
                        )}
                      </div>
                      <span className="text-[0.88em] text-[var(--rv-muted)] whitespace-nowrap">
                        {formatResumeDate(item.startDate, dateFormat)} –{' '}
                        {item.current ? 'Present' : formatResumeDate(item.endDate, dateFormat)}
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
                )
              )}
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
            <div className="flex flex-col gap-2.5">
              {visibleItems.map((item) =>
                entryLayout === 'date-left-rail' ? (
                  <article
                    key={item.id}
                    className="rv-entry break-inside-avoid grid grid-cols-[24%_1fr] gap-4 items-start"
                  >
                    <div className="text-[0.88em] text-[var(--rv-muted)] leading-snug">
                      <div>
                        {formatResumeDate(item.startDate, dateFormat)} –{' '}
                        {formatResumeDate(item.endDate, dateFormat)}
                      </div>
                      {item.location && <div className="mt-0.5">{item.location}</div>}
                    </div>
                    <div>
                      <div>
                        {eduSchoolFirst ? (
                          <>
                            <span className="font-bold">{item.institution}</span>
                            <span className="italic">
                              , {item.degree}
                              {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold">
                              {item.degree}
                              {item.fieldOfStudy ? `, ${item.fieldOfStudy}` : ''}
                            </span>
                            <span className="italic">, {item.institution}</span>
                          </>
                        )}
                      </div>
                      {item.gpa && (
                        <div className="text-[0.9em] font-semibold mt-0.5">GPA: {item.gpa}</div>
                      )}
                      {item.thesisTitle && (
                        <p className="text-[0.9em] italic mt-0.5">
                          Thesis: {item.thesisTitle}
                          {item.advisor ? ` (Advisor: ${item.advisor})` : ''}
                        </p>
                      )}
                    </div>
                  </article>
                ) : (
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
                )
              )}
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
            <div className="flex flex-col gap-2.5">
              {visibleItems.map((proj) => (
                <article key={proj.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="font-semibold inline-flex items-center gap-1.5">
                      <span>{variant === 'flowcv-banner' ? `• ${proj.name}` : proj.name}</span>
                      {proj.url &&
                        (variant === 'flowcv-banner' ? (
                          <ExternalLink className="w-3 h-3 text-[var(--rv-muted)] inline" />
                        ) : (
                          <span className="font-normal text-[0.88em] text-[var(--rv-muted)]">
                            ({proj.url})
                          </span>
                        ))}
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
                    <ul
                      className={`${
                        variant === 'flowcv-banner' ? 'pl-3 list-none' : 'pl-4 list-disc'
                      } mt-0.5 space-y-0.5 text-[0.94em]`}
                    >
                      {proj.bullets.map((b, i) => (
                        <li key={i} className={variant === 'flowcv-banner' ? 'italic' : ''}>
                          {b}
                        </li>
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
        const effectiveSkillsLayout =
          sc.skillsLayout ||
          (variant === 'flowcv-banner'
            ? 'grid'
            : variant === 'creative-pill'
              ? 'bubble'
              : 'rows');
        const cols = sc.skillsGridCols || 3;
        const gridColsClass =
          cols === 1
            ? 'grid-cols-1'
            : cols === 2
              ? 'grid-cols-2'
              : cols === 4
                ? 'grid-cols-4'
                : 'grid-cols-3';

        return (
          <section className="rv-section break-inside-avoid">
            <SectionHeading title={section.title} variant={variant} />
            {effectiveSkillsLayout === 'grid' ? (
              <div className={`grid ${gridColsClass} gap-x-5 gap-y-2.5 text-[0.93em]`}>
                {visibleItems.map((grp) => (
                  <div key={grp.id}>
                    <div className="font-bold">{grp.category}</div>
                    <div className="italic text-[var(--rv-muted)] leading-snug">
                      {grp.items.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            ) : effectiveSkillsLayout === 'bubble' ? (
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
            ) : effectiveSkillsLayout === 'compact' ? (
              <p className="text-[0.93em] leading-relaxed">
                {visibleItems.map((g) => `${g.category}: ${g.items.join(', ')}`).join(' • ')}
              </p>
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
