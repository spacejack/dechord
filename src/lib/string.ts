export function trimStart (s: string): string {
	if (typeof s !== 'string') {
		throw new Error('trimStart requires a string')
	}
	for (let i = 0; i < s.length;) {
		if (s[i] === ' ' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r') {
			i += 1
		} else {
			return i < 1 ? s : s.substr(i)
		}
	}
	return ''
}
