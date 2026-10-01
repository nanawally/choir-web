import { Circle, Line, Rect, RegularPolygon } from "react-konva";

type Props = {
  color: string;
  shape: string;
  selected: boolean;
  opacity?: number;
  shapeScale?: number;
};

export default function ChoristShape({ color, shape, selected, opacity = 1, shapeScale = 1 }: Props) {
  const stroke = selected ? "blue" : undefined;
  const strokeWidth = selected ? 2 : 0;

  const s = shapeScale;

  if (shape === "square") {
    const size = 36 * s;
    return (
      <Rect
        width={size}
        height={size}
        offsetX={size / 2}
        offsetY={size / 2}
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
        radius={22 * s}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (shape === "diamond") {
    const size = 30 * s;
    return (
      <Rect
        width={size}
        height={size}
        offsetX={size / 2}
        offsetY={size / 2}
        rotation={45}
        fill={color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    );
  }

  if (shape === "cross") {
    const a = 7 * s;
    const b = 18 * s;
    return (
      <Line
        points={[
          -a, -b,  a, -b,
           a,  -a,  b, -a,
           b,   a,  a,  a,
           a,   b, -a,  b,
          -a,   a, -b,  a,
          -b,  -a, -a, -a,
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
    const r = 20 * s;
    const inner = 9 * s;
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      points.push(r * Math.cos(outerAngle), r * Math.sin(outerAngle));
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
      radius={20 * s}
      fill={color}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
    />
  );
}
