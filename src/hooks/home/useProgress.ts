import { createEffect, onMount, onCleanup, createSignal } from 'solid-js';
import { useCanvas } from '@/hooks/home/useCanvas';
import { useNodes } from '@/hooks/home/useNodes';
import { oldNode } from '@/types/home/roadmap';

// Corrected imports as you provided
import { CanvasRenderer } from '@/utils/home/canvas/canvaUtils';
import { processConceptData } from '@/utils/home/canvas/nodesUtils';
import { loadSyllabusFile } from '@/utils/home/courses/syllabusUtils';

export default function useProgress() {
	const [moduleName, setModuleName] = createSignal('');
	const [parentFolder, setParentFolder] = createSignal('');

	onMount(() => {
		const segments = location.pathname.split('/').filter(Boolean);
		const courseIndex = segments.findIndex((segment) => segment === 'course' || segment === 'library');

		if (courseIndex !== -1 && courseIndex + 1 < segments.length) {
			const path = window.location.pathname;
			const pathParts = path.split('/');
			const modulename = pathParts.pop() || '';
			const parentname = pathParts.pop() || '';
			setModuleName(modulename);
			setParentFolder(parentname);
		}
	});

	const canvas = useCanvas();
	const nodeManager = useNodes();
	const [activeTooltipId, setActiveTooltipId] = createSignal<string | null>(null);

	let renderer: CanvasRenderer | null = null;

	// --- Event Handlers ---
	const handleMouseMove = (e: MouseEvent): void => {
		if (nodeManager.draggedNodeId()) {
			nodeManager.handleNodeDrag(e, canvas.lastMouse(), canvas.setLastMouse, canvas.transform());
		}
	};

	const handleMouseUp = (e: MouseEvent): void => {
		if (e.button === 0) {
			nodeManager.stopNodeDrag();
		}
	};

	const handleNodeMouseDown = (e: MouseEvent, node: oldNode): void => {
		const canvasElement = canvas.getCanvasElement?.() || null;
		nodeManager.handleNodeMouseDown(e, node, canvas.setLastMouse, canvasElement);
	};

	const handleCanvasClick = (e: MouseEvent): void => {
		if (e.button === 0) {
			setActiveTooltipId(null);
			canvas.handleMouseDown?.(e);
		}
	};

	const handleCanvasContextMenu = (e: MouseEvent): void => {
		e.preventDefault();
	};

	const handleTooltipToggle = (nodeId: string | null): void => {
		setActiveTooltipId(nodeId);
	};

	// --- Node Action Handlers ---
	const handleDeleteNode = (nodeId: string): void => {
		nodeManager.deleteNode(nodeId);
		setActiveTooltipId(null);
	};

	const handleMarkNotLearned = (nodeId: string): void => {
		nodeManager.markAsNotLearned(nodeId);
		setActiveTooltipId(null);
	};

	const handleMarkLearned = (nodeId: string): void => {
		nodeManager.markAsLearned(nodeId);
		setActiveTooltipId(null);
	};

	// --- Canvas Drawing ---
	const drawCanvasContent = (): void => {
		const ctx = canvas.ctx();
		const canvasElement = canvas.getCanvasElement?.();
		if (!ctx || !canvasElement) return;

		if (!renderer) {
			renderer = new CanvasRenderer(ctx, canvasElement);
		}

		renderer.render(nodeManager.nodes(), nodeManager.connections(), canvas.transform());
	};

	// --- Lifecycle and Effects ---
	onMount(() => {
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	});

	onCleanup(() => {
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	});

	// Re-draw the canvas whenever nodes, connections, or the transform changes
	createEffect(() => {
		// Touch reactive sources so Solid tracks dependencies
		nodeManager.nodes();
		nodeManager.connections();
		canvas.transform();
		drawCanvasContent();
	});

	// --- Data Fetching ---
	async function createConcepts() {
		// Clear existing nodes to show a loading state
		nodeManager.setNodes([]);
		nodeManager.setConnections([]);

		// Ensure moduleName is present
		if (!moduleName() || moduleName().trim() === '') {
			console.error('Module name is missing. Cannot generate concepts.');
			return;
		}

		let syllabus = await loadSyllabusFile(parentFolder(), moduleName());

		// Helper to normalize a syllabus array from various response shapes
		const extractSyllabus = (obj: any): any[] | null => {
			if (Array.isArray(obj)) return obj;
			if (Array.isArray(obj?.syllabus)) return obj.syllabus;
			if (Array.isArray(obj?.data?.syllabus)) return obj.data.syllabus;
			if (Array.isArray(obj?.chapters)) return obj.chapters;
			return null;
		};

		// If no local syllabus, try to generate one
		if (!Array.isArray(syllabus) || syllabus.length === 0) {
			try {
				const resp = await fetch('http://localhost:4999/module-syllabus', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ module_name: moduleName() }),
				});
				if (!resp.ok) {
					const errText = await resp.text();
					console.error('Failed to generate syllabus:', errText);
					return; // Avoid sending empty syllabus -> 400
				}
				const genData = await resp.json();
				const generated = extractSyllabus(genData);
				if (!generated || generated.length === 0) {
					console.error('Generated syllabus is empty or invalid:', genData);
					return; // Avoid sending empty syllabus -> 400
				}
				syllabus = generated;
			} catch (e) {
				console.error('Error while generating syllabus:', e);
				return; // Avoid sending empty syllabus -> 400
			}
		}

		const body = {
			moduleName: moduleName(),
			syllabus,
		};

		try {
			const response = await fetch('http://localhost:4999/module-concepts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Server error:', errorText);
				return;
			}

			const data = await response.json();
			
			if (data && data.concepts) {
				const { nodes, connections } = processConceptData(data);
				nodeManager.setNodes(nodes);
				nodeManager.setConnections(connections);
			} else {
				console.error('Failed to create concepts or invalid data received:', data);
			}

		} catch (error) {
			console.error('Error creating concepts:', error);
		}
	}

	return {
		canvas,
		nodeManager,
		activeTooltipId,
		handleCanvasClick,
		handleCanvasContextMenu,
		handleNodeMouseDown,
		handleTooltipToggle,
		handleDeleteNode,
		handleMarkNotLearned,
		handleMarkLearned,
		createConcepts,
	};
}