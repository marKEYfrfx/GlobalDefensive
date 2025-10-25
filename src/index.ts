import { Instance, CSPlayerPawn, PointTemplate, CSPlayerController, Vector, QAngle, Entity, EntityDamage } from "cs_script/point_script";
import { CFuncTrackTrain, CPropPhysicsMultiplayer } from "./HammerEntities";

// An enum to define the current phase of the game
export enum GamePhase {
    e_MAIN = "MAIN",
    e_ARMAGEDDON = "ARMAGEDDON",
}

// An enum to define the different types of damage
export enum DamageType {
    e_PHYSICAL = "PHYSICAL",
    e_FIRE = "FIRE",
    e_LIGHTNING = "LIGHTNING",
    e_POISON = "POISON",
    e_AOE_EXPLOSIVE = "AOE_EXPLOSIVE",
}

export enum TroopType {
    e_DOOR = "DOOR",
    e_VASE = "VASE",
    e_STATUE = "STATUE",
    e_GALLON = "GALLON",
    e_LITER = "LITER",
    e_FLOWER = "FLOWER",
}

export class CTroop {
    private m_trackTrain: CFuncTrackTrain;
    private m_propPhysicsMultiplayer: CPropPhysicsMultiplayer;

    constructor(trackTrain: CFuncTrackTrain, propPhysicsMultiplayer: CPropPhysicsMultiplayer) {
        this.m_propPhysicsMultiplayer = propPhysicsMultiplayer;
        this.m_trackTrain = trackTrain;
    }
}

// A class to hold references to map entities
export class CMapEntities {
    m_doorTemplate: PointTemplate;
    m_vaseTemplate: PointTemplate;
    m_statueTemplate: PointTemplate;
    m_gallonTemplate: PointTemplate;
    m_literTemplate: PointTemplate;
    m_flowerTemplate: PointTemplate;
    m_ctPaths: Map<string, Entity[]>;
    m_tPaths: Map<string, Entity[]>;

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
        this.m_doorTemplate = findTemplate("template.troop.door");
        this.m_vaseTemplate = findTemplate("template.troop.vase");
        this.m_statueTemplate = findTemplate("template.troop.statue");
        this.m_gallonTemplate = findTemplate("template.troop.gallon");
        this.m_literTemplate = findTemplate("template.troop.liter");
        this.m_flowerTemplate = findTemplate("template.troop.flower");

        this.m_ctPaths = new Map<string, Entity[]>();
        this.m_tPaths = new Map<string, Entity[]>();
        const teams = ['ct', 't'];
        const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

        for (const team of teams) {
            const currentMap = team === 'ct' ? this.m_ctPaths : this.m_tPaths;
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
        const trainEntity = spawnedEntities.find(e => e.GetEntityName() === trainName);

        if (trainEntity) {
            // **FIX:** Change the prototype of the engine entity to our custom class prototype.
            // This makes the engine's entity object behave like an instance of CFuncTrackTrain.
            Object.setPrototypeOf(trainEntity, CFuncTrackTrain.prototype);

            // Now we can safely cast and use our custom methods.
            const train = trainEntity as CFuncTrackTrain;
            train.teleportToPathAndStart(spawnNode, 500); // Example speed of 500
        } else {
            Instance.Msg(`Error: Could not find train with name ${trainName} in the spawned template.`);
        }
    }
}

/*
* Singleton/Global
*/
var g_mapEntities = new CMapEntities();


// Map chat commands to their corresponding entity templates
const commandToTemplate = new Map<string, PointTemplate | undefined>([
    ["!flower", g_mapEntities.m_flowerTemplate],
    ["!liter", g_mapEntities.m_literTemplate],
    ["!gallon", g_mapEntities.m_gallonTemplate],
    ["!statue", g_mapEntities.m_statueTemplate],
    ["!vase", g_mapEntities.m_vaseTemplate],
    ["!door", g_mapEntities.m_doorTemplate]
]);


// Set server commands for warmup
Instance.ServerCommand("mp_warmup_offline_enabled 1");
Instance.ServerCommand("mp_warmup_pausetimer 1");
Instance.ServerCommand("bot_stop 1");
Instance.ServerCommand("mp_buy_anywhere 1");

// Handle player chat commands
Instance.OnPlayerChat(({ player, text }: { player: CSPlayerController | undefined; text: string; }) => {
    if (!player) return;
    const pathA = g_mapEntities.m_ctPaths.get('a')!;
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