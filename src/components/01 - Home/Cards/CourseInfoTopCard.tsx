interface Props {
    value: string;
    attribute: string;
}

export default function CourseInfoTopCard(props: Props) {
    return (
        <div class="bg-gradient-to-br from-sidebar-light-3 to-sidebar-light-1 p-4 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/40 cursor-pointer group">
            <h3 class="text-lg font-semibold text-accent-light-1 mb-2 group-hover:text-white transition-colors duration-300">{props.attribute}</h3>
            {/* tooltip to show the full text */}
            <p class="text-text/80 group-hover:text-white/90 transition-colors text-md duration-300 text-nowrap max-w-[90%] truncate">{props.value}</p>
        </div>
    );
};
