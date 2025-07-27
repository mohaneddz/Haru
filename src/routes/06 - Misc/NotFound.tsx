import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
export default function Redirect() {
    const navigate = useNavigate();

    onMount(() => {
        navigate("/home");
    });

    return (
        <div>
        </div>
    );
};
