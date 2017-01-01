/**
 * The defense supervisor controls all owned towers.
 */
namespace DefenseSupervisor {
	function tryAttackHostiles(tower: StructureTower): boolean {
		const hostile = <Creep>tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
		if (hostile) {
			switch (tower.attack(hostile)) {
				case OK:
					return true;
				default:
					return false;
			}
		}
		return false;
	}

	function tryRepairStructures(tower: StructureTower): boolean {
		const damaged = <Structure>tower.pos.findClosestByRange(FIND_STRUCTURES, {
			filter: function(st: Structure) {
				return (st.hits / st.hitsMax) < 0.90;
			}
		});
		if (damaged) {
			switch (tower.repair(damaged)) {
				case OK:
					return true;
				case ERR_NOT_ENOUGH_RESOURCES:
				// handle other cases
				default:
					return false;
			};
		}
		return false;
	}

	function tryHealCreeps(tower: StructureTower): boolean {
		const injured = <Creep>tower.pos.findClosestByRange(FIND_MY_CREEPS, {
			filter: function(creep: Creep) {
				return (creep.hits / creep.hitsMax) < 0.90;
			}
		});
		if (injured) {
			switch (tower.heal(injured)) {
				case OK:
					return true;
				default:
					return false;
			}
		}
		return false;
	}

	function commandTowers(towers: StructureTower[]) {
		towers.forEach((tower) => {
			if (tower.energy > 0) {
				tryAttackHostiles(tower) ||
				tryRepairStructures(tower) ||
				tryHealCreeps(tower);
			}
		});
	}

	export function run() {
		for (let name in Game.rooms) {
			const room = Game.rooms[name];
			const towers = <StructureTower[]>room.find(FIND_MY_STRUCTURES, {
				filter: (s: Structure) => {
					if (s instanceof StructureTower) {
						return s.energy > 0;
					} else {
						return false;
					}
				}
			});
			commandTowers(towers);
		}
	}
}

export default DefenseSupervisor;
