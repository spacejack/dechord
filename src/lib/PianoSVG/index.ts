const _DEFAULTS: PianoSVG.Defaults = {
	wkWidth: 16,
	wkHeight: 80,
	bkWidth: 16 * 0.7,
	bkHeight: 80 * 0.6,
	x: 0,
	y: 0
}

/**
 * SVG Piano Keyboard renderer
 */
interface PianoSVG {
	/** Root DOM Element of PianoSVG */
	element: SVGElement
	/** Render keys using the provided state */
	render(state: PianoSVG.State): void
}

function PianoSVG (opts?: Partial<PianoSVG.Options>): PianoSVG {
	const options: PianoSVG.Options = {classes: [], ...opts}
	const svgContainer = createSvg('svg')
	if (options.classRoot) {
		svgContainer.classList.add(options.classRoot)
	}
	/** Group element for white keys */
	const gWhite = createSvg('g')
	if (options.classWGroup) {
		gWhite.classList.add(options.classWGroup)
	}
	/** Group element for black keys */
	const gBlack = createSvg('g')
	if (options.classBGroup) {
		gBlack.classList.add(options.classBGroup)
	}
	// Black keys drawn on top of white
	svgContainer.appendChild(gWhite)
	svgContainer.appendChild(gBlack)

	const keyElements: (SVGElement | null)[] = Array.from(
		{length: PianoSVG.NUM_NOTES}, () => null
	)

	const state = {
		..._DEFAULTS,
		keys: Array.from({length: PianoSVG.NUM_NOTES},
			() => PianoSVG.KEYSTATE_NOKEY
		) as PianoSVG.KeyState[]
	}

	/** Update local state with new values (if provided) */
	function updateState (s: PianoSVG.State) { // tslint:disable-line no-shadowed-variable
		s.wkWidth != null && (state.wkWidth = s.wkWidth)
		s.wkHeight != null && (state.wkHeight = s.wkHeight)
		s.bkWidth != null && (state.bkWidth = s.bkWidth)
		s.bkHeight != null && (state.bkHeight = s.bkHeight)
		s.x != null && (state.x = s.x)
		s.y != null && (state.y = s.y)
	}

	/** Note id to x coordinate */
	function idToX (id: number) {
		const x = PianoSVG.wkCountToId(id)
		if (PianoSVG.NOTE_COLORS[id % 12] === 'w') {
			return x * state.wkWidth
		}
		// Black key offset
		return x * state.wkWidth - state.bkWidth / 2
	}

	/** Create a key SVG element */
	function createKeyEl (i: number, ks: PianoSVG.KeyState): SVGElement {
		if (!ks) {
			throw new Error('Cannot create svg for non-renderable KeyState')
		}
		const color = PianoSVG.NOTE_COLORS[i % 12]
		const svg = createSvg('rect')
		const cls = color === 'b' ? options.classBKey : options.classWKey
		if (cls) {
			svg.classList.add(cls)
		}
		//if (ks === PianoSVG.KEYSTATE_ON && options.classActive) {
		if (options.classes[ks]) {
			svg.classList.add(options.classes[ks]!)
		}
		svg.setAttribute('x', String(state.x + idToX(i)))
		svg.setAttribute('y', String(state.y))
		svg.setAttribute('width', String(color === 'b' ? state.bkWidth : state.wkWidth))
		svg.setAttribute('height', String(color === 'b' ? state.bkHeight : state.wkHeight))
		svg.dataset.noteid = String(i)
		return svg
	}

	/** Insert a new key element at the correct position in the DOM */
	function insertKeyElement (i: number, el: SVGElement) {
		if (keyElements[i]) {
			throw new Error('Already existing DOM Element for id: ' + i)
		}
		keyElements[i] = el
		const color = PianoSVG.NOTE_COLORS[i % 12]
		const group = color === 'b' ? gBlack : gWhite
		const nextId = nextExisting(i, state.keys)
		if (nextId != null) {
			const nextEl = keyElements[nextId]
			if (!nextEl) {
				throw new Error('Element expected at ' + nextId)
			}
			group.insertBefore(el, nextEl)
		} else {
			group.appendChild(el)
		}
	}

	/** First or diff render */
	function render (s: PianoSVG.State) { // tslint:disable-line no-shadowed-variable
		updateState(s)
		// Diff between s & state to render/patch
		const curKeys = s.keys
		if (!curKeys) {
			return
		}
		const oldKeys = state.keys
		for (let i = 0; i < PianoSVG.NUM_NOTES; ++i) {
			if (curKeys[i] != oldKeys[i]) { // tslint:disable-line triple-equals
				const ks = curKeys[i]
				const kso = oldKeys[i]
				const el = keyElements[i]
				if (el) {
					if (!ks) {
						el.remove()
						keyElements[i] = null
					}
					//if (ks === PianoSVG.KEYSTATE_ON || kso === PianoSVG.KEYSTATE_ON) {
					if (ks !== kso) {
						let c: undefined | null | string
						if (kso && (c = options.classes[kso])) {
							el.classList.remove(c)
						}
						if (ks && (c = options.classes[ks])) {
							el.classList.add(c)
						}
					}
				} else if (ks) {
					insertKeyElement(i, createKeyEl(i, ks))
				}
				// Update this key state
				oldKeys[i] = curKeys[i] || 0
			}
		}
		// TODO: Handle position or size changes!
	}

	return {
		element: svgContainer,
		render
	}
}

namespace PianoSVG {
	export type KeyState = number | null | undefined

	export const KEYSTATE_NOKEY = 0

	export type KeyColor = 'b' | 'w'

	export const NOTE_COLORS: KeyColor[] = [
		'w', 'b', 'w', 'b', 'w', 'w', 'b', 'w', 'b', 'w', 'b', 'w'
	]

	/** Number of MIDI notes, from 0-127 */
	export const NUM_NOTES = 128

	export interface Options {
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
		/** Classes for each integer state */
		classes: (string | null | undefined)[]
	}

	export interface State {
		/** State of keys indexed by MIDI id 0-127 */
		keys?: ArrayLike<KeyState>
		/** Black key width */
		bkWidth?: number
		/** Black key height */
		bkHeight?: number
		/** White key width */
		wkWidth?: number
		/** White key height */
		wkHeight?: number
		/** X drawing offset from 0 */
		x?: number
		/** Y drawing offset from 0 */
		y?: number
	}

	export interface Defaults {
		wkWidth: number
		wkHeight: number
		bkWidth: number
		bkHeight: number
		x: number
		y: number
	}

	export const DEFAULTS: Readonly<Defaults> = _DEFAULTS

	/** Count white keys included from 0 to id (not including id) */
	export function wkCountToId (id: number) {
		if (!Number.isSafeInteger(id) || id < 0 || id >= NUM_NOTES) {
			throw new Error('Invalid id for count: ' + id)
		}
		let x = 0
		for (let i = 0; i < id; ++i) {
			if (NOTE_COLORS[i % 12] === 'w') {
				++x
			}
		}
		return x
	}
}

export default PianoSVG

// Internal helpers

/** Find the next existing key of same color */
function nextExisting (id: number, keys: PianoSVG.KeyState[]): number | undefined {
	const color = PianoSVG.NOTE_COLORS[id % 12]
	for (let i = id + 1; i < PianoSVG.NUM_NOTES; ++i) {
		if (keys[i] && PianoSVG.NOTE_COLORS[i % 12] === color) {
			return i
		}
	}
	return undefined
}

function createSvg (tag: string): SVGElement {
	return document.createElementNS('http://www.w3.org/2000/svg', tag)
}
