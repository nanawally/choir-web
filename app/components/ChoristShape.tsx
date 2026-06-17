import { Circle, Rect, RegularPolygon } from "react-konva";

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
