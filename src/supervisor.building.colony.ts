/**
 * TODO:
 */
namespace BuildingSupervisor {
	export function run(env) {
		Memory['buildingTimer'] = Number(Memory['buildingTimer']) - 1;
		if (Memory['buildingTimer'] <= 0) {
			for (let name in Game.spawns) {
				const spawner = Game.spawns[name];
				//layGroundWorkFor(spawner);
			}
			Memory['buildingTimer'] = 120;
		}
		return env;
	}
}

export default BuildingSupervisor;
