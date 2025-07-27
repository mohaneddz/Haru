interface Props {
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    class?: string;
    children?: any;
}

export default function Button(props: Props) {

    const getVariantClass = () => {
        switch (props.variant) {
            case 'primary':
                return 'bg-accent-dark-1 text-white';
            case 'secondary':
                return 'bg-gray-500 text-white hover:bg-gray-600';
            case 'danger':
                return 'bg-red-500 text-white hover:bg-red-600';
            case 'ghost':
                return 'bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-300';
            default:
                return 'bg-gray-300 text-black hover:bg-gray-400';

        }
    }

    return (
        <div class={`clickable py-4 px-2 rounded-sm ${getVariantClass()} ${props.class}`} onclick={props.onClick}>
            {props.children}
        </div>
    );
};
