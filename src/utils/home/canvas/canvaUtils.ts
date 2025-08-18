import { oldNode, Connection, Transform } from '@/types/home/roadmap';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  private drawBackground(transform: Transform): void {
    const { x, y, scale } = transform;

    this.ctx.fillStyle = 'rgba(107, 114, 128, 0.5)';

    const dotSize = 1 / scale;
    const spacing = 25;

    const startX = Math.floor((-x / scale) / spacing) * spacing;
    const startY = Math.floor((-y / scale) / spacing) * spacing;
    const endX = startX + (this.canvas.width / scale) + spacing;
    const endY = startY + (this.canvas.height / scale) + spacing;

    for (let px = startX; px < endX; px += spacing) {
      for (let py = startY; py < endY; py += spacing) {
        this.ctx.beginPath();
        this.ctx.arc(px, py, dotSize, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }
  }

  private getEdgePoint(node: oldNode, tx: number, ty: number): { x: number; y: number } {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const dx = tx - cx;
    const dy = ty - cy;

    if (dx === 0 && dy === 0) return { x: cx, y: cy };

    const hw = node.width / 2;
    const hh = node.height / 2;

    const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  private drawArrowhead(fromX: number, fromY: number, toX: number, toY: number, scale: number): void {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const size = 8 / Math.max(scale, 0.0001);
    const a1 = angle + Math.PI / 7;
    const a2 = angle - Math.PI / 7;

    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - size * Math.cos(a1), toY - size * Math.sin(a1));
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - size * Math.cos(a2), toY - size * Math.sin(a2));
    this.ctx.stroke();
  }

  private shiftPointAlong(start: { x: number; y: number }, end: { x: number; y: number }, delta: number) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    return { x: start.x + nx * delta, y: start.y + ny * delta };
  }

  private drawConnections(nodes: oldNode[], connections: Connection[], scale: number): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2 / Math.max(scale, 0.0001);

    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    connections.forEach(conn => {
      const fromNode = nodeMap.get(conn.fromNodeId);
      const toNode = nodeMap.get(conn.toNodeId);
      if (!fromNode || !toNode) return;

      const fromCenterX = fromNode.x + fromNode.width / 2;
      const fromCenterY = fromNode.y + fromNode.height / 2;
      const toCenterX = toNode.x + toNode.width / 2;
      const toCenterY = toNode.y + toNode.height / 2;

      const startEdge = this.getEdgePoint(fromNode, toCenterX, toCenterY);
      const endEdge = this.getEdgePoint(toNode, fromCenterX, fromCenterY);

      const pad = 6 / Math.max(scale, 0.0001);
      const start = this.shiftPointAlong(startEdge, endEdge, pad);
      // FIX: Use a negative pad to move the point outwards from the node edge, making the arrow visible.
      const end = this.shiftPointAlong(endEdge, startEdge, -pad);

      this.ctx.beginPath();
      this.ctx.moveTo(start.x, start.y);
      this.ctx.lineTo(end.x, end.y);
      this.ctx.stroke();

      this.drawArrowhead(start.x, start.y, end.x, end.y, scale);
    });
  }

  public render(nodes: oldNode[], connections: Connection[], transform: Transform): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.scale, transform.scale);

    this.drawBackground(transform);
    this.drawConnections(nodes, connections, transform.scale);

    this.ctx.restore();
  }
}