export interface WhiteboardEvent {
  type: 'draw' | 'erase' | 'clear' | 'text' | 'shape';
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  color?: string;
  size?: number;
  text?: string;
  shapeType?: 'rect' | 'circle' | 'line';
}
