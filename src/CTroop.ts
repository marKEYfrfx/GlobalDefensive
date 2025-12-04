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
    private m_currentHealth: number = 1;
    private m_healthConnectionId: number | undefined;


private spawnTroopEntities(template: PointTemplate): { propEnt: CPropPhysicsMultiplayer, trainEnt: CFuncTrackTrain } | undefined {
        const spawnedEntities = template.ForceSpawn();
        if (!spawnedEntities || spawnedEntities.length === 0) {
            const errorMsg = `Failed to spawn entities from template ${template.GetEntityName()}.`;
            Instance.Msg(errorMsg);
            throw new Error(errorMsg);
        }
        // Find entities by pattern - train.* and mdl.*
        const trainEntity = spawnedEntities.find(e => e.GetEntityName().startsWith("train."));
        const propEntity = spawnedEntities.find(e => e.GetEntityName().startsWith("mdl."));
        if (trainEntity && propEntity) {
            // Apply prototype casting to attach custom behavior
            Object.setPrototypeOf(trainEntity, CFuncTrackTrain.prototype);
            const trackTrain = trainEntity as CFuncTrackTrain;

            Object.setPrototypeOf(propEntity, CPropPhysicsMultiplayer.prototype);
            const propPhysics = propEntity as CPropPhysicsMultiplayer;
            return { propEnt: propPhysics, trainEnt: trackTrain };
        }
        return undefined;
    }

    /**
     * Discovers the troop type from the prop entity's name.
     * Expects entity names in format: "mdl.{trooptype}" (e.g., "mdl.door", "mdl.vase")
     * @returns The discovered TroopType
     */
    private discoverTroopType(template: PointTemplate): TroopType {
        const templateName = template.GetEntityName();
        const parts = templateName.split('.');
        const typeStr = parts[parts.length - 1].toUpperCase();

        // Dynamically get the enum value from the derived string
        const troopTypeEnum = (TroopType as any)[`e_${typeStr}`];
        if (!troopTypeEnum) {
            throw new Error(`Unknown troop type: ${typeStr}`);
        }
        return troopTypeEnum;
    }

        /**
     * Starts the troop's movement from a given path node.
     * @param spawnNode The path_track entity where the troop should start.
     */
    private StartAt(spawnNode: CPathTrack): void {
        this.m_trackTrain.teleportToPathAndStart(spawnNode, 500);
    }

    /**
     * Constructs a CTroop object, which spawns and manages a troop entity.
     * @param template The PointTemplate entity used to spawn this troop.
     */
    constructor(template: PointTemplate, startPath: CPathTrack) {
        const spawned = this.spawnTroopEntities(template);
        if (!spawned) {
            throw new Error("Failed to spawn troop entities");
        }
        this.m_propPhysicsMultiplayer = spawned.propEnt;
        this.m_trackTrain = spawned.trainEnt;
        
        // Discover and set the troop type from entity names
        this.m_troopType = this.discoverTroopType(template);
        
        // Subscribe to health changes using the prop's method
        this.m_healthConnectionId = this.m_propPhysicsMultiplayer.subscribeToHealthChanges(
            (newHealth) => {
                this.m_currentHealth = newHealth;
                Instance.Msg(`[CTroop ${this.m_troopType}] Health changed to: ${this.m_currentHealth}`);
                if (this.m_currentHealth <= 0) {
                    this.destroy();
                }
            }
        );
        this.StartAt(startPath);
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
     * Gets the prop_physics_multiplayer entity.
     * @returns The CPropPhysicsMultiplayer instance.
     */
    public getProp(): CPropPhysicsMultiplayer {
        return this.m_propPhysicsMultiplayer;
    }

    // IDebuggable interface implementation
    debugColumnTitle(): string {
        return "Troops"; // This won't be used when in IDebugColumn context
    }

    debugEntityName(): string {
        return this.m_troopType;
    }

    debugCurrentValue(): string {
        return `HP: ${this.m_currentHealth.toFixed(3)}`;
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
        this.m_propPhysicsMultiplayer.Remove();
        this.m_trackTrain.Remove();
    }
}
