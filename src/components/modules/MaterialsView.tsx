import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  FileText,
  CheckSquare,
  Layers,
  BookOpen,
  ArrowUpRight,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Tag,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ReadLaterItem, StudyDocument, StudyTag, TaggableCollection } from '../../types/study';
import { formatSummaryAsMarkdown } from '../../utils/studyFormatters';
import { getSummaryTemplate } from '../../utils/summaryTemplates';
import { TAG_COLOR_PALETTE } from '../../utils/tagColors';
import { PageHeader, EmptyState, SourceAttribution, Modal } from '../ui/CommonUI';
import {
  AssignItemTagsModal,
  ManageTagsModal,
  TagSelectorInline,
} from '../ui/TagManagerModals';

type MaterialTypeFilter =
  | 'all'
  | 'documents'
  | 'summaries'
  | 'quizzes'
  | 'flashcards'
  | 'readLater';

export const MaterialsView: React.FC = () => {
  const {
    state,
    focusMode,
    setFocusMode,
    activeReadLaterId,
    setActiveReadLaterId,
    materialsInitialTab,
    setMaterialsInitialTab,
    setActiveModule,
    openWithDraft,
    addDocument,
    updateDocument,
    deleteDocument,
    deleteSummary,
    deleteQuiz,
    deleteDeck,
    addToReadLater,
    toggleReadLaterStatus,
    removeFromReadLater,
    openReadLaterInFocus,
  } = useStudy();

  const [typeFilter, setTypeFilter] = useState<MaterialTypeFilter>(materialsInitialTab);
  const [readLaterStatusFilter, setReadLaterStatusFilter] = useState<'all' | 'unread' | 'completed'>('unread');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagCategoryFilter, setTagCategoryFilter] = useState<'all' | 'subject' | 'project'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tag Modals
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [assignTagTarget, setAssignTagTarget] = useState<{
    collection: TaggableCollection;
    id: string;
    title: string;
    tagIds: string[];
  } | null>(null);

  // Document Editor / Viewer Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<StudyDocument | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docSubject, setDocSubject] = useState(state.subjects[0] ?? 'General Studies');
  const [docType, setDocType] = useState<StudyDocument['docType']>('Lecture Note');
  const [docContent, setDocContent] = useState('');
  const [docTagIds, setDocTagIds] = useState<string[]>([]);

  useEffect(() => {
    setTypeFilter(materialsInitialTab);
  }, [materialsInitialTab]);

  useEffect(() => {
    if (activeReadLaterId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeReadLaterId]);

  const activeReadLaterItem = useMemo(
    () => state.readLater.find((r) => r.id === activeReadLaterId) ?? null,
    [state.readLater, activeReadLaterId]
  );

  const unreadReadLaterCount = useMemo(
    () => state.readLater.filter((r) => r.status === 'unread').length,
    [state.readLater]
  );

  const handleTabChange = (tab: MaterialTypeFilter) => {
    setTypeFilter(tab);
    setMaterialsInitialTab(tab);
    if (activeReadLaterId) {
      setActiveReadLaterId(null);
    }
  };

  const tagMap = useMemo(() => {
    return new Map<string, StudyTag>(state.tags.map((t) => [t.id, t]));
  }, [state.tags]);

  // Remove stale tag filter selections if a tag was deleted
  useEffect(() => {
    setSelectedTagIds((prev) => prev.filter((id) => tagMap.has(id)));
  }, [tagMap]);

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const resetAllFilters = () => {
    setSubjectFilter('all');
    setSelectedTagIds([]);
    setSearchQuery('');
  };

  const hasActiveFilters =
    subjectFilter !== 'all' || selectedTagIds.length > 0 || searchQuery.trim().length > 0;

  const openCreateDoc = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocSubject(state.subjects[0] ?? 'General Studies');
    setDocType('Lecture Note');
    setDocContent('');
    setDocTagIds([]);
    setIsDocModalOpen(true);
  };

  const openEditDoc = (doc: StudyDocument) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocSubject(doc.subject);
    setDocType(doc.docType);
    setDocContent(doc.content);
    setDocTagIds(doc.tagIds ?? []);
    setIsDocModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;
    if (editingDoc) {
      updateDocument({
        ...editingDoc,
        title: docTitle.trim(),
        subject: docSubject,
        docType,
        content: docContent.trim(),
        tagIds: docTagIds,
      });
    } else {
      addDocument({
        title: docTitle.trim(),
        subject: docSubject,
        docType,
        content: docContent.trim(),
        source: 'user',
        tagIds: docTagIds,
      });
    }
    setIsDocModalOpen(false);
  };

  const tagUsageInScope = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (ids?: string[]) => {
      ids?.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    };
    if (typeFilter === 'readLater') {
      state.readLater.forEach((r) => {
        if (readLaterStatusFilter === 'all' || r.status === readLaterStatusFilter) {
          bump(r.tagIds);
        }
      });
      return counts;
    }
    if (typeFilter === 'all' || typeFilter === 'documents') state.documents.forEach((d) => bump(d.tagIds));
    if (typeFilter === 'all' || typeFilter === 'summaries') state.summaries.forEach((s) => bump(s.tagIds));
    if (typeFilter === 'all' || typeFilter === 'quizzes') state.quizzes.forEach((q) => bump(q.tagIds));
    if (typeFilter === 'all' || typeFilter === 'flashcards') state.decks.forEach((d) => bump(d.tagIds));
    return counts;
  }, [state, typeFilter, readLaterStatusFilter]);

  const visibleFilterTags = useMemo(() => {
    return state.tags.filter(
      (t) => tagCategoryFilter === 'all' || t.category === tagCategoryFilter
    );
  }, [state.tags, tagCategoryFilter]);

  const unifiedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = (
      title: string,
      subject: string,
      body = '',
      tagIds: string[] = []
    ) => {
      if (subjectFilter !== 'all' && subject !== subjectFilter) return false;
      if (
        selectedTagIds.length > 0 &&
        !selectedTagIds.every((tid) => tagIds.includes(tid))
      ) {
        return false;
      }
      if (!q) return true;
      const matchesTagName = tagIds.some((tid) =>
        tagMap.get(tid)?.name.toLowerCase().includes(q)
      );
      return (
        matchesTagName ||
        title.toLowerCase().includes(q) ||
        subject.toLowerCase().includes(q) ||
        body.toLowerCase().includes(q)
      );
    };

    const list: Array<{
      id: string;
      kind: Exclude<MaterialTypeFilter, 'all'>;
      title: string;
      subject: string;
      preview: string;
      meta: string;
      source: 'sample' | 'gemini' | 'user';
      createdAt: string;
      tagIds: string[];
      rawDoc?: StudyDocument;
      rawReadLater?: ReadLaterItem;
      markdownContent?: string;
    }> = [];

    if (typeFilter === 'readLater') {
      state.readLater.forEach((item) => {
        if (readLaterStatusFilter !== 'all' && item.status !== readLaterStatusFilter) return;
        const itemTagIds = item.tagIds ?? [];
        if (matchesSearch(item.title, item.subject, item.content, itemTagIds)) {
          const originLabel =
            item.origin === 'assistant'
              ? 'AI Assistant'
              : item.origin === 'summarizer'
              ? 'Notes Summarizer'
              : 'Study Materials';
          list.push({
            id: item.id,
            kind: 'readLater',
            title: item.title,
            subject: item.subject,
            preview: item.content.replace(/[#*`>_~-]/g, '').trim().slice(0, 160),
            meta: `${originLabel} · ~${item.estimatedMinutes} min read`,
            source: item.source,
            createdAt: item.savedAt,
            tagIds: itemTagIds,
            rawReadLater: item,
          });
        }
      });
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (typeFilter === 'all' || typeFilter === 'documents') {
      state.documents.forEach((doc) => {
        const itemTagIds = doc.tagIds ?? [];
        if (matchesSearch(doc.title, doc.subject, doc.content, itemTagIds)) {
          list.push({
            id: doc.id,
            kind: 'documents',
            title: doc.title,
            subject: doc.subject,
            preview: doc.content.slice(0, 140),
            meta: doc.docType,
            source: doc.source,
            createdAt: doc.updatedAt,
            tagIds: itemTagIds,
            rawDoc: doc,
            markdownContent: doc.content,
          });
        }
      });
    }

    if (typeFilter === 'all' || typeFilter === 'summaries') {
      state.summaries.forEach((s) => {
        const itemTagIds = s.tagIds ?? [];
        if (matchesSearch(s.title, s.subject, s.tldr, itemTagIds)) {
          list.push({
            id: s.id,
            kind: 'summaries',
            title: s.title,
            subject: s.subject,
            preview: s.tldr,
            meta: s.templateId ? getSummaryTemplate(s.templateId).name : s.format,
            source: s.source,
            createdAt: s.createdAt,
            tagIds: itemTagIds,
            markdownContent: formatSummaryAsMarkdown(s),
          });
        }
      });
    }

    if (typeFilter === 'all' || typeFilter === 'quizzes') {
      state.quizzes.forEach((quiz) => {
        const itemTagIds = quiz.tagIds ?? [];
        if (matchesSearch(quiz.title, quiz.subject, '', itemTagIds)) {
          list.push({
            id: quiz.id,
            kind: 'quizzes',
            title: quiz.title,
            subject: quiz.subject,
            preview: `${quiz.questions.length} questions · ${quiz.difficulty} (${quiz.questionType})`,
            meta: 'Quiz',
            source: quiz.source,
            createdAt: quiz.createdAt,
            tagIds: itemTagIds,
          });
        }
      });
    }

    if (typeFilter === 'all' || typeFilter === 'flashcards') {
      state.decks.forEach((deck) => {
        const itemTagIds = deck.tagIds ?? [];
        if (matchesSearch(deck.title, deck.subject, '', itemTagIds)) {
          const mastered = deck.cards.filter((c) => c.mastery === 'mastered').length;
          list.push({
            id: deck.id,
            kind: 'flashcards',
            title: deck.title,
            subject: deck.subject,
            preview: `${deck.cards.length} cards · ${mastered} completed`,
            meta: 'Flashcard Collection',
            source: deck.source,
            createdAt: deck.createdAt,
            tagIds: itemTagIds,
          });
        }
      });
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, typeFilter, readLaterStatusFilter, subjectFilter, selectedTagIds, searchQuery, tagMap]);

  const handleDeleteItem = (kind: Exclude<MaterialTypeFilter, 'all'>, id: string) => {
    if (kind === 'documents') deleteDocument(id);
    if (kind === 'summaries') deleteSummary(id);
    if (kind === 'quizzes') deleteQuiz(id);
    if (kind === 'flashcards') deleteDeck(id);
    if (kind === 'readLater') removeFromReadLater(id);
  };

  // Distraction-Free Long-Form Reader View for an opened Read Later item
  if (activeReadLaterItem) {
    const originLabel =
      activeReadLaterItem.origin === 'assistant'
        ? 'AI Study Assistant'
        : activeReadLaterItem.origin === 'summarizer'
        ? 'Notes Summarizer'
        : 'Study Materials';

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveReadLaterId(null);
              setMaterialsInitialTab('readLater');
              setTypeFilter('readLater');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Read Later Queue
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setAssignTagTarget({
                  collection: 'readLater',
                  id: activeReadLaterItem.id,
                  title: activeReadLaterItem.title,
                  tagIds: activeReadLaterItem.tagIds ?? [],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              Tags
            </button>

            <button
              type="button"
              onClick={() => toggleReadLaterStatus(activeReadLaterItem.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeReadLaterItem.status === 'completed'
                  ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/40'
                  : 'bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {activeReadLaterItem.status === 'completed' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  Mark as Read
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {focusMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit Focus
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  Enter Focus Mode
                </>
              )}
            </button>

            <button
              type="button"
              aria-label={`Remove ${activeReadLaterItem.title} from Read Later`}
              onClick={() => removeFromReadLater(activeReadLaterItem.id)}
              className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <article className="max-w-3xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-10 space-y-6 shadow-sm">
          <header className="space-y-3 pb-6 border-b border-[var(--border-color)]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--text-muted)]">
              <SourceAttribution
                source={activeReadLaterItem.source}
                subject={activeReadLaterItem.subject}
                extra={originLabel}
                timestamp={activeReadLaterItem.savedAt}
              />
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                ~{activeReadLaterItem.estimatedMinutes} min read
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] leading-snug">
              {activeReadLaterItem.title}
            </h1>
            {(activeReadLaterItem.tagIds ?? []).length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                {(activeReadLaterItem.tagIds ?? [])
                  .map((id) => tagMap.get(id))
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
          </header>

          <div className="study-prose text-base">
            <ReactMarkdown>{activeReadLaterItem.content}</ReactMarkdown>
          </div>

          <footer className="pt-6 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-[var(--text-muted)]">
              {activeReadLaterItem.status === 'completed'
                ? 'Marked as completed. Reopen anytime from Read Later.'
                : 'Finished reviewing this material in Focus Mode?'}
            </span>
            <div className="flex items-center gap-2">
              {activeReadLaterItem.status === 'unread' && (
                <button
                  type="button"
                  onClick={() => {
                    toggleReadLaterStatus(activeReadLaterItem.id);
                    setActiveReadLaterId(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Completed & Return
                </button>
              )}
            </div>
          </footer>
        </article>

        <ManageTagsModal isOpen={isManageTagsOpen} onClose={() => setIsManageTagsOpen(false)} />
        <AssignItemTagsModal target={assignTagTarget} onClose={() => setAssignTagTarget(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Study Materials"
        subtitle="Central library for your lecture notes, documents, AI summaries, quizzes, flashcard collections, and Read Later bookmarks."
        action={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsManageTagsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Tag className="w-4 h-4 text-[var(--color-primary)]" />
              Manage Tags
            </button>
            <button
              type="button"
              onClick={openCreateDoc}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Note / Document
            </button>
          </div>
        }
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
            {(
              [
                { id: 'all', label: 'All Materials' },
                {
                  id: 'readLater',
                  label:
                    unreadReadLaterCount > 0 ? `Read Later (${unreadReadLaterCount})` : 'Read Later',
                },
                { id: 'documents', label: 'Notes & Docs' },
                { id: 'summaries', label: 'AI Summaries' },
                { id: 'quizzes', label: 'Quizzes' },
                { id: 'flashcards', label: 'Flashcards' },
              ] as Array<{ id: MaterialTypeFilter; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              aria-label="Filter by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="all">All Subjects</option>
              {state.subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Color-Coded Tag Filter Strip */}
        <div className="pt-3 border-t border-[var(--border-color)] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-main)]">
                <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Tags
              </span>
              <div className="inline-flex items-center gap-0.5 p-0.5 bg-[var(--bg-subtle)] rounded-md">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'subject', label: 'Subject' },
                    { id: 'project', label: 'Project' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTagCategoryFilter(cat.id)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                      tagCategoryFilter === cat.id
                        ? 'bg-[var(--bg-card)] text-[var(--text-main)] font-semibold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedTagIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap cursor-pointer"
              >
                Clear tag filter ({selectedTagIds.length})
              </button>
            )}
          </div>

          {visibleFilterTags.length === 0 ? (
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
              <span>No tags in this category yet.</span>
              <button
                type="button"
                onClick={() => setIsManageTagsOpen(true)}
                className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
              >
                Create tag
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTagIds([])}
                aria-pressed={selectedTagIds.length === 0}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedTagIds.length === 0
                    ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/40 font-semibold'
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                }`}
              >
                All Tags
              </button>

              {visibleFilterTags.map((tag) => {
                const spec = TAG_COLOR_PALETTE[tag.color] ?? TAG_COLOR_PALETTE.teal;
                const active = selectedTagIds.includes(tag.id);
                const count = tagUsageInScope.get(tag.id) ?? 0;
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTagFilter(tag.id)}
                    aria-pressed={active}
                    title={`${tag.category === 'subject' ? 'Subject' : 'Project'} tag (${spec.label})`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? `${spec.activeControlClass} font-semibold`
                        : 'bg-[var(--bg-main)] text-[var(--text-main)] border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${spec.dotClass}`}
                      aria-hidden="true"
                    />
                    <span>{tag.name}</span>
                    <span className="text-[11px] font-mono tabular-nums opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {typeFilter === 'readLater' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'unread', label: 'Unread' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'all', label: 'All Saved' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setReadLaterStatusFilter(opt.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                    readLaterStatusFilter === opt.id
                      ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/40 font-semibold'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Open any item in Focus Mode to track reading scroll progress automatically.
            </span>
          </div>
        )}
      </div>

      {/* Materials Grid */}
      {unifiedItems.length === 0 ? (
        typeFilter === 'readLater' ? (
          <EmptyState
            icon={<Bookmark className="w-5 h-5" />}
            title={
              readLaterStatusFilter === 'unread'
                ? 'No unread Read Later items'
                : 'No matching Read Later bookmarks'
            }
            description="Bookmark explanations in AI Study Assistant, summaries in Notes Summarizer, or lecture notes here to queue them for future Focus Mode sessions."
            actionLabel="Browse All Materials"
            onAction={() => handleTabChange('all')}
          />
        ) : (
          <EmptyState
            icon={<FolderOpen className="w-5 h-5" />}
            title="No matching study materials"
            description={
              hasActiveFilters
                ? 'No study materials match your current tag, subject, or search filters.'
                : 'Create a new note or generate summaries, quizzes, and flashcards.'
            }
            actionLabel={hasActiveFilters ? 'Reset Filters' : 'Create Note'}
            onAction={hasActiveFilters ? resetAllFilters : openCreateDoc}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {unifiedItems.map((item) => {
            const KindIcon =
              item.kind === 'readLater'
                ? Bookmark
                : item.kind === 'documents'
                ? BookOpen
                : item.kind === 'summaries'
                ? FileText
                : item.kind === 'quizzes'
                ? CheckSquare
                : Layers;

            const existingBookmark =
              item.kind === 'documents' || item.kind === 'summaries'
                ? state.readLater.find((r) => r.originId === item.id)
                : undefined;

            return (
              <article
                key={`${item.kind}-${item.id}`}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <SourceAttribution
                      source={item.source}
                      subject={item.subject}
                      extra={item.meta}
                    />
                    <KindIcon className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-main)] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                    {item.preview}
                  </p>
                  {item.tagIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1">
                      {item.tagIds
                        .map((tid) => tagMap.get(tid))
                        .filter((t): t is StudyTag => Boolean(t))
                        .map((tag) => {
                          const spec = TAG_COLOR_PALETTE[tag.color] ?? TAG_COLOR_PALETTE.teal;
                          const isFiltered = selectedTagIds.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTagFilter(tag.id)}
                              title={`Filter by ${tag.name} (${tag.category})`}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                isFiltered
                                  ? `${spec.textClass} underline underline-offset-2 font-semibold`
                                  : `${spec.textClass} hover:underline underline-offset-2`
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${spec.dotClass}`}
                                aria-hidden="true"
                              />
                              <span>{tag.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.kind === 'readLater' && item.rawReadLater ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openReadLaterInFocus(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Read in Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveReadLaterId(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          Read
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleReadLaterStatus(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {item.rawReadLater.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5" />
                              Mark Read
                            </>
                          )}
                        </button>
                      </>
                    ) : item.kind === 'documents' && item.rawDoc ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditDoc(item.rawDoc!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--color-primary)] rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openWithDraft({
                              targetModule: 'summarizer',
                              topic: item.title,
                              subject: item.subject,
                              notes: item.rawDoc!.content,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                          Summarize
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveModule(
                            item.kind === 'summaries'
                              ? 'summarizer'
                              : item.kind === 'quizzes'
                              ? 'quiz'
                              : 'flashcards'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--color-primary)] rounded-lg cursor-pointer"
                      >
                        Open
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit tags for ${item.title}`}
                      title="Assign subject or project tags"
                      onClick={() =>
                        setAssignTagTarget({
                          collection: item.kind === 'flashcards' ? 'decks' : item.kind,
                          id: item.id,
                          title: item.title,
                          tagIds: item.tagIds,
                        })
                      }
                      className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                        item.tagIds.length > 0
                          ? 'text-[var(--color-primary)] hover:bg-[var(--bg-subtle)]'
                          : 'text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                    {(item.kind === 'documents' || item.kind === 'summaries') &&
                      item.markdownContent && (
                        <button
                          type="button"
                          aria-label={
                            existingBookmark
                              ? `Remove ${item.title} from Read Later`
                              : `Save ${item.title} to Read Later`
                          }
                          title={existingBookmark ? 'Saved to Read Later' : 'Save to Read Later'}
                          onClick={() => {
                            if (existingBookmark) {
                              removeFromReadLater(existingBookmark.id);
                            } else {
                              addToReadLater({
                                title: item.title,
                                subject: item.subject,
                                origin: item.kind === 'summaries' ? 'summarizer' : 'materials',
                                originId: item.id,
                                content: item.markdownContent!,
                                source: item.source,
                                tagIds: item.tagIds,
                              });
                            }
                          }}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            existingBookmark
                              ? 'text-[var(--color-primary)] bg-[var(--bg-subtle)]'
                              : 'text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                          }`}
                        >
                          {existingBookmark ? (
                            <BookmarkCheck className="w-4 h-4" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => handleDeleteItem(item.kind, item.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Create / Edit Document Modal */}
      <Modal
        isOpen={isDocModalOpen}
        title={editingDoc ? 'Edit Study Document' : 'Create Study Note / Document'}
        onClose={() => setIsDocModalOpen(false)}
      >
        <form onSubmit={handleSaveDoc} className="space-y-4">
          <div>
            <label htmlFor="doc-title" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Document Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g., Week 8 Lecture Notes — Fourier Series"
              required
              className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Subject
              </label>
              <select
                id="doc-subject"
                value={docSubject}
                onChange={(e) => setDocSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="doc-type" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Document Type
              </label>
              <select
                id="doc-type"
                value={docType}
                onChange={(e) => setDocType(e.target.value as StudyDocument['docType'])}
                className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="Lecture Note">Lecture Note</option>
                <option value="Study Guide">Study Guide</option>
                <option value="Formula Sheet">Formula Sheet</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="doc-content" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Content
            </label>
            <textarea
              id="doc-content"
              rows={5}
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Write or paste your lecture notes, formulas, or reading summaries..."
              required
              className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
            />
          </div>

          <div className="pt-2 border-t border-[var(--border-color)]">
            <div className="text-xs font-semibold text-[var(--text-main)] mb-2">
              Color-Coded Tags (Subject &amp; Project)
            </div>
            <TagSelectorInline selectedTagIds={docTagIds} onChange={setDocTagIds} />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
            >
              {editingDoc ? 'Save Changes' : 'Save Material'}
            </button>
          </div>
        </form>
      </Modal>

      <ManageTagsModal isOpen={isManageTagsOpen} onClose={() => setIsManageTagsOpen(false)} />
      <AssignItemTagsModal target={assignTagTarget} onClose={() => setAssignTagTarget(null)} />
    </div>
  );
};
