<script>
  import { fade } from "svelte/transition";
  export let duration;
</script>

<style type="text/scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    background: #333333;
  }
</style>

<div transition:fade={{ duration: duration }} class="loading">
  <slot>Loading</slot>
</div>
