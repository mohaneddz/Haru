import { Node, Transform } from '@/types/home/roadmap';

interface Props {
    node: Node;
    transform: Transform;
    isPinned: boolean;
    onClose?: () => void;
    onDelete?: (nodeId: string) => void;
    onMarkNotLearned?: (nodeId: string) => void;
    onMarkLearned?: (nodeId: string) => void;
}

export default function ConceptTooltip(props: Props) {
    const handleDelete = (e: MouseEvent) => {
        console.log('Delete node:', props.node.id);
        e.stopPropagation();
        props.onDelete?.(props.node.id);
        props.onClose?.();
    };

    const handleMarkNotLearned = (e: MouseEvent) => {
        e.stopPropagation();
        props.onMarkNotLearned?.(props.node.id);
        props.onClose?.();
    };

    const handleMarkLearned = (e: MouseEvent) => {
        e.stopPropagation();
        props.onMarkLearned?.(props.node.id);
        props.onClose?.();
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    return (
        <div
            class="absolute bg-gray-800 text-text p-3 rounded-lg shadow-lg z-50 max-w-xs"
            style={{
                left: `${props.transform.x + (props.node.x + props.node.width / 2) * props.transform.scale}px`,
                top: `${props.transform.y + props.node.y * props.transform.scale - 140}px`,
                'font-size': '12px',
                transform: 'translateX(-50%)',
                'pointer-events': props.isPinned ? 'auto' : 'none',
            }}
        >
            <div class="font-semibold mb-1 flex items-center gap-2">
                {props.node.text}
                {props.node.learned && (
                    <span class="text-green-400 text-xs">✓ Learned</span>
                )}
            </div>
            
            <div class="text-gray-300 text-xs mb-3">
                {props.isPinned ? 'Click to unpin this tooltip.' : 'Click to pin this tooltip.'} 
            </div>

            {props.node.learned && props.node.learnedDate && (
                <div class="text-green-300 text-xs mb-2">
                    Learned on: {formatDate(props.node.learnedDate)}
                </div>
            )}
            
            {props.isPinned && (
                <>
                    <div class="text-xs text-blue-300 mb-2">
                        📌 Pinned
                    </div>
                    
                    {/* Action buttons */}
                    <div class="flex gap-2 mt-2 flex-wrap">
                        {props.node.learned ? (
                            <button
                                class="bg-primary hover:bg-primary-dark-1 text-text text-xs px-2 py-1 rounded transition-colors"
                                onClick={handleMarkNotLearned}
                            >
                                Not Learned
                            </button>
                        ) : (
                            <button
                                class="bg-primary-dark-2 hover:bg-primary-dark-3 text-text text-xs px-2 py-1 rounded transition-colors"
                                onClick={handleMarkLearned}
                            >
                                Learned
                            </button>
                        )}
                        <button
                            class="bg-secondary-light-3 hover:bg-secondary-light-2 text-text text-xs px-2 py-1 rounded transition-colors"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </>
            )}
            
            {/* Arrow pointing down to the node */}
            <div 
                class="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"
                style={{
                    left: '50%',
                    bottom: '-4px',
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
};