import { createSignal, onMount } from 'solid-js';
import { Node, Connection, Transform, MousePosition } from '@/types/roadmap';
import { loadNodesFromCSV } from '@/utils/home/canvas/loadNodes';

export function useNodes() {
    const [nodes, setNodes] = createSignal<Node[]>([]);
    const [connections, setConnections] = createSignal<Connection[]>([]);
    const [draggedNodeId, setDraggedNodeId] = createSignal<string | null>(null);

    // Load nodes from CSV on mount
    onMount(async () => {
        const { nodes: csvNodes, connections: csvConnections } = await loadNodesFromCSV();
        setNodes(csvNodes);
        setConnections(csvConnections);
    });

    // ... rest of your existing methods ...

    const handleNodeMouseDown = (
        e: MouseEvent,
        node: Node,
        setLastMouse: (pos: MousePosition) => void,
        canvasRef: HTMLCanvasElement | null
    ): void => {
        e.stopPropagation();
        setDraggedNodeId(node.id);
        setLastMouse({ x: e.clientX, y: e.clientY });
        if (canvasRef) {
            canvasRef.style.cursor = 'grabbing';
        }
    };

    const handleNodeDrag = (
        e: MouseEvent,
        lastMouse: MousePosition,
        setLastMouse: (pos: MousePosition) => void,
        transform: Transform
    ): void => {
        if (draggedNodeId()) {
            const deltaX = (e.clientX - lastMouse.x) / transform.scale;
            const deltaY = (e.clientY - lastMouse.y) / transform.scale;

            setNodes((prevNodes) =>
                prevNodes.map((node) =>
                    node.id === draggedNodeId()
                        ? { ...node, x: node.x + deltaX, y: node.y + deltaY }
                        : node
                )
            );

            setLastMouse({ x: e.clientX, y: e.clientY });
        }
    };

    const addNode = (canvasRef: HTMLCanvasElement | null, transform: Transform): void => {
        if (!canvasRef) return;

        const newX = (canvasRef.width / 2 - transform.x) / transform.scale - 75;
        const newY = (canvasRef.height / 2 - transform.y) / transform.scale - 35;

        const newNode: Node = {
            id: `node-${Date.now()}`,
            x: newX,
            y: newY,
            width: 150,
            height: 70,
            text: 'New Node',
            learned: false,
        };
        setNodes((prev) => [...prev, newNode]);
    };

    const deleteNode = (nodeId: string): void => {
        setNodes(prev => prev.filter(node => node.id !== nodeId));
        setConnections(prev => prev.filter(conn => 
            conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
        ));
    };

    const markAsLearned = (nodeId: string): void => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId 
                ? { ...node, learned: true, learnedDate: new Date() }
                : node
        ));
    };

    const markAsNotLearned = (nodeId: string): void => {
        setNodes(prev => prev.map(node => 
            node.id === nodeId 
                ? { ...node, learned: false, learnedDate: undefined }
                : node
        ));
    };

    const stopNodeDrag = (): void => {
        setDraggedNodeId(null);
    };

    return {
        nodes,
        setNodes,
        connections,
        draggedNodeId,
        handleNodeMouseDown,
        handleNodeDrag,
        addNode,
        deleteNode,
        markAsLearned,
        markAsNotLearned,
        stopNodeDrag,
    };
}