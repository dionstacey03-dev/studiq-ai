import React from 'react';
import { Check, LayoutTemplate } from 'lucide-react';
import { SummaryTemplateId } from '../../types/study';
import { SUMMARY_TEMPLATES, SummaryTemplateDefinition } from '../../utils/summaryTemplates';
import { Modal } from './CommonUI';

export const TemplateMiniWireframe: React.FC<{ templateId: SummaryTemplateId }> = ({
  templateId,
}) => {
  if (templateId === 'cornell') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] overflow-hidden flex flex-col"
      >
        <div className="flex-1 grid grid-cols-3">
          <div className="col-span-1 bg-[var(--bg-subtle)]/80 border-r border-[var(--border-color)] p-1.5 space-y-1">
            <div className="h-1.5 w-4/5 rounded-sm bg-[var(--color-primary)]/45" />
            <div className="h-1.5 w-3/5 rounded-sm bg-[var(--text-muted)]/30" />
          </div>
          <div className="col-span-2 p-1.5 space-y-1">
            <div className="h-1.5 w-11/12 rounded-sm bg-[var(--text-main)]/25" />
            <div className="h-1.5 w-9/12 rounded-sm bg-[var(--text-muted)]/25" />
            <div className="h-1.5 w-10/12 rounded-sm bg-[var(--text-muted)]/25" />
          </div>
        </div>
        <div className="h-3.5 border-t border-[var(--border-color)] bg-[var(--bg-subtle)]/50 px-1.5 flex items-center">
          <div className="h-1.5 w-2/3 rounded-sm bg-[var(--color-primary)]/40" />
        </div>
      </div>
    );
  }

  if (templateId === 'outline') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-1.5 flex flex-col justify-center gap-1"
      >
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-mono font-bold text-[var(--color-primary)]">I.</span>
          <div className="h-1.5 w-3/4 rounded-sm bg-[var(--text-main)]/30" />
        </div>
        <div className="flex items-center gap-1 pl-2.5">
          <span className="text-[7px] font-mono text-[var(--text-muted)]">A.</span>
          <div className="h-1.5 w-2/3 rounded-sm bg-[var(--text-muted)]/25" />
        </div>
        <div className="flex items-center gap-1 pl-2.5">
          <span className="text-[7px] font-mono text-[var(--text-muted)]">B.</span>
          <div className="h-1.5 w-1/2 rounded-sm bg-[var(--text-muted)]/25" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-mono font-bold text-[var(--color-primary)]">II.</span>
          <div className="h-1.5 w-3/5 rounded-sm bg-[var(--text-main)]/30" />
        </div>
      </div>
    );
  }

  if (templateId === 'revision') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-1.5 space-y-1.5"
      >
        <div className="grid grid-cols-2 gap-1">
          <div className="h-4 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] px-1 flex items-center">
            <div className="h-1.5 w-3/4 rounded-sm bg-[var(--color-primary)]/45" />
          </div>
          <div className="h-4 rounded bg-[var(--bg-subtle)] border border-[var(--border-color)] px-1 flex items-center">
            <div className="h-1.5 w-2/3 rounded-sm bg-[var(--color-primary)]/45" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 w-11/12 rounded-sm bg-[var(--text-muted)]/30" />
          <div className="h-1.5 w-4/5 rounded-sm bg-[var(--text-muted)]/25" />
        </div>
      </div>
    );
  }

  if (templateId === 'compare') {
    return (
      <div
        aria-hidden="true"
        className="w-full h-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] overflow-hidden grid grid-cols-2"
      >
        <div className="p-1.5 border-r border-[var(--border-color)] space-y-1">
          <div className="h-1.5 w-3/4 rounded-sm bg-[var(--color-primary)]/50" />
          <div className="h-1.5 w-full rounded-sm bg-[var(--text-muted)]/25" />
          <div className="h-1.5 w-4/5 rounded-sm bg-[var(--text-muted)]/25" />
        </div>
        <div className="p-1.5 space-y-1">
          <div className="h-1.5 w-3/4 rounded-sm bg-[var(--color-accent)]/70" />
          <div className="h-1.5 w-full rounded-sm bg-[var(--text-muted)]/25" />
          <div className="h-1.5 w-4/5 rounded-sm bg-[var(--text-muted)]/25" />
        </div>
      </div>
    );
  }

  // Executive Summary
  return (
    <div
      aria-hidden="true"
      className="w-full h-14 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-1.5 space-y-1.5"
    >
      <div className="h-3.5 rounded bg-[var(--bg-subtle)]/80 px-1.5 flex items-center">
        <div className="h-1.5 w-4/5 rounded-sm bg-[var(--color-primary)]/45" />
      </div>
      <div className="space-y-1 px-0.5">
        <div className="h-1.5 w-11/12 rounded-sm bg-[var(--text-main)]/25" />
        <div className="h-1.5 w-9/12 rounded-sm bg-[var(--text-muted)]/25" />
      </div>
    </div>
  );
};

interface SummaryTemplatesModalProps {
  isOpen: boolean;
  selectedId: SummaryTemplateId;
  onSelect: (template: SummaryTemplateDefinition) => void;
  onClose: () => void;
}

export const SummaryTemplatesModal: React.FC<SummaryTemplatesModalProps> = ({
  isOpen,
  selectedId,
  onSelect,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} title="Summary Templates Library" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Choose a structured note-taking layout before processing with Gemini. Each template formats both the AI output and your saved study sheet.
        </p>

        <div className="space-y-2.5">
          {SUMMARY_TEMPLATES.map((tpl) => {
            const isSelected = tpl.id === selectedId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onSelect(tpl);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--bg-subtle)]/70'
                    : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-subtle)]/40'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <TemplateMiniWireframe templateId={tpl.id} />
                  </div>
                  <div className="sm:col-span-8 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-main)]">
                        <LayoutTemplate className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                        {tpl.name}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {tpl.tagline}
                    </p>
                    <div className="text-[11px] text-[var(--text-muted)] pt-0.5">
                      <span className="font-medium text-[var(--text-main)]">Includes:</span>{' '}
                      {tpl.structureIncludes.join(' · ')}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
