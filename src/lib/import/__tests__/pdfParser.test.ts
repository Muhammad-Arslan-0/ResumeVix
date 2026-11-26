import { describe, expect, it } from 'vitest';
import { parseResumeTextHeuristic } from '../pdfParser';

describe('parseResumeTextHeuristic', () => {
  it('extracts profile, summary, experience, education, skills, and languages from sectionized CV text', () => {
    const sampleText = `Muhammad Arslan
Flutter Developer
m.arslan9052@gmail.com
(+92)304 4805793
PROFILE
Flutter Developer with 3+ years of experience building cross-platform mobile apps.
PROFESSIONAL EXPERIENCE
Flutter Developer, Devlynx Technology
- Developed and launched 8+ cross-platform mobile apps.
- Integrated Firebase services and Stripe payments.
EDUCATION
BS Computer Science, University Of Sahiwal
GPA: 3.50/4.0
SKILLS
Dart, Flutter, Firebase, Bloc, Provider
LANGUAGES
English — Professional Proficiency
Urdu — Native/Bilingual`;

    const parsed = parseResumeTextHeuristic(sampleText);

    expect(parsed.profile.fullName).toBe('Muhammad Arslan');
    expect(parsed.profile.headline).toBe('Flutter Developer');
    expect(parsed.profile.email).toBe('m.arslan9052@gmail.com');
    expect(parsed.summary).toContain('3+ years of experience');
    expect(parsed.experience.length).toBe(1);
    expect(parsed.experience[0].bullets.length).toBe(2);
    expect(parsed.education.length).toBe(1);
    expect(parsed.skills[0].items).toContain('Flutter');
    expect(parsed.customSections.custom_languages?.title).toBe('Languages');
  });
});
