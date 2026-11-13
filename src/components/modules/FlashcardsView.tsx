import React, { useEffect, useState } from 'react';
import {
  Layers,
  Sparkles,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  BookOpen,
  Lightbulb,
  Shuffle,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { requestFlashcardsGeneration } from '../../services/aiClient';
import { CardMastery, FlashcardDeck } from '../../types/study';
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  SourceAttribution,
  LoadingSkeleton,
} from '../ui/CommonUI';

export const FlashcardsView: React.FC = () => {
  const {
    state,
    draft,
    clearDraft,
    addDeck,
    deleteDeck,
    updateCardMastery,
    addCardToDeck,
    addActivity,
  } = useStudy();

  const [creationTab, setCreationTab] = useState<'ai' | 'manual'>('ai');
  const [topic, setTopic] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');
  const [subject, setSubject] = useState<string>(state.subjects[1] ?? state.subjects[0] ?? 'General Studies');
  const [cardCount, setCardCount] = useState(8);
  const [manualDeckTitle, setManualDeckTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Study Mode State
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [studyFilter, setStudyFilter] = useState<'all' | 'difficult'>('all');
  const [orderedCardIds, setOrderedCardIds] = useState<string[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Add manual card inside active deck
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');
  const [manualHint, setManualHint] = useState('');

  useEffect(() => {
    if (draft && draft.targetModule === 'flashcards') {
      setCreationTab('ai');
      setTopic(draft.topic);
      setSubject(draft.subject);
      setSourceNotes(draft.notes ?? '');
      setActiveDeckId(null);
      clearDraft();
    }
  }, [draft, clearDraft]);

  const activeDeck = state.decks.find((d) => d.id === activeDeckId) ?? null;

  const visibleCards = activeDeck
    ? (orderedCardIds.length > 0
        ? orderedCardIds
            .map((id) => activeDeck.cards.find((c) => c.id === id))
            .filter(Boolean)
        : activeDeck.cards
      ).filter((c): c is NonNullable<typeof c> =>
        Boolean(c && (studyFilter === 'all' || c.mastery === 'difficult'))
      )
    : [];

  // Keyboard navigation
  useEffect(() => {
    if (!activeDeck || visibleCards.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        setFlipped(false);
        setShowHint(false);
        setCardIndex((idx) => Math.min(visibleCards.length - 1, idx + 1));
      } else if (e.code === 'ArrowLeft') {
        setFlipped(false);
        setShowHint(false);
        setCardIndex((idx) => Math.max(0, idx - 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDeck, visibleCards.length]);

  const openDeckForStudy = (deck: FlashcardDeck) => {
    setActiveDeckId(deck.id);
    setStudyFilter('all');
    setOrderedCardIds(deck.cards.map((c) => c.id));
    setCardIndex(0);
    setFlipped(false);
    setShowHint(false);
  };

  const handleShuffle = () => {
    if (!activeDeck) return;
    const ids = [...activeDeck.cards.map((c) => c.id)];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    setOrderedCardIds(ids);
    setCardIndex(0);
    setFlipped(false);
    setShowHint(false);
  };

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceNotes.trim()) {
      setError('Enter a topic or paste study notes to generate flashcards.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generated = await requestFlashcardsGeneration({
        topic,
        sourceNotes,
        subject,
        cardCount,
      });

      const createdDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        title: generated.deckTitle || topic || `${subject} Flashcards`,
        subject: generated.subject || subject,
        createdAt: new Date().toISOString(),
        source: 'gemini',
        cards: generated.cards.map((c, idx) => ({
          id: `fc-${Date.now()}-${idx}`,
          front: c.front,
          back: c.back,
          hint: c.hint || '',
          mastery: 'new',
        })),
      };

      addDeck(createdDeck);
      setTopic('');
      setSourceNotes('');
      openDeckForStudy(createdDeck);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDeckTitle.trim()) return;
    const created: FlashcardDeck = {
      id: `deck-${Date.now()}`,
      title: manualDeckTitle.trim(),
      subject,
      createdAt: new Date().toISOString(),
      source: 'user',
      cards: [],
    };
    addDeck(created);
    setManualDeckTitle('');
    openDeckForStudy(created);
  };

  const handleRateCard = (mastery: CardMastery) => {
    if (!activeDeck || visibleCards.length === 0) return;
    const card = visibleCards[Math.min(cardIndex, visibleCards.length - 1)];
    if (!card) return;
    updateCardMastery(activeDeck.id, card.id, mastery);

    if (cardIndex < visibleCards.length - 1) {
      setFlipped(false);
      setShowHint(false);
      setCardIndex((idx) => idx + 1);
    } else {
      addActivity({
        module: 'flashcards',
        action: 'Completed flashcard review',
        detail: `${activeDeck.title} (${visibleCards.length} cards)`,
        subject: activeDeck.subject,
        source: 'user',
      });
    }
  };

  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !manualFront.trim() || !manualBack.trim()) return;
    addCardToDeck(activeDeck.id, manualFront.trim(), manualBack.trim(), manualHint.trim());
    setManualFront('');
    setManualBack('');
    setManualHint('');
  };

  const safeIndex = Math.min(cardIndex, Math.max(0, visibleCards.length - 1));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Flashcards"
        subtitle="Generate flashcards from notes, build custom decks, shuffle cards, flag difficult items, and track mastery."
        action={
          activeDeck && (
            <button
              type="button"
              onClick={() => setActiveDeckId(null)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Back to Collections
            </button>
          )
        }
      />

      {activeDeck ? (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Deck Header + Study Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <SourceAttribution
                source={activeDeck.source}
                subject={activeDeck.subject}
                extra={`${activeDeck.cards.filter((c) => c.mastery === 'mastered').length}/${activeDeck.cards.length} completed`}
              />
              <h2 className="text-xl font-bold text-[var(--text-main)] mt-1">{activeDeck.title}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setStudyFilter('all');
                    setCardIndex(0);
                    setFlipped(false);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    studyFilter === 'all'
                      ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  All ({activeDeck.cards.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudyFilter('difficult');
                    setCardIndex(0);
                    setFlipped(false);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    studyFilter === 'difficult'
                      ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Difficult ({activeDeck.cards.filter((c) => c.mastery === 'difficult').length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleShuffle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Shuffle
              </button>
            </div>
          </div>

          {visibleCards.length === 0 ? (
            <EmptyState
              icon={<Layers className="w-5 h-5" />}
              title={
                studyFilter === 'difficult'
                  ? 'No difficult cards flagged'
                  : 'This flashcard collection is empty'
              }
              description={
                studyFilter === 'difficult'
                  ? 'Switch back to All cards or mark tricky cards as Difficult during review.'
                  : 'Add your first card below to start studying this collection.'
              }
              actionLabel={studyFilter === 'difficult' ? 'Show All Cards' : undefined}
              onAction={studyFilter === 'difficult' ? () => setStudyFilter('all') : undefined}
            />
          ) : (
            (() => {
              const currentCard = visibleCards[safeIndex];
              const statusLabel =
                currentCard.mastery === 'mastered'
                  ? 'Completed'
                  : currentCard.mastery === 'difficult'
                  ? 'Marked Difficult'
                  : currentCard.mastery === 'learning'
                  ? 'Reviewing'
                  : 'New';

              return (
                <>
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[var(--text-muted)]">
                    <span>
                      Card {safeIndex + 1} / {visibleCards.length}
                    </span>
                    <span className="text-[var(--color-primary)] font-semibold">{statusLabel}</span>
                  </div>

                  {/* 3D Flip Card */}
                  <div className="perspective-1000">
                    <button
                      type="button"
                      onClick={() => setFlipped((f) => !f)}
                      aria-label="Flip flashcard"
                      className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-2xl"
                    >
                      <div
                        className={`relative w-full min-h-[290px] transition-transform duration-500 transform-style-3d ${
                          flipped ? 'rotate-y-180' : ''
                        }`}
                      >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-sm">
                          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span>Front · {statusLabel}</span>
                            <span className="inline-flex items-center gap-1 text-[var(--color-primary)] font-medium">
                              <RotateCw className="w-3.5 h-3.5" />
                              Click or press Space to flip
                            </span>
                          </div>
                          <div className="my-auto py-4 text-center">
                            <p className="text-lg sm:text-xl font-semibold text-[var(--text-main)] leading-snug max-w-xl mx-auto">
                              {currentCard.front}
                            </p>
                          </div>
                          <div className="text-center text-xs text-[var(--text-muted)]">
                            Question / Concept Prompt
                          </div>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#0B1928] text-[#F0F8FF] border border-[#254258] rounded-2xl p-6 sm:p-10 flex flex-col justify-between shadow-sm">
                          <div className="flex items-center justify-between text-xs text-[#A9C4D4]">
                            <span>Back · Answer</span>
                            <span className="inline-flex items-center gap-1 text-[#42E6D0] font-medium">
                              <RotateCw className="w-3.5 h-3.5" />
                              Flip back
                            </span>
                          </div>
                          <div className="my-auto py-4 text-center">
                            <p className="text-base sm:text-lg text-[#F0F8FF] leading-relaxed max-w-xl mx-auto">
                              {currentCard.back}
                            </p>
                          </div>
                          <div className="text-center text-xs text-[#A9C4D4]">
                            Mark your progress below
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Navigation & Mastery Rating Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeIndex === 0}
                        onClick={() => {
                          setFlipped(false);
                          setShowHint(false);
                          setCardIndex((i) => Math.max(0, i - 1));
                        }}
                        className="p-2 text-[var(--text-main)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer"
                        aria-label="Previous card"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={safeIndex >= visibleCards.length - 1}
                        onClick={() => {
                          setFlipped(false);
                          setShowHint(false);
                          setCardIndex((i) => Math.min(visibleCards.length - 1, i + 1));
                        }}
                        className="p-2 text-[var(--text-main)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer"
                        aria-label="Next card"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {currentCard.hint && (
                        <button
                          type="button"
                          onClick={() => setShowHint((h) => !h)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-subtle)] cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          {showHint ? 'Hide Hint' : 'Hint'}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRateCard('difficult')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 rounded-lg cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Mark Difficult
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateCard('learning')}
                        className="px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
                      >
                        Review Again
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateCard('mastered')}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Card
                      </button>
                    </div>
                  </div>

                  {showHint && currentCard.hint && (
                    <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-main)]">
                      <strong>Hint:</strong> {currentCard.hint}
                    </div>
                  )}
                </>
              );
            })()
          )}

          {/* Add Card Manually */}
          <form
            onSubmit={handleAddManualCard}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[var(--text-main)]">
              Add a Card Manually
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={manualFront}
                onChange={(e) => setManualFront(e.target.value)}
                placeholder="Front question or term"
                required
                className="px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <input
                type="text"
                value={manualBack}
                onChange={(e) => setManualBack(e.target.value)}
                placeholder="Back answer or definition"
                required
                className="px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={manualHint}
                onChange={(e) => setManualHint(e.target.value)}
                placeholder="Optional memory hint"
                className="flex-1 px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Card
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Deck Builder + Collections */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
              <button
                type="button"
                onClick={() => setCreationTab('ai')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  creationTab === 'ai'
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Generate with AI
              </button>
              <button
                type="button"
                onClick={() => setCreationTab('manual')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  creationTab === 'manual'
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Create Empty Deck
              </button>
            </div>

            {creationTab === 'ai' ? (
              <form onSubmit={handleGenerateDeck} className="space-y-4">
                <div>
                  <label htmlFor="fc-topic" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                    Topic
                  </label>
                  <input
                    id="fc-topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Cranial Nerves & Sensory Pathways"
                    className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="fc-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                      Subject
                    </label>
                    <select
                      id="fc-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
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
                    <label htmlFor="fc-count" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                      Card Count
                    </label>
                    <select
                      id="fc-count"
                      value={cardCount}
                      onChange={(e) => setCardCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-medium font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    >
                      <option value={5}>5 cards</option>
                      <option value={8}>8 cards</option>
                      <option value={12}>12 cards</option>
                      <option value={15}>15 cards</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="fc-notes" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                    Study Notes (optional)
                  </label>
                  <textarea
                    id="fc-notes"
                    rows={4}
                    value={sourceNotes}
                    onChange={(e) => setSourceNotes(e.target.value)}
                    placeholder="Paste definitions, formulas, or lecture excerpts..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
                  />
                </div>

                {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? 'Generating Flashcards...' : 'Generate Deck with Gemini'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateManualDeck} className="space-y-4">
                <div>
                  <label htmlFor="manual-deck-title" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                    Collection Title
                  </label>
                  <input
                    id="manual-deck-title"
                    type="text"
                    value={manualDeckTitle}
                    onChange={(e) => setManualDeckTitle(e.target.value)}
                    placeholder="e.g., Microeconomics Exam Terms"
                    required
                    className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                </div>
                <div>
                  <label htmlFor="manual-deck-subj" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                    Subject
                  </label>
                  <select
                    id="manual-deck-subj"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {state.subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Collection
                </button>
              </form>
            )}
          </div>

          {/* Saved Collections Grid */}
          <div className="xl:col-span-7 space-y-4">
            {loading && <LoadingSkeleton lines={5} />}

            {state.decks.length === 0 && !loading ? (
              <EmptyState
                icon={<Layers className="w-5 h-5" />}
                title="No flashcard collections yet"
                description="Generate an AI flashcard deck from notes or create a custom collection."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.decks.map((deck) => {
                  const completed = deck.cards.filter((c) => c.mastery === 'mastered').length;
                  const difficult = deck.cards.filter((c) => c.mastery === 'difficult').length;
                  const pct =
                    deck.cards.length > 0 ? Math.round((completed / deck.cards.length) * 100) : 0;

                  return (
                    <article
                      key={deck.id}
                      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <SourceAttribution
                          source={deck.source}
                          subject={deck.subject}
                          extra={`${deck.cards.length} cards`}
                        />
                        <h3 className="text-base font-semibold text-[var(--text-main)] leading-snug">
                          {deck.title}
                        </h3>
                        <div className="pt-1">
                          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                            <span>
                              Completed ({completed}/{deck.cards.length})
                              {difficult > 0 ? ` · ${difficult} difficult` : ''}
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-[var(--text-main)]">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                        <button
                          type="button"
                          onClick={() => openDeckForStudy(deck)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Study Cards
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${deck.title}`}
                          onClick={() => deleteDeck(deck.id)}
                          className="p-2 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
