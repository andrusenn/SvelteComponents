<script>
  export let trigger = 0.8,
    reveal = "fadeInUp",
    duration = "0.5s",
    delay = "0s";
  // ScrolY
  let sy = 0;
  // css Class
  let cssClass = "";
  // Action -----------------
  function rev(node, _args) {
    let args = {
      ..._args
    };
    let el = node.getBoundingClientRect();
    let elPosY = el.top + args.scrollY;
    let _trigger = args.scrollY + window.innerHeight * args.trigger;
    let anim = node.querySelector(".rev");

    // Anim settings
    anim.style.setProperty("--animation-delay", args.delay);
    anim.style.setProperty("--animation-duration", args.duration);

    if (elPosY < _trigger) {
      // args.class = animateIn;
      node.dispatchEvent(new CustomEvent("triggered"));
    }
    return {
      update(args) {
        el = node.getBoundingClientRect();
        elPosY = el.top + args.scrollY;
        _trigger = args.scrollY + window.innerHeight * args.trigger;
        // Apply trigger
        if (elPosY < _trigger) {
          node.dispatchEvent(new CustomEvent("triggered"));
        }
      },
      destroy() {}
    };
  }
</script>

<style>
  .wrapper {
    position: relative;
  }
  .animate {
    opacity: 0;
  }
  .fadeIn {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeIn var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
  }
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  .fadeInUp {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInUp var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
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

  .fadeInDown {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInDown var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
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

  .fadeInLeft {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInLeft var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
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

  .fadeInRight {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInRight var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
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

  .fadeInRotY {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInRotY var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
  }
  @keyframes fadeInRotY {
    0% {
      opacity: 0;
      transform: rotate3d(0, 1, 0, 45deg);
    }
    100% {
      opacity: 1;
      transform: rotate3d(0);
    }
  }

  .fadeInRotX {
    --animation-delay: 0s;
    --animation-duration: 1s;
    animation: fadeInRotX var(--animation-delay) 1 ease-in-out;
    animation-duration: var(--animation-duration);
    animation-fill-mode: forwards;
    animation-delay: var(--animation-delay);
  }
  @keyframes fadeInRotX {
    0% {
      opacity: 0;
      transform: rotate3d(1, 0, 0, 45deg);
    }
    100% {
      opacity: 1;
      transform: rotate3d(0);
    }
  }
</style>

<svelte:window bind:scrollY={sy} />

<div
  class="wrapper"
  on:triggered={() => (cssClass = reveal)}
  use:rev={{ scrollY: sy, trigger: trigger, duration: duration, delay: delay }}>
  <div class={'rev animate ' + cssClass}>
    <slot />
  </div>
</div>
