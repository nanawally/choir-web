"use client";

import { Circle, Group, Layer, Line, Rect, RegularPolygon, Stage, Text } from "react-konva";
import RosterPanel from "./components/RosterPanel";
import { useEffect, useRef, useState } from "react";
import { apiFetch, getAssignments, listVoiceGroups } from "./lib/api";
import FormationBar from "./components/FormationBar";
import VoiceGroupPanel from "./components/VoiceGroupPanel";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

type Chorist = { id: string; name: string };
type Placement = { choristId: string; x: number; y: number };

function snapToGrid(value: number) {
  return Math.round(value / CELL_SIZE) * CELL_SIZE; // round the position to the nearest multiple of the cell size
}

export default function Home() {
  const [chorists, setChorists] = useState<Chorist[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [assignments, setAssignments] = useState<
    { choristId: string; voicePartId: string }[]
  >([]);
  const [voiceGroups, setVoiceGroups] = useState<
    {
      id: string;
      name: string;
      parts: {
        id: string;
        name: string;
        color: string;
        shape: string;
      }[];
    }[]
  >([]);
  const [marquee, setMarquee] = useState<{
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const didMarquee = useRef(false);

  useEffect(() => {
    apiFetch("/chorists")
      .then((res) => res.json())
      .then(setChorists);
  }, []);

  useEffect(() => {
    listVoiceGroups().then(setVoiceGroups);
  }, []);

  useEffect(() => {
    if (activeGroupId) {
      getAssignments(activeGroupId).then(setAssignments);
    }
  }, [activeGroupId]);

  function handleSelectGroup(id: string | null) {
    setActiveGroupId(id);
    if (!id) setAssignments([]);
  }
  
  const placedIds = new Set(placements.map((p) => p.choristId));

  function handlePlace(choristId: string) {
    // Find the first empty grid cell
    const occupied = new Set(placements.map((p) => `${p.x},${p.y}`));
    for (let y = CELL_SIZE; y < HEIGHT; y += CELL_SIZE) {
      for (let x = CELL_SIZE; x < WIDTH; x += CELL_SIZE) {
        if (!occupied.has(`${x},${y}`)) {
          setPlacements([...placements, { choristId, x, y }]);
          return;
        }
      }
    }
  }

  function handleRemove(choristId: string) {
    setPlacements(placements.filter((p) => p.choristId !== choristId));
  }

  function handleLoad(
    loaded: { choristId: string; gridX: number; gridY: number }[],
  ) {
    setPlacements(
      loaded.map((p) => ({ choristId: p.choristId, x: p.gridX, y: p.gridY })),
    );
  }

  function getChoristVisuals(choristId: string): {
    color: string;
    shape: string;
  } {
    if (!activeGroupId) return { color: "grey", shape: "circle" };
    const assignment = assignments.find((a) => a.choristId === choristId);
    if (!assignment) return { color: "#ccc", shape: "circle" }; // unassigned = light grey;
    const group = voiceGroups.find((g) => g.id === activeGroupId);
    const part = group?.parts.find((p) => p.id === assignment.voicePartId);
    if (!part) return { color: "grey", shape: "circle" };
    return { color: part.color, shape: part.shape };
  }

  const gridLines = [];
  // Vertical lines
  for (let x = 0; x <= WIDTH; x += CELL_SIZE) {
    gridLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, HEIGHT]}
        stroke="#ddd"
        strokeWidth={1}
      />,
    );
  }
  // Horizontal lines
  for (let y = 0; y <= HEIGHT; y += CELL_SIZE) {
    gridLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, WIDTH, y]}
        stroke="#ddd"
        strokeWidth={1}
      />,
    );
  }

  return (
    <div className="flex h-screen">
      <RosterPanel
        chorists={chorists}
        setChorists={setChorists}
        placedIds={placedIds}
        onPlace={handlePlace}
        activeGroup={voiceGroups.find((g) => g.id === activeGroupId) ?? null}
        assignments={assignments}
        onAssignmentsChange={setAssignments}
      />
      <div className="flex flex-col flex-1">
        <FormationBar placements={placements} onLoad={handleLoad} />
        <VoiceGroupPanel
          activeGroupId={activeGroupId}
          onSelectGroup={handleSelectGroup}
          voiceGroups={voiceGroups}
          setVoiceGroups={setVoiceGroups}
        />
        <Stage
          width={WIDTH}
          height={HEIGHT}
          onMouseDown={(e) => {
            // Only start marquee on empty space
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

            // Only select if the rectangle has some real size (not just a click)
            if (dx > 5 || dy > 5) {
              didMarquee.current = true;
              const left = Math.min(marquee.startX, marquee.x);
              const right = Math.max(marquee.startX, marquee.x);
              const top = Math.min(marquee.startY, marquee.y);
              const bottom = Math.max(marquee.startY, marquee.y);

              const selected = new Set<string>();
              placements.forEach((p) => {
                if (
                  p.x >= left &&
                  p.x <= right &&
                  p.y >= top &&
                  p.y <= bottom
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
            {placements.map((p) => {
              const chorist = chorists.find((c) => c.id === p.choristId);
              if (!chorist) return null;
              return (
                <Group
                  key={p.choristId}
                  x={p.x}
                  y={p.y}
                  draggable
                  onDragStart={(e) => {
                    const node = e.target;
                    setDragStart({ x: node.x(), y: node.y() });
                    // Auto-select if dragging an unselected shape
                    if (!selectedIds.has(p.choristId)) {
                      setSelectedIds(new Set([p.choristId]));
                    }
                  }}
                  onDragEnd={(e) => {
                    const node = e.target;
                    const newX = snapToGrid(node.x());
                    const newY = snapToGrid(node.y());
                    node.position({ x: newX, y: newY });

                    if (
                      dragStart &&
                      selectedIds.has(p.choristId) &&
                      selectedIds.size > 1
                    ) {
                      // Calculate how far this shape moved
                      const dx = newX - dragStart.x;
                      const dy = newY - dragStart.y;
                      // Move all selected shapes by the same delta
                      setPlacements(
                        placements.map((pl) =>
                          selectedIds.has(pl.choristId)
                            ? {
                                ...pl,
                                x: snapToGrid(pl.x + dx),
                                y: snapToGrid(pl.y + dy),
                              }
                            : pl,
                        ),
                      );
                    } else {
                      // Single shape drag
                      setPlacements(
                        placements.map((pl) =>
                          pl.choristId === p.choristId
                            ? { ...pl, x: newX, y: newY }
                            : pl,
                        ),
                      );
                    }
                    setDragStart(null);
                  }}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleRemove(p.choristId);
                  }}
                  onClick={(e) => {
                    if (e.evt.shiftKey) {
                      // Shift + click toggles selection
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
                  {(() => {
                    const { color, shape } = getChoristVisuals(p.choristId);
                    const selected = selectedIds.has(p.choristId);
                    const stroke = selected ? "blue" : undefined;
                    const strokeWidth = selected ? 2 : 0;
                    if (shape === "square") {
                      return (
                        <Rect
                          width={36}
                          height={36}
                          offsetX={18}
                          offsetY={18}
                          fill={color}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                        />
                      );
                    }
                    if (shape === "triangle") {
                      return (
                        <RegularPolygon
                          sides={3}
                          radius={22}
                          fill={color}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                        />
                      );
                    }
                    return (
                      <Circle
                        radius={20}
                        fill={color}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                      />
                    );
                  })()}
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
      </div>
    </div>
  );
}
