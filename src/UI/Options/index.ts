import m from 'mithril'

let isOpen = false

export function open() {
	isOpen = true
}

export function close() {
	isOpen = false
}

export interface Opts {
	wrapTo1Octave: boolean
}

export interface Attrs {
	options: Opts
	onChange(o: Opts): void
}

export default function Options(): m.Component<Attrs> {
	return {
		view: ({attrs: {options, onChange}}) => {
			return m('.options',
				m('h2', 'Options'),
				m('.inputs',
					m('label.clickable',
						m('input', {
							type: 'checkbox',
							checked: options.wrapTo1Octave,
							onclick: () => {
								options.wrapTo1Octave = !options.wrapTo1Octave
								onChange(options)
							}
						}),
						' Wrap notes to 1 octave'
					)
				),
				m('hr'),
				m('.text-col',
					m('h3', 'DECHORD: A Jazz chord parser & player'),
					m('p', '© 2019 by ',
						m('a', {href: 'https://github.com/spacejack'}, 'spacejack'),
						' | ', m('a', {href: 'https://github.com/spacejack/dechord'}, 'Github Repo')
					),
					m('p', 'By enabling audio and MIDI, you can hear the chord, as well as play along with a connected MIDI device. Note that only Chromium browsers support MIDI. Firefox may have MIDI extensions.'),
					m('p', 'Uses ',
						m('a', {href: 'https://github.com/MithrilJS/mithril.js'}, 'Mithril.js'),
						' for UI, ', m('a', {href: 'https://github.com/tonaljs/tonal'}, 'Tonal.js'),
						' for chord parsing, and ', m('a', {href: 'https://github.com/surikov/webaudiofont'}, ' WebAudioFontPlayer'), ' for instrument sounds.'
					),
					m('p', 'Performs some additonal convenience parsing to understand ',
						m('a', {class: 'nobr', href: 'https://irealpro.com/dwkb/chord-symbols/'}, 'iReal Pro chord symbols'),
						'.'
					),
					m('p', 'For more information on piano chords and extensions, see ',
						m('a',
							{class: 'nobr', href: 'https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-chords/extensions-alterations/'},
							'this helpful reference'
						),
						'.'
					)
				)
			)
		}
	}
}
