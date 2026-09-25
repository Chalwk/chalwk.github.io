---
title: "Spot the Difference - Picture Puzzle"
date: 2026-09-25
last-updated: 2026-09-25
categories: [ programming, guide, web-app ]
tags: [ programming, guide, web-app ]
---

---

# This game is a Work In Progress

---

Two procedurally generated scenes sit side by side. A handful of differences are hidden between them: a colour swapped here, an object moved there, one gone entirely. Click a spot on either picture to mark it before the timer runs out. The game is designed for larger screens first, but the layout adapts down to phones.

## [**Link to Game**](https://chalwk.github.io/pages/browser-apps/games/spot-the-difference)

---

## Scenes

Everything on the board is inline SVG. There is no sprite sheet, no PNG, no asset file. The sky, the hills, the tree on the left, the fence on the right, and every single object the dungeon scatters are drawn as shapes at runtime.

Fourteen object types share a shapes module: sun, cloud, tree, mushroom, star, heart, moon, flower, gem, ghost, balloon, fish, bird, bush. Six scene themes decide which of those can appear and what colours the world is painted in. The skeleton (sky gradient, hills, ground strip, permanent tree, permanent fence) is identical on both boards and never becomes a difference, so the eye has something fixed to compare against.

---

## Features

* Two procedurally generated SVG scenes rendered side by side, one untouched, one with differences applied
* Four difference archetypes: recolour, resize, move, remove
* Six themed worlds: meadow, dusk, night, desert, candy, underwater reef
* Fourteen distinct objects, each drawn as inline SVG with a face, highlight, or small detail so they read as characters rather than primitives
* Every object is drawn centred on its own origin, so the caller wraps it in a translate and scale group and gets a scalable sprite for free
* Depth layering: sky objects sit small and distant above the ground line, ground objects sit larger along it
* Per-theme object pools, so a reef never gets a sun and a meadow never gets a fish
* Fixed skeleton on both boards: sky, hills, ground, tree, fence. The eye anchors on them, making differences pop.
* Difficulty rotation: recolour, move, resize, and remove cycle through the diff kinds so a round is never all one type
* Colour distance check: recolours are rejected unless the two palette entries are far enough apart in RGB to actually see
* Overlap and separation checks: objects never crowd each other, differences never land on top of each other
* Twelve rounds with a countdown timer, ramping difficulty, and a time bonus carried into the next round
* Combo scoring: consecutive finds multiply the reward, a wrong click resets it
* Hints: reveal one difference for a time cost. Limited per round
* Three scene sizes and three difficulty presets
* All sound generated at runtime with the Web Audio API, no asset files
* Keyboard and click/touch controls

---

## How to Play

Goal: clear twelve rounds before the timer runs out. Each round hides more differences than the last.

**Controls:**

* Click or tap either board: mark a spot as a difference
* H: use a hint
* M: mute or unmute
* Space or Enter: start a new game after the game over overlay
* Touch devices get the same click detection, no separate controls needed

**Rules:**

* Both boards are clickable. A difference counts no matter which side you click
* A correct click scores 25 points plus 5 per combo step
* A wrong click costs time and resets your combo
* Hints reveal one difference and cost time. Hints per round drop as difficulty rises
* Clearing a round awards a time bonus and carries a slice of the remaining time into the next round
* Changing scene size or difficulty starts a fresh game

---

## Design Notes

A running log of how the game is built, what is done, and what is still rough.

### File Structure

The game runs as plain (non-module) scripts sharing one global scope, loaded in dependency order by `index.html`. Every file is small and focused.

```
spot-the-difference/
├── index.html
├── style.css
└── js/
    ├── dom.js
    ├── constants.js
    ├── utils.js
    ├── state.js
    ├── audio.js
    ├── helpers.js
    ├── shapes.js
    ├── scene.js
    ├── render.js
    ├── game.js
    └── input.js
```

* **`index.html`** - The Jekyll page markup: the HUD, the settings bar, the two scene boards, the game over overlay, and the action bar. Loads every script in `js/` in dependency order.
* **`style.css`** - All visual styling: panel and HUD layout, timer bar, combo and hint chips, the scrolling event log, the diff ring / miss mark / hint pulse animations, the responsive breakpoints, and the game over overlay.
* **`js/dom.js`** - Grabs every DOM element handle the game touches up front, so the rest of the code just references ready-made constants.
* **`js/constants.js`** - The data tables that drive the game: size presets, difficulty presets, scene themes, object types, per-theme object pools, difference types, and the diff kind cycle.
* **`js/utils.js`** - Random ints, array shuffle/pick, clamp, distance between points, and the coordinate-space mapper that turns a raw click into a viewBox point.
* **`js/state.js`** - The mutable, module-level game state: round, score, combo, best score, the current scene, timer fields, game active/over flags, and the audio context handle. Restores sound and best score from `localStorage` on load.
* **`js/audio.js`** - The oscillator-based Web Audio engine and every named sound wrapper: found, miss, hint, round complete, victory, death. Also the mute toggle.
* **`js/helpers.js`** - The scrolling event log, status setter, object type lookup, and the `farEnough` separation check used by scene generation.
* **`js/shapes.js`** - Draws every object as SVG markup, centred on its own origin. One `switch` on `typeId`, one return string per case.
* **`js/scene.js`** - Procedural generation: scattering objects by band (sky or ground), applying differences to a cloned right side, and validating the result. The public entry point is `buildRoundScene()`, which wraps the generator in a retry loop.
* **`js/render.js`** - Draws both boards from scene state, plus the timer HUD, chips, and the transient miss/hint markers.
* **`js/game.js`** - Game lifecycle: starting a new game, building a round, ticking the timer, resolving hits and misses, completing a round, and ending the game.
* **`js/input.js`** - Keyboard, click, and settings-change wiring, plus the boot call.

---

### Data and Architecture

The content is data-driven. Themes, objects, pools, and difficulty presets are plain arrays and objects. Adding an object means one entry in `OBJECT_TYPES`, one case in `shapes.js`, and adding the id to any theme pool that should use it.

Difficulty scales through multipliers and offsets. The starting timer, the diff count, the ramp rate, the miss penalty, the hint cost, and the hit radius multiplier all live in `DIFFICULTY_PRESETS`. No separate code paths per difficulty.

Themes own their own world. A theme is not just a colour swap. It declares its sky gradient, ground colour, hill colours, accent colour, and two object pools. The pools are what stop a reef from picking the sun. This is the single change that made the game stop looking like random primitives scattered on a background.

Retry instead of patch. `buildRoundScene()` calls `generateDifferences()` up to ten times and takes the first valid result. If every attempt fails it falls through to a last-ditch single-difference retry. A failed roll is thrown away and the whole round is rebuilt. A scene that passes every local check can still end up unwinnable: two differences too close together, a resize that lands on another object, an object clipped by the viewBox. Regenerating is cheaper and simpler than patching.

### Scene Composition

Every object is drawn centred on its own (0, 0). The renderer wraps it in a `<g transform="translate(x y) scale(s)">` and that is the entire sprite system. Moving or resizing an object is a change to two numbers. A resize difference literally rewrites `scale`, a move difference rewrites `x` and `y`, and neither the renderer nor the shape code knows the difference.

Depth bands, not free scatter. Earlier revisions placed every object anywhere on the canvas with a single overlap check. That produced noise: suns next to fish, mushrooms floating in the sky, everything the same size. Objects now belong to one of two bands. Sky objects are smaller and constrained to the area above the ground line. Ground objects are larger and constrained to a band along it, with the left and right edges reserved for the skeleton tree and fence. Scale ranges differ per band: sky uses 0.6 to 1.0, ground uses 0.95 to 1.35. The result reads as a scene with depth rather than a field.

The skeleton is what makes it a puzzle. A stable frame is what turns "spot what changed" from an impossible task into a solvable one. The permanent tree and permanent fence anchor the left and right edges of the frame. The sun or moon sits in the same top-right corner on both boards. The hills are drawn with the same ellipses. Everything that can be a difference is layered on top of that fixed base, so the eye has a reference.

Character, not geometry. The shape set used to be minimal primitives. A tree was three circles and a rectangle. The current set gives every object a small face, a highlight, a shadow, or a piece of detail: the sun has eyes and a smile, the mushroom has speckles, the gem has facets, the ghost has a mouth. Same SVG cost, much better readability at small sizes, and the game now has a personality.

### Difference Generation

Four archetypes, no weak ones. The original set had an `add` kind. Adding a subtle extra object to a busy scene is not findable, so it was removed. Every kind that remains produces something a player can actually see: a colour that is clearly different, a size that is clearly different, a position that is clearly different, or an object that is clearly gone.

Recolour uses a colour distance check. Palette entries closer than a threshold in RGB are rejected. A gold sun that becomes a slightly lighter gold sun is not a difference, it is noise. The check only considers clearly-different palette entries when any exist, falling back to any other entry when none do.

Move anchors on the object, not the gap. A move difference has two visible positions: where the object was and where it is now. The hit radius is based on the object's size, not on the distance moved. Clicks land on the object, not on empty space between two objects.

Resize keeps the object inside the frame and away from everything else. The scale is clamped to a visible range and the position is nudged back inside the viewBox. A resize that puts the object on top of another one is rejected and retried.

Remove leaves the anchor at the object's old position. Both the left and right marks sit at the same point. Clicking the empty space where the object used to be counts.

Separation between differences. Every new difference is checked against the ones already placed. If its anchor is too close to an existing one, it is rejected. Two differences in the same spot are one difference from the player's point of view, and the second one becomes unfindable.

### Rendering

Full redraw on every change. The boards are rebuilt from scene state on every render. At this scene size it is cheap, and it removes an entire class of stale UI bugs.

Layered markup. Each board's markup is the skeleton, then every object on that side, then the found markers. The skeleton is identical on both boards, so the only markup that differs between left and right is the object list.

Fog-free, but layered states. A found difference gets a dashed ring and a checkmark on whichever side it lives on. A removed object only gets the ring on the left. A move gets a ring at both the from and to positions on the two boards.

Deterministic rendering. Unlike the dungeon in Dead End, this game does not need stable per-tile hashing. The scene state is fully deterministic once generated, so the same scene renders the same markup every time without needing to seed anything.

Transient markers are appended, not part of state. The miss X and the hint pulse are appended directly to the SVG and removed by `setTimeout`. They are not stored anywhere and they do not survive the next render. That keeps the scene state honest: the scene only ever contains objects and differences, never UI.

### Game Flow and Player Choice

One action, one tick. A click either scores or misses, both update the HUD, both may end the round. There is no menu, no pause, no free look.

Combo rewards accuracy. A correct click scores 25 plus 5 per combo step, so the tenth difference in a clean run is worth much more than the first. A miss resets the combo to zero. That is the entire risk-reward system and it reads on the HUD as a single chip.

Time is the only resource. Misses cost time. Hints cost time. Clearing a round early awards a time bonus and carries a slice of the remaining time into the next round. There is no health, no lives, no currency. Time is the whole loop and every decision is measured in seconds.

The celebration window is cancellable. After a round is cleared there is a short pause before the next round begins. The pending timeout is stored so a New Game click during the celebration cancels it cleanly. Without that, clicking New Game at the wrong moment would drop the player into a phantom round 2 with a fresh scene but a stale timer.

---