import React from 'react';
import { TemplateConfig } from '@/types';

interface PageShellProps {
  config: TemplateConfig;
  className?: string;
  bare?: boolean;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  config,
  className = '',
  bare = false,
  children,
}) => {
  const { style, pageSize } = config;
  const widthMm = pageSize === 'A4' ? '210mm' : '215.9mm';
  const minHeightMm = pageSize === 'A4' ? '297mm' : '279.4mm';

  const cssVars = {
    '--rv-font-body': `'${style.fontFamily}', system-ui, -apple-system, sans-serif`,
    '--rv-font-heading': `'${style.headingFontFamily || style.fontFamily}', system-ui, -apple-system, sans-serif`,
    '--rv-font-size': `${style.fontSizePt}pt`,
    '--rv-line-height': `${style.lineHeight}`,
    '--rv-accent': style.accentColor,
    '--rv-text': style.textColor,
    '--rv-muted': style.mutedColor,
    '--rv-margin-mm': `${style.marginMm}mm`,
    '--rv-section-gap': `${style.sectionSpacingPx}px`,
  } as React.CSSProperties;

  if (bare) {
    return (
      <div
        className={`text-[var(--rv-text)] box-border ${className}`}
        style={{
          ...cssVars,
          width: '100%',
          fontFamily: 'var(--rv-font-body)',
          fontSize: 'var(--rv-font-size)',
          lineHeight: 'var(--rv-line-height)',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`resume-page bg-white text-[var(--rv-text)] shadow-xl print:shadow-none mx-auto box-border ${className}`}
      style={{
        ...cssVars,
        width: widthMm,
        minHeight: minHeightMm,
        padding: 'var(--rv-margin-mm)',
        fontFamily: 'var(--rv-font-body)',
        fontSize: 'var(--rv-font-size)',
        lineHeight: 'var(--rv-line-height)',
      }}
    >
      {children}
    </div>
  );
};
