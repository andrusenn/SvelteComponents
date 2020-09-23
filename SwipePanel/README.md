# Reveal

Simple Svelte (<3) component for reveal on scroll

## Usage

```html
<script>
    import Reveal from "svelte-c-reveal";
</script>

<Reveal> Content to be revealed </Reveal>

<Reveal trigger="0.1" reveal="fadeInUp">
    Trigger when 10% is in viewport
</Reveal>

<Reveal trigger="0.5" reveal="fadeInUp">
    Trigger in center of viweport (50%)
</Reveal>
```

## Reveal and Hide

```html
<script>
    import Reveal from "svelte-c-reveal";
</script>

<Reveal trigger="0.5" reveal="fadeInUp" hide="fadeOutDown">
    <h1>My revealed content</h1>
    <p>Hello I'm here!</p>
</Reveal>
```

## Props

| Name       | Value     | Desc                                                                      |
| ---------- | --------- | ------------------------------------------------------------------------- |
| `reveal`   | String    | Reveal effect                                                             |
| `hide`     | String    | Reveal out (hide) effect                                                  |
| `trigger`  | Float     | (0.0 to 1.0) When the reveal will trigger -> (viewport height \* trigger) |
| `duration` | Css value | (number) Duration of the transition in seconds without "s"                |
| `delay`    | Css value | (number) Time delayed in seconds without "s"                              |

## Effects availables

| Name                 |
| -------------------- |
| `fadeIn`             |
| `fadeOut`            |
| `fadeInUp` [default] |
| `fadeOutUp`          |
| `fadeInDown`         |
| `fadeOutDown`        |
| `fadeInRotateX`      |
| `fadeOutRotateX`     |
| `fadeInRotateY`      |
| `fadeOutRotateY`     |
| `fadeInLeft`         |
| `fadeOutLeft`        |
| `fadeInRight`        |
| `fadeOutRight`       |

## Custom effects

```html
<script>
    import Reveal from "svelte-c-reveal";
</script>
<style>
    .myfx {
        animation-name: myanimation;
    }
    @keyframes myanimation {
        0% {
            opacity: 0;
            transform: rotate(90deg) scale(0);
        }
        100% {
            opacity: 1;
            transform: rotate(0deg) scale(1);
        }
    }
</style>

<Reveal trigger="0.5" reveal="myfx"> The center of viweport </Reveal>
```
