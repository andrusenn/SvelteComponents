<script>
    import { onMount } from "svelte";
    export let trigger = 0.0;
    export let duration = 0.4;
    export let delay = 0;
    export let reveal = "fadeIn";
    export let hide = "";
    let cssClass = "";
    // Action -----------------
    function rev(node, args) {
        let revealNode = node.querySelector(".svelte-c-reveal");
        revealNode.style.setProperty("--animation-delay", args.delay + "s");
        revealNode.style.setProperty(
            "--animation-duration",
            args.duration + "s",
        );
        // Anim settings
        const handler = (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.dispatchEvent(new CustomEvent("in"));
                    if (hide === "") {
                        observer.disconnect();
                    }
                } else {
                    if (hide !== "") {
                        entry.target.dispatchEvent(new CustomEvent("out"));
                    }
                }
            });
        };
        let _trigger = 100 * trigger;
        const observer = new IntersectionObserver(handler, {
            root: null,
            rootMargin: `0% 0% -${_trigger}% 0%`,
            threshold: 0,
        });

        // Observe
        observer.observe(node);

        // Return
        return {
            destroy(observer) {
                observer.disconnect();
            },
        };
    }
</script>

<style>
    .wrapper {
        overflow: hidden;
        position: relative;
        padding: 0;
        margin: 0;
    }
    .hide {
        opacity: 0;
        padding: 0;
        margin: 0;
    }
    .svelte-c-reveal {
        position: relative;
        --animation-delay: 0s;
        --animation-duration: 1s;
        animation-duration: var(--animation-duration);
        animation-fill-mode: forwards;
        animation-direction: normal;
        animation-delay: var(--animation-delay);
        animation-timing-function: ease-in-out;
        animation-iteration-count: 1;
    }
    .fadeIn {
        animation-name: fadeIn;
    }
    .fadeOut {
        animation-name: fadeOut;
    }
    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    @keyframes fadeOut {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    .fadeInUp {
        animation-name: fadeInUp;
    }
    .fadeOutUp {
        animation-name: fadeOutUp;
    }
    @keyframes fadeInUp {
        0% {
            opacity: 0;
            transform: translate3d(0, 15px, 0);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes fadeOutUp {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translate3d(0, -15px, 0);
        }
    }

    .fadeInDown {
        animation-name: fadeInDown;
    }
    .fadeOutDown {
        animation-name: fadeOutDown;
    }
    @keyframes fadeInDown {
        0% {
            opacity: 0;
            transform: translate3d(0, -15px, 0);
        }
        100% {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes fadeOutDown {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translate3d(0, 15px, 0);
        }
    }

    .fadeInLeft {
        animation-name: fadeInLeft;
    }
    .fadeOutLeft {
        animation-name: fadeOutLeft;
    }
    @keyframes fadeInLeft {
        0% {
            opacity: 0;
            transform: translate3d(-15px, 0, 0);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes fadeOutLeft {
        0% {
            opacity: 1;
            transform: translateX(0);
        }
        100% {
            opacity: 0;
            transform: translate3d(-15px, 0, 0);
        }
    }

    .fadeInRight {
        animation-name: fadeInRight;
    }
    .fadeOutRight {
        animation-name: fadeOutRight;
    }
    @keyframes fadeInRight {
        0% {
            opacity: 0;
            transform: translate3d(15px, 0, 0);
        }
        100% {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes fadeOutRight {
        0% {
            opacity: 1;
            transform: translateX(0);
        }
        100% {
            opacity: 0;
            transform: translate3d(15px, 0, 0);
        }
    }

    .fadeInRotY {
        animation-name: fadeInRotY;
    }
    .fadeOutRotY {
        animation-name: fadeOutRotY;
    }
    @keyframes fadeInRotY {
        0% {
            opacity: 0;
            transform: rotate3d(0, 1, 0, 90deg);
        }
        100% {
            opacity: 1;
            transform: rotate3d(0);
        }
    }
    @keyframes fadeOutRotY {
        0% {
            opacity: 1;
            transform: rotate3d(0);
        }
        100% {
            opacity: 0;
            transform: rotate3d(0, 1, 0, 90deg);
        }
    }

    .fadeInRotX {
        animation-name: fadeInRotX;
    }
    .fadeOutRotX {
        animation-name: fadeOutRotX;
    }
    @keyframes fadeInRotX {
        0% {
            opacity: 0;
            transform: rotate3d(1, 0, 0, 90deg);
        }
        100% {
            opacity: 1;
            transform: rotate3d(0);
        }
    }
    @keyframes fadeOutRotX {
        0% {
            opacity: 1;
            transform: rotate3d(0);
        }
        100% {
            opacity: 0;
            transform: rotate3d(1, 0, 0, 90deg);
        }
    }
</style>

<div
    class="wrapper"
    use:rev={{ duration: duration, delay: delay }}
    on:in={(e) => (cssClass = reveal)}
    on:out={(e) => (cssClass = hide)}>
    <div class={'hide svelte-c-reveal ' + cssClass}>
        <slot />
    </div>
</div>
