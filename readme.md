# PianoSVG

A very lightweight, zero-dependency, declarative SVG piano keyboard renderer.

[Online Demo](https://spacejack.github.io/pianosvg/)

Renders any section(s) of a 128-key piano keyboard.

## Install:

	npm install pianosvg

(TypeScript types are included.)

## About

PianoSVG is a piano keyboard renderer which draws a piano keyboard using SVG elements. It renders up to 128 different piano keys, having pressed & released states.

This library uses MIDI's 128 note IDs to reference keys. Starting from 0 (C-1) to 127 (G9). To represent the keyboard state, provide an array of numbers representing key states up to 128 elements long.

`KeyState` values can be:

* `0 | undefined` - Don't draw key
* `1` - Draw key (normal)
* `2` - Draw key (active)

### DOM Representation

The DOM tree is structured like this:

	<svg> (root)
		<g> (white keys group)
			<rect> (white key)
			<rect> (white key)
			...
		<g> (black keys group)
			<rect> (black key)
			<rect> (black key)
			...

Additionally, each key (rect) element will have a `data-noteid` attribute which can be read to get that key's MIDI note number (as a string.)

### Styling

You will need to provide some minimal CSS for key styles (fill or stroke colors at least) so that the rendered keyboard will be visible.

You can provide CSS class names that will be applied to the various elements in the options object when creating a `PianoSVG` instance.

### Event Handling

Note that PianoSVG is a renderer only, it does not handle input events for you. The returned DOM tree can be used to add event listeners manually.

See the example app for a more complete demo and code. Note that while PianoSVG has no dependencies, the example app uses [Mithril](https://github.com/MithrilJS/mithril.js) to help cut down on boilerplate. PianoSVG could similarly be easily integrated with React, Vue, Angular, etc.

## Basic Usage:

```typescript
// Create instance using these options
const piano = PianoSVG({
	classRoot: 'piano'
	classBKey: 'key-black',
	classWKey: 'key-white',
	classActive: 'key-active'
})

// Insert the returned SVG element in the page somewhere
document.body.appendChild(piano.element)

// State for one octave of keys, starting from C-1 (MIDI ID 0)
// 1 key is in normal (not active) state
// 2 key is in "active" state (pressed)
// 0 or undefined means doesn't exist, don't draw
const pianoState = {
	keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
}
piano.render(pianoState)

// Set the first key state to "active" and re-render
pianoState.keys[0] = 2
piano.render(pianoState)
// Note that in this example we mutated the state and array objects,
// but it's also fine to send a different state object every render.
```
### All Options Properties:

```typescript
interface Options {
	/** CSS class for root element */
	classRoot?: string
	/** CSS class for black keys group element */
	classBGroup?: string
	/** CSS class for white keys group element */
	classWGroup?: string
	/** CSS class for black key elements */
	classBKey?: string
	/** CSS class for white key elements */
	classWKey?: string
	/** CSS class for active (pressed) key elements */
	classActive?: string
}
```

### All State Properties:

```typescript
interface State {
	/** State of keys indexed by MIDI id 0-127 */
	keys?: ArrayLike<KeyState>;
	/** Black key width */
	bWidth?: number;
	/** Black key height */
	bHeight?: number;
	/** White key width */
	wWidth?: number;
	/** White key height */
	wHeight?: number;
	/** X drawing offset from 0 */
	x?: number;
	/** Y drawing offset from 0 */
	y?: number;
}
```

## Development Install:

First git clone this repo. Then:

	npm install

## Build module

	npm run build

## Serve, compile & watch example app:

	npm start

Then go to http://localhost:3000/ in your browser.
