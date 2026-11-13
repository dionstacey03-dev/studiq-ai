import React, { useEffect, useState } from 'react';
import {
  FileUp,
  Sparkles,
  Trash2,
  Search,
  Layers,
  CheckSquare,
  FileText,
  X,
  Copy,
  Check,
  Download,
  Bookmark,
  BookmarkCheck,
  Volume2,
  Pause,
  Loader2,
  Printer,
  Tag,
  LayoutTemplate,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { requestNotesSummary } from '../../services/aiClient';
import { StudyNoteSummary, StudyTag, SummaryTemplateId } from '../../types/study';
import { formatSummaryAsMarkdown } from '../../utils/studyFormatters';
import { TAG_COLOR_PALETTE } from '../../utils/tagColors';
import { getSummaryTemplate, SUMMARY_TEMPLATES } from '../../utils/summaryTemplates';
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  SourceAttribution,
  LoadingSkeleton,
} from '../ui/CommonUI';
import { TtsAudioBar, useTtsPlayer } from '../ui/TtsPlayer';
import { AssignItemTagsModal } from '../ui/TagManagerModals';
import {
  SummaryTemplatesModal,
  TemplateMiniWireframe,
} from '../ui/SummaryTemplatesModal';

const SAMPLE_LECTURE_EXCERPT = `Cellular Respiration & Oxidative Phosphorylation:
1. Glycolysis occurs in the cytosol, splitting one 6-carbon glucose into two 3-carbon pyruvate molecules with a net yield of 2 ATP and 2 NADH.
2. Pyruvate enters the mitochondrial matrix and is oxidized by the pyruvate dehydrogenase complex into acetyl-CoA, releasing CO2 and generating NADH.
3. The Citric Acid Cycle (Krebs Cycle) oxidizes acetyl-CoA, producing 3 NADH, 1 FADH2, and 1 GTP per acetyl group.
4. Along the inner mitochondrial membrane, Complexes I–IV transfer electrons from NADH and FADH2 to O2, pumping protons into the intermembrane space.
5. The resulting proton-motive force drives ATP synthase (chemiosmosis), yielding ~28–32 ATP per glucose.`;

export const SummarizerView: React.FC = () => {
  const {
    state,
    draft,
    clearDraft,
    addSummary,
    deleteSummary,
    addToReadLater,
    removeFromReadLater,
    openWithDraft,
  } = useStudy();

  const [subject, setSubject] = useState<string>(state.subjects[5] ?? state.subjects[0] ?? 'General Studies');
  const [selectedTemplateId, setSelectedTemplateId] = useState<SummaryTemplateId>('summary');
  const [notesText, setNotesText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    mimeType: string;
    base64?: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSummaryId, setSelectedSummaryId] = useState<string>(
    state.summaries[0]?.id ?? ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const tts = useTtsPlayer();

  const activeTemplate = getSummaryTemplate(selectedTemplateId);
  const format = activeTemplate.legacyFormat;

  useEffect(() => {
    if (draft && draft.targetModule === 'summarizer') {
      setSubject(draft.subject);
      setNotesText(draft.notes ?? draft.topic);
      clearDraft();
    }
  }, [draft, clearDraft]);

  const selectedSummary =
    state.summaries.find((s) => s.id === selectedSummaryId) ?? state.summaries[0] ?? null;

  useEffect(() => {
    tts.stop();
  }, [selectedSummary?.id]);

  const filteredSummaries = state.summaries.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.tldr.toLowerCase().includes(q)
    );
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);

    if (file.size > 10 * 1024 * 1024) {
      setError('Uploaded file exceeds 10 MB limit. Please upload a smaller study document.');
      return;
    }

    const isTextLike =
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv');

    const isSupportedBinary =
      file.type === 'application/pdf' ||
      file.type.startsWith('image/');

    if (!isTextLike && !isSupportedBinary) {
      setError(
        `Unsupported file type (${file.name}). Please upload .txt, .md, .csv, .pdf, or an image of your notes.`
      );
      return;
    }

    if (isTextLike) {
      try {
        const content = await file.text();
        if (!content.trim()) {
          setError('The uploaded text file is empty.');
          return;
        }
        setNotesText(content);
        setUploadedFile({ name: file.name, mimeType: file.type || 'text/plain' });
      } catch {
        setError('Could not read the uploaded text document.');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        setError('Document could not be encoded for summarization.');
        return;
      }
      setUploadedFile({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        base64,
      });
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesText.trim() && !uploadedFile?.base64) {
      setError('Paste study notes or upload a supported document before summarizing.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generated = await requestNotesSummary({
        content: notesText,
        fileName: uploadedFile?.name,
        fileMimeType: uploadedFile?.mimeType,
        fileBase64: uploadedFile?.base64,
        subject,
        format,
        templateId: selectedTemplateId,
      });

      const newSummary: StudyNoteSummary = {
        id: `sum-${Date.now()}`,
        title: generated.title,
        subject: generated.subject || subject,
        format,
        templateId: selectedTemplateId,
        tldr: generated.tldr,
        keyConcepts: generated.keyConcepts ?? [],
        sections: generated.sections ?? [],
        cuePairs: generated.cuePairs,
        keyTerms: generated.keyTerms ?? [],
        reviewQuestions: generated.reviewQuestions ?? [],
        rawSourcePreview: notesText
          ? notesText.slice(0, 140)
          : `Uploaded file: ${uploadedFile?.name}`,
        createdAt: new Date().toISOString(),
        source: 'gemini',
      };

      addSummary(newSummary);
      setSelectedSummaryId(newSummary.id);
      setNotesText('');
      setUploadedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarize study material.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = async (sum: StudyNoteSummary) => {
    try {
      await navigator.clipboard.writeText(formatSummaryAsMarkdown(sum));
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      setError('Clipboard copy failed.');
    }
  };

  const handleDownloadSummary = (sum: StudyNoteSummary) => {
    const markdown = formatSummaryAsMarkdown(sum);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sum.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="Notes Summarizer"
          subtitle="Paste text or upload supported documents (.txt, .md, .pdf, slide images) to generate concise summaries, detailed breakdowns, or revision notes."
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print-grid-reset">
        {/* Left Input + Saved Summaries */}
        <div className="xl:col-span-5 space-y-6 no-print">
          <form
            onSubmit={handleSummarize}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-[var(--text-main)]">
                New Study Summary
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSubject('Cell Biology');
                  setNotesText(SAMPLE_LECTURE_EXCERPT);
                }}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap cursor-pointer"
              >
                Load sample notes
              </button>
            </div>

            <div>
              <label htmlFor="sum-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Subject
              </label>
              <select
                id="sum-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Templates Library Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-main)]">
                  <LayoutTemplate className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Templates
                </span>
                <button
                  type="button"
                  onClick={() => setIsTemplatesOpen(true)}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Browse Templates ({SUMMARY_TEMPLATES.length})
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SUMMARY_TEMPLATES.slice(0, 3).map((tpl) => {
                  const active = selectedTemplateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      aria-pressed={active}
                      title={tpl.tagline}
                      className={`p-2 rounded-xl border text-left transition-colors cursor-pointer space-y-1.5 ${
                        active
                          ? 'border-[var(--color-primary)] bg-[var(--bg-subtle)]/70'
                          : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-subtle)]/40'
                      }`}
                    >
                      <TemplateMiniWireframe templateId={tpl.id} />
                      <div
                        className={`text-xs font-semibold truncate ${
                          active ? 'text-[var(--color-primary)]' : 'text-[var(--text-main)]'
                        }`}
                      >
                        {tpl.shortName}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] text-[var(--text-muted)]">
                <span>
                  Selected:{' '}
                  <strong className="text-[var(--text-main)]">{activeTemplate.name}</strong>
                </span>
                <div className="flex items-center gap-2">
                  {SUMMARY_TEMPLATES.slice(3).map((tpl) => {
                    const active = selectedTemplateId === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`font-medium transition-colors cursor-pointer ${
                          active
                            ? 'text-[var(--color-primary)] font-semibold underline underline-offset-2'
                            : 'hover:text-[var(--text-main)]'
                        }`}
                      >
                        {tpl.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="sum-notes" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Paste Study Notes
              </label>
              <textarea
                id="sum-notes"
                rows={6}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Paste lecture transcripts, textbook sections, or study notes..."
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-main)]">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-main)] hover:text-[var(--color-primary)] cursor-pointer">
                <FileUp className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Upload .txt, .md, .csv, .pdf, or image</span>
                <input
                  type="file"
                  accept=".txt,.md,.csv,.pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadedFile && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)]">
                  <span className="truncate max-w-[160px]">{uploadedFile.name}</span>
                  <button
                    type="button"
                    aria-label="Remove uploaded file"
                    onClick={() => setUploadedFile(null)}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Summarizing with Gemini...' : 'Generate Summary'}
            </button>
          </form>

          {/* Saved Summaries Library */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Saved Summaries</h2>
              <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                {filteredSummaries.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title or subject..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            {filteredSummaries.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                No summaries match your filter.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-color)] max-h-80 overflow-y-auto">
                {filteredSummaries.map((sum) => {
                  const isActive = selectedSummary?.id === sum.id;
                  return (
                    <li key={sum.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSummaryId(sum.id)}
                        className={`flex-1 text-left p-2 rounded-lg transition-colors min-w-0 cursor-pointer ${
                          isActive
                            ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)]'
                            : 'hover:bg-[var(--bg-subtle)]/50 text-[var(--text-main)]'
                        }`}
                      >
                        <div className="text-sm font-medium truncate">{sum.title}</div>
                        <SourceAttribution
                          source={sum.source}
                          subject={sum.subject}
                          timestamp={sum.createdAt}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${sum.title}`}
                        onClick={() => deleteSummary(sum.id)}
                        className="p-1.5 mt-1 text-[var(--text-muted)] hover:text-rose-500 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right Structured Reader */}
        <div className="xl:col-span-7">
          {loading ? (
            <LoadingSkeleton lines={8} />
          ) : !selectedSummary ? (
            <EmptyState
              icon={<FileText className="w-5 h-5" />}
              title="No summary selected"
              description="Select a saved summary or paste study material on the left to generate structured revision notes."
            />
          ) : (
            <article className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 sm:p-8 space-y-6 print-sheet">
              <header className="print-only-header">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                    STUDIQ AI · Notes Summary
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {selectedSummary.subject} ·{' '}
                    {selectedSummary.templateId
                      ? getSummaryTemplate(selectedSummary.templateId).name
                      : selectedSummary.format}
                  </div>
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">
                  Printed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </header>

              <div className="flex flex-col gap-4 pb-5 border-b border-[var(--border-color)]">
                <div className="space-y-1.5 min-w-0">
                  <SourceAttribution
                    source={selectedSummary.source}
                    subject={selectedSummary.subject}
                    extra={
                      selectedSummary.templateId
                        ? getSummaryTemplate(selectedSummary.templateId).name
                        : selectedSummary.format
                    }
                    timestamp={selectedSummary.createdAt}
                  />
                  <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] text-balance">
                    {selectedSummary.title}
                  </h2>
                  {(selectedSummary.tagIds ?? []).length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                      {(selectedSummary.tagIds ?? [])
                        .map((tid) => state.tags.find((t) => t.id === tid))
                        .filter((t): t is StudyTag => Boolean(t))
                        .map((tag) => {
                          const spec = TAG_COLOR_PALETTE[tag.color] ?? TAG_COLOR_PALETTE.teal;
                          return (
                            <span
                              key={tag.id}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium ${spec.textClass}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${spec.dotClass}`}
                                aria-hidden="true"
                              />
                              {tag.name}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Action Bar: Copy, Download, Tags, Read Later, Listen, Print, Flashcards, Quiz */}
                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopySummary(selectedSummary)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedSummary ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadSummary(selectedSummary)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Download .md
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Tags
                  </button>
                  {(() => {
                    const savedBookmark = state.readLater.find(
                      (r) => r.originId === selectedSummary.id
                    );
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (savedBookmark) {
                            removeFromReadLater(savedBookmark.id);
                          } else {
                            addToReadLater({
                              title: selectedSummary.title,
                              subject: selectedSummary.subject,
                              origin: 'summarizer',
                              originId: selectedSummary.id,
                              content: formatSummaryAsMarkdown(selectedSummary),
                              source: selectedSummary.source,
                              tagIds: selectedSummary.tagIds,
                            });
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          savedBookmark
                            ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/40 font-semibold'
                            : 'text-[var(--text-main)] bg-[var(--bg-main)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        {savedBookmark ? (
                          <>
                            <BookmarkCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            Saved to Read Later
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            Read Later
                          </>
                        )}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() =>
                      tts.toggleListen({
                        id: selectedSummary.id,
                        text: formatSummaryAsMarkdown(selectedSummary),
                        contextLabel: selectedSummary.subject,
                      })
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      tts.activeId === selectedSummary.id || tts.loadingId === selectedSummary.id
                        ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/40 font-semibold'
                        : 'text-[var(--text-main)] bg-[var(--bg-main)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {tts.loadingId === selectedSummary.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary)]" />
                        Generating audio...
                      </>
                    ) : tts.activeId === selectedSummary.id && tts.isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        {tts.activeId === selectedSummary.id ? 'Resume' : 'Listen'}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openWithDraft({
                        targetModule: 'flashcards',
                        topic: selectedSummary.title,
                        subject: selectedSummary.subject,
                        notes: formatSummaryAsMarkdown(selectedSummary),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Make Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openWithDraft({
                        targetModule: 'quiz',
                        topic: selectedSummary.title,
                        subject: selectedSummary.subject,
                        notes: formatSummaryAsMarkdown(selectedSummary),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Quiz from Notes
                  </button>
                </div>

                {(tts.loadingId === selectedSummary.id || tts.activeId === selectedSummary.id) && (
                  <div className="no-print">
                    <TtsAudioBar
                      isPlaying={tts.isPlaying}
                      isLoading={tts.loadingId === selectedSummary.id}
                      currentTime={tts.currentTime}
                      duration={tts.duration}
                      playbackRate={tts.playbackRate}
                      voiceName={tts.voiceName}
                      label={`Listening · ${selectedSummary.title}`}
                      onTogglePlay={() =>
                        tts.toggleListen({
                          id: selectedSummary.id,
                          text: formatSummaryAsMarkdown(selectedSummary),
                          contextLabel: selectedSummary.subject,
                        })
                      }
                      onStop={tts.stop}
                      onSeek={tts.seek}
                      onChangeRate={tts.changeRate}
                      onChangeVoice={(nextVoice) =>
                        tts.changeVoice(nextVoice, {
                          id: selectedSummary.id,
                          text: formatSummaryAsMarkdown(selectedSummary),
                          contextLabel: selectedSummary.subject,
                        })
                      }
                    />
                  </div>
                )}

                {tts.error && (
                  <div className="no-print">
                    <ErrorBanner message={tts.error} onDismiss={tts.clearError} />
                  </div>
                )}
              </div>

              {selectedSummary.templateId === 'cornell' ? (
                /* Cornell 2-Column Cue/Notes + Bottom Summary Layout */
                <div className="space-y-5">
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden">
                    <div className="hidden md:grid md:grid-cols-12 bg-[var(--bg-subtle)]/70 border-b border-[var(--border-color)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      <div className="md:col-span-4 px-4 py-2.5 border-r border-[var(--border-color)]">
                        Cues &amp; Recall Questions
                      </div>
                      <div className="md:col-span-8 px-4 py-2.5">
                        Lecture &amp; Study Notes
                      </div>
                    </div>
                    <div className="divide-y divide-[var(--border-color)]">
                      {(selectedSummary.cuePairs && selectedSummary.cuePairs.length > 0
                        ? selectedSummary.cuePairs
                        : selectedSummary.sections.map((sec) => ({
                            cue: sec.heading,
                            notes: sec.points.join(' '),
                          }))
                      ).map((row, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-12 print-avoid-break"
                        >
                          <div className="md:col-span-4 p-4 bg-[var(--bg-subtle)]/35 border-b md:border-b-0 md:border-r border-[var(--border-color)]">
                            <div className="text-xs font-semibold text-[var(--color-primary)] md:hidden mb-1">
                              Cue
                            </div>
                            <p className="text-sm font-semibold text-[var(--text-main)] leading-snug">
                              {row.cue}
                            </p>
                          </div>
                          <div className="md:col-span-8 p-4 bg-[var(--bg-main)]">
                            <p className="text-sm text-[var(--text-main)] leading-relaxed">
                              {row.notes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-color)] print-avoid-break">
                    <h3 className="text-xs font-semibold text-[var(--color-primary)] mb-1">
                      Cornell Bottom Summary
                    </h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">
                      {selectedSummary.tldr}
                    </p>
                  </div>
                </div>
              ) : selectedSummary.templateId === 'outline' ? (
                /* Hierarchical Outline Layout */
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-color)] print-avoid-break">
                    <h3 className="text-xs font-semibold text-[var(--color-primary)] mb-1">
                      Topic Overview
                    </h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">
                      {selectedSummary.tldr}
                    </p>
                  </div>

                  {selectedSummary.sections.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[var(--text-main)]">
                        Hierarchical Outline
                      </h3>
                      <ol className="space-y-4">
                        {selectedSummary.sections.map((section, idx) => {
                          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][idx] ?? `${idx + 1}`;
                          const hasPrefix = /^[IVX]+\.|^\d+\./.test(section.heading.trim());
                          return (
                            <li
                              key={idx}
                              className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] print-avoid-break"
                            >
                              <h4 className="text-sm font-semibold text-[var(--text-main)] mb-2.5 flex items-baseline gap-2">
                                {!hasPrefix && (
                                  <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                                    {roman}.
                                  </span>
                                )}
                                <span>{section.heading}</span>
                              </h4>
                              <ol className="space-y-1.5 pl-4 border-l border-[var(--border-color)] ml-1.5">
                                {section.points.map((pt, pIdx) => (
                                  <li
                                    key={pIdx}
                                    className="text-sm text-[var(--text-muted)] leading-relaxed flex items-baseline gap-2"
                                  >
                                    <span className="font-mono text-xs text-[var(--text-main)] shrink-0">
                                      {String.fromCharCode(65 + (pIdx % 26))}.
                                    </span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ol>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}

                  {selectedSummary.keyConcepts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2.5">
                        Key Takeaways
                      </h3>
                      <ul className="space-y-2 list-disc pl-5 text-sm text-[var(--text-main)]">
                        {selectedSummary.keyConcepts.map((concept, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {concept}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Summary / Revision / Comparison Layout */
                <>
                  <div className="p-4 rounded-xl bg-[var(--bg-subtle)]/70 border border-[var(--border-color)] print-avoid-break">
                    <h3 className="text-xs font-semibold text-[var(--color-primary)] mb-1">
                      Overview
                    </h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">
                      {selectedSummary.tldr}
                    </p>
                  </div>

                  {selectedSummary.keyConcepts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2.5">
                        Key Points
                      </h3>
                      <ul className="space-y-2 list-disc pl-5 text-sm text-[var(--text-main)]">
                        {selectedSummary.keyConcepts.map((concept, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {concept}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedSummary.sections.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-[var(--text-main)]">
                        {selectedSummary.templateId === 'compare'
                          ? 'Comparison Breakdown'
                          : 'Organized Breakdown'}
                      </h3>
                      <div
                        className={
                          selectedSummary.templateId === 'compare'
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                            : 'divide-y divide-[var(--border-color)] border-t border-[var(--border-color)]'
                        }
                      >
                        {selectedSummary.sections.map((section, idx) => (
                          <div
                            key={idx}
                            className={
                              selectedSummary.templateId === 'compare'
                                ? 'p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] print-avoid-break'
                                : 'py-4 first:pt-3 last:pb-0 print-avoid-break'
                            }
                          >
                            <h4 className="text-sm font-semibold text-[var(--text-main)] mb-2">
                              {section.heading}
                            </h4>
                            <ul className="space-y-1.5 list-disc pl-5 text-sm text-[var(--text-muted)]">
                              {section.points.map((pt, pIdx) => (
                                <li key={pIdx} className="leading-relaxed">
                                  {pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedSummary.keyTerms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2.5">
                    Important Definitions
                  </h3>
                  <dl className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                    {selectedSummary.keyTerms.map((kt, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[var(--bg-main)] grid grid-cols-1 sm:grid-cols-3 gap-2 print-avoid-break"
                      >
                        <dt className="text-sm font-semibold text-[var(--text-main)]">{kt.term}</dt>
                        <dd className="sm:col-span-2 text-sm text-[var(--text-muted)] leading-relaxed">
                          {kt.definition}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {selectedSummary.reviewQuestions.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-color)]">
                  <h3 className="text-sm font-semibold text-[var(--text-main)] mb-2.5">
                    Revision Questions
                  </h3>
                  <ol className="space-y-2 list-decimal pl-5 text-sm text-[var(--text-muted)]">
                    {selectedSummary.reviewQuestions.map((q, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {q}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
          )}
        </div>
      </div>

      <SummaryTemplatesModal
        isOpen={isTemplatesOpen}
        selectedId={selectedTemplateId}
        onSelect={(tpl) => setSelectedTemplateId(tpl.id)}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <AssignItemTagsModal
        target={
          isTagModalOpen && selectedSummary
            ? {
                collection: 'summaries',
                id: selectedSummary.id,
                title: selectedSummary.title,
                tagIds: selectedSummary.tagIds ?? [],
              }
            : null
        }
        onClose={() => setIsTagModalOpen(false)}
      />
    </div>
  );
};
