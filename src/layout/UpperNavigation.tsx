import { For, JSX, createSignal, createEffect, Accessor } from "solid-js";

interface Props {
    tabs?: string[];
    activeTab?: string; 
    defaultActiveTab?: string; 
    children?: JSX.Element | JSX.Element[];
    onTabChange?: (tab: string) => void;
}


export default function UpperNavigation(props: Props) {
    const isControlled = () => props.activeTab !== undefined;

    const [internalActiveTab, setInternalActiveTab] = createSignal<string | undefined>(
        (() => {
            const tabs = props.tabs || [];
            if (props.defaultActiveTab && tabs.includes(props.defaultActiveTab)) {
                return props.defaultActiveTab;
            }
            return tabs.length > 0 ? tabs[0] : undefined;
        })()
    );

    const currentTab: Accessor<string | undefined> = () =>
        isControlled() ? props.activeTab : internalActiveTab();

    createEffect(() => {
        if (isControlled()) return; 

        const tabs = props.tabs || [];
        const currentInternal = internalActiveTab();

        if (tabs.length === 0) {
            if (currentInternal !== undefined) setInternalActiveTab(undefined);
            return;
        }

        const defaultIsValid = props.defaultActiveTab && tabs.includes(props.defaultActiveTab);

        if (currentInternal === undefined || !tabs.includes(currentInternal)) {
            setInternalActiveTab(defaultIsValid ? props.defaultActiveTab : tabs[0]);
        }
    });
    
    createEffect(() => {
        const active = currentTab();
    });

    const handleTabClick = (tab: string) => {
        if (!isControlled()) {
            setInternalActiveTab(tab);
        }
        if (props.onTabChange) {
            props.onTabChange(tab);
        }
    };

    return (
        <div id="navigation" class="absolute h-12 bg-background-light-3 w-full z-50">

            <ul class="absolute bottom-0 flex w-full justify-around h-min z-50 text-accent-dark-3">
                <For each={props.tabs || []}>
                    {(tab) => (
                        <li
                            class={`cursor-pointer w-full text-center px-4 py-2 text-sm font-semibold ${currentTab() === tab ? 'bg-gradient-to-t from-accent/40 text-white' : 'hover:text-accent-dark-1'}`}
                            onClick={() => handleTabClick(tab)}
                        >
                            {tab}
                        </li>
                    )}
                </For>
            </ul>
        </div>
    );
};