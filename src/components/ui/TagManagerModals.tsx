import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Plus, Tag, Trash2, X } from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { StudyTag, TagCategory, TagColorId, TaggableCollection } from '../../types/study';
import { TAG_COLOR_OPTIONS, TAG_COLOR_PALETTE } from '../../utils/tagColors';
import { Modal } from './CommonUI';

interface TagSelectorInlineProps {
  selectedTagIds: string[];
  onChange: (nextIds: string[]) => void;
  allowQuickCreate?: boolean;
}

export const TagSelectorInline: React.FC<TagSelectorInlineProps> = ({
  selectedTagIds,
  onChange,
  allowQuickCreate = true,
}) => {
  const { state, createTag } = useStudy();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<TagCategory>('project');
  const [newColor, setNewColor] = useState<TagColorId>('teal');

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleQuickCreate = () => {
    const clean = newName.trim();
    if (!clean) return;
    const created = createTag({ name: clean, color: newColor, category: newCategory });
    if (!selectedTagIds.includes(created.id)) {
      onChange([...selectedTagIds, created.id]);
    }
    setNewName('');
    setCreating(false);
  };

  const subjectTags = state.tags.filter((t) => t.category === 'subject');
  const projectTags = state.tags.filter((t) => t.category === 'project');

  const renderGroup = (title: string, items: StudyTag[]) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-[var(--text-muted)]">{title}</div>
        <div className="flex flex-wrap gap-1.5">
          {items.map((tag) => {
            const spec = TAG_COLOR_PALETTE[tag.color] ?? TAG_COLOR_PALETTE.teal;
            const active = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? spec.activeControlClass
                    : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${spec.dotClass}`} aria-hidden="true" />
                <span>{tag.name}</span>
                {active && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {state.tags.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          No tags created yet. Create a subject or project tag below.
        </p>
      ) : (
        <div className="space-y-2.5">
          {renderGroup('Subject Tags', subjectTags)}
          {renderGroup('Project Tags', projectTags)}
        </div>
      )}

      {allowQuickCreate && (
        <div>
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New color tag
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  Create Quick Tag
                </span>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  aria-label="Cancel creating tag"
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickCreate();
                    }
                  }}
                  placeholder="Tag name (e.g., Finals Week)"
                  className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <select
                  aria-label="New tag category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TagCategory)}
                  className="px-2.5 py-1.5 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="project">Project</option>
                  <option value="subject">Subject</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Tag color">
                  {TAG_COLOR_OPTIONS.map((opt) => {
                    const selected = newColor === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNewColor(opt.id)}
                        aria-label={`Color: ${opt.label}`}
                        aria-checked={selected}
                        role="radio"
                        title={opt.label}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                          opt.swatchClass
                        } ${selected ? 'ring-2 ring-offset-2 ring-[var(--text-main)] ring-offset-[var(--bg-main)] scale-105' : 'opacity-85 hover:opacity-100'}`}
                      >
                        {selected && <Check className="w-3 h-3 text-white dark:text-slate-950 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleQuickCreate}
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-[var(--text-on-primary)] rounded-md whitespace-nowrap cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({ isOpen, onClose }) => {
  const { state, createTag, updateTag, deleteTag } = useStudy();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TagCategory>('project');
  const [color, setColor] = useState<TagColorId>('teal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<TagCategory>('project');
  const [editColor, setEditColor] = useState<TagColorId>('teal');

  const tagUsageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const bump = (ids?: string[]) => {
      ids?.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    };
    state.documents.forEach((d) => bump(d.tagIds));
    state.summaries.forEach((s) => bump(s.tagIds));
    state.quizzes.forEach((q) => bump(q.tagIds));
    state.decks.forEach((d) => bump(d.tagIds));
    state.readLater.forEach((r) => bump(r.tagIds));
    return counts;
  }, [state.documents, state.summaries, state.quizzes, state.decks, state.readLater]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createTag({ name: name.trim(), color, category });
    setName('');
  };

  const startEdit = (tag: StudyTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditCategory(tag.category);
    setEditColor(tag.color);
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateTag({
      id: editingId,
      name: editName.trim(),
      category: editCategory,
      color: editColor,
    });
    setEditingId(null);
  };

  return (
    <Modal isOpen={isOpen} title="Manage Color-Coded Tags" onClose={onClose}>
      <div className="space-y-5">
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-3"
        >
          <div className="text-xs font-semibold text-[var(--text-main)]">
            Create New Subject or Project Tag
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Thesis Research, Bio 101"
              className="sm:col-span-2 px-3 py-2 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <select
              aria-label="Tag category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TagCategory)}
              className="px-3 py-2 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="project">Project Tag</option>
              <option value="subject">Subject Tag</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Select tag color">
              {TAG_COLOR_OPTIONS.map((opt) => {
                const selected = color === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setColor(opt.id)}
                    aria-label={opt.label}
                    aria-checked={selected}
                    role="radio"
                    title={opt.label}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                      opt.swatchClass
                    } ${selected ? 'ring-2 ring-offset-2 ring-[var(--text-main)] ring-offset-[var(--bg-main)] scale-105' : 'opacity-85 hover:opacity-100'}`}
                  >
                    {selected && <Check className="w-3 h-3 text-white dark:text-slate-950 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 text-[var(--text-on-primary)] rounded-lg whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Tag
            </button>
          </div>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[var(--text-main)]">Workspace Tags</span>
            <span className="font-mono tabular-nums text-[var(--text-muted)]">
              {state.tags.length} total
            </span>
          </div>

          {state.tags.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              No tags created yet. Add one above to organize notes and materials.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border-color)] max-h-72 overflow-y-auto border border-[var(--border-color)] rounded-xl">
              {state.tags.map((tag) => {
                const spec = TAG_COLOR_PALETTE[tag.color] ?? TAG_COLOR_PALETTE.teal;
                const usage = tagUsageCounts.get(tag.id) ?? 0;
                const isEditing = editingId === tag.id;

                if (isEditing) {
                  return (
                    <li key={tag.id} className="p-3 bg-[var(--bg-main)] space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        />
                        <select
                          aria-label="Edit tag category"
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as TagCategory)}
                          className="px-2.5 py-1.5 text-xs bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-md"
                        >
                          <option value="project">Project</option>
                          <option value="subject">Subject</option>
                        </select>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {TAG_COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setEditColor(opt.id)}
                              aria-label={opt.label}
                              className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${
                                opt.swatchClass
                              } ${editColor === opt.id ? 'ring-2 ring-offset-1 ring-[var(--text-main)] ring-offset-[var(--bg-main)]' : 'opacity-80'}`}
                            >
                              {editColor === opt.id && (
                                <Check className="w-2.5 h-2.5 text-white dark:text-slate-950 stroke-[3]" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            className="px-2.5 py-1 text-xs font-semibold bg-[var(--color-primary)] text-[var(--text-on-primary)] rounded-md cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                }

                return (
                  <li
                    key={tag.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-subtle)]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${spec.dotClass}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                          {tag.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {tag.category === 'subject' ? 'Subject' : 'Project'}
                          <span aria-hidden="true"> · </span>
                          <span>{spec.label}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{usage} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        aria-label={`Edit tag ${tag.name}`}
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTag(tag.id)}
                        aria-label={`Delete tag ${tag.name}`}
                        className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

interface AssignItemTagsModalProps {
  target: {
    collection: TaggableCollection;
    id: string;
    title: string;
    tagIds: string[];
  } | null;
  onClose: () => void;
}

export const AssignItemTagsModal: React.FC<AssignItemTagsModalProps> = ({ target, onClose }) => {
  const { setItemTags } = useStudy();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(target?.tagIds ?? []);
  }, [target]);

  if (!target) return null;

  const handleSave = () => {
    setItemTags(target.collection, target.id, selectedIds);
    onClose();
  };

  return (
    <Modal isOpen={Boolean(target)} title="Assign Tags" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pb-3 border-b border-[var(--border-color)]">
          <Tag className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
          <span className="font-medium text-[var(--text-main)] truncate">{target.title}</span>
        </div>

        <TagSelectorInline
          selectedTagIds={selectedIds}
          onChange={setSelectedIds}
          allowQuickCreate
        />

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
          >
            Save Tags
          </button>
        </div>
      </div>
    </Modal>
  );
};
