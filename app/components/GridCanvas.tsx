import { useEffect, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import Konva from "konva";
import ChoristShape from "./ChoristShape";

const CELL_SIZE = 50;
const ROW_SPACING = 120;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; gridX: number; gridY: number };
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
  highlightPartId: string | null;
  onRemove: (choristId: string) => void;
  formationName: string | null;
  hiddenIds: Set<string>;
  rowSizes: number[];
};

function snapToGrid(value: number): number {
  return Math.round(value / CELL_SIZE) * CELL_SIZE;
}

function arcPosition(
  gridX: number,
  gridY: number,
  rowSize: number,
  centerX: number,
  centerY: number,
): { x: number; y: number } {
  const radius = (gridY + 1) * ROW_SPACING;
  if (rowSize === 1) {
    return { x: centerX, y: centerY - radius };
  }
  const PAD = 0.15; // radians inward from each edge so end positions aren't clipped
  const angle = Math.PI - PAD - (gridX / (rowSize - 1)) * (Math.PI - 2 * PAD);
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY - radius * Math.sin(angle),
  };
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
  highlightPartId,
  onRemove,
  formationName,
  hiddenIds,
  rowSizes,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const didMarquee = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const centerX = size.width / 2;
  const centerY = size.height - 20;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect(); // cleanup on unmount
  }, []);

  function snapToArc(
    pixelX: number,
    pixelY: number,
  ): { x: number; y: number; gridX: number; gridY: number } | null {
    let closest: { x: number; y: number; gridX: number; gridY: number } | null =
      null;
    let minDist = Infinity;

    rowSizes.forEach((rowSize, gridY) => {
      for (let gridX = 0; gridX < rowSize; gridX++) {
        const pos = arcPosition(gridX, gridY, rowSize, centerX, centerY);
        const dist = Math.hypot(pixelX - pos.x, pixelY - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closest = { x: pos.x, y: pos.y, gridX, gridY };
        }
      }
    });

    return closest;
  }

  function handleDownload() {
    const stage = stageRef.current;
    if (!stage) return;
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = (formationName || "formation") + ".png";
    link.href = dataURL;
    link.click();
  }

  function getChoristVisuals(choristId: string): {
    color: string;
    shape: string;
  } {
    if (!activeGroupId) return { color: "grey", shape: "circle" };
    const assignment = assignments.find((a) => a.choristId === choristId);
    if (!assignment) return { color: "#ccc", shape: "circle" };
    const group = voiceGroups.find((g) => g.id === activeGroupId);
    const part = group?.parts.find((p) => p.id === assignment.voicePartId);
    if (!part) return { color: "grey", shape: "circle" };
    return { color: part.color, shape: part.shape };
  }

  function toPixel(gridX: number, gridY: number): { x: number; y: number } {
    if (rowSizes.length > 0) {
      const rowSize = rowSizes[gridY] ?? 1;
      return arcPosition(gridX, gridY, rowSize, centerX, centerY);
    }
    return { x: gridX * CELL_SIZE, y: gridY * CELL_SIZE };
  }

  const gridLines = [];
  if (rowSizes.length > 0) {
    // Arc mode: draw semicircles and position dots
    rowSizes.forEach((rowSize, gridY) => {
      const radius = (gridY + 1) * ROW_SPACING;
      // Draw the arc as a series of short line segments (padded to match positions)
      const PAD = 0.15;
      const points: number[] = [];
      for (let a = Math.PI - PAD; a >= PAD; a -= 0.05) {
        points.push(centerX + radius * Math.cos(a));
        points.push(centerY - radius * Math.sin(a));
      }
      gridLines.push(
        <Line
          key={`arc-${gridY}`}
          points={points}
          stroke="#ddd"
          strokeWidth={1}
        />,
      );
      // Draw dots at each valid position
      for (let gridX = 0; gridX < rowSize; gridX++) {
        const pos = arcPosition(gridX, gridY, rowSize, centerX, centerY);
        gridLines.push(
          <Rect
            key={`dot-${gridY}-${gridX}`}
            x={pos.x - 3}
            y={pos.y - 3}
            width={6}
            height={6}
            fill="#ccc"
            cornerRadius={3}
          />,
        );
      }
    });
  } else {
    // Rectangular grid mode
    for (let x = 0; x <= size.width; x += CELL_SIZE) {
      gridLines.push(
        <Line
          key={`v-${x}`}
          points={[x, 0, x, size.height]}
          stroke="#ddd"
          strokeWidth={1}
        />,
      );
    }
    for (let y = 0; y <= size.height; y += CELL_SIZE) {
      gridLines.push(
        <Line
          key={`h-${y}`}
          points={[0, y, size.width, y]}
          stroke="#ddd"
          strokeWidth={1}
        />,
      );
    }
  }

  return (
    <div ref={containerRef} className="flex-1 h-full">
      <div className="flex justify-end mb-1">
        <button
          onClick={handleDownload}
          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
        >
          Download PNG
        </button>
      </div>
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
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
              const pos = toPixel(p.gridX, p.gridY);
              if (
                pos.x >= left &&
                pos.x <= right &&
                pos.y >= top &&
                pos.y <= bottom
              ) {
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
          {placements
            .filter((p) => !hiddenIds.has(p.choristId))
            .map((p) => {
              const chorist = chorists.find((c) => c.id === p.choristId);
              if (!chorist) return null;
              const { color, shape } = getChoristVisuals(p.choristId);
              const dimmed =
                highlightPartId != null &&
                assignments.find((a) => a.choristId === p.choristId)
                  ?.voicePartId !== highlightPartId;
              const opacity = dimmed ? 0.2 : 1;
              const pos = toPixel(p.gridX, p.gridY);
              return (
                <Group
                  key={p.choristId}
                  x={pos.x}
                  y={pos.y}
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

                    if (rowSizes.length > 0) {
                      const snapped = snapToArc(node.x(), node.y());
                      if (!snapped) return;
                      node.position({ x: snapped.x, y: snapped.y });
                      setPlacements(
                        placements.map((pl) =>
                          pl.choristId === p.choristId
                            ? {
                                ...pl,
                                gridX: snapped.gridX,
                                gridY: snapped.gridY,
                              }
                            : pl,
                        ),
                      );
                    } else {
                      const newX = snapToGrid(node.x());
                      const newY = snapToGrid(node.y());
                      node.position({ x: newX, y: newY });

                      if (
                        dragStart &&
                        selectedIds.has(p.choristId) &&
                        selectedIds.size > 1
                      ) {
                        const origPos = toPixel(p.gridX, p.gridY);
                        const dx = newX - origPos.x;
                        const dy = newY - origPos.y;
                        const gridDx = Math.round(dx / CELL_SIZE);
                        const gridDy = Math.round(dy / CELL_SIZE);
                        setPlacements(
                          placements.map((pl) =>
                            selectedIds.has(pl.choristId)
                              ? {
                                  ...pl,
                                  gridX: pl.gridX + gridDx,
                                  gridY: pl.gridY + gridDy,
                                }
                              : pl,
                          ),
                        );
                      } else {
                        setPlacements(
                          placements.map((pl) =>
                            pl.choristId === p.choristId
                              ? {
                                  ...pl,
                                  gridX: Math.round(newX / CELL_SIZE),
                                  gridY: Math.round(newY / CELL_SIZE),
                                }
                              : pl,
                          ),
                        );
                      }
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
                  <ChoristShape
                    color={color}
                    shape={shape}
                    selected={selectedIds.has(p.choristId)}
                    opacity={opacity}
                  />
                  <Text
                    text={chorist.name}
                    fontSize={11}
                    fill="#333"
                    opacity={opacity}
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
    </div>
  );
}
