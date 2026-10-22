export const CELL_SIZE = 50;
export const GRID_WIDTH = 800;
export const GRID_HEIGHT = 600;

export type Chorist = { id: string; firstName: string; lastName: string; notes: string | null };
export type Placement = { choristId: string; gridX: number; gridY: number };
export type VoiceGroup = {
  id: string;
  name: string;
  isStandard: boolean;
  parts: { id: string; name: string; color: string; shape: string }[];
};
export type Assignment = { choristId: string; voicePartId: string };
