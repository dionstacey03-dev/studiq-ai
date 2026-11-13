import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Plus,
  Trash2,
  BookmarkPlus,
  Bookmark,
  BookmarkCheck,
  CheckSquare,
  MessageSquareText,
  Loader2,
  Check,
  Copy,
  Volume2,
  Pause,
  Printer,
  Mic,
  MicOff,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { requestTopicExplanation } from '../../services/aiClient';
import { ChatMessage, ChatThread } from '../../types/study';
import { PageHeader, ErrorBanner, SourceAttribution, EmptyState } from '../ui/CommonUI';
import { TtsAudioBar, useTtsPlayer } from '../ui/TtsPlayer';
import { useSpeechDictation } from '../../hooks/useSpeechDictation';

const QUICK_PROMPTS = [
  {
    label: 'Eigenvalues & SVD intuition',
    subject: 'Linear Algebra',
    prompt: 'Explain Singular Value Decomposition (SVD) geometrically and show how it relates to eigenvalues.',
  },
  {
    label: 'SN1 vs. SN2 decision rules',
    subject: 'Organic Chemistry II',
    prompt: 'Give me a step-by-step decision framework for predicting whether a reaction proceeds via SN1, SN2, E1, or E2.',
  },
  {
    label: 'Action potential ion channels',
    subject: 'Cognitive Neuroscience',
    prompt: 'Walk step-by-step through depolarization, repolarization, and the refractory period in a neuronal action potential.',
  },
  {
    label: 'Keynesian vs. Classical AS-AD',
    subject: 'Macroeconomic Theory',
    prompt: 'Compare short-run Keynesian aggregate supply with long-run Classical equilibrium using a practical example.',
  },
];

export const AssistantView: React.FC = () => {
  const {
    state,
    draft,
    clearDraft,
    addThread,
    updateThread,
    deleteThread,
    addSummary,
    addToReadLater,
    removeFromReadLater,
    openWithDraft,
    addActivity,
  } = useStudy();

  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    state.threads[0]?.id ?? ''
  );
  const [subject, setSubject] = useState<string>(
    state.threads[0]?.subject ?? state.subjects[0] ?? 'General Studies'
  );
  const [level, setLevel] = useState<ChatThread['level']>(
    state.threads[0]?.level ?? 'Undergraduate'
  );
  const [style, setStyle] = useState<ChatThread['style']>(
    state.threads[0]?.style ?? 'Clear Overview'
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printMsgId, setPrintMsgId] = useState<string | null>(null);
  const tts = useTtsPlayer();
  const dictation = useSpeechDictation({
    onTranscriptChange: setInput,
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const clearPrintFilter = () => setPrintMsgId(null);
    window.addEventListener('afterprint', clearPrintFilter);
    return () => window.removeEventListener('afterprint', clearPrintFilter);
  }, []);

  const handlePrintConversation = () => {
    flushSync(() => setPrintMsgId(null));
    window.print();
  };

  const handlePrintMessage = (msgId: string) => {
    flushSync(() => setPrintMsgId(msgId));
    window.print();
    setPrintMsgId(null);
  };

  const activeThread = state.threads.find((t) => t.id === selectedThreadId) ?? null;

  useEffect(() => {
    if (draft && draft.targetModule === 'assistant') {
      setSubject(draft.subject);
      setInput(draft.topic);
      clearDraft();
    }
  }, [draft, clearDraft]);

  useEffect(() => {
    if (activeThread) {
      setSubject(activeThread.subject);
      setLevel(activeThread.level);
      setStyle(activeThread.style);
    }
    tts.stop();
  }, [activeThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages.length, loading]);

  const handleNewThread = () => {
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: 'New Study Conversation',
      subject,
      level,
      style,
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    addThread(newThread);
    setSelectedThreadId(newThread.id);
    setError(null);
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Clipboard access was denied by your browser.');
    }
  };

  const sendMessage = async (overridePrompt?: string, overrideSubject?: string) => {
    const text = (overridePrompt ?? input).trim();
    if (!text || loading) return;

    if (dictation.isListening) {
      dictation.stop();
    }

    const targetSubject = overrideSubject ?? subject;
    setError(null);
    setSavedNotice(false);
    if (!overridePrompt) setInput('');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      source: 'user',
    };

    let targetThread: ChatThread;
    if (activeThread) {
      targetThread = {
        ...activeThread,
        title:
          activeThread.messages.length === 0
            ? text.slice(0, 48) + (text.length > 48 ? '...' : '')
            : activeThread.title,
        subject: targetSubject,
        level,
        style,
        updatedAt: new Date().toISOString(),
        messages: [...activeThread.messages, userMsg],
      };
      updateThread(targetThread);
    } else {
      targetThread = {
        id: `thread-${Date.now()}`,
        title: text.slice(0, 48) + (text.length > 48 ? '...' : ''),
        subject: targetSubject,
        level,
        style,
        updatedAt: new Date().toISOString(),
        messages: [userMsg],
      };
      addThread(targetThread);
      setSelectedThreadId(targetThread.id);
    }

    setLoading(true);
    try {
      const historyPayload = targetThread.messages.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const answer = await requestTopicExplanation({
        prompt: text,
        subject: targetSubject,
        level,
        style,
        history: historyPayload,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: answer,
        createdAt: new Date().toISOString(),
        source: 'gemini',
      };

      updateThread({
        ...targetThread,
        updatedAt: new Date().toISOString(),
        messages: [...targetThread.messages, assistantMsg],
      });

      addActivity({
        module: 'assistant',
        action: 'Asked AI Study Assistant',
        detail: text.slice(0, 60),
        subject: targetSubject,
        source: 'gemini',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Gemini Study Assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThreadAsNote = () => {
    if (!activeThread || activeThread.messages.length === 0) return;
    const assistantMessages = activeThread.messages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length === 0) return;
    const latestReply = assistantMessages[assistantMessages.length - 1];
    const paragraphs = latestReply.content
      .split('\n')
      .map((line) => line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').trim())
      .filter((line) => line.length > 12);

    addSummary({
      id: `sum-${Date.now()}`,
      title: activeThread.title,
      subject: activeThread.subject,
      format: 'Concise Summary',
      tldr: paragraphs[0] ?? latestReply.content.slice(0, 180),
      keyConcepts: paragraphs.slice(0, 4),
      sections: [
        {
          heading: 'AI Study Assistant Explanation',
          points: paragraphs.slice(0, 6),
        },
      ],
      keyTerms: [],
      reviewQuestions: ['Can you explain this concept in your own words without looking at your notes?'],
      createdAt: new Date().toISOString(),
      source: latestReply.source === 'gemini' ? 'gemini' : 'sample',
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleQuizFromThread = () => {
    if (!activeThread) return;
    const contextText = activeThread.messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('\n\n');

    openWithDraft({
      targetModule: 'quiz',
      topic: activeThread.title,
      subject: activeThread.subject,
      notes: contextText.slice(0, 3000),
    });
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="AI Study Assistant"
          subtitle="Ask academic questions, switch between beginner and advanced depth, copy responses, and turn explanations into notes or quizzes."
          action={
            <button
              type="button"
              onClick={handleNewThread}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start print-grid-reset">
        {/* Conversation History Rail */}
        <aside className="no-print bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-[var(--text-muted)]">Conversations</h2>
            <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
              {state.threads.length}
            </span>
          </div>

          {state.threads.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] px-1 py-4">
              No saved threads yet. Start a new conversation to begin.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-[440px] overflow-y-auto">
              {state.threads.map((thread) => {
                const isSelected = thread.id === activeThread?.id;
                return (
                  <li key={thread.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`flex-1 text-left px-3 py-2.5 rounded-lg transition-colors min-w-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] font-semibold'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-subtle)]/60'
                      }`}
                    >
                      <div className="text-sm truncate">{thread.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                        {thread.subject} · {thread.messages.length} msg
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${thread.title}`}
                      onClick={() => {
                        deleteThread(thread.id);
                        if (isSelected) {
                          const remaining = state.threads.filter((t) => t.id !== thread.id);
                          setSelectedThreadId(remaining[0]?.id ?? '');
                        }
                      }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-md opacity-70 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main Chat Workspace */}
        <section className="lg:col-span-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl flex flex-col min-h-[600px] max-h-[78vh] print-sheet">
          {/* Print-only Paper Header */}
          <header className="print-only-header">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                STUDIQ AI · Study Assistant
              </div>
              <div className="text-base font-bold text-[var(--text-main)] mt-0.5">
                {activeThread?.title ?? 'Academic Explanation'}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {activeThread?.subject ?? subject} · {activeThread?.level ?? level} ·{' '}
                {activeThread?.style ?? style}
              </div>
            </div>
            <div className="text-xs font-mono text-[var(--text-muted)]">
              Printed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </header>

          {/* Controls Toolbar */}
          <div className="no-print p-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-subtle)]/40 rounded-t-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="Academic subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>

              <select
                aria-label="Explanation depth"
                value={level}
                onChange={(e) => setLevel(e.target.value as ChatThread['level'])}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="Beginner">Beginner</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <select
                aria-label="Explanation format"
                value={style}
                onChange={(e) => setStyle(e.target.value as ChatThread['style'])}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="Clear Overview">Simple Language</option>
                <option value="Step-by-Step">Step-by-Step</option>
                <option value="Practical Examples">Practical Examples</option>
                <option value="Concept Summary">Concept Summary</option>
              </select>
            </div>

            {activeThread && activeThread.messages.some((m) => m.role === 'assistant') && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintConversation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleSaveThreadAsNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {savedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Saved to Materials
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      Save to Materials
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleQuizFromThread}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--color-primary)] border border-[var(--border-color)] hover:opacity-90 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Quiz This Topic
                </button>
              </div>
            )}
          </div>

          {/* Messages Viewport */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 print-expand">
            {(!activeThread || activeThread.messages.length === 0) && !loading ? (
              <div className="py-4 space-y-6">
                <EmptyState
                  icon={<MessageSquareText className="w-5 h-5" />}
                  title="Ask STUDIQ AI to explain any academic topic"
                  description="Select your subject, depth level, and explanation format above, or start with a sample prompt below."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => sendMessage(item.prompt, item.subject)}
                      className="text-left p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-primary)] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-[var(--color-primary)]">
                        {item.subject}
                      </div>
                      <div className="text-sm font-semibold text-[var(--text-main)] mt-1">
                        {item.label}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                        {item.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeThread?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  } ${printMsgId && printMsgId !== msg.id ? 'no-print' : ''}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl px-4 py-3.5 ${
                      msg.role === 'user'
                        ? 'bg-[var(--color-primary)] text-[var(--text-on-primary)] text-sm print-message-user print-avoid-break'
                        : 'bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] w-full print-message-assistant'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <>
                        <div className="print-only-label text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">
                          Question
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </>
                    ) : (
                      (() => {
                        const savedItem = state.readLater.find((r) => r.originId === msg.id);
                        const msgIdx = activeThread?.messages.findIndex((m) => m.id === msg.id) ?? -1;
                        const prevUserMsg =
                          msgIdx > 0
                            ? [...(activeThread?.messages.slice(0, msgIdx) ?? [])]
                                .reverse()
                                .find((m) => m.role === 'user')
                            : undefined;
                        const bookmarkTitle = prevUserMsg
                          ? prevUserMsg.content.slice(0, 72) +
                            (prevUserMsg.content.length > 72 ? '...' : '')
                          : activeThread?.title ?? 'AI Study Explanation';

                        return (
                          <div className="space-y-3">
                            <div className="print-only-label text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                              STUDIQ AI Explanation
                            </div>
                            <div className="study-prose text-sm">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <div className="no-print pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
                              <SourceAttribution source={msg.source} timestamp={msg.createdAt} />
                              <div className="flex flex-wrap items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    tts.toggleListen({
                                      id: msg.id,
                                      text: msg.content,
                                      contextLabel: activeThread?.subject ?? subject,
                                    })
                                  }
                                  className={`inline-flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    tts.activeId === msg.id || tts.loadingId === msg.id
                                      ? 'text-[var(--color-primary)] font-semibold'
                                      : 'text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                                  }`}
                                >
                                  {tts.loadingId === msg.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Generating audio...
                                    </>
                                  ) : tts.activeId === msg.id && tts.isPlaying ? (
                                    <>
                                      <Pause className="w-3.5 h-3.5" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5" />
                                      {tts.activeId === msg.id ? 'Resume' : 'Listen'}
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (savedItem) {
                                      removeFromReadLater(savedItem.id);
                                    } else {
                                      addToReadLater({
                                        title: bookmarkTitle,
                                        subject: activeThread?.subject ?? subject,
                                        origin: 'assistant',
                                        originId: msg.id,
                                        content: msg.content,
                                        source: msg.source ?? 'gemini',
                                      });
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                    savedItem
                                      ? 'text-[var(--color-primary)] font-semibold'
                                      : 'text-[var(--text-muted)] hover:text-[var(--color-primary)]'
                                  }`}
                                >
                                  {savedItem ? (
                                    <>
                                      <BookmarkCheck className="w-3.5 h-3.5" />
                                      Saved to Read Later
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-3.5 h-3.5" />
                                      Read Later
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      Copy response
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrintMessage(msg.id)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--color-primary)] whitespace-nowrap shrink-0 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Print
                                </button>
                              </div>
                            </div>
                            {(tts.loadingId === msg.id || tts.activeId === msg.id) && (
                              <div className="no-print">
                                <TtsAudioBar
                                  isPlaying={tts.isPlaying}
                                  isLoading={tts.loadingId === msg.id}
                                  currentTime={tts.currentTime}
                                  duration={tts.duration}
                                  playbackRate={tts.playbackRate}
                                  voiceName={tts.voiceName}
                                  label={`Listening · ${activeThread?.subject ?? subject}`}
                                  onTogglePlay={() =>
                                    tts.toggleListen({
                                      id: msg.id,
                                      text: msg.content,
                                      contextLabel: activeThread?.subject ?? subject,
                                    })
                                  }
                                  onStop={tts.stop}
                                  onSeek={tts.seek}
                                  onChangeRate={tts.changeRate}
                                  onChangeVoice={(nextVoice) =>
                                    tts.changeVoice(nextVoice, {
                                      id: msg.id,
                                      text: msg.content,
                                      contextLabel: activeThread?.subject ?? subject,
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="no-print flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] text-sm text-[var(--text-main)] max-w-md">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] shrink-0" />
                <span>Thinking through your question with Gemini...</span>
              </div>
            )}

            {(error || tts.error || dictation.error) && (
              <div className="no-print">
                <ErrorBanner
                  message={(error || tts.error || dictation.error)!}
                  onDismiss={() => {
                    setError(null);
                    tts.clearError();
                    dictation.clearError();
                  }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="no-print p-4 border-t border-[var(--border-color)] bg-[var(--bg-card)] rounded-b-xl"
          >
            {dictation.isListening && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center justify-between gap-2 mb-2.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"
                    aria-hidden="true"
                  />
                  <span className="font-medium truncate">
                    Listening — dictate your question or lecture notes
                  </span>
                </div>
                <button
                  type="button"
                  onClick={dictation.stop}
                  className="font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            <div className="flex items-end gap-2.5 sm:gap-3">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask or dictate a theorem, reaction mechanism, lecture notes, or follow-up question..."
                className="flex-1 px-4 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
              <button
                type="button"
                onClick={() => dictation.toggle(input)}
                disabled={loading}
                aria-pressed={dictation.isListening}
                aria-label={
                  dictation.isListening
                    ? 'Stop voice dictation'
                    : 'Dictate question or lecture notes with microphone'
                }
                title={
                  dictation.isSupported
                    ? dictation.isListening
                      ? 'Stop voice dictation'
                      : 'Dictate with microphone'
                    : 'SpeechRecognition is unavailable in this browser'
                }
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-3 text-sm font-medium border rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                  dictation.isListening
                    ? 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white'
                    : 'bg-[var(--bg-main)] hover:bg-[var(--bg-subtle)] border-[var(--border-color)] text-[var(--text-main)]'
                }`}
              >
                {dictation.isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="hidden sm:inline">Dictate</span>
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Explain</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
