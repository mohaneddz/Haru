interface Definition {
    dateAdded: string;
	term: string;
	definition: string;
    selected?: boolean = false;
    onSelect?: any;
}

interface Translation {
    dateAdded: string;
    term: string;
    translation: string;
    selected?: boolean = false;
    onSelect?: any;
}