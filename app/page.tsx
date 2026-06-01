"use client";

import { Circle, Group, Layer, Line, Stage, Text } from "react-konva";
import RosterPanel from "./components/RosterPanel";
import { useEffect, useState } from "react";
import { apiFetch } from "./lib/api";
import FormationBar from "./components/FormationBar";

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

  useEffect(() => {
    apiFetch("/chorists")
      .then((res) => res.json())
      .then(setChorists);
  }, []);

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
      />
      <div className="flex flex-col flex-1">
        <FormationBar placements={placements} onLoad={handleLoad} />
        <Stage width={WIDTH} height={HEIGHT}>
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
                  onDragEnd={(e) => {
                    const node = e.target;
                    const newX = snapToGrid(node.x());
                    const newY = snapToGrid(node.y());
                    node.position({ x: newX, y: newY });
                    setPlacements(
                      placements.map((pl) =>
                        pl.choristId === p.choristId
                          ? { ...pl, x: newX, y: newY }
                          : pl,
                      ),
                    );
                  }}
                  onContextMenu={(e) => {
                    e.evt.preventDefault();
                    handleRemove(p.choristId);
                  }}
                >
                  <Circle radius={20} fill="grey" />
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
        </Stage>
      </div>
    </div>
  );
}
