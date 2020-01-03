import Stream from 'mithril/stream'

interface Input {
	device: Stream<Input.Device>
	status: Stream<string>
	state: boolean[]
	destroy(): void
}

import MidiInput from './MidiInput'
import KeyboardInput from './KeyboardInput'
import SocketInput from './SocketInput'

function Input (type: Input.Type, options: Input.Options): Input {
	return type === 'midi' ? MidiInput(options)
		: type === 'socket' ? SocketInput(options)
		: KeyboardInput(options)
}

namespace Input {
	export type Type = 'keyboard' | 'midi' | 'socket'
	export const TOTAL_NOTES  = 128
	export const MAX_VELOCITY = 127

	export interface Device {
		id: string
		name: string
		manufacturer: string
		state: string
		type: string
	}

	export class PlayEvent {
		type: 'play' | 'stop'
		pitch: number
		velocity: number
		constructor(type: 'play' | 'stop', pitch: number, velocity = 0) {
			this.type = type
			this.pitch = pitch
			this.velocity = velocity
		}
	}

	export class DeviceEvent {
		type: 'device'
		device: Device
		constructor(type: 'device', device: Device) {
			this.type = type
			this.device = device
		}
	}

	export interface Options {
		onPlay(e: PlayEvent): void
		onStop(e: PlayEvent): void
	}
}

export default Input
