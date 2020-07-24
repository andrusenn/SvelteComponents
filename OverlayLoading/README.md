# OverlayLoading

Simple Svelte omponent for overlay

## Usage

```html
<script>
  import {loading} from './store.js';
  import OverlayLoading from "svelte-overlay-loading";
</script>

{#if loading}
<OverlayLoading>
  Loading...
</OverlayLoading>
{/if}

```
