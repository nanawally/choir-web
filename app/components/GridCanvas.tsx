import { useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import ChoristShape from "./ChoristShape";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; x: number; y: number };
type VoiceGroup = {
  id: string;
  name: string;
  parts: { id: string; name: string; color: string; shape: string }[];
};
type Assignment = { choristId: string; voicePartId: string };

type Props = {
  chorists: Chorist[];
  placements: Placement[];
  setPlacements: (placements: Placement[]) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  activeGroupId: string | null;
  voiceGroups: VoiceGroup[];
  assignments: Assignment[];
  onRemove: (choristId: string) => void;
};

function snapToGrid(value: number): number {
  return Math.round(value / CELL_SIZE) * CELL_SIZE;
}

export default function GridCanvas({
  chorists,
  placements,
  setPlacements,
  selectedIds,
  setSelectedIds,
  activeGroupId,
  voiceGroups,
  assignments,
  onRemove,
}: Props) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const didMarquee = useRef(false);

  function getChoristVisuals(choristId: string): { color: string; shape: string } {
    if (!activeGroupId) return { color: "grey", shape: "circle" };
    const assignment = assignments.find((a) => a.choristId === choristId);
    if (!assignment) return { color: "#ccc", shape: "circle" };
    const group = voiceGroups.find((g) => g.id === activeGroupId);
    const part = group?.parts.find((p) => p.id === assignment.voicePartId);
    if (!part) return { color: "grey", shape: "circle" };
    return { color: part.color, shape: part.shape };
  }

  const gridLines = [];
  for (let x = 0; x <= WIDTH; x += CELL_SIZE) {
    gridLines.push(
      <Line key={`v-${x}`} points={[x, 0, x, HEIGHT]} stroke="#ddd" strokeWidth={1} />,
    );
  }
  for (let y = 0; y <= HEIGHT; y += CELL_SIZE) {
    gridLines.push(
      <Line key={`h-${y}`} points={[0, y, WIDTH, y]} stroke="#ddd" strokeWidth={1} />,
    );
  }

  return (
    <Stage
      width={WIDTH}
      height={HEIGHT}
      onMouseDown={(e) => {
        if (e.target !== e.target.getStage()) return;
        const pos = e.target.getStage()!.getPointerPosition()!;
        setMarquee({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y });
      }}
      onMouseMove={(e) => {
        if (!marquee) return;
        const pos = e.target.getStage()!.getPointerPosition()!;
        setMarquee({ ...marquee, x: pos.x, y: pos.y });
      }}
      onMouseUp={() => {
        if (!marquee) return;
        const dx = Math.abs(marquee.x - marquee.startX);
        const dy = Math.abs(marquee.y - marquee.startY);

        if (dx > 5 || dy > 5) {
          didMarquee.current = true;
          const left = Math.min(marquee.startX, marquee.x);
          const right = Math.max(marquee.startX, marquee.x);
          const top = Math.min(marquee.startY, marquee.y);
          const bottom = Math.max(marquee.startY, marquee.y);

          const selected = new Set<string>();
          placements.forEach((p) => {
            if (p.x >= left && p.x <= right && p.y >= top && p.y <= bottom) {
              selected.add(p.choristId);
            }
          });
          setSelectedIds(selected);
        }
        setMarquee(null);
      }}
      onClick={(e) => {
        if (didMarquee.current) {
          didMarquee.current = false;
          return;
        }
        if (e.target === e.target.getStage()) {
          setSelectedIds(new Set());
        }
      }}
    >
      <Layer listening={false}>{gridLines}</Layer>
      <Layer>
        {placements.map((p) => {
          const chorist = chorists.find((c) => c.id === p.choristId);
          if (!chorist) return null;
          const { color, shape } = getChoristVisuals(p.choristId);
          return (
            <Group
              key={p.choristId}
              x={p.x}
              y={p.y}
              draggable
              onDragStart={(e) => {
                const node = e.target;
                setDragStart({ x: node.x(), y: node.y() });
                if (!selectedIds.has(p.choristId)) {
                  setSelectedIds(new Set([p.choristId]));
                }
              }}
              onDragEnd={(e) => {
                const node = e.target;
                const newX = snapToGrid(node.x());
                const newY = snapToGrid(node.y());
                node.position({ x: newX, y: newY });

                if (dragStart && selectedIds.has(p.choristId) && selectedIds.size > 1) {
                  const dx = newX - dragStart.x;
                  const dy = newY - dragStart.y;
                  setPlacements(
                    placements.map((pl) =>
                      selectedIds.has(pl.choristId)
                        ? { ...pl, x: snapToGrid(pl.x + dx), y: snapToGrid(pl.y + dy) }
                        : pl,
                    ),
                  );
                } else {
                  setPlacements(
                    placements.map((pl) =>
                      pl.choristId === p.choristId ? { ...pl, x: newX, y: newY } : pl,
                    ),
                  );
                }
                setDragStart(null);
              }}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                onRemove(p.choristId);
              }}
              onClick={(e) => {
                if (e.evt.shiftKey) {
                  const next = new Set(selectedIds);
                  if (next.has(p.choristId)) {
                    next.delete(p.choristId);
                  } else {
                    next.add(p.choristId);
                  }
                  setSelectedIds(next);
                } else {
                  setSelectedIds(new Set([p.choristId]));
                }
              }}
            >
              <ChoristShape color={color} shape={shape} selected={selectedIds.has(p.choristId)} />
              <Text
                text={chorist.name}
                fontSize={11}
                fill="#333"
                y={22}
                align="center"
                offsetX={25}
                width={50}
              />
            </Group>
          );
        })}
      </Layer>
      <Layer listening={false}>
        {marquee && (
          <Rect
            x={Math.min(marquee.startX, marquee.x)}
            y={Math.min(marquee.startY, marquee.y)}
            width={Math.abs(marquee.x - marquee.startX)}
            height={Math.abs(marquee.y - marquee.startY)}
            fill="rgba(0, 100, 255, 0.1)"
            stroke="rgba(0, 100, 255, 0.5)"
            strokeWidth={1}
          />
        )}
      </Layer>
    </Stage>
  );
}
