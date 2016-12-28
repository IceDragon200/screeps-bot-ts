import Hive from "./hive";
import CartographyRepo from "./repo.cartography";

/**
 * The CreepRegistrar handles creep death and logging surveying
 * information upon death (The hive must live on!)
 */
namespace CreepRegistrar {
	/**
	 * Logs the creeps by their role to the console for debugging
	 */
	export function reportCreepsByRole(creepsByRole: Hive.ICreepsByRole) {
		Hive.Roles.forEach(function(role) {
			const [mn, mx] = Hive.PopulationCap[role];
			console.log(`Workers available ${role}: ${creepsByRole[role].length} / ${mn} / ${mx}`);
		});
	}

	export function run() {
		if (Memory['creep_registrar'] === undefined) {
			Memory['creep_registrar'] = {
				timer: 0
			};
		}
		const reg = Memory['creep_registrar'];
		if (--reg.timer < 0) {
			for (let name in Memory['creeps']) {
				if (!Game.creeps[name]) {
					CartographyRepo.log(Memory['creeps'][name]);
					delete Memory['creeps'][name];
					console.log(`Buried ${name}`);
				}
			}
			reg.timer = 60;
		}
	}
}

export default CreepRegistrar;
