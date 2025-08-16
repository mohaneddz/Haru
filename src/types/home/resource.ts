export interface Document{
    title: string;
    type: string;
    link: string;
    tags: string[];
    local?: boolean;
}

export interface Video {
    title: string;
    img: string;
    duration?: string;
    count: number; // if playlist show the number of vids / = 1
    tags: string[];
    link: string;
}

export interface Tool {
    title: string;
    description: string;
    link: string;
    tags: string[];
}