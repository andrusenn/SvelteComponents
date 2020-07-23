# Reveal

Simple Svelte (<3) component for reveal on scroll

## Install

`npm i --save svelte-c-reveal`

## Using

```html
<script>
import Reveal from "svelte-c-reveal";
</script>

<Reveal>
  Content to be revealed
</Reveal>

<Reveal trigger="0.5" reveal="fadeInUp">
The center of viweport
</Reveal>
```

## Props

| Name       | Value     | Desc                                                                     |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `reveal`   | String    | Reveal effect                                                            |
| `trigger`  | Float     | (0.0 to 1.0) When the reveal will trigger -> (viewport height * trigger) |
| `duration` | Css value | (0.5s) Duration of the transition                                        |
| `delay`    | Css value | (0s) Time delay                                                          |

## Effects availables

| Name                 |
| -------------------- |
| `fadeIn`             |
| `fadeInUp` [default] |
| `fadeInDown`         |
| `fadeInRotateX`      |
| `fadeInRotateY`      |
| `fadeInLeft`         |
| `fadeInRight`        |
