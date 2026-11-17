# Motion

Six moves. Each one has a job; use one per idea, and let the drawing read with
all motion off.

| Move | Class | Job | Cycle |
| --- | --- | --- | --- |
| Float | `.iso-float` | suspension, "this thing is a layer" | 6–10 s |
| Trace | `.iso-trace` | connection, flow direction | 1.9 s march |
| Packet | `.iso-packet` | transport along one connector | 3.4 s |
| Node | `.iso-node` | endpoints, liveness | 3.2 s |
| Lens | `.iso-lens` | attention, "looking at" | 11 s drift |
| Steam | `.iso-steam` | work being done | 4.2 s |

## Float

```css
.iso-float { animation: kiln-float var(--float-duration, 8s) var(--ease-in-out) var(--float-delay, 0s) infinite; }
@keyframes kiln-float { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-8px,0); } }
```

- Amplitude is fixed at 8 px. A 20 px float reads as a wobble.
- Stagger `--float-delay` by 0.4–0.7 s per layer so they don't pulse in unison.
- Vary `--float-duration` between 6 and 10 s; identical durations look mechanical.

## Trace

```css
.iso-trace { stroke-dasharray: 2.5 4.5; animation: iso-march 1.9s linear infinite; animation-delay: calc(var(--i, 0) * -0.55s); }
@keyframes iso-march { to { stroke-dashoffset: -14; } }
```

Dashes always march **toward** the destination. If a connector runs right to
left, reverse the animation instead of reversing the path — or just accept that
connectors read outward from the hub.

## Packet

```css
.iso-packet { fill: var(--iso-accent); offset-rotate: 0deg; offset-path: path('…');
  animation: iso-packet 3.4s var(--ease-in-out) infinite; }
@keyframes iso-packet { 0% { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
```

One packet per trace, never more. Set `offset-path` inline to the same `d` as the
trace. Fade at both ends so it appears to leave and arrive.

## Node

```css
.iso-node { fill: var(--iso-paper); stroke: var(--iso-line); animation: iso-node-pulse 3.2s var(--ease-in-out) infinite; }
@keyframes iso-node-pulse { 0%,100% { r: 2.6; fill: var(--iso-paper); } 50% { r: 3.6; fill: var(--iso-accent); } }
```

Radius grows 1 px and the fill flips to accent at the peak. That is the whole
move — anything more is decoration.

## Lens

A slow 2–6 px translation (`.iso-lens`, 11–14 s) on a magnifier or callout. The
lens may also carry a slowly rotating dashed inner ring (`spin 22s linear`).

## Steam

Dots rising from the working block: `translateY(6px) → translateY(-18px)` while
opacity goes 0 → 0.8 → 0 and scale 0.6 → 1.15. Stagger by −1.4 s. Only ever on
the "computation" form.

## Contract

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
}
```

Every illustration must remain legible at frame 0 with motion disabled: nothing
may depend on an animation having run. In interactive contexts, hovering a
poster may speed the float up (`.iso-poster:hover .iso-float { animation-duration: 45%; }`),
but must never introduce new motion.
