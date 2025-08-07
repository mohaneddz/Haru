interface Props {
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'basic' | '';
    class?: string;
    children?: any;
}

export default function Button(props: Props) {

    const getVariantClass = () => {
        switch (props.variant) {
            case 'primary':
                return 'bg-accent-dark-1 text-text';
            case 'secondary':
                return 'bg-gray-500 text-text hover:bg-gray-600';
            case 'danger':
                return 'bg-red-500 text-text hover:bg-red-600';
            case 'basic':
                return 'bg-gray-500 text-text hover:bg-gray-400';
            case 'ghost':
                return 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-text border border-gray-300';
            default:
                return ' ';
        }
    }

    return (
        <div class={`cursor-pointer hover:brightness-105 active:brightness-95 hover:scale-102 active:scale-95 transition-all duration-100 py-4 px-2 rounded-sm ${getVariantClass()} ${props.class}`} onclick={props.onClick}>
            {props.children}
        </div>
    );
};
