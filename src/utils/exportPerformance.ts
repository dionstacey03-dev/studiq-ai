import { jsPDF } from 'jspdf';
import { DayOfWeek, StudyStoreState } from '../types/study';

export interface SubjectPerformanceRow {
  subject: string;
  studyMins: number;
  quizAvg: number | null;
  attemptsCount: number;
  deckMastered: number;
  deckCards: number;
  difficultCount: number;
}

export interface PerformanceExportPayload {
  state: StudyStoreState;
  totalMinutes: number;
  totalHours: string;
  avgQuizPct: number;
  completedTasks: number;
  totalCards: number;
  masteredCards: number;
  minutesByDay: Record<DayOfWeek, number>;
  subjectRows: SubjectPerformanceRow[];
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(escapeCsvCell).join(',');
}

function formatSourceLabel(source: string): string {
  if (source === 'sample') return 'Sample Data (Preloaded)';
  if (source === 'gemini') return 'Generated with Gemini';
  return 'User Entry';
}

export function exportPerformanceCsv(payload: PerformanceExportPayload): void {
  const {
    state,
    totalMinutes,
    totalHours,
    avgQuizPct,
    completedTasks,
    totalCards,
    masteredCards,
    minutesByDay,
    subjectRows,
  } = payload;

  const dateStamp = new Date().toISOString().slice(0, 10);
  const lines: string[] = [];

  lines.push(csvRow(['STUDIQ AI - Study Performance Report']));
  lines.push(csvRow(['Generated At', new Date().toISOString()]));
  lines.push(csvRow(['Student Name', state.profile.name]));
  lines.push(csvRow(['Major / Focus', state.profile.major]));
  lines.push(csvRow(['Institution', state.profile.institution]));
  lines.push(csvRow(['Academic Level', state.profile.academicLevel]));
  lines.push('');

  lines.push(csvRow(['OVERVIEW METRICS']));
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total Study Hours', totalHours]));
  lines.push(csvRow(['Total Study Minutes', totalMinutes]));
  lines.push(csvRow(['Recorded Study Sessions', state.sessions.length]));
  lines.push(csvRow(['Average Quiz Accuracy (%)', state.quizAttempts.length > 0 ? `${avgQuizPct}%` : 'N/A']));
  lines.push(csvRow(['Completed Quizzes', state.quizAttempts.length]));
  lines.push(csvRow(['Study Streak (Days)', state.profile.studyStreakDays]));
  lines.push(csvRow(['Weekly Hour Goal (Hours)', state.profile.weeklyGoalHours]));
  lines.push(csvRow(['Completed Planner Tasks', completedTasks]));
  lines.push(csvRow(['Flashcards Mastered', `${masteredCards} / ${totalCards}`]));
  lines.push('');

  lines.push(csvRow(['DAILY STUDY ACTIVITY (ACTIVE WEEK)']));
  lines.push(csvRow(['Day', 'Minutes Studied', 'Hours']));
  (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[]).forEach((day) => {
    const mins = minutesByDay[day] ?? 0;
    lines.push(csvRow([day, mins, (mins / 60).toFixed(2)]));
  });
  lines.push('');

  lines.push(csvRow(['SUBJECT-WISE PERFORMANCE']));
  lines.push(
    csvRow([
      'Subject',
      'Study Minutes',
      'Study Hours',
      'Quiz Average (%)',
      'Quiz Attempts',
      'Flashcards Mastered',
      'Total Flashcards',
      'Difficult Flashcards',
    ])
  );
  subjectRows.forEach((row) => {
    lines.push(
      csvRow([
        row.subject,
        row.studyMins,
        (row.studyMins / 60).toFixed(2),
        row.quizAvg !== null ? `${row.quizAvg}%` : 'N/A',
        row.attemptsCount,
        row.deckMastered,
        row.deckCards,
        row.difficultCount,
      ])
    );
  });
  lines.push('');

  lines.push(csvRow(['QUIZ ATTEMPT HISTORY']));
  lines.push(csvRow(['Quiz Title', 'Subject', 'Score', 'Total Questions', 'Percentage (%)', 'Completed At']));
  state.quizAttempts.forEach((att) => {
    lines.push(
      csvRow([
        att.quizTitle,
        att.subject,
        att.score,
        att.total,
        `${att.percentage}%`,
        att.completedAt,
      ])
    );
  });
  lines.push('');

  lines.push(csvRow(['STUDY SESSION LOG']));
  lines.push(csvRow(['Date', 'Day', 'Subject', 'Topic', 'Minutes', 'Source', 'Notes']));
  state.sessions.forEach((ses) => {
    lines.push(
      csvRow([
        ses.date,
        ses.day,
        ses.subject,
        ses.topic,
        ses.minutes,
        formatSourceLabel(ses.source),
        ses.notes ?? '',
      ])
    );
  });

  const csvContent = `\uFEFF${lines.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `studiq-study-performance-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPerformancePdf(payload: PerformanceExportPayload): void {
  const {
    state,
    totalMinutes,
    totalHours,
    avgQuizPct,
    completedTasks,
    totalCards,
    masteredCards,
    minutesByDay,
    subjectRows,
  } = payload;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2;
  let y = 44;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 48;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(16, 40, 58); // #10283A
    doc.text(title, marginX, y);
    y += 6;
    doc.setDrawColor(220, 233, 236); // #DCE9EC
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 14;
  };

  // Report Header Band
  doc.setFillColor(8, 127, 131); // #087F83
  doc.roundedRect(marginX, y, contentWidth, 68, 8, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('STUDIQ AI — Study Performance Report', marginX + 18, y + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(229, 240, 242);
  doc.text(
    `${state.profile.name}  ·  ${state.profile.major} (${state.profile.academicLevel})  ·  ${state.profile.institution}`,
    marginX + 18,
    y + 44
  );

  const dateLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const hasSampleOnly = state.sessions.every((s) => s.source === 'sample');
  doc.text(
    `Generated: ${dateLabel}  ·  ${hasSampleOnly ? 'Includes Preloaded Sample Data' : 'Includes Live Study Activity'}`,
    marginX + 18,
    y + 57
  );

  y += 88;

  // Overview KPI Cards (2x2 grid)
  drawSectionHeading('Overview Metrics');
  const kpis = [
    {
      label: 'Total Study Time',
      value: `${totalHours} hrs (${totalMinutes} min)`,
      detail: `${state.sessions.length} logged session${state.sessions.length === 1 ? '' : 's'}`,
    },
    {
      label: 'Quiz Accuracy',
      value: state.quizAttempts.length > 0 ? `${avgQuizPct}%` : 'N/A',
      detail: `${state.quizAttempts.length} completed quiz${state.quizAttempts.length === 1 ? '' : 'zes'}`,
    },
    {
      label: 'Streak & Weekly Goal',
      value: `${state.profile.studyStreakDays} day streak`,
      detail: `Target: ${state.profile.weeklyGoalHours} hrs/week (${Math.min(
        100,
        Math.round((totalMinutes / Math.max(1, state.profile.weeklyGoalHours * 60)) * 100)
      )}% reached)`,
    },
    {
      label: 'Tasks & Flashcard Mastery',
      value: `${masteredCards} / ${totalCards} mastered`,
      detail: `${completedTasks} planner task${completedTasks === 1 ? '' : 's'} completed`,
    },
  ];

  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 52;

  kpis.forEach((kpi, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cardX = marginX + col * (cardWidth + cardGap);
    const cardY = y + row * (cardHeight + 10);

    doc.setFillColor(241, 247, 248); // #F1F7F8
    doc.setDrawColor(220, 233, 236);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(82, 108, 123);
    doc.text(kpi.label, cardX + 12, cardY + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(16, 40, 58);
    doc.text(kpi.value, cardX + 12, cardY + 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 108, 123);
    doc.text(kpi.detail, cardX + 12, cardY + 44);
  });

  y += cardHeight * 2 + 28;

  // Weekly Daily Distribution
  drawSectionHeading('Daily Study Distribution (Mon–Sun)');
  const dayColWidth = contentWidth / 7;
  ensureSpace(44);
  (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as DayOfWeek[]).forEach((day, idx) => {
    const boxX = marginX + idx * dayColWidth;
    const mins = minutesByDay[day] ?? 0;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 233, 236);
    doc.roundedRect(boxX, y, dayColWidth - 6, 36, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(82, 108, 123);
    doc.text(day, boxX + 8, y + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(8, 127, 131);
    doc.text(`${mins}m`, boxX + 8, y + 28);
  });
  y += 54;

  // Subject-Wise Performance Table
  drawSectionHeading('Subject-Wise Performance');
  if (subjectRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(82, 108, 123);
    doc.text('No subject activity recorded yet.', marginX, y);
    y += 20;
  } else {
    ensureSpace(26);
    doc.setFillColor(229, 240, 242);
    doc.rect(marginX, y - 10, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 58);
    doc.text('Subject', marginX + 8, y + 3);
    doc.text('Study Time', marginX + 245, y + 3);
    doc.text('Quiz Avg', marginX + 340, y + 3);
    doc.text('Flashcards', marginX + 425, y + 3);
    y += 18;

    subjectRows.forEach((row) => {
      ensureSpace(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(16, 40, 58);
      doc.text(doc.splitTextToSize(row.subject, 225)[0] || row.subject, marginX + 8, y);
      doc.text(`${(row.studyMins / 60).toFixed(1)}h (${row.studyMins}m)`, marginX + 245, y);
      doc.text(row.quizAvg !== null ? `${row.quizAvg}%` : '—', marginX + 340, y);
      doc.text(
        row.deckCards > 0 ? `${row.deckMastered}/${row.deckCards} mastered` : '—',
        marginX + 425,
        y
      );
      y += 8;
      doc.setDrawColor(235, 242, 244);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 12;
    });
    y += 8;
  }

  // Quiz History Table
  if (state.quizAttempts.length > 0) {
    drawSectionHeading('Quiz Attempt History');
    ensureSpace(26);
    doc.setFillColor(229, 240, 242);
    doc.rect(marginX, y - 10, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 58);
    doc.text('Quiz Title', marginX + 8, y + 3);
    doc.text('Subject', marginX + 250, y + 3);
    doc.text('Score', marginX + 390, y + 3);
    doc.text('Date', marginX + 455, y + 3);
    y += 18;

    state.quizAttempts.slice(0, 15).forEach((att) => {
      ensureSpace(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(16, 40, 58);
      doc.text(doc.splitTextToSize(att.quizTitle, 232)[0] || att.quizTitle, marginX + 8, y);
      doc.text(doc.splitTextToSize(att.subject, 130)[0] || att.subject, marginX + 250, y);
      doc.text(`${att.score}/${att.total} (${att.percentage}%)`, marginX + 390, y);
      doc.text(att.completedAt.slice(0, 10), marginX + 455, y);
      y += 8;
      doc.setDrawColor(235, 242, 244);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 12;
    });
    y += 8;
  }

  // Study Session Log
  drawSectionHeading('Study Session Log');
  if (state.sessions.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(82, 108, 123);
    doc.text('No study sessions logged yet.', marginX, y);
  } else {
    ensureSpace(26);
    doc.setFillColor(229, 240, 242);
    doc.rect(marginX, y - 10, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 40, 58);
    doc.text('Topic', marginX + 8, y + 3);
    doc.text('Subject', marginX + 245, y + 3);
    doc.text('Duration', marginX + 380, y + 3);
    doc.text('Date', marginX + 450, y + 3);
    y += 18;

    state.sessions.slice(0, 25).forEach((ses) => {
      ensureSpace(22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(16, 40, 58);
      doc.text(doc.splitTextToSize(ses.topic, 228)[0] || ses.topic, marginX + 8, y);
      doc.text(doc.splitTextToSize(ses.subject, 125)[0] || ses.subject, marginX + 245, y);
      doc.text(`${ses.minutes} min`, marginX + 380, y);
      doc.text(ses.date, marginX + 450, y);
      y += 8;
      doc.setDrawColor(235, 242, 244);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 12;
    });
  }

  // Page Footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(82, 108, 123);
    doc.text(
      `STUDIQ AI · Think Deeper. Learn Faster. · Page ${i} of ${totalPages}`,
      marginX,
      pageHeight - 24
    );
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`studiq-study-performance-${dateStamp}.pdf`);
}
