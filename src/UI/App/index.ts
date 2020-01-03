import m from 'mithril'
import {chord} from '@tonaljs/chord'
type Chord = ReturnType<typeof chord>
import PianoSVG from '../../lib/PianoSVG'
import {trimStart} from '../../lib/string'
import {chordToMidiNotes} from '../../lib/music'
import Input from '../../lib/Input'
import MusicPlayer from '../../MusicPlayer'
import OptionsPanel from '../Options'

const KEYSTATE_OFF = 1
const KEYSTATE_ON = 2
const KEYSTATE_PRESSED = 3
const KEYSTATE_COMBINED = 4

// Key sizes
const WK_WIDTH = 40
const WK_HEIGHT = 200
const BK_WIDTH = 25
const BK_HEIGHT = 124

/** How long to hold chord when played */
const PLAY_CHORD_DURATION = 4

/** Render 3 octaves */
const NUM_KEYS = 12 * 3 + 1

const EXAMPLES = [
	'Db^', 'C7', 'F-7', 'Ebm7', 'Ab7', 'Db^', 'C7', 'F-7', 'E-7', 'Eb-7', 'Ab13'
]

/** App component */
export default function App(): m.Component {
	/** PianoSVG state */
	const state = {
		// Two octave keyboard
		keys: Array.from(
			{length: NUM_KEYS}, () => KEYSTATE_OFF
		) as PianoSVG.KeyState[],
		bkWidth: BK_WIDTH,
		bkHeight: BK_HEIGHT,
		wkWidth: WK_WIDTH,
		wkHeight: WK_HEIGHT
	}
	/** Lowest MIDI note rendered */
	const noteOffset = 4 * 12
	const noteEnd = noteOffset + NUM_KEYS
	/** Will hold instance of PianoSVG */
	let pianoSvg: PianoSVG | undefined
	/** User typed chord string */
	let chordSrc = ''
	/** Current parsed chord object */
	let curChord: {chord: Chord, notes: Set<number>} | undefined
	/** Music player */
	let player: MusicPlayer | undefined
	/** MIDI input */
	let input: Input | undefined
	let instrument = 0
	let volume = 0.1
	//let wrapNotes = false
	let exampleIndex = 0
	let optionsOpen = false
	const appOptions = {
		wrapTo1Octave: false
	}

	/* Reset piano keys state */
	function resetKeys() {
		for (let i = 0; i < state.keys.length; ++i) {
			state.keys[i] = KEYSTATE_OFF
		}
		pianoSvg?.render(state)
	}

	function pressNote (e: Input.PlayEvent) {
		const p = e.pitch
		if (player) {
			player.playNote(instrument, p, volume * (e.velocity / 127), PLAY_CHORD_DURATION)
		}
		if (p >= noteOffset && p < noteEnd) {
			render()
		}
	}

	function releaseNote (e: Input.PlayEvent) {
		const p = e.pitch
		if (player) {
			player.stopNote(p)
		}
		if (p >= noteOffset && p < noteEnd) {
			render()
		}
	}

	function render() {
		const cnotes = curChord ? curChord.notes : new Set<number>()
		const inotes = new Set<number>()
		if (input) {
			for (let i = noteOffset; i < noteEnd; ++i) {
				if (input.state[i]) {
					inotes.add(i - noteOffset)
				}
			}
		}
		for (let i = 0; i < NUM_KEYS; ++i) {
			state.keys[i] = cnotes.has(i) && inotes.has(i) ? KEYSTATE_COMBINED
				: inotes.has(i) ? KEYSTATE_PRESSED
				: cnotes.has(i) ? KEYSTATE_ON
				: KEYSTATE_OFF
		}
		pianoSvg?.render(state)
	}

	function setChord (str: string) {
		chordSrc = str ? trimStart(str) : ''
		// Custom pre-processing on input
		// We don't deal with octaves, so always interpret '-' as minor (m)
		// We also want to allow ^ or ^7 for Δ
		const src = chordSrc.replace(/\-/g, 'm').replace(/\^7/g, 'Δ').replace(/\^/g, 'Δ')
		// Then send it to tonal to parse
		const c = chord(src)
		if (!c.name) {
			curChord = undefined
			resetKeys()
			return
		}
		curChord = {
			chord: c,
			notes: new Set(chordToMidiNotes(c, {
				wrapTo: appOptions.wrapTo1Octave ? 12 : undefined
			}))
		}
		render()
	}

	function initPlayer() {
		if (player) return player
		try {
			player = MusicPlayer()
			input = Input('midi', {
				onPlay: pressNote,
				onStop: releaseNote
			})
		} catch (err) {
			console.warn('Error creating MusicPlayer:', err)
			return undefined
		}
		console.log('Created MusicPlayer instance')
		console.log('Instruments: ', player.instruments.length)
		return player
	}

	function playChord() {
		if (!curChord || !player) {
			return false
		}
		for (const n of curChord.notes.values()) {
			player.playNote(instrument, n + noteOffset, volume, PLAY_CHORD_DURATION)
		}
		return true
	}

	/** A piano key was (possibly) clicked */
	function clickKey (e: Event) {
		const keyEl = e.target
	// 	if (key instanceof SVGElement) {
	// 		noteId = key.dataset.noteid || ''
	// 		if (noteId) {
	// 			// Flip the state of this key then re-render the keyboard
	// 			const i = Number(noteId)
	// 			state.keys[i] = state.keys[i] === PianoSVG.KEYSTATE_ON
	// 				? PianoSVG.KEYSTATE_OFF : PianoSVG.KEYSTATE_ON
	// 			pianoSvg?.render(state)
	// 		}
	// 	}
	}

	return {
		view: () => m('.app',
			m('h1', {class: 'center pt05'}, 'Dechord'),
			m('.piano-container', {
				onclick: clickKey,
				oncreate: v => {
					// Create an instance of PianoSVG
					pianoSvg = PianoSVG({
						classRoot: 'piano',
						classBKey: 'key-black',
						classWKey: 'key-white',
						classes: [null, null, 'key-active', 'key-pressed', 'key-combined']
					})
					// Set a specific width & height based on our key sizes/count
					pianoSvg.element.style.width = `${PianoSVG.wkCountToId(state.keys.length) * state.wkWidth}px`
					pianoSvg.element.style.height = `${state.wkHeight}px`
					// Initial render of keyboard
					pianoSvg.render(state)
					// Show it in the page
					v.dom.appendChild(pianoSvg.element)
				},
				onremove: () => {
					if (pianoSvg != null) {
						pianoSvg.element.remove()
						pianoSvg = undefined
					}
				}
			}),
			m('div.center',
				m('h3', 'Enter a chord: (',
					m('a', {
						onclick: (e: Event) => {
							e.preventDefault()
							const str = EXAMPLES[exampleIndex]
							exampleIndex = (exampleIndex + 1) % EXAMPLES.length
							setChord(str)
						}
					}, 'example'),
					')'
				),
				m('.large.mt1.mb1.fx-c',
					m('input.center', {
						type: 'text',
						style: 'width: 10em',
						value: chordSrc,
						oninput: ((e: Event) => {
							setChord((e.currentTarget as HTMLInputElement).value)
						})
					}),
					m('button.ml05',
						{
							type: 'button',
							title: player ? null : 'Click to enable audio and MIDI input',
							disabled: !!player && (!curChord || curChord.notes.size < 1),
							onclick: !!player ? playChord : initPlayer
						},
						player ? 'Play'
							: m('span.tiny.lbr',
								{style: 'display: block; line-height: 1.1em'},
								'audio\n& midi'
							)
					)
				),
				m('h4', curChord && curChord.notes.size > 0
					? curChord.chord.name
					: m.trust('&nbsp;')
				)
			),
			optionsOpen && m(OptionsPanel, {
				options: appOptions,
				onChange: o => {
					if (curChord != null) {
						setChord(chordSrc)
					}
				}
			}),
			m('button.btn-options',
				{
					onclick: () => {
						optionsOpen = !optionsOpen
					}
				},
				m('img', {
					src: './img/options.svg'
				})
			)
		)
	}
}
