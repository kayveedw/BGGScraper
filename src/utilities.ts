declare global {
	interface Array<T> {
		pushIfNew(o: T): Array<T>; // Only add to the array if not already there
	}
}
if (!Array.prototype.pushIfNew) {
	Array.prototype.pushIfNew = function <T>(this: T[], item: T): T[] {
		if (!this.includes(item)) {
			this.push(item);
		}
		return this;
	};
}

export function quoteWrapper(input: string): string {
	return '"' + input + '"';
}
export function sortStringAsc(a: string, b: string): number {
	return a !== b ? (a < b ? -1 : 1) : 0;
}
export function sortStringDesc(a: string, b: string): number {
	return sortStringAsc(b, a);
}
