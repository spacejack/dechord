import Stream from 'mithril/stream'
import Input from './index'

function KeyboardInput (options: Input.Options): Input {
	const status = Stream<string>()
	const device = Stream<Input.Device>()
	const state = Array.from({length: Input.TOTAL_NOTES}, x => false)

	function onKeyDown (e: KeyboardEvent) {
		const pitch = KeyboardInput.keyCodeToPitch(e.keyCode)
		if (!state[pitch]) {
			state[pitch] = true
			options.onPlay(new Input.PlayEvent('play', pitch, Input.MAX_VELOCITY))
		}
	}

	function onKeyUp (e: KeyboardEvent) {
		const pitch = KeyboardInput.keyCodeToPitch(e.keyCode)
		state[pitch] = false
		options.onStop(new Input.PlayEvent('play', pitch, Input.MAX_VELOCITY))
	}

	window.addEventListener('keydown', onKeyDown)
	window.addEventListener('keyup', onKeyUp)

	Promise.resolve().then(() => {
		status('Keyboard connected')
		device({
			id: '0',
			name: 'Computer keyboard',
			manufacturer: 'unknown',
			state: 'connected',
			type: 'computer'
		})
	})

	return {
		status, device, state,
		destroy: () => {
			window.removeEventListener('keydown', onKeyDown)
			window.removeEventListener('keyup', onKeyUp)
		}
	}
}

namespace KeyboardInput {
	export function keyCodeToPitch (k: number) {
		// TODO: Translate keycode to pitch
		return k
	}

	export function pitchToKeyCode (pitch: number) {
		// TODO: Translate
		return pitch
	}
}

export default KeyboardInput
