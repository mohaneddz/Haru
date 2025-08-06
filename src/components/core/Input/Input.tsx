interface Props {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    class?: string;
    id?: string;
    placeholder?: string;
    readonly?: boolean;
}

export default function Input(props: Props) {
    return (
        <input
            disabled={props.readonly}
            id={props.id}
            type="text"
            placeholder={props.placeholder || "Search..."}
            value={props.searchTerm}
            onInput={(e) => props.setSearchTerm(e.currentTarget.value)}
            class={`w-full pl-4 pr-4 py-2 bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 placeholder-text/50 focus:outline-none focus:border-accent ${props.class}`}
        />
    );
};
