import {chord} from '@tonaljs/chord'
type Chord = ReturnType<typeof chord>
import {toMidi} from '@tonaljs/midi'

export interface Options {
	wrapTo?: number
}

export function chordToMidiNotes (c: Chord, options: Options = {}) {
	const notes: number[] = []
	const wrapTo = options.wrapTo
	if (wrapTo != null && (!Number.isSafeInteger(wrapTo) || wrapTo < 12)) {
		throw new Error('Invalid wrapTo value: ' + options.wrapTo)
	}
	for (let ni = 0; ni < c.notes.length; ++ ni) {
		const n = c.notes[ni]
		let i = toMidi(n + '0')
		if (i != null) {
			const prevId = notes.length > 0 ? notes[notes.length - 1] : undefined
			// Try to ensure we're always moving up the scale
			if (prevId != null && i < prevId) {
				i += 12
			}
			// Start low enough on the keyboard
			if (i > 12 && (prevId == null || i - 12 > prevId)) {
				i -= 12
			}
			if (wrapTo != null) {
				// Don't spread the chord past the specified number of keys
				if (notes.length > 0 && i > notes[0] + wrapTo) {
					i -= 12
				}
			}
			notes.push(i)
		} else {
			console.warn('Failed to parse note: ' + n)
		}
	}
	return notes
}

/** @deprecated Using Tonal.js instead */
function parseChord (str: string) {
	const RX = /([A-Ga-g]{1})([Bb\#]?)([\-\^]?)([0-9]?)([0-9]?)/
	const r = RX.exec(str)
	if (r == null) {
		return ''
	}
	const key = r[1].toUpperCase()
	const flatSharp = r[2] ? r[2].toLowerCase() : ''
	const type = r[3] || ''
	const num = r[4] || ''
	const num2 = r[5] || ''
	return key + flatSharp + type + num + num2
}
