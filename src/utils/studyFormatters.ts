import { StudyNoteSummary } from '../types/study';

export function estimateReadingMinutes(content: string): number {
  const words = content
    .replace(/[#*`>_~-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function formatSummaryAsMarkdown(sum: StudyNoteSummary): string {
  const templateLabel =
    sum.templateId === 'cornell'
      ? 'Cornell Notes'
      : sum.templateId === 'outline'
        ? 'Hierarchical Outline'
        : sum.templateId === 'revision'
          ? 'Exam Revision Sheet'
          : sum.templateId === 'compare'
            ? 'Concept Comparison'
            : sum.format;

  const lines: string[] = [
    `# ${sum.title}`,
    `Subject: ${sum.subject} | Template: ${templateLabel}`,
    '',
  ];

  if (sum.templateId === 'cornell' && sum.cuePairs && sum.cuePairs.length > 0) {
    lines.push('## Cornell Notes (Cue | Notes)', '');
    sum.cuePairs.forEach((pair) => {
      lines.push(`### ${pair.cue}`, pair.notes, '');
    });
    lines.push('## Bottom Summary', sum.tldr, '');
  } else {
    lines.push('## Summary Overview', sum.tldr, '');
    if (sum.keyConcepts.length > 0) {
      lines.push('## Key Points', ...sum.keyConcepts.map((c) => `- ${c}`), '');
    }
    sum.sections.forEach((sec) => {
      lines.push(`## ${sec.heading}`, ...sec.points.map((p) => `- ${p}`), '');
    });
  }

  if (sum.keyTerms.length > 0) {
    lines.push(
      '## Important Definitions',
      ...sum.keyTerms.map((kt) => `- **${kt.term}**: ${kt.definition}`),
      ''
    );
  }
  if (sum.reviewQuestions.length > 0) {
    lines.push(
      '## Revision Questions',
      ...sum.reviewQuestions.map((q, i) => `${i + 1}. ${q}`)
    );
  }
  return lines.join('\n');
}

export function prepareTextForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\|\s*[-:\s|]+\|\s*$/gm, '')
    .replace(/\|/g, ', ')
    .replace(/[*_~>#]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

