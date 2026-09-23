"use client";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { sortVoiceGroups } from "../lib/voiceGroupSort";
import {
  createVoiceGroup,
  deleteVoiceGroup,
  addVoicePart,
  updateVoicePart,
  deleteVoicePart,
  reorderVoiceParts,
} from "../lib/api";

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = { id: string; name: string; isStandard: boolean; parts: VoicePart[] };

type Props = {
  activeGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  voiceGroups: VoiceGroup[];
  setVoiceGroups: (groups: VoiceGroup[]) => void;
  highlightPartId: string | null;
  onHighlightPart: (id: string | null) => void;
};

// Default colors for auto-advancing when adding new parts
const DEFAULT_COLORS = [
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#f9ca24",
  "#a55eea",
  "#26de81",
  "#fd9644",
  "#778ca3",
];
const SHAPES = ["circle", "square", "triangle", "diamond", "cross", "star"];

function SortablePartItem({
  part,
  isEditing,
  isHighlighted,
  editingPartName,
  editingPartColor,
  editingPartShape,
  onEditNameChange,
  onEditColorChange,
  onEditShapeChange,
  onSave,
  onCancelEdit,
  onStartEdit,
  onHighlight,
  onDelete,
}: {
  part: VoicePart;
  isEditing: boolean;
  isHighlighted: boolean;
  editingPartName: string;
  editingPartColor: string;
  editingPartShape: string;
  onEditNameChange: (v: string) => void;
  onEditColorChange: (v: string) => void;
  onEditShapeChange: (v: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onHighlight: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style}>
      {isEditing ? (
        <div className="flex flex-col gap-1 border border-gray-300 rounded p-1.5 bg-gray-50">
          <input
            value={editingPartName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="border border-gray-300 rounded px-1 py-0.5 text-sm"
            autoFocus
          />
          <div className="flex gap-1 items-center">
            <input
              type="color"
              value={editingPartColor}
              onChange={(e) => onEditColorChange(e.target.value)}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer p-0"
            />
            <select
              value={editingPartShape}
              onChange={(e) => onEditShapeChange(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-sm"
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onSave}
              className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-0.5 border border-gray-300 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`flex items-center justify-between text-sm py-0.5 cursor-pointer rounded px-1 ${isHighlighted ? "bg-gray-200" : "hover:bg-gray-100"}`}
          onClick={onHighlight}
        >
          <span className="flex items-center gap-1">
            {/* Drag handle */}
            <span
              {...attributes}
              {...listeners}
              style={{ touchAction: "none" }}
              className="cursor-grab active:cursor-grabbing select-none text-gray-400"
              onClick={(e) => e.stopPropagation()}
            >
              ≡
            </span>
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: part.color }}
            />
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              title="Double-click to edit"
            >
              {part.name}
            </span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            X
          </button>
        </div>
      )}
    </li>
  );
}

export default function VoiceGroupPanel({
  activeGroupId,
  onSelectGroup,
  voiceGroups,
  setVoiceGroups,
  highlightPartId,
  onHighlightPart,
}: Props) {
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editingPartName, setEditingPartName] = useState("");
  const [editingPartColor, setEditingPartColor] = useState(DEFAULT_COLORS[0]);
  const [editingPartShape, setEditingPartShape] = useState(SHAPES[0]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartColor, setNewPartColor] = useState(DEFAULT_COLORS[0]);
  const [newPartShape, setNewPartShape] = useState(SHAPES[0]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const activeGroup = voiceGroups.find((g) => g.id === activeGroupId) ?? null;

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const group = await createVoiceGroup(newGroupName.trim());
    if (group) {
      setVoiceGroups([...voiceGroups, group]);
      setNewGroupName("");
      setShowAddGroup(false);
      onSelectGroup(group.id);
    }
  }

  async function handleDeleteGroup() {
    if (!activeGroupId) return;
    if (!window.confirm("Delete this voice group?")) return;
    if (await deleteVoiceGroup(activeGroupId)) {
      setVoiceGroups(voiceGroups.filter((g) => g.id !== activeGroupId));
      onSelectGroup(null);
    }
  }

  async function handleAddPart() {
    if (!activeGroupId || !newPartName.trim()) return;
    const part = await addVoicePart(
      activeGroupId,
      newPartName.trim(),
      newPartColor,
      newPartShape,
    );
    if (part) {
      setVoiceGroups(
        voiceGroups.map((g) =>
          g.id === activeGroupId ? { ...g, parts: [...g.parts, part] } : g,
        ),
      );
      setNewPartName("");
      setShowAddPart(false);
      // Auto-advance color for next part
      const nextIdx = (DEFAULT_COLORS.indexOf(newPartColor) + 1) % DEFAULT_COLORS.length;
      setNewPartColor(DEFAULT_COLORS[nextIdx]);
    }
  }

  async function handleSavePartEdit(partId: string) {
    const trimmed = editingPartName.trim();
    if (!trimmed) {
      setEditingPartId(null);
      return;
    }
    if (await updateVoicePart(partId, trimmed, editingPartColor, editingPartShape)) {
      setVoiceGroups(
        voiceGroups.map((g) => ({
          ...g,
          parts: g.parts.map((p) =>
            p.id === partId
              ? { ...p, name: trimmed, color: editingPartColor, shape: editingPartShape }
              : p,
          ),
        })),
      );
    }
    setEditingPartId(null);
  }

  async function handleDeletePart(partId: string) {
    if (await deleteVoicePart(partId)) {
      setVoiceGroups(
        voiceGroups.map((g) => ({
          ...g,
          parts: g.parts.filter((p) => p.id !== partId),
        })),
      );
    }
  }

  function handlePartDragEnd(event: DragEndEvent) {
    if (!activeGroup) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeGroup.parts.findIndex((p) => p.id === active.id);
    const newIndex = activeGroup.parts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...activeGroup.parts];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, activeGroup.parts[oldIndex]);

    setVoiceGroups(
      voiceGroups.map((g) =>
        g.id === activeGroupId ? { ...g, parts: reordered } : g,
      ),
    );
    reorderVoiceParts(activeGroupId!, reordered.map((p) => p.id));
  }

  return (
    <div className="w-64 border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="font-bold mb-3">Voice Groups</h2>

      <select
        value={activeGroupId || ""}
        onChange={(e) => onSelectGroup(e.target.value || null)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2"
      >
        <option value="">No voice group</option>
        {sortVoiceGroups(voiceGroups).map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      {showAddGroup ? (
        <div className="flex gap-1 mb-4">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateGroup();
              if (e.key === "Escape") { setShowAddGroup(false); setNewGroupName(""); }
            }}
            placeholder="New group..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            autoFocus
          />
          <button
            onClick={handleCreateGroup}
            className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddGroup(true)}
          className="text-sm text-blue-500 hover:underline mb-4"
        >
          + Add group
        </button>
      )}

      {activeGroup && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-gray-500 font-medium">Parts</h3>
            <button
              onClick={handleDeleteGroup}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              Delete group
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePartDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={activeGroup.parts.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1 mb-3">
                {activeGroup.parts.map((p) => (
                  <SortablePartItem
                    key={p.id}
                    part={p}
                    isEditing={editingPartId === p.id}
                    isHighlighted={highlightPartId === p.id}
                    editingPartName={editingPartName}
                    editingPartColor={editingPartColor}
                    editingPartShape={editingPartShape}
                    onEditNameChange={setEditingPartName}
                    onEditColorChange={setEditingPartColor}
                    onEditShapeChange={setEditingPartShape}
                    onSave={() => handleSavePartEdit(p.id)}
                    onCancelEdit={() => setEditingPartId(null)}
                    onStartEdit={() => {
                      setEditingPartId(p.id);
                      setEditingPartName(p.name);
                      setEditingPartColor(p.color);
                      setEditingPartShape(p.shape);
                    }}
                    onHighlight={() => onHighlightPart(highlightPartId === p.id ? null : p.id)}
                    onDelete={() => handleDeletePart(p.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {showAddPart ? (
            <div className="flex flex-col gap-1">
              <input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPart();
                  if (e.key === "Escape") { setShowAddPart(false); setNewPartName(""); }
                }}
                placeholder="Part name..."
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                autoFocus
              />
              <div className="flex gap-1 items-center">
                <input
                  type="color"
                  value={newPartColor}
                  onChange={(e) => setNewPartColor(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer p-0"
                />
                <select
                  value={newPartShape}
                  onChange={(e) => setNewPartShape(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-1 py-1 text-sm"
                >
                  {SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddPart}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddPart(true)}
              className="text-sm text-blue-500 hover:underline"
            >
              + Add part
            </button>
          )}
        </>
      )}
    </div>
  );
}
