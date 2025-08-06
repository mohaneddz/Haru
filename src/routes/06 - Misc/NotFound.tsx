import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { getStoreValue } from "@/config/store";

export default function Redirect() {
    const navigate = useNavigate();

    onMount(async () => {
        const initialPage = await getStoreValue('initialPage');
        console.log("Redirecting to initial page:", initialPage);
        navigate(`/${initialPage}`);
    });

    return (
        <div>
        </div>
    );
};
