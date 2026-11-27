import { describe, expect, it } from 'vitest';
import { parseResumeTextHeuristic } from '../pdfParser';

describe('parseResumeTextHeuristic', () => {
  it('extracts profile, links, multiple experiences, education, skills, multiple projects, and languages', () => {
    const sampleText = `Muhammad Arslan
Flutter Developer
m.arslan9052@gmail.com (+92)304 4805793 Lahore, Pakistan
portfolio-89dbb.web.app
PROFILE
Flutter Developer with 3+ years of experience building cross-platform mobile apps.
PROFESSIONAL EXPERIENCE
2024/01 – 2026/07
Lahore - Model Town, Pakistan
Flutter Developer, Devlynx Technology
- Developed and launched 8+ cross-platform mobile apps
from scratch for Android and iOS.
- Integrated Firebase services and Stripe payments.
2023/07 – 2024/01
Lahore, Pakistan
Flutter Developer, Soloinsight Inc
- Implemented offline-first architecture using SQLite.
EDUCATION
2018 – 2022
Sahiwal, Pakistan
BS Computer Science, University Of Sahiwal
GPA: 3.50/4.0
SKILLS
Dart, Flutter, Firebase, Bloc, Provider
PROJECTS
* LeafWise
LeafWise is an AI-powered plant identification app.
* NesmasPoint
NesmasPoint helps SMB owners manage operations.
* Ermol Learner
Ermol simplifies driving lesson booking.
LANGUAGES
English — Professional Proficiency
Urdu — Native/Bilingual`;

    const parsed = parseResumeTextHeuristic(sampleText, [
      'https://linkedin.com/in/muhammad-arslan-758490248',
      'https://github.com/Muhammad-Arslan-0',
    ]);

    expect(parsed.profile.fullName).toBe('Muhammad Arslan');
    expect(parsed.profile.headline).toBe('Flutter Developer');
    expect(parsed.profile.email).toBe('m.arslan9052@gmail.com');
    expect(parsed.profile.website).toBe('portfolio-89dbb.web.app');
    expect(parsed.profile.linkedin).toContain('linkedin.com/in/muhammad-arslan-758490248');
    expect(parsed.profile.github).toContain('github.com/Muhammad-Arslan-0');
    expect(parsed.profile.location).toBe('Lahore, Pakistan');
    expect(parsed.experience.length).toBe(2);
    expect(parsed.experience[0].bullets[0]).toContain('from scratch for Android and iOS.');
    expect(parsed.education[0].gpa).toBe('3.50/4.0');
    expect(parsed.projects.length).toBe(3);
    expect(parsed.projects.map((p) => p.name)).toEqual([
      'LeafWise',
      'NesmasPoint',
      'Ermol Learner',
    ]);
    expect(parsed.skills[0].items).toContain('Flutter');
    expect(parsed.languages?.length).toBe(2);
    expect(parsed.languages?.[0]).toMatchObject({
      language: 'English',
      level: 'Professional Proficiency',
    });
  });
});
