import { StudyNoteSummary, SummaryTemplateId } from '../types/study';

export interface SummaryTemplateDefinition {
  id: SummaryTemplateId;
  name: string;
  shortName: string;
  legacyFormat: StudyNoteSummary['format'];
  tagline: string;
  bestFor: string;
  structureIncludes: string[];
}

export const SUMMARY_TEMPLATES: SummaryTemplateDefinition[] = [
  {
    id: 'cornell',
    name: 'Cornell Notes',
    shortName: 'Cornell',
    legacyFormat: 'Detailed Summary',
    tagline: 'Cue questions on the left, structured lecture notes on the right, and a synthesis footer.',
    bestFor: 'Active recall lectures, textbook chapters, and exam prep.',
    structureIncludes: ['Cue / Question Column', 'Detailed Notes Column', 'Bottom Synthesis Summary', 'Key Definitions'],
  },
  {
    id: 'outline',
    name: 'Hierarchical Outline',
    shortName: 'Outline',
    legacyFormat: 'Detailed Summary',
    tagline: 'Roman-numeral hierarchy organizing main topics, sub-points, and supporting evidence.',
    bestFor: 'Dense multi-topic lectures, research papers, and syllabus breakdowns.',
    structureIncludes: ['Brief Overview', 'Nested Topic Hierarchy', 'Core Concepts', 'Review Prompts'],
  },
  {
    id: 'summary',
    name: 'Executive Summary',
    shortName: 'Summary',
    legacyFormat: 'Concise Summary',
    tagline: 'Tight high-yield distillation of core takeaways, essential terms, and synthesis.',
    bestFor: 'Quick pre-class catch-up, rapid review, and executive takeaways.',
    structureIncludes: ['2–3 Sentence Overview', 'High-Yield Takeaways', 'Concise Breakdown', 'Glossary Terms'],
  },
  {
    id: 'revision',
    name: 'Exam Revision Sheet',
    shortName: 'Revision',
    legacyFormat: 'Revision Notes',
    tagline: 'Focused exam cram sheet highlighting formulas, definitions, traps, and self-test questions.',
    bestFor: 'Midterm and final exam review sessions.',
    structureIncludes: ['Exam Takeaways', 'Formulas & Rules', 'Key Definitions', 'Practice Self-Check'],
  },
  {
    id: 'compare',
    name: 'Concept Comparison',
    shortName: 'Compare',
    legacyFormat: 'Detailed Summary',
    tagline: 'Contrasts competing theories, mechanisms, or models side by side across shared criteria.',
    bestFor: 'Mechanism comparisons (e.g., SN1 vs. SN2, Mitosis vs. Meiosis, IS-LM models).',
    structureIncludes: ['Comparison Overview', 'Criteria-by-Criteria Sections', 'Distinctions & Edge Cases', 'Check Questions'],
  },
];

export function getSummaryTemplate(id?: SummaryTemplateId): SummaryTemplateDefinition {
  return SUMMARY_TEMPLATES.find((t) => t.id === id) ?? SUMMARY_TEMPLATES[2];
}
