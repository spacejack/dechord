import Stream from 'mithril/stream'
import Input from '.'

interface MIDIInput {
	onmidimessage(event: any): void
	addEventListener(type: string, cb: (e: Event) => void, bubbles?: boolean): void
	removeEventListener(type: string, cb: (e: Event) => void, bubbles?: boolean): void
}

interface MIDIInputMap {
	values(): Iterator<MIDIInput>
}

interface MIDIAccess {
	inputs: MIDIInputMap
	onstatechange(event: Event & {port: any}): void
}

declare global {
	interface Navigator {
		requestMIDIAccess?(): Promise<MIDIAccess>
	}
}

/** Create instance of MidiInput */
export default function MidiInput (opts: Input.Options): Input {
	const status = Stream<string>()
	const device = Stream<Input.Device>()
	const state = Array.from({length: Input.TOTAL_NOTES}, () => false)
	const midiInputs: MIDIInput[] = []

	if (navigator.requestMIDIAccess) {
		console.log('navigator.requestMIDIAccess found')
		navigator.requestMIDIAccess().then(midi => {
			const inputs = midi.inputs.values()
			for (let ir = inputs.next(); ir && !ir.done; ir = inputs.next()) {
				const input = ir.value
				console.log('midi input:', input)
				midiInputs.push(input)
				//input.value.onmidimessage = onMIDIMessage
				input.addEventListener('midimessage', onMIDIMessage)
			}
			midi.onstatechange = onMIDIStateChange
		}).catch(err => {
			console.log('requestMIDIAccessFailure:', err)
			status('MIDI access request failed.')
		})
	} else {
		console.log('navigator.requestMIDIAccess undefined')
		status('MIDIAccess unsupported')
	}

	function onMIDIStateChange (event: Event & {port: any}) {
		console.log('midiOnStateChange event:', event)
		const port = event.port
		console.log('port:', event.port)
		status(port.manufacturer + ' / ' + port.name + ' (' + port.state + ')')
		device({
			id: port.id,
			name: port.name,
			manufacturer: port.manufacturer,
			state: port.state,
			type: port.type
		})
	}

	function onMIDIMessage (event: any) {
		const data: Int8Array = event.data
		const cmd = data[0] >> 4
		const channel = data[0] & 0xf
		const type = data[0] & 0xf0
		const pitch = data[1]
		const velocity = data[2]
		switch (type) {
			case 144:
			if (velocity > 0) {
					// When velocity=0 the note is released
					state[pitch] = true
					opts.onPlay(new Input.PlayEvent('play', pitch, velocity))
				} else {
					state[pitch] = false
					opts.onStop(new Input.PlayEvent('stop', pitch, velocity))
				}
				break
			case 128:
				state[pitch] = false
				opts.onStop(new Input.PlayEvent('stop', pitch, velocity))
				break
		}
	}

	return {
		status, device, state,
		destroy: () => {
			for (const input of midiInputs) {
				input.removeEventListener('midimessage', onMIDIMessage)
			}
		}
	}
}
