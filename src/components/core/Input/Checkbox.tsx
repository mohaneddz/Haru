interface Props {
    selected?: boolean;
    onChange: () => void;
    class?: string;
}

export default function Checkbox(props: Props) {
    return (
        <input
            type="checkbox"
            class={`appearance-none aspect-square h-4 w-4 border-2 border-primary rounded-sm checked:bg-primary bg-background-light-3 checked:border-transparent cursor-pointer ${props.class || ''}`}
            checked={props.selected}
            onChange={props.onChange}
        />
    );
};
