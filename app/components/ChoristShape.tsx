import { Circle, Line, Rect, RegularPolygon } from "react-konva";

type Props = {
  color: string;
  shape: string;
  selected: boolean;
  opacity?: number;
};

export default function ChoristShape({ color, shape, selected, opacity = 1 }: Props) {
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
        opacity={opacity}
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
        opacity={opacity}
      />
    );
  }

  if (shape === "diamond") {
    // A square rotated 45 degrees
    return (
      <Rect
        width={30}
        height={30}
        offsetX={15}
        offsetY={15}
        rotation={45}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (shape === "cross") {
    // Plus/cross shape drawn as a closed 12-point polygon
    const a = 7;  // half-width of each arm
    const b = 18; // half-length of each arm
    return (
      <Line
        points={[
          -a, -b,  a, -b,  // top of vertical arm
           a,  -a,  b, -a,  // top-right corner into right arm
           b,   a,  a,  a,  // right arm down
           a,   b, -a,  b,  // bottom of vertical arm
          -a,   a, -b,  a,  // bottom-left corner into left arm
          -b,  -a, -a, -a,  // left arm up
        ]}
        closed
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (shape === "star") {
    // 5-point star as a closed line shape
    const r = 20;
    const inner = 9;
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      // Outer point
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      points.push(r * Math.cos(outerAngle), r * Math.sin(outerAngle));
      // Inner point
      const innerAngle = outerAngle + Math.PI / 5;
      points.push(inner * Math.cos(innerAngle), inner * Math.sin(innerAngle));
    }
    return (
      <Line
        points={points}
        closed
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  // Default: circle
  return (
    <Circle
      radius={20}
      fill={color}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}
