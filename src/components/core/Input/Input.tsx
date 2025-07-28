interface Props {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export default function Input(props: Props) {
    return (
        <input
            type="text"
            placeholder="Search goals..."
            value={props.searchTerm}
            onInput={(e) => props.setSearchTerm(e.currentTarget.value)}
            class="w-full pl-10 pr-4 py-2 bg-sidebar-light-2 border border-border-light-2 rounded-md text-text/70 placeholder-text/50 focus:outline-none focus:border-accent"
        />
    );
};
