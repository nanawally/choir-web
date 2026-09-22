"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listVoiceGroups,
  createVoiceGroup,
  renameVoiceGroup,
  deleteVoiceGroup,
  setVoiceGroupStandard,
  addVoicePart,
  updateVoicePart,
  deleteVoicePart,
  reorderVoiceParts,
} from "../../lib/api";
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
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

type VoicePart = { id: string; name: string; color: string; shape: string };
type VoiceGroup = {
  id: string;
  name: string;
  isStandard: boolean;
  parts: VoicePart[];
};

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

function SortablePartRow({
  part,
  onUpdate,
  onDelete,
}: {
  part: VoicePart;
  onUpdate: (name: string, color: string, shape: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(part.name);
  const [color, setColor] = useState(part.color);
  const [shape, setShape] = useState(part.shape);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: part.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function save() {
    if (!name.trim()) return;
    onUpdate(name.trim(), color, shape);
    setEditing(false);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 py-1.5 px-2 border-b border-gray-100"
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing text-gray-400 select-none"
      >
        ≡
      </span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="border border-gray-300 rounded px-2 py-0.5 text-sm w-24"
            autoFocus
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 border border-gray-300 rounded cursor-pointer p-0"
          />
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value)}
            className="border border-gray-300 rounded px-1 py-0.5 text-sm"
          >
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={save}
            className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-2 py-0.5 border border-gray-300 rounded text-xs"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span
            className="w-3 h-3 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: part.color }}
          />
          <span
            className="text-sm cursor-pointer hover:text-blue-600"
            onDoubleClick={() => {
              setName(part.name);
              setColor(part.color);
              setShape(part.shape);
              setEditing(true);
            }}
            title="Double-click to edit"
          >
            {part.name}
          </span>
          <span className="text-xs text-gray-400">{part.shape}</span>
          <div className="ml-auto">
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function VoiceGroupsPage() {
  const [groups, setGroups] = useState<VoiceGroup[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupStandard, setNewGroupStandard] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  // Add part state per group
  const [addingPartGroupId, setAddingPartGroupId] = useState<string | null>(
    null,
  );
  const [newPartName, setNewPartName] = useState("");
  const [newPartColor, setNewPartColor] = useState(DEFAULT_COLORS[0]);
  const [newPartShape, setNewPartShape] = useState(SHAPES[0]);
  // Rename group
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    listVoiceGroups().then(setGroups);
  }, []);

  const standardGroups = groups.filter((g) => g.isStandard);
  const otherGroups = groups.filter((g) => !g.isStandard);

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const group = await createVoiceGroup(
      newGroupName.trim(),
      newGroupStandard,
    );
    if (group) {
      setGroups([...groups, group]);
      setNewGroupName("");
      setNewGroupStandard(true);
      setShowAddGroup(false);
      setExpandedGroupId(group.id);
    }
  }

  async function handleRenameGroup(id: string) {
    if (!renameValue.trim()) return;
    if (await renameVoiceGroup(id, renameValue.trim())) {
      setGroups(
        groups.map((g) =>
          g.id === id ? { ...g, name: renameValue.trim() } : g,
        ),
      );
    }
    setRenamingGroupId(null);
  }

  async function handleToggleStandard(id: string, current: boolean) {
    if (await setVoiceGroupStandard(id, !current)) {
      setGroups(
        groups.map((g) =>
          g.id === id ? { ...g, isStandard: !current } : g,
        ),
      );
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!window.confirm("Delete this voice group and all its parts?")) return;
    if (await deleteVoiceGroup(id)) {
      setGroups(groups.filter((g) => g.id !== id));
      if (expandedGroupId === id) setExpandedGroupId(null);
    }
  }

  async function handleAddPart(groupId: string) {
    if (!newPartName.trim()) return;
    const part = await addVoicePart(
      groupId,
      newPartName.trim(),
      newPartColor,
      newPartShape,
    );
    if (part) {
      setGroups(
        groups.map((g) =>
          g.id === groupId ? { ...g, parts: [...g.parts, part] } : g,
        ),
      );
      setNewPartName("");
      setAddingPartGroupId(null);
      const nextIdx =
        (DEFAULT_COLORS.indexOf(newPartColor) + 1) % DEFAULT_COLORS.length;
      setNewPartColor(DEFAULT_COLORS[nextIdx]);
    }
  }

  async function handleUpdatePart(
    partId: string,
    name: string,
    color: string,
    shape: string,
  ) {
    if (await updateVoicePart(partId, name, color, shape)) {
      setGroups(
        groups.map((g) => ({
          ...g,
          parts: g.parts.map((p) =>
            p.id === partId ? { ...p, name, color, shape } : p,
          ),
        })),
      );
    }
  }

  async function handleDeletePart(partId: string) {
    if (await deleteVoicePart(partId)) {
      setGroups(
        groups.map((g) => ({
          ...g,
          parts: g.parts.filter((p) => p.id !== partId),
        })),
      );
    }
  }

  function handlePartDragEnd(groupId: string, event: DragEndEvent) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = group.parts.findIndex((p) => p.id === active.id);
    const newIndex = group.parts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...group.parts];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, group.parts[oldIndex]);

    setGroups(
      groups.map((g) => (g.id === groupId ? { ...g, parts: reordered } : g)),
    );
    reorderVoiceParts(groupId, reordered.map((p) => p.id));
  }

  function renderGroup(group: VoiceGroup) {
    const isExpanded = expandedGroupId === group.id;
    const isRenaming = renamingGroupId === group.id;

    return (
      <div
        key={group.id}
        className="border border-gray-200 rounded-lg overflow-hidden"
      >
        <div
          className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{isExpanded ? "▼" : "▶"}</span>
            {isRenaming ? (
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameGroup(group.id);
                  if (e.key === "Escape") setRenamingGroupId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="border border-gray-300 rounded px-2 py-0.5 text-sm"
                autoFocus
              />
            ) : (
              <span className="font-medium">{group.name}</span>
            )}
            <span className="text-xs text-gray-400">
              {group.parts.length} part{group.parts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={group.isStandard}
                onChange={() =>
                  handleToggleStandard(group.id, group.isStandard)
                }
              />
              Standard
            </label>
            <button
              onClick={() => {
                setRenamingGroupId(group.id);
                setRenameValue(group.name);
              }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Rename
            </button>
            <button
              onClick={() => handleDeleteGroup(group.id)}
              className="text-red-400 hover:text-red-600 text-xs"
            >
              Delete
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 py-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handlePartDragEnd(group.id, e)}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={group.parts.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul>
                  {group.parts.map((p) => (
                    <SortablePartRow
                      key={p.id}
                      part={p}
                      onUpdate={(name, color, shape) =>
                        handleUpdatePart(p.id, name, color, shape)
                      }
                      onDelete={() => handleDeletePart(p.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            {group.parts.length === 0 && (
              <p className="text-gray-400 text-sm py-2">No parts yet.</p>
            )}

            {addingPartGroupId === group.id ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPart(group.id);
                    if (e.key === "Escape") setAddingPartGroupId(null);
                  }}
                  placeholder="Part name..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                  autoFocus
                />
                <input
                  type="color"
                  value={newPartColor}
                  onChange={(e) => setNewPartColor(e.target.value)}
                  className="w-7 h-7 border border-gray-300 rounded cursor-pointer p-0"
                />
                <select
                  value={newPartShape}
                  onChange={(e) => setNewPartShape(e.target.value)}
                  className="border border-gray-300 rounded px-1 py-1 text-sm"
                >
                  {SHAPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAddPart(group.id)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAddingPartGroupId(group.id);
                  setNewPartName("");
                }}
                className="text-sm text-blue-500 hover:underline mt-2"
              >
                + Add part
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen py-8 px-8">
      <Link
        href="/"
        className="self-start text-sm text-blue-500 hover:underline mb-4"
      >
        &larr; Home
      </Link>
      <h1 className="text-4xl font-bold mb-6">Voice Groups</h1>

      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Standard groups appear in the roster table and at the top of the
            concert editor dropdown.
          </span>
          <button
            onClick={() => setShowAddGroup(true)}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium flex-shrink-0 ml-4"
          >
            + Add group
          </button>
        </div>

        {showAddGroup && (
          <div className="flex items-center gap-2 mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateGroup();
                if (e.key === "Escape") {
                  setShowAddGroup(false);
                  setNewGroupName("");
                }
              }}
              placeholder="Group name..."
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
              autoFocus
            />
            <label className="flex items-center gap-1 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={newGroupStandard}
                onChange={(e) => setNewGroupStandard(e.target.checked)}
              />
              Standard
            </label>
            <button
              onClick={handleCreateGroup}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowAddGroup(false);
                setNewGroupName("");
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {standardGroups.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Standard
            </h2>
            <div className="space-y-2 mb-6">
              {standardGroups.map(renderGroup)}
            </div>
          </>
        )}

        {otherGroups.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Other
            </h2>
            <div className="space-y-2">{otherGroups.map(renderGroup)}</div>
          </>
        )}

        {groups.length === 0 && (
          <p className="text-gray-400 text-sm text-center mt-8">
            No voice groups yet.
          </p>
        )}
      </div>
    </div>
  );
}
