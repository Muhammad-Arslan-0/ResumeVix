import React from 'react';
import {
  BookOpen,
  Briefcase,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Layers,
  Sparkles,
  UserSquare2,
} from 'lucide-react';
import { ResumeData, SectionConfig, SectionType, TemplateConfig } from '@/types';
import { TemplateDefinition } from '../registry';

interface SectionRendererProps {
  section: SectionConfig;
  data: ResumeData;
  variant: TemplateDefinition['variant'] | 'double-rule' | 'short-underline' | 'plain';
  entryLayout?: TemplateDefinition['entryLayout'];
  headingUppercase?: boolean;
  headingIconStyle?: 'none' | 'outline' | 'filled';
  dateFormat?: TemplateConfig['style']['dateFormat'];
  entryConfig?: TemplateConfig['style']['entryConfig'];
  sectionCustomizations?: TemplateConfig['style']['sectionCustomizations'];
  highlightAuthorName?: string;
}

function getHeadingIcon(type: SectionType) {
  switch (type) {
    case 'summary':
      return UserSquare2;
    case 'experience':
      return Briefcase;
    case 'education':
      return GraduationCap;
    case 'publications':
      return BookOpen;
    case 'projects':
      return FolderGit2;
    case 'skills':
      return Sparkles;
    default:
      return Layers;
  }
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
  sectionType,
  variant,
  uppercase = true,
  iconStyle = 'none',
}: {
  title: string;
  sectionType?: SectionType;
  variant: SectionRendererProps['variant'];
  uppercase?: boolean;
  iconStyle?: 'none' | 'outline' | 'filled';
}) {
  const caseClass = uppercase ? 'uppercase' : 'normal-case';
  const baseClass = `rv-section-heading break-after-avoid font-bold tracking-wide ${caseClass} mb-1.5 flex items-center gap-1.5`;
  const styleHeading = {
    fontFamily: 'var(--rv-font-heading)',
    fontSize: 'var(--rv-section-heading-size)',
  };

  const IconComp = sectionType ? getHeadingIcon(sectionType) : null;
  const iconNode =
    IconComp && iconStyle !== 'none' ? (
      <span
        style={
          iconStyle === 'filled'
            ? { backgroundColor: 'var(--rv-heading-color)', color: '#ffffff' }
            : { borderColor: 'var(--rv-heading-color)', color: 'var(--rv-heading-color)' }
        }
        className={`w-4 h-4 rounded-sm ${
          iconStyle === 'filled' ? '' : 'border'
        } inline-flex items-center justify-center shrink-0`}
      >
        <IconComp className="w-2.5 h-2.5" />
      </span>
    ) : null;

  if (variant === 'ats-minimal') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} border-b border-gray-300 pb-0.5 text-[var(--rv-heading-color)]`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  if (variant === 'academic-ruled') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} border-b-2 border-[var(--rv-accent)] pb-0.5 text-[var(--rv-heading-color)]`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  if (variant === 'executive-bold') {
    return (
      <h2
        style={styleHeading}
        className={`${baseClass} text-[var(--rv-heading-color)] border-l-4 border-[var(--rv-accent)] pl-2`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  if (variant === 'creative-pill') {
    return (
      <div className="break-after-avoid mb-2">
        <h2
          style={styleHeading}
          className={`inline-flex items-center gap-1.5 font-bold ${caseClass} tracking-wider px-2 py-0.5 rounded bg-[var(--rv-accent)] text-white`}
        >
          {iconNode}
          <span>{title}</span>
        </h2>
      </div>
    );
  }
  if (variant === 'editorial-banner') {
    return (
      <h2
        style={{
          ...styleHeading,
          color: 'var(--rv-heading-color)',
        }}
        className={`rv-section-heading break-after-avoid font-bold tracking-wider ${caseClass} flex items-center justify-center gap-1.5 bg-slate-100 py-1 px-3 rounded-[2px] mb-2.5`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  if (variant === 'double-rule') {
    return (
      <h2
        style={{ ...styleHeading, color: 'var(--rv-heading-color)' }}
        className={`rv-section-heading break-after-avoid font-bold tracking-wider ${caseClass} flex items-center justify-center gap-1.5 border-y border-gray-300 py-1 mb-2`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  if (variant === 'short-underline') {
    return (
      <div className="break-after-avoid mb-2">
        <h2
          style={{ ...styleHeading, color: 'var(--rv-heading-color)' }}
          className={`font-bold tracking-wide ${caseClass} inline-flex items-center gap-1.5 border-b-2 border-[var(--rv-accent)] pb-0.5`}
        >
          {iconNode}
          <span>{title}</span>
        </h2>
      </div>
    );
  }
  if (variant === 'plain') {
    return (
      <h2
        style={{ ...styleHeading, color: 'var(--rv-heading-color)' }}
        className={`${baseClass}`}
      >
        {iconNode}
        <span>{title}</span>
      </h2>
    );
  }
  // modern-accent
  return (
    <h2
      style={styleHeading}
      className={`${baseClass} text-[var(--rv-heading-color)] border-b border-gray-200 pb-0.5`}
    >
      {iconNode}
      <span>{title}</span>
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
    headingIconStyle = 'none',
    dateFormat = 'YYYY/MM',
    entryConfig,
    sectionCustomizations,
    highlightAuthorName,
  }) => {
    if (!section.visible) return null;
    const sc = sectionCustomizations || {};
    const ec = entryConfig || {};
    const useColumns =
      ec.structure ? ec.structure === 'columns' : entryLayout === 'date-left-rail';
    const datePos = ec.datePosition || 'left';
    const subtitleBelow = ec.subtitlePlacement === 'below';
    const entryTitleBold = ec.titleBold ?? true;
    const entrySubtitleItalic = ec.subtitleItalic ?? true;
    const expCompanyFirst = sc.experienceTitleOrder === 'company-first';
    const eduSchoolFirst = sc.educationTitleOrder === 'school-first';
    const showSummaryHeading = sc.showSummaryHeading ?? true;
    const renderHeading = () => (
      <SectionHeading
        title={section.title}
        sectionType={section.type}
        variant={variant}
        uppercase={headingUppercase}
        iconStyle={headingIconStyle}
      />
    );

    switch (section.type) {
      case 'page_break':
        return <div className="break-before-page h-0" aria-hidden="true" />;

      case 'summary': {
        if (!data.summary.trim()) return null;
        return (
          <section className="rv-section">
            {showSummaryHeading && renderHeading()}
            <p className="text-[0.96em] text-[var(--rv-text)] leading-relaxed">{data.summary}</p>
          </section>
        );
      }

      case 'experience': {
        const visibleItems = data.experience.filter((e) => e.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section">
            {renderHeading()}
            <div className="flex flex-col gap-3">
              {visibleItems.map((item) => {
                const dateStr = `${formatResumeDate(item.startDate, dateFormat)} – ${
                  item.current ? 'Present' : formatResumeDate(item.endDate, dateFormat)
                }`;
                const titleText = expCompanyFirst ? item.company : item.role;
                const subText = expCompanyFirst ? item.role : item.company;

                const titleBlock = (
                  <div style={{ fontSize: 'var(--rv-entry-header-size)' }}>
                    <span className={entryTitleBold ? 'font-bold' : 'font-normal'}>
                      {titleText}
                    </span>
                    {subText &&
                      (subtitleBelow ? (
                        <div
                          style={{ color: 'var(--rv-entry-subtitle-color)' }}
                          className={`text-[0.94em] ${entrySubtitleItalic ? 'italic' : ''}`}
                        >
                          {subText}
                        </div>
                      ) : (
                        <span
                          style={{ color: 'var(--rv-entry-subtitle-color)' }}
                          className={entrySubtitleItalic ? 'italic' : ''}
                        >
                          , {subText}
                        </span>
                      ))}
                  </div>
                );

                const bulletsBlock = item.bullets.length > 0 && (
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[0.94em]">
                    {item.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                );

                if (useColumns) {
                  const dateCol = (
                    <div
                      style={{ color: 'var(--rv-date-color)' }}
                      className={`text-[0.88em] leading-snug ${
                        datePos === 'right' ? 'text-right' : ''
                      }`}
                    >
                      <div>{dateStr}</div>
                      {item.location && <div className="mt-0.5">{item.location}</div>}
                    </div>
                  );

                  return (
                    <article
                      key={item.id}
                      className={`rv-entry break-inside-avoid grid gap-4 items-start ${
                        datePos === 'right'
                          ? 'grid-cols-[1fr_24%]'
                          : 'grid-cols-[24%_1fr]'
                      }`}
                    >
                      {datePos === 'right' ? (
                        <>
                          <div>
                            {titleBlock}
                            {bulletsBlock}
                          </div>
                          {dateCol}
                        </>
                      ) : (
                        <>
                          {dateCol}
                          <div>
                            {titleBlock}
                            {bulletsBlock}
                          </div>
                        </>
                      )}
                    </article>
                  );
                }

                return (
                  <article key={item.id} className="rv-entry break-inside-avoid">
                    <div className="flex justify-between items-baseline gap-2">
                      {titleBlock}
                      <span
                        style={{ color: 'var(--rv-date-color)' }}
                        className="text-[0.88em] whitespace-nowrap"
                      >
                        {dateStr}
                      </span>
                    </div>
                    {item.location && (
                      <div style={{ color: 'var(--rv-date-color)' }} className="text-[0.86em]">
                        {item.location}
                      </div>
                    )}
                    {bulletsBlock}
                  </article>
                );
              })}
            </div>
          </section>
        );
      }

      case 'education': {
        const visibleItems = data.education.filter((e) => e.visible);
        if (visibleItems.length === 0) return null;
        return (
          <section className="rv-section">
            {renderHeading()}
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
            {renderHeading()}
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
            {renderHeading()}
            <div className="flex flex-col gap-2.5">
              {visibleItems.map((proj) => (
                <article key={proj.id} className="rv-entry break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-2">
                    <div className="font-semibold inline-flex items-center gap-1.5">
                      <span>{variant === 'editorial-banner' ? `• ${proj.name}` : proj.name}</span>
                      {proj.url &&
                        (variant === 'editorial-banner' ? (
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
                        variant === 'editorial-banner' ? 'pl-3 list-none' : 'pl-4 list-disc'
                      } mt-0.5 space-y-0.5 text-[0.94em]`}
                    >
                      {proj.bullets.map((b, i) => (
                        <li key={i} className={variant === 'editorial-banner' ? 'italic' : ''}>
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
          (variant === 'editorial-banner'
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
            {renderHeading()}
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
            {renderHeading()}
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
