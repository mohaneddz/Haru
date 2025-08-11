import { Node, Connection, Transform } from '@/types/home/roadmap';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  drawBackground(transform: Transform): void {
    const { x, y, scale } = transform;
    
    const dotSize = 2;
    const spacing = 20;
    const startX = Math.floor((-x / scale) / spacing) * spacing;
    const startY = Math.floor((-y / scale) / spacing) * spacing;
    const endX = startX + (this.canvas.width / scale) + spacing * 2;
    const endY = startY + (this.canvas.height / scale) + spacing * 2;

    this.ctx.fillStyle = '#374151';

    for (let px = startX; px < endX; px += spacing) {
      for (let py = startY; py < endY; py += spacing) {
        this.ctx.beginPath();
        this.ctx.arc(px, py, dotSize, 0, 2 * Math.PI);
        this.ctx.fill();
      }
    }
  }

  drawConnections(nodes: Node[], connections: Connection[], transform: Transform): void {
    this.ctx.strokeStyle = '#9CA3AF';
    this.ctx.lineWidth = 2 / transform.scale;

    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromNodeId);
      const toNode = nodes.find(n => n.id === conn.toNodeId);

      if (fromNode && toNode) {
        const fromX = fromNode.x + fromNode.width / 2;
        const fromY = fromNode.y + fromNode.height / 2;
        const toX = toNode.x + toNode.width / 2;
        const toY = toNode.y + toNode.height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
      }
    });
  }

  render(nodes: Node[], connections: Connection[], transform: Transform): void {
    const { x, y, scale } = transform;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    this.drawBackground(transform);
    this.drawConnections(nodes, connections, transform);

    this.ctx.restore();
  }
}