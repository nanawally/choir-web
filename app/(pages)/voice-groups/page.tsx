"use client";

import { useState } from "react";
import {
  GripVertical,
  EllipsisVertical,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import NavSidebar from "../../components/NavSidebar";
import { useTranslation } from "../../lib/LanguageContext";
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
  const { t } = useTranslation();
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
      className="flex items-center gap-2 h-8 px-2 border-b border-border"
    >
      <span
        {...attributes}
        {...listeners}
        style={{ touchAction: "none" }}
        className="cursor-grab active:cursor-grabbing text-subtle select-none"
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
            className="border border-border rounded px-2 py-0.5 text-sm w-20"
            autoFocus
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 border border-border rounded cursor-pointer p-0"
          />
          <select
            value={shape}
            onChange={(e) => setShape(e.target.value)}
            className="border border-border rounded px-1 py-0.5 text-xs"
          >
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button onClick={save} className="px-2 py-0.5 btn-primary text-xs">
            {t("common.save")}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-2 py-0.5 border border-border rounded text-xs"
          >
            {t("common.cancel")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <span
            className="w-3 h-3 rounded-full inline-block shrink-0"
            style={{ backgroundColor: part.color }}
          />
          <span
            className="text-sm font-medium cursor-pointer hover:text-link"
            onDoubleClick={() => {
              setName(part.name);
              setColor(part.color);
              setShape(part.shape);
              setEditing(true);
            }}
            title={t("common.doubleClickToEdit")}
          >
            {part.name}
          </span>
          <span className="text-xs text-subtle">{part.shape}</span>
          <div className="ml-auto">
            <button
              onClick={onDelete}
              className="text-danger hover:text-danger-hover text-xs"
            >
              {t("common.delete")}
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
  onUpdatePart: (
    partId: string,
    name: string,
    color: string,
    shape: string,
  ) => void;
  onDeletePart: (partId: string) => void;
  onPartDragEnd: (groupId: string, event: DragEndEvent) => void;
  onRenameGroup: (id: string) => void;
  onToggleStandard: (id: string, current: boolean) => void;
  onDeleteGroup: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isRenaming = renamingGroupId === group.id;
  const hasMore = group.parts.length > VISIBLE_ROWS;
  const visibleParts =
    expanded || !hasMore ? group.parts : group.parts.slice(0, VISIBLE_ROWS - 1);

  return (
    <div className="border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-hover-bg">
        <div className="flex items-center gap-2">
          {isRenaming ? (
            <input
              value={renameValue}
              onChange={(e) => onSetRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameGroup(group.id);
                if (e.key === "Escape") onSetRenamingGroupId(null);
              }}
              className="border border-border rounded px-2 py-0.5 text-sm w-24"
              autoFocus
            />
          ) : (
            <span className="font-medium text-sm">{group.name}</span>
          )}
          <span className="text-xs text-subtle">
            {group.parts.length}{" "}
            {group.parts.length !== 1
              ? t("voiceGroups.partsCount")
              : t("voiceGroups.partCount")}
          </span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-subtle hover:text-muted text-sm px-1"
          title={t("common.options")}
        >
          <EllipsisVertical size={16} />
        </button>
      </div>

      {/* Collapsible menu */}
      {menuOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-hover-bg border-t border-border">
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="checkbox"
              checked={group.isStandard}
              onChange={() => onToggleStandard(group.id, group.isStandard)}
            />
            {t("common.standard")}
          </label>
          <button
            onClick={() => {
              onSetRenamingGroupId(group.id);
              onSetRenameValue(group.name);
            }}
            className="text-subtle hover:text-muted text-xs"
          >
            {t("common.rename")}
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="text-danger hover:text-danger-hover text-xs"
          >
            {t("common.delete")}
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
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground h-8 px-2 border-b border-border w-full"
          >
            <span>
              {expanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
            </span>
            {expanded ? t("common.showLess") : t("common.showMore")}
          </button>
        )}

        {/* Empty filler rows so all collapsed cards are the same height */}
        {!expanded &&
          (() => {
            const usedRows = hasMore ? VISIBLE_ROWS : group.parts.length;
            const emptyRows = VISIBLE_ROWS - usedRows;
            return Array.from({ length: emptyRows }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="h-8 px-2 border-b border-transparent"
              >
                &nbsp;
              </div>
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
              placeholder={t("voiceGroups.partName")}
              className="border border-border rounded px-2 py-0.5 text-sm w-20"
              autoFocus
            />
            <input
              type="color"
              value={newPartColor}
              onChange={(e) => onSetNewPartColor(e.target.value)}
              className="w-6 h-6 border border-border rounded cursor-pointer p-0"
            />
            <select
              value={newPartShape}
              onChange={(e) => onSetNewPartShape(e.target.value)}
              className="border border-border rounded px-1 py-0.5 text-xs"
            >
              {SHAPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => onAddPart(group.id)}
              className="px-2 py-0.5 btn-primary text-xs"
            >
              {t("common.add")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              onSetAddingPartGroupId(group.id);
              onSetNewPartName("");
            }}
            className="text-sm text-link hover:underline py-1.5 px-2"
          >
            {t("voiceGroups.addPart")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VoiceGroupsPage() {
  const { t } = useTranslation();
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
      <div className="flex-1 flex flex-col pt-16 pb-8 md:pt-8 px-4 md:px-8">
        <h1 className="text-4xl font-bold mb-2 text-center">
          {t("voiceGroups.title")}
        </h1>
        <p className="text-sm text-muted text-center mb-6">
          {t("voiceGroups.description")}
        </p>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowAddGroup(true)}
            className="px-3 py-2 btn-primary text-sm font-medium"
          >
            {t("voiceGroups.addGroup")}
          </button>
        </div>

        {showAddGroup && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex flex-wrap items-center gap-2 p-3 border border-border rounded-lg bg-hover-bg">
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
                placeholder={t("voiceGroups.groupName")}
                className="border border-border rounded px-2 py-1 text-sm"
                autoFocus
              />
              <label className="flex items-center gap-1 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={newGroupStandard}
                  onChange={(e) => setNewGroupStandard(e.target.checked)}
                />
                {t("common.standard")}
              </label>
              <button
                onClick={handleCreateGroup}
                className="px-3 py-1 btn-primary text-sm"
              >
                {t("common.create")}
              </button>
              <button
                onClick={() => {
                  setShowAddGroup(false);
                  setNewGroupName("");
                }}
                className="px-3 py-1 border border-border rounded text-sm"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {standardGroups.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3 text-center">
              {t("common.standard")}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {standardGroups.map((g) => (
                <div key={g.id} className="w-full sm:w-64">
                  <VoiceGroupCard group={g} {...cardProps} />
                </div>
              ))}
            </div>
          </>
        )}

        {otherGroups.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3 text-center">
              {t("common.other")}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center">
              {otherGroups.map((g) => (
                <div key={g.id} className="w-full sm:w-64">
                  <VoiceGroupCard group={g} {...cardProps} />
                </div>
              ))}
            </div>
          </>
        )}

        {!loading &&
          standardGroups.length === 0 &&
          otherGroups.length === 0 && (
            <p className="text-subtle text-sm text-center mt-8">
              {t("voiceGroups.noGroups")}
            </p>
          )}
      </div>
    </div>
  );
}
