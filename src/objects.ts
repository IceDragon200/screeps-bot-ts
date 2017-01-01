namespace Objects {
	export function patch<T>(obj, key: string, def: (obj: any) => T): T {
		if (obj[key] === undefined) {
			obj[key] = def(obj);
		}
		return obj[key];
	}
}

export default Objects;
