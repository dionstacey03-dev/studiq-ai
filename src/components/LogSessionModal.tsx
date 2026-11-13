import React, { useState } from 'react';
import { Modal } from './ui/CommonUI';
import { useStudy } from '../context/StudyContext';
import { DayOfWeek } from '../types/study';

function getDayFromDateStr(dateStr: string): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const parsed = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Thu' : days[parsed.getDay()];
}

export const LogSessionModal: React.FC = () => {
  const { state, isSessionModalOpen, setIsSessionModalOpen, logStudySession } = useStudy();
  const [subject, setSubject] = useState<string>(state.subjects[0] ?? 'General Studies');
  const [topic, setTopic] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [date, setDate] = useState('2026-11-12');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedMinutes = Math.max(5, Math.min(480, Number(minutes) || 30));
    logStudySession({
      subject,
      topic: topic.trim() || `${subject} Focused Review`,
      minutes: parsedMinutes,
      date,
      day: getDayFromDateStr(date),
      notes: notes.trim() || undefined,
      source: 'user',
    });
    setTopic('');
    setNotes('');
    setMinutes('45');
    setIsSessionModalOpen(false);
  };

  return (
    <Modal
      isOpen={isSessionModalOpen}
      title="Log Completed Study Session"
      onClose={() => setIsSessionModalOpen(false)}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="session-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            Subject
          </label>
          <select
            id="session-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          >
            {state.subjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="session-topic" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            Topic Covered
          </label>
          <input
            id="session-topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Eigenvalue decomposition & practice proofs"
            required
            className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="session-minutes" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              Duration (minutes)
            </label>
            <input
              id="session-minutes"
              type="number"
              min={5}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="session-date" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
              Date
            </label>
            <input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="session-notes" className="block text-xs font-semibold text-[var(--text-main)] mb-1.5">
            Reflection Notes (optional)
          </label>
          <textarea
            id="session-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key takeaways or concepts to revisit..."
            className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setIsSessionModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
          >
            Save Study Session
          </button>
        </div>
      </form>
    </Modal>
  );
};
