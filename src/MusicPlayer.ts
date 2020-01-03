// This uses the WebAudioFontPlayer library to play instruments.
// The library and instruments are available via a window global.
declare global {
	interface WebAudioFontPlayer {
		loader: {
			startLoad(a: AudioContext, url: string, param: string): void
			waitLoad(cb: () => void): void
			decodeAfterLoading(a: AudioContext, name: string): void
			instrumentKeys(): string[]
			instrumentInfo(index: number): {
				url: string
				variable: string
				title: string
			}
		}
		cancelQueue(a: AudioContext): void
		queueWaveTable(
			audioContext: AudioContext,
			destination: AudioDestinationNode,
			tone: WebAudioFontPlayer.Tone,
			n: number,
			pitch: number,
			duration: number,
			velocity: number,
			bend?: any
		): void
	}

	namespace WebAudioFontPlayer {
		interface Tone {
			zones: {
				buffer: AudioBuffer
				delay: number
				[id: string]: any
			}[]
		}
	}

	interface Window {
		/** Webkit prefixed AudioContext */
		webkitAudioContext?: typeof AudioContext
		/** WebAudioFontPlayer global */
		WebAudioFontPlayer: new() => WebAudioFontPlayer
		/** Default WebAudioFontPlayer instrument */
		_tone_0000_JCLive_sf2_file: any
	}
}

const XAudioContext = window.AudioContext || window.webkitAudioContext // as AudioContext

interface MusicPlayer {
	playNote(idx: number, pitch: number, volume: number, duration: number): void
	stopNote(pitch: number): void
	stopAll(): void
	loadInstrument(index: number): Promise<number>
	instruments: MusicPlayer.Instrument[]
	playingNotes: ReadonlyArray<MusicPlayer.Note>
}

/**
 * Create an instance of MusicPlayer.
 * Call this on user input so Audio is enabled correctly.
 */
function MusicPlayer(): MusicPlayer {
	if (!XAudioContext) {
		throw new Error('Could not find AudioContext support')
	}
	if (!window._tone_0000_JCLive_sf2_file) {
		throw new Error('_tone_0000_JCLive_sf2_file object not found on window')
	}
	const playingNotes: {pitch: number; envelope: any}[] = []
	const audioContext = new XAudioContext()
	const afPlayer = new window.WebAudioFontPlayer()
	afPlayer.loader.decodeAfterLoading(audioContext, '_tone_0000_JCLive_sf2_file')
	const instruments: MusicPlayer.Instrument[] = afPlayer.loader.instrumentKeys().map((k, i) => ({
		key: k,
		label: afPlayer.loader.instrumentInfo(i).title,
		tone: undefined
	}))
	// First instrument is loaded by default(?) as a global on window
	instruments[0].tone = window._tone_0000_JCLive_sf2_file

	function loadInstrument (index: number): Promise<number> {
		if (!Number.isSafeInteger(index) || index < 0 || index >= instruments.length) {
			return Promise.reject(new Error('Out of range instrument index: ' + index))
		}
		if (instruments[index].tone != null) {
			return Promise.resolve(index)
		}
		return new Promise((resolve, reject) => {
			const info = afPlayer.loader.instrumentInfo(index)
			afPlayer.loader.startLoad(audioContext, info.url, info.variable)
			afPlayer.loader.waitLoad(() => {
				const tone = (window as any)[info.variable]
				instruments[index].tone = tone
				console.log(`loaded instrument '${info.variable}' (${index}). tone:`, tone)
				afPlayer.cancelQueue(audioContext)
				resolve(index)
			})
		})
	}

	function playNote (idx: number, pitch: number, volume: number, duration: number) {
		stopNote(pitch)
		if (typeof idx !== 'number' || !Number.isSafeInteger(idx) || idx < 0 || idx >= instruments.length) {
			throw new Error('Invalid instrument index: ' + idx)
		}
		const instrument = instruments[idx]
		if (!instrument.tone) {
			console.warn("This tone hasn't been loaded yet")
			return false
		}
		const envelope = afPlayer.queueWaveTable(
			audioContext, audioContext.destination, instrument.tone!, 0,
			pitch, duration, volume
		)
		const note = {pitch, envelope}
		playingNotes.push(note)
		return true
	}

	function stopNote (pitch: number) {
		for (let i = 0; i < playingNotes.length; ++i) {
			const note = playingNotes[i]
			if (note.pitch === pitch) {
				if (note.envelope) {
					note.envelope.cancel()
				}
				playingNotes.splice(i, 1)
				return
			}
		}
	}

	function stopAll() {
		for (let i = 0; i < playingNotes.length; ++i) {
			const note = playingNotes[i]
			if (note.envelope) {
				note.envelope.cancel()
			}
		}
		playingNotes.length = 0
	}

	return {
		playNote,
		stopNote,
		stopAll,
		instruments,
		loadInstrument,
		playingNotes
	}
}

namespace MusicPlayer {
	export interface Instrument {
		key: string
		label: string
		tone: WebAudioFontPlayer.Tone | undefined
	}

	export interface Note {
		pitch: number
		envelope: any
	}
}

export default MusicPlayer
