"use client";

import { useState } from "react";
import { GripVertical, EllipsisVertical, ChevronUp, ChevronRight } from "lucide-react";
import NavSidebar from "../../components/NavSidebar";
import {
  useVoiceGroups,
  SHAPES,
  type VoicePart,
  type VoiceGroup,
} from "../../hooks/useVoiceGroups";
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

const VISIBLE_ROWS = 4;

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
      className="flex items-center gap-2 h-8 px-2 border-b border-gray-100"
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing text-gray-400 select-none"
      >
        <GripVertical size={14} />
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
            className="border border-gray-300 rounded px-2 py-0.5 text-sm w-20"
            autoFocus
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 border border-gray-300 rounded cursor-pointer p-0"
          />
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value)}
            className="border border-gray-300 rounded px-1 py-0.5 text-xs"
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
            className="text-sm font-medium cursor-pointer hover:text-blue-600"
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

function VoiceGroupCard({
  group,
  sensors,
  addingPartGroupId,
  newPartName,
  newPartColor,
  newPartShape,
  renamingGroupId,
  renameValue,
  onSetAddingPartGroupId,
  onSetNewPartName,
  onSetNewPartColor,
  onSetNewPartShape,
  onSetRenamingGroupId,
  onSetRenameValue,
  onAddPart,
  onUpdatePart,
  onDeletePart,
  onPartDragEnd,
  onRenameGroup,
  onToggleStandard,
  onDeleteGroup,
}: {
  group: VoiceGroup;
  sensors: ReturnType<typeof useSensors>;
  addingPartGroupId: string | null;
  newPartName: string;
  newPartColor: string;
  newPartShape: string;
  renamingGroupId: string | null;
  renameValue: string;
  onSetAddingPartGroupId: (id: string | null) => void;
  onSetNewPartName: (v: string) => void;
  onSetNewPartColor: (v: string) => void;
  onSetNewPartShape: (v: string) => void;
  onSetRenamingGroupId: (id: string | null) => void;
  onSetRenameValue: (v: string) => void;
  onAddPart: (groupId: string) => void;
  onUpdatePart: (partId: string, name: string, color: string, shape: string) => void;
  onDeletePart: (partId: string) => void;
  onPartDragEnd: (groupId: string, event: DragEndEvent) => void;
  onRenameGroup: (id: string) => void;
  onToggleStandard: (id: string, current: boolean) => void;
  onDeleteGroup: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isRenaming = renamingGroupId === group.id;
  const hasMore = group.parts.length > VISIBLE_ROWS;
  const visibleParts = expanded || !hasMore
    ? group.parts
    : group.parts.slice(0, VISIBLE_ROWS - 1);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
        <div className="flex items-center gap-2">
          {isRenaming ? (
            <input
              value={renameValue}
              onChange={(e) => onSetRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameGroup(group.id);
                if (e.key === "Escape") onSetRenamingGroupId(null);
              }}
              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-24"
              autoFocus
            />
          ) : (
            <span className="font-medium text-sm">{group.name}</span>
          )}
          <span className="text-xs text-gray-400">
            {group.parts.length} part{group.parts.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-gray-400 hover:text-gray-600 text-sm px-1"
          title="Options"
        >
          <EllipsisVertical size={16} />
        </button>
      </div>

      {/* Collapsible menu */}
      {menuOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-t border-gray-100">
          <label className="flex items-center gap-1 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={group.isStandard}
              onChange={() => onToggleStandard(group.id, group.isStandard)}
            />
            Standard
          </label>
          <button
            onClick={() => {
              onSetRenamingGroupId(group.id);
              onSetRenameValue(group.name);
            }}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Rename
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            Delete
          </button>
        </div>
      )}

      {/* Parts list */}
      <div className="px-2 py-1 flex-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => onPartDragEnd(group.id, e)}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext
            items={visibleParts.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="m-0 p-0 list-none">
              {visibleParts.map((p) => (
                <SortablePartRow
                  key={p.id}
                  part={p}
                  onUpdate={(name, color, shape) =>
                    onUpdatePart(p.id, name, color, shape)
                  }
                  onDelete={() => onDeletePart(p.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {/* Show more / Show less */}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 h-8 px-2 border-b border-gray-100 w-full"
          >
            <span>{expanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}</span>
            {expanded ? "Show less" : "Show more"}
          </button>
        )}

        {/* Empty filler rows so all collapsed cards are the same height */}
        {!expanded &&
          (() => {
            const usedRows = hasMore ? VISIBLE_ROWS : group.parts.length;
            const emptyRows = VISIBLE_ROWS - usedRows;
            return Array.from({ length: emptyRows }, (_, i) => (
              <div key={`empty-${i}`} className="h-8 px-2 border-b border-transparent">&nbsp;</div>
            ));
          })()}

        {/* Add part */}
        {addingPartGroupId === group.id ? (
          <div className="flex items-center gap-2 py-2 px-2">
            <input
              value={newPartName}
              onChange={(e) => onSetNewPartName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAddPart(group.id);
                if (e.key === "Escape") onSetAddingPartGroupId(null);
              }}
              placeholder="Part name..."
              className="border border-gray-300 rounded px-2 py-0.5 text-sm w-20"
              autoFocus
            />
            <input
              type="color"
              value={newPartColor}
              onChange={(e) => onSetNewPartColor(e.target.value)}
              className="w-6 h-6 border border-gray-300 rounded cursor-pointer p-0"
            />
            <select
              value={newPartShape}
              onChange={(e) => onSetNewPartShape(e.target.value)}
              className="border border-gray-300 rounded px-1 py-0.5 text-xs"
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => onAddPart(group.id)}
              className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onSetAddingPartGroupId(group.id);
              onSetNewPartName("");
            }}
            className="text-sm text-blue-500 hover:underline py-1.5 px-2"
          >
            + Add part
          </button>
        )}
      </div>
    </div>
  );
}

export default function VoiceGroupsPage() {
  const {
    loading,
    standardGroups,
    otherGroups,
    showAddGroup,
    setShowAddGroup,
    newGroupName,
    setNewGroupName,
    newGroupStandard,
    setNewGroupStandard,
    addingPartGroupId,
    setAddingPartGroupId,
    newPartName,
    setNewPartName,
    newPartColor,
    setNewPartColor,
    newPartShape,
    setNewPartShape,
    renamingGroupId,
    setRenamingGroupId,
    renameValue,
    setRenameValue,
    handleCreateGroup,
    handleRenameGroup,
    handleToggleStandard,
    handleDeleteGroup,
    handleAddPart,
    handleUpdatePart,
    handleDeletePart,
    handlePartDragEnd,
  } = useVoiceGroups();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const cardProps = {
    sensors,
    addingPartGroupId,
    newPartName,
    newPartColor,
    newPartShape,
    renamingGroupId,
    renameValue,
    onSetAddingPartGroupId: setAddingPartGroupId,
    onSetNewPartName: setNewPartName,
    onSetNewPartColor: setNewPartColor,
    onSetNewPartShape: setNewPartShape,
    onSetRenamingGroupId: setRenamingGroupId,
    onSetRenameValue: setRenameValue,
    onAddPart: handleAddPart,
    onUpdatePart: handleUpdatePart,
    onDeletePart: handleDeletePart,
    onPartDragEnd: handlePartDragEnd,
    onRenameGroup: handleRenameGroup,
    onToggleStandard: handleToggleStandard,
    onDeleteGroup: handleDeleteGroup,
  };

  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <div className="flex-1 flex flex-col py-8 px-8">
      <h1 className="text-4xl font-bold mb-2 text-center">Voice Groups</h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        Standard groups appear in the chorists table and at the top of the concert
        editor dropdown.
      </p>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setShowAddGroup(true)}
          className="px-3 py-2 bg-blue-500 text-white rounded text-sm font-medium"
        >
          + Add group
        </button>
      </div>

      {showAddGroup && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
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
              className="border border-gray-300 rounded px-2 py-1 text-sm"
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
        </div>
      )}

      {standardGroups.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Standard
          </h2>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {standardGroups.map((g) => (
              <div key={g.id} className="w-64">
                <VoiceGroupCard group={g} {...cardProps} />
              </div>
            ))}
          </div>
        </>
      )}

      {otherGroups.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 text-center">
            Other
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {otherGroups.map((g) => (
              <div key={g.id} className="w-64">
                <VoiceGroupCard group={g} {...cardProps} />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && standardGroups.length === 0 && otherGroups.length === 0 && (
        <p className="text-gray-400 text-sm text-center mt-8">
          No voice groups yet.
        </p>
      )}
      </div>
    </div>
  );
}
