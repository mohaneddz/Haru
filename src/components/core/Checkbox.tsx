interface Props {
    selected?: boolean | undefined;
    onChange: (event: Event) => void;
}

export default function Checkbox(props: Props) {
    return (
        <input
            type="checkbox"
            class="appearance-none h-4 w-4 border-2 border-primary rounded-sm checked:bg-primary bg-background-light-1 checked:border-transparent cursor-pointer"
            checked={props.selected}
            onChange={props.onChange}
        />
    );
};
