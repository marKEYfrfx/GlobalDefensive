import { Instance, CSPlayerPawn, PointTemplate, CSPlayerController, Vector, QAngle, Entity } from "cs_script/point_script";

// An enum to define the current phase of the game
export enum GamePhase {
    MAIN = "MAIN",
    ARMAGEDDON = "ARMAGEDDON",
}

// An enum to define the different types of damage
export enum DamageType {
    PHYSICAL = "PHYSICAL",
    FIRE = "FIRE",
    LIGHTNING = "LIGHTNING",
    POISON = "POISON",
    AOE_EXPLOSIVE = "AOE_EXPLOSIVE",
}

// A class to hold references to map entities
export class MapEntities {
    doorTemplate: PointTemplate;
    vaseTemplate: PointTemplate;
    statueTemplate: PointTemplate;
    gallonTemplate: PointTemplate;
    literTemplate: PointTemplate;
    flowerTemplate: PointTemplate;
    ctPaths: Map<string, Entity[]>;
    tPaths: Map<string, Entity[]>;

    constructor() {
        // Helper function to find and validate a PointTemplate entity
        const findTemplate = (name: string): PointTemplate => {
            const entity = Instance.FindEntityByName(name) as PointTemplate;
            if (!entity) {
                Instance.Msg(`Failed to find PointTemplate entity with name: ${name}`);
                throw new Error(`Failed to find PointTemplate entity with name: ${name}`);
            }
            return entity;
        };

        // Find and assign the point_template entities from the map
        this.doorTemplate = findTemplate("template.troop.door");
        this.vaseTemplate = findTemplate("template.troop.vase");
        this.statueTemplate = findTemplate("template.troop.statue");
        this.gallonTemplate = findTemplate("template.troop.gallon");
        this.literTemplate = findTemplate("template.troop.liter");
        this.flowerTemplate = findTemplate("template.troop.flower");

        this.ctPaths = new Map<string, Entity[]>();
        this.tPaths = new Map<string, Entity[]>();
        const teams = ['ct', 't'];
        const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

        for (const team of teams) {
            const currentMap = team === 'ct' ? this.ctPaths : this.tPaths;
            for (const letter of letters) {
                const pathArray: Entity[] = [];
                for (let i = 1; i <= 48; i++) {
                    const entityName = `${team}_path.${letter}.${i}`;
                    const pathEntity = Instance.FindEntityByName(entityName);
                    if (!pathEntity) {
                        Instance.Msg(`Failed to find path_track entity with name: ${entityName}`);
                        throw new Error(`Failed to find path_track entity with name: ${entityName}`);
                    }
                    pathArray.push(pathEntity);
                }
                currentMap.set(letter, pathArray);
            }
        }
    }
}

/**
 * Spawns an entity template and sets up the func_tracktrain within it.
 * @param template The PointTemplate to use for spawning.
 * @param spawnNode The path_track entity where the train should start.
 * @param name The base name for the entities being spawned (e.g., "flower").
 */
function spawnEntityAt(template: PointTemplate, spawnNode: Entity, name: string): void {
    const spawnedEntities = template.ForceSpawn();
    if (spawnedEntities) {
        const trainName = `train.${name}`;
        const train = spawnedEntities.find(e => e.GetEntityName() === trainName);

        if (train) {
            const pathNodeName = spawnNode.GetEntityName();
            Instance.EntFireAtTarget({ target: train, input: "TeleportToPathNode", value: pathNodeName });
            Instance.EntFireAtTarget({ target: train, input: "SetSpeedReal", value: 100 });
            Instance.EntFireAtTarget({ target: train, input: "StartForward" });
        } else {
            Instance.Msg(`Error: Could not find train with name ${trainName} in the spawned template.`);
        }
    }
}

var mapEntities = new MapEntities();


// Map chat commands to their corresponding entity templates
const commandToTemplate = new Map<string, PointTemplate | undefined>([
    ["!flower", mapEntities.flowerTemplate],
    ["!liter", mapEntities.literTemplate],
    ["!gallon", mapEntities.gallonTemplate],
    ["!statue", mapEntities.statueTemplate],
    ["!vase", mapEntities.vaseTemplate],
    ["!door", mapEntities.doorTemplate]
]);


// Set server commands for warmup
Instance.ServerCommand("mp_warmup_offline_enabled 1");
Instance.ServerCommand("mp_warmup_pausetimer 1");
Instance.ServerCommand("bot_stop 1");
Instance.ServerCommand("mp_buy_anywhere 1");

// Handle player chat commands
Instance.OnPlayerChat(({ player, text }: { player: CSPlayerController | undefined; text: string; }) => {
    if (!player) return;
    const pathA = mapEntities.ctPaths.get('a')!;
    const spawnNode = pathA[0];
    const name = text.substring(1);
    const template = commandToTemplate.get(text);
    if (template) {
        // Call the spawn function with the template, spawn node, and entity name
        spawnEntityAt(template, spawnNode, name);
        Instance.Msg(`${name} spawned at ct_path.a.1 and is now moving.`);
    } else {
        Instance.Msg("Invalid Command");
    }
});
