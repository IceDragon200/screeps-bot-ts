export interface Action {
	id: number;
	name: string;
	params: any[];
}

namespace ActionQueue {

	function patch(target: Action[]) {
		return target || [];
	}

	export function hasQueued(target: Action[]) {
		return target && target.length > 0;
	}

	export function shift(target: Action[]): Action {
		return patch(target).shift();
	}

	export function prepend(target: Action[], value: Action) {
		target = patch(target);
		target.unshift(value);
		return target;
	}

	export function append(target: Action[], value: Action) {
		target = patch(target);
		target.push(value);
		return target;
	}

	export function complete(target: Action[], cb: (value: Action) => boolean): [boolean, Action[]] {
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

export default ActionQueue;
