namespace Objects {
	export function patch(obj, key, def) {
		if (obj[key] === undefined) {
			obj[key] = def(obj);
		}
		return obj[key];
	}
}

export default Objects;
