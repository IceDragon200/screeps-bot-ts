namespace CreepQueue {
	function patch(target: string[]) {
		return target || [];
	}

	export function hasQueued(target: string[]) {
		return target && target.length > 0;
	}

	export function shift(target: string[]): string {
		return patch(target).shift();
	}

	export function prepend(target: string[], value: string) {
		target = patch(target);
		target.unshift(value);
		return target;
	}

	export function append(target: string[], value: string) {
		target = patch(target);
		target.push(value);
		return target;
	}

	export function complete(target: string[], cb: (value: string) => boolean): [boolean, queue] {
		target = patch(target);
		if (target.length > 0) {
			const value = target[0];
			if (cb(value)) {
				shift(target);
				return [true, target];
			}
		}
		return [false, target];
	}
}

export default CreepQueue;
