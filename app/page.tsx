"use client";

import { Circle, Layer, Line, Stage } from "react-konva";

const CELL_SIZE = 50;
const WIDTH = 800;
const HEIGHT = 600;

function snapToGrid(value: number) {
  return Math.round(value / CELL_SIZE) * CELL_SIZE; // round the position to the nearest multiple of the cell size
}

export default function Home() {
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
    <Stage width={800} height={600}>
      <Layer listening={false}>{gridLines}</Layer>
      <Layer>
        <Circle
          x={100}
          y={100}
          radius={25}
          fill="steelblue"
          draggable
          onDragEnd={(e) => {
            // what happened (drag event)
            const node = e.target; // who did it happen to
            node.position({
              x: snapToGrid(node.x()),
              y: snapToGrid(node.y()),
            });
          }}
        />
      </Layer>
    </Stage>
  );
}
