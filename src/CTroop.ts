import { Instance, CSPlayerPawn, PointTemplate, CSPlayerController, Vector, QAngle, Entity, EntityDamage } from "cs_script/point_script";
import { CFuncTrackTrain, CPathTrack, CPropPhysicsMultiplayer } from "./HammerEntities";
import { IDebuggable } from "./CDebugMenu";

export enum TroopType {
    e_DOOR = "DOOR",
    e_VASE = "VASE",
    e_STATUE = "STATUE",
    e_GALLON = "GALLON",
    e_LITER = "LITER",
    e_FLOWER = "FLOWER",
}

export class CTroop implements IDebuggable {
    private m_troopType: TroopType;
    private m_trackTrain: CFuncTrackTrain;
    private m_propPhysicsMultiplayer: CPropPhysicsMultiplayer;
    private m_currentHealth: number = 0;
    private m_healthConnectionId: number | undefined;

    /**
     * Constructs a CTroop object, which spawns and manages a troop entity.
     * @param template The PointTemplate entity used to spawn this troop.
     */
    constructor(template: PointTemplate) {
        // Infer the troop type from the template's entity name (e.g., "template.troop.door" -> "DOOR")
        const templateName = template.GetEntityName();
        const parts = templateName.split('.');
        const typeStr = parts[parts.length - 1].toUpperCase();

        // Dynamically get the enum value from the derived string
        const troopTypeEnum = (TroopType as any)[`e_${typeStr}`];

        if (troopTypeEnum === undefined) {
            const errorMsg = `Could not determine troop type from template name: ${templateName}`;
            Instance.Msg(errorMsg);
            throw new Error(errorMsg);
        }
        this.m_troopType = troopTypeEnum;

        // ForceSpawn creates the entities defined in the template.
        const spawnedEntities = template.ForceSpawn();
        if (!spawnedEntities || spawnedEntities.length === 0) {
            const errorMsg = `Failed to spawn entities from template ${template.GetEntityName()}.`;
            Instance.Msg(errorMsg);
            throw new Error(errorMsg);
        }

        const troopName = this.m_troopType.toString().toLowerCase(); // e.g., "door"
        const trainNameBase = `train.${troopName}`;
        const propNameBase = `mdl.${troopName}`;

        // Find entities by checking if their name starts with the base name
        const trainEntity = spawnedEntities.find(e => e.GetEntityName().startsWith(trainNameBase));
        if (trainEntity) {
            Object.setPrototypeOf(trainEntity, CFuncTrackTrain.prototype);
            this.m_trackTrain = trainEntity as CFuncTrackTrain;
        } else {
            const errorMsg = `Could not find train with base name ${trainNameBase} in the spawned template.`;
            Instance.Msg(errorMsg);
            throw new Error(errorMsg);
        }

        const propEntity = spawnedEntities.find(e => e.GetEntityName().startsWith(propNameBase));
        if (propEntity) {
            Object.setPrototypeOf(propEntity, CPropPhysicsMultiplayer.prototype);
            this.m_propPhysicsMultiplayer = propEntity as CPropPhysicsMultiplayer;
            
            // Connect to the OnHealthChanged output to track health changes
            this.m_healthConnectionId = Instance.ConnectOutput(
                this.m_propPhysicsMultiplayer,
                "OnHealthChanged",
                (inputData) => {
                    // The value parameter contains the new health value
                    if (typeof inputData.value === 'number') {
                        this.m_currentHealth = inputData.value;
                        Instance.Msg(`[CTroop ${this.m_troopType}] Health changed to: ${this.m_currentHealth}`);
                    }
                }
            );
        } else {
            const errorMsg = `Could not find prop with base name ${propNameBase} in the spawned template.`;
            Instance.Msg(errorMsg);
            throw new Error(errorMsg);
        }

    }

    /**
     * Gets the type of this troop.
     * @returns The TroopType enum member.
     */
    public getTroopType(): TroopType {
        return this.m_troopType;
    }

    /**
     * Gets the current health of the prop_physics_multiplayer entity.
     * This value is updated via the OnHealthChanged output.
     * @returns The current health value.
     */
    public getCurrentHealth(): number {
        return this.m_currentHealth;
    }

    /**
     * Cleans up the troop by disconnecting output listeners.
     * Call this when you're done with the troop to prevent memory leaks.
     */
    public destroy(): void {
        if (this.m_healthConnectionId !== undefined) {
            Instance.DisconnectOutput(this.m_healthConnectionId);
            this.m_healthConnectionId = undefined;
        }
    }

    /**
     * Starts the troop's movement from a given path node.
     * @param spawnNode The path_track entity where the troop should start.
     */
    public SpawnAt(spawnNode: CPathTrack): void {
        this.m_trackTrain.teleportToPathAndStart(spawnNode, 500);
    }

    /**
     * The title for the entire column.
     */
    debugColumnTitle(): string {
        return "CTroop";
    };

    /**
     * The name for the specific entity/row.
     */
    debugEntityName(): string {
        return this.getTroopType();
    };
    
    /**
     * The current value to display for the entity/row.
     */
    debugCurrentValue(): string {
        return `Health: ${this.m_currentHealth}`;
    }
}
