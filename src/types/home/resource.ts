export type UrlString = `http://${string}` | `https://${string}`;

export interface Document{
    title: string;
    type: string;
    link: string; // may be local path or URL
    tags: string[];
    local?: boolean;
}

export interface Video {
    title: string;
    img: string;
    duration?: string;
    count: number; // if playlist show the number of vids / = 1
    tags: string[];
    link?: UrlString; // must be a URL
}

export interface Tool {
    title: string;
    description: string;
    link: UrlString; // must be a URL
    tags: string[];
}