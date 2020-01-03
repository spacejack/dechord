import Stream from 'mithril/stream'
import Input from '.'

const WS_PORT = 3030

interface MIDIMessage {
	type: number
	pitch: number
	velocity: number
}

function SocketInput (opts: Input.Options): Input {
	const status = Stream<string>()
	const device = Stream<Input.Device>()
	const state = Array.from<boolean>({length: Input.TOTAL_NOTES}).fill(false)
	const msg: MIDIMessage = {
		type: 0, pitch: 0, velocity: 0
	}

	let ws = new WebSocket('ws://localhost:' + WS_PORT)
	let inPorts: string[] = []
	let outPorts: string[] = []

	// Listen for opened
	ws.addEventListener('open', e => {
		status('WebSocket connected')
		device({
			id: '??',
			name: 'WebSocket',
			manufacturer: '',
			state: 'open',
			type: 'WebSocket'
		})
		// Request MIDI in & out ports
		ws.send('inports')
		ws.send('outports')
	})

	// Add the message listener
	ws.addEventListener('message', evt => {
		const raw = String(evt.data)
		const delimPos = raw.indexOf(' ')
		const msgName = delimPos >= 0 ? raw.slice(0, delimPos) : raw
		const data = delimPos >= 0 ? raw.slice(delimPos + 1) : undefined
		if (msgName === 'M') {
			// Handle MIDI message
			const parts = raw.split(' ')
			msg.type = Number(parts[1])
			msg.pitch = Number(parts[2])
			msg.velocity = Number(parts[3])
			switch (msg.type) {
				case 144:
				if (msg.velocity > 0) {
						state[msg.pitch] = true
						opts.onPlay(new Input.PlayEvent('play', msg.pitch, msg.velocity))
					} else {
						// When velocity=0 the note is released
						state[msg.pitch] = false
						opts.onStop(new Input.PlayEvent('stop', msg.pitch, msg.velocity))
					}
					break
				case 128:
					state[msg.pitch] = false
					opts.onStop(new Input.PlayEvent('stop', msg.pitch, msg.velocity))
					break
			}
		} else if (msgName === 'inports') {
			if (data != null) {
				inPorts = JSON.parse(data)
				console.log('Got inPorts:', inPorts)
			} else {
				console.warn('Got empty data for inports message')
			}
		} else if (msgName === 'outports') {
			if (data != null) {
				outPorts = JSON.parse(data)
				console.log('Got outPorts:', outPorts)
			} else {
				console.warn('Got empty data for outports message')
			}
		}
	})

	function destroy() {
		if (ws != null) {
			ws.close()
			ws = undefined as any
		}
	}

	return {
		status, device, state, destroy
	}
}

export default SocketInput
