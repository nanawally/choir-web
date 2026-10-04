import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "../../lib/LanguageContext";
import { Undo, Redo } from "lucide-react";
import { Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import Konva from "konva";
import ChoristShape from "./ChoristShape";
import { shortName } from "../../lib/choristName";

const CELL_SIZE = 50;
const ARC_PADDING = 40; // pixels of padding around the outermost arc
// Fixed virtual canvas size for grid mode — content scales proportionally with screen
const GRID_VIRTUAL_WIDTH = 1400;
const GRID_VIRTUAL_HEIGHT = 800;

type Chorist = { id: string; firstName: string; lastName: string };
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
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
  virtualWidth: number;
  virtualHeight: number;
  activeFormationId: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
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
  rowSpacing: number,
): { x: number; y: number } {
  const radius = (gridY + 1) * rowSpacing;
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
  canvasWidth,
  canvasHeight,
  scale,
  virtualWidth,
  virtualHeight,
  activeFormationId,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: Props) {
  const { t } = useTranslation();

  // Grid mode uses a fixed virtual reference size so content scales with the screen.
  // Arc mode keeps the passed-in virtualWidth/Height (responsive to window size).
  const isGridMode = rowSizes.length === 0;
  const effectiveVW = isGridMode ? GRID_VIRTUAL_WIDTH : virtualWidth;
  const effectiveVH = isGridMode ? GRID_VIRTUAL_HEIGHT : virtualHeight;
  const effectiveScale = isGridMode ? canvasWidth / GRID_VIRTUAL_WIDTH : scale;

  // Center the formation on the canvas by computing the offset to the bounding box mid-point.
  let gridLayerX = 0;
  let gridLayerY = 0;
  if (isGridMode && placements.length > 0) {
    const minGX = Math.min(...placements.map((p) => p.gridX));
    const maxGX = Math.max(...placements.map((p) => p.gridX));
    const minGY = Math.min(...placements.map((p) => p.gridY));
    const maxGY = Math.max(...placements.map((p) => p.gridY));
    const contentCenterX = ((minGX + maxGX) / 2 + 0.5) * CELL_SIZE;
    const contentCenterY = ((minGY + maxGY) / 2 + 0.5) * CELL_SIZE;
    gridLayerX = canvasWidth / 2 - contentCenterX * effectiveScale;
    gridLayerY = canvasHeight / 2 - contentCenterY * effectiveScale;
  }

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

  // --- Formation transition animation ---
  // offsetX/offsetY on each Group starts at (to - from) and tweens to 0.
  // Visual position = (x - offsetX, y - offsetY), so it starts at "from" and ends at "to".
  const committedPixelPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const fromPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [animOffset, setAnimOffset] = useState<Map<string, { x: number; y: number }>>(new Map());
  const prevFormationIdRef = useRef<string | null>(null);
  const animCancelRef = useRef<(() => void) | null>(null);

  // Center of the virtual coordinate space (for arc rendering)
  const centerX = effectiveVW / 2;
  const centerY = effectiveVH - 20;

  // Compute row spacing so the outermost arc fills the available space
  const numRows = rowSizes.length || 1;
  const maxRadiusH = centerX - ARC_PADDING; // horizontal limit (half width minus padding)
  const maxRadiusV = centerY - ARC_PADDING; // vertical limit (full height minus padding)
  const rowSpacing = Math.min(maxRadiusH, maxRadiusV) / numRows;

  // Shrink shapes when arc positions are close together
  let shapeScale = 1;
  if (rowSizes.length > 0) {
    let minGap = Infinity;
    rowSizes.forEach((rowSize, gy) => {
      if (rowSize < 2) return;
      for (let gx = 0; gx < rowSize - 1; gx++) {
        const a = arcPosition(gx, gy, rowSize, centerX, centerY, rowSpacing);
        const b = arcPosition(
          gx + 1,
          gy,
          rowSize,
          centerX,
          centerY,
          rowSpacing,
        );
        const gap = Math.hypot(b.x - a.x, b.y - a.y);
        if (gap < minGap) minGap = gap;
      }
    });
    if (minGap < 50) {
      shapeScale = Math.max(0.4, minGap / 50);
    }
  }
  
  // Precompute current pixel positions for all placed chorists
  const currentPixelPos = new Map(
    placements.map((p) => [p.choristId, toPixel(p.gridX, p.gridY)]),
  );

  // Capture "from" positions just before they change.
  // useLayoutEffect runs after every render (before useEffects), so when
  // activeFormationId changes we save the previous committed positions first.
  useLayoutEffect(() => {
    if (activeFormationId !== prevFormationIdRef.current) {
      fromPosRef.current = committedPixelPosRef.current; // snapshot before overwrite
      prevFormationIdRef.current = activeFormationId;
    }
    committedPixelPosRef.current = currentPixelPos;
  });

  // Animate chorists to their new positions when the formation changes.
  useEffect(() => {
    if (!activeFormationId) {
      animCancelRef.current?.();
      return;
    }

    const from = fromPosRef.current;
    const to = currentPixelPos;

    animCancelRef.current?.();
    let cancelled = false;
    animCancelRef.current = () => { cancelled = true; };

    const DURATION = 1000;
    const startTime = performance.now();

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function tick(now: number) {
      if (cancelled) return;
      const t = Math.min((now - startTime) / DURATION, 1);
      const e = easeInOut(t);
      const next = new Map<string, { x: number; y: number }>();
      to.forEach((tp, id) => {
        const fp = from.get(id) ?? tp; // new chorist → appears at target
        next.set(id, {
          x: (tp.x - fp.x) * (1 - e),
          y: (tp.y - fp.y) * (1 - e),
        });
      });
      setAnimOffset(next);
      if (t < 1) requestAnimationFrame(tick);
      else {
        setAnimOffset(new Map());
        animCancelRef.current = null;
      }
    }

    requestAnimationFrame(tick);
    return () => { cancelled = true; animCancelRef.current = null; };
  }, [activeFormationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { animCancelRef.current?.(); }, []);

  // Convert physical pointer position to virtual coordinates (accounts for grid layer offset)
  function toVirtual(pos: { x: number; y: number }) {
    return {
      x: (pos.x - gridLayerX) / effectiveScale,
      y: (pos.y - gridLayerY) / effectiveScale,
    };
  }

  function snapToArc(
    pixelX: number,
    pixelY: number,
  ): { x: number; y: number; gridX: number; gridY: number } | null {
    let closest: { x: number; y: number; gridX: number; gridY: number } | null =
      null;
    let minDist = Infinity;

    rowSizes.forEach((rowSize, gridY) => {
      for (let gridX = 0; gridX < rowSize; gridX++) {
        const pos = arcPosition(
          gridX,
          gridY,
          rowSize,
          centerX,
          centerY,
          rowSpacing,
        );
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
      return arcPosition(gridX, gridY, rowSize, centerX, centerY, rowSpacing);
    }
    return { x: gridX * CELL_SIZE, y: gridY * CELL_SIZE };
  }

  // Grid lines drawn in virtual coordinate space
  const gridLines = [];
  if (rowSizes.length > 0) {
    // Arc mode: draw semicircles and position dots
    rowSizes.forEach((rowSize, gridY) => {
      const radius = (gridY + 1) * rowSpacing;
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
        const pos = arcPosition(
          gridX,
          gridY,
          rowSize,
          centerX,
          centerY,
          rowSpacing,
        );
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
    // Rectangular grid — extend to cover the full canvas regardless of the centering offset.
    // The layer has x={gridLayerX} scaleX={effectiveScale}, so the canvas edges in virtual
    // coordinates are: left = -gridLayerX/effectiveScale, right = (canvasWidth-gridLayerX)/effectiveScale
    const leftV = Math.floor(-gridLayerX / effectiveScale / CELL_SIZE) * CELL_SIZE;
    const rightV = Math.ceil((canvasWidth - gridLayerX) / effectiveScale / CELL_SIZE) * CELL_SIZE;
    const topV = Math.floor(-gridLayerY / effectiveScale / CELL_SIZE) * CELL_SIZE;
    const bottomV = Math.ceil((canvasHeight - gridLayerY) / effectiveScale / CELL_SIZE) * CELL_SIZE;
    for (let x = leftV; x <= rightV; x += CELL_SIZE) {
      gridLines.push(
        <Line key={`v-${x}`} points={[x, topV, x, bottomV]} stroke="#ddd" strokeWidth={1} />,
      );
    }
    for (let y = topV; y <= bottomV; y += CELL_SIZE) {
      gridLines.push(
        <Line key={`h-${y}`} points={[leftV, y, rightV, y]} stroke="#ddd" strokeWidth={1} />,
      );
    }
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-1 right-14 z-10 flex flex-col gap-1 items-end">
        <button
          onClick={handleDownload}
          className="px-2 py-1 bg-surface-alt hover:bg-surface-alt rounded text-sm"
        >
          {t("common.downloadPng")}
        </button>
        <div className="flex gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2 py-1 bg-surface-alt hover:bg-surface-alt rounded disabled:opacity-40"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2 py-1 bg-surface-alt hover:bg-surface-alt rounded disabled:opacity-40"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>
      <Stage
        ref={stageRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={(e) => {
          if (e.target !== e.target.getStage()) return;
          const raw = e.target.getStage()!.getPointerPosition()!;
          const pos = toVirtual(raw);
          setMarquee({ startX: pos.x, startY: pos.y, x: pos.x, y: pos.y });
        }}
        onMouseMove={(e) => {
          if (!marquee) return;
          const raw = e.target.getStage()!.getPointerPosition()!;
          const pos = toVirtual(raw);
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
        <Layer listening={false} scaleX={effectiveScale} scaleY={effectiveScale} x={gridLayerX} y={gridLayerY}>
          {/* White background so exported PNGs aren't transparent (invisible in dark mode).
              In grid mode, sized to cover the full canvas regardless of the centering offset. */}
          <Rect
            x={isGridMode ? -gridLayerX / effectiveScale : 0}
            y={isGridMode ? -gridLayerY / effectiveScale : 0}
            width={isGridMode ? canvasWidth / effectiveScale : effectiveVW}
            height={isGridMode ? canvasHeight / effectiveScale : effectiveVH}
            fill="white"
          />
          {gridLines}
        </Layer>
        <Layer scaleX={effectiveScale} scaleY={effectiveScale} x={gridLayerX} y={gridLayerY}>
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
              const pos = currentPixelPos.get(p.choristId) ?? toPixel(p.gridX, p.gridY);
              const offset = animOffset.get(p.choristId) ?? { x: 0, y: 0 };
              return (
                <Group
                  key={p.choristId}
                  x={pos.x}
                  y={pos.y}
                  offsetX={offset.x}
                  offsetY={offset.y}
                  draggable
                  onDragStart={(e) => {
                    // Cancel any in-progress animation so drag coordinates are clean
                    if (animCancelRef.current) {
                      animCancelRef.current();
                      setAnimOffset(new Map());
                    }
                    const node = e.target;
                    setDragStart({ x: node.x(), y: node.y() });
                    if (!selectedIds.has(p.choristId)) {
                      setSelectedIds(new Set([p.choristId]));
                    }
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const occupied = new Set(
                      placements
                        .filter((pl) => pl.choristId !== p.choristId)
                        .map((pl) => `${pl.gridX},${pl.gridY}`),
                    );
                    const origPos = toPixel(p.gridX, p.gridY);

                    if (rowSizes.length > 0) {
                      const snapped = snapToArc(node.x(), node.y());
                      if (
                        !snapped ||
                        occupied.has(`${snapped.gridX},${snapped.gridY}`)
                      ) {
                        // Snap back to original position
                        node.position(origPos);
                        return;
                      }
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
                      const newGridX = Math.round(newX / CELL_SIZE);
                      const newGridY = Math.round(newY / CELL_SIZE);

                      if (
                        dragStart &&
                        selectedIds.has(p.choristId) &&
                        selectedIds.size > 1
                      ) {
                        const dx = newX - origPos.x;
                        const dy = newY - origPos.y;
                        const gridDx = Math.round(dx / CELL_SIZE);
                        const gridDy = Math.round(dy / CELL_SIZE);
                        // Check all moved positions for collisions with non-selected chorists
                        const nonSelected = placements.filter(
                          (pl) => !selectedIds.has(pl.choristId),
                        );
                        const nonSelectedSet = new Set(
                          nonSelected.map((pl) => `${pl.gridX},${pl.gridY}`),
                        );
                        const hasCollision = placements
                          .filter((pl) => selectedIds.has(pl.choristId))
                          .some((pl) =>
                            nonSelectedSet.has(
                              `${pl.gridX + gridDx},${pl.gridY + gridDy}`,
                            ),
                          );
                        if (hasCollision) {
                          node.position(origPos);
                          return;
                        }
                        node.position({ x: newX, y: newY });
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
                        if (occupied.has(`${newGridX},${newGridY}`)) {
                          node.position(origPos);
                          return;
                        }
                        node.position({ x: newX, y: newY });
                        setPlacements(
                          placements.map((pl) =>
                            pl.choristId === p.choristId
                              ? {
                                  ...pl,
                                  gridX: newGridX,
                                  gridY: newGridY,
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
                    shapeScale={shapeScale}
                  />
                  <Text
                    text={shortName(chorist, chorists)}
                    fontSize={11 * shapeScale}
                    fill="#333"
                    opacity={opacity}
                    y={22 * shapeScale}
                    align="center"
                    offsetX={25 * shapeScale}
                    width={50 * shapeScale}
                  />
                </Group>
              );
            })}
        </Layer>
        <Layer listening={false} scaleX={effectiveScale} scaleY={effectiveScale} x={gridLayerX} y={gridLayerY}>
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
