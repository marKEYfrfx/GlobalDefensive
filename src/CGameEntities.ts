import { Instance, CSPlayerPawn, PointTemplate, CSPlayerController, Vector, QAngle, Entity, EntityDamage } from "cs_script/point_script";
import { CFuncTrackTrain, CPathTrack, CPropPhysicsMultiplayer } from "./HammerEntities";
import { CTroop } from "./CTroop";
import { IDebugColumn } from "./CDebugMenu";


const TEMPLATE_TROOP_DOOR: string = "template.troop.door";
const TEMPLATE_TROOP_VASE: string = "template.troop.vase";
const TEMPLATE_TROOP_STATUE: string = "template.troop.statue";
const TEMPLATE_TROOP_GALLON: string = "template.troop.gallon";
const TEMPLATE_TROOP_LITER: string = "template.troop.liter";
const TEMPLATE_TROOP_FLOWER: string = "template.troop.flower";

export class CAttackingArray implements IDebugColumn {
    private m_troops: CTroop[] = [];
    private m_teamName: string;
    private m_healthSubscriptions: Map<CTroop, number> = new Map();

    constructor(teamName: string) {
        this.m_teamName = teamName;
    }

    /**
     * Adds a troop to the array and subscribes to its health changes for death tracking.
     * @param troop The troop to add and monitor.
     */
    public addTroop(troop: CTroop): void {
        this.m_troops.push(troop);
        
        // Subscribe to the troop's prop health changes for death tracking
        const prop = troop.getProp();
        const connectionId = prop.subscribeToHealthChanges((newHealth) => {
            if (newHealth <= 0) {
                // Remove the troop from our array when it dies
                this.removeTroop(troop);
            }
        });
        
        if (connectionId !== undefined) {
            this.m_healthSubscriptions.set(troop, connectionId);
        }
    }

    /**
     * Removes a troop from the array and cleans up any subscriptions.
     * @param troop The troop to remove.
     */
    public removeTroop(troop: CTroop): void {
        const index = this.m_troops.indexOf(troop);
        if (index !== -1) {
            this.m_troops.splice(index, 1);
            
            // Clean up health subscription if exists
            const connectionId = this.m_healthSubscriptions.get(troop);
            if (connectionId !== undefined) {
                Instance.DisconnectOutput(connectionId);
                this.m_healthSubscriptions.delete(troop);
            }
        }
    }

    /**
     * Gets all troops currently in the array.
     */
    public getTroops(): CTroop[] {
        return this.m_troops;
    }

    /**
     * Gets the number of troops in the array.
     */
    public getCount(): number {
        return this.m_troops.length;
    }

    // IDebugColumn interface implementation
    getDebugColumnTitle(): string {
        return this.m_teamName;
    }

    getDebugItems(): CTroop[] {
        return this.m_troops;
    }
}

// A class to hold references to map entities
export class CGameEntities {
    m_doorTemplate: PointTemplate;
    m_vaseTemplate: PointTemplate;
    m_statueTemplate: PointTemplate;
    m_gallonTemplate: PointTemplate;
    m_literTemplate: PointTemplate;
    m_flowerTemplate: PointTemplate;
    m_ctPaths: Map<string, CPathTrack[]>;
    m_tPaths: Map<string, CPathTrack[]>;
    m_attackingCT: CAttackingArray;
    m_attackingT: CAttackingArray;

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
        this.m_doorTemplate = findTemplate(TEMPLATE_TROOP_DOOR);
        this.m_vaseTemplate = findTemplate(TEMPLATE_TROOP_VASE);
        this.m_statueTemplate = findTemplate(TEMPLATE_TROOP_STATUE);
        this.m_gallonTemplate = findTemplate(TEMPLATE_TROOP_GALLON);
        this.m_literTemplate = findTemplate(TEMPLATE_TROOP_LITER);
        this.m_flowerTemplate = findTemplate(TEMPLATE_TROOP_FLOWER);

        this.m_ctPaths = new Map<string, CPathTrack[]>();
        this.m_tPaths = new Map<string, CPathTrack[]>();
        this.m_attackingCT = new CAttackingArray("CT Troops");
        this.m_attackingT = new CAttackingArray("T Troops");
        const teams = ['ct', 't'];
        const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

        for (const team of teams) {
            const currentMap = team === 'ct' ? this.m_ctPaths : this.m_tPaths;
            for (const letter of letters) {
                const pathArray: CPathTrack[] = [];
                for (let i = 1; i <= 48; i++) {
                    const entityName = `${team}_path.${letter}.${i}`;
                    const pathEntity = Instance.FindEntityByName(entityName);
                    if (!pathEntity) {
                        Instance.Msg(`Failed to find path_track entity with name: ${entityName}`);
                        throw new Error(`Failed to find path_track entity with name: ${entityName}`);
                    }
                    Object.setPrototypeOf(pathEntity, CPathTrack.prototype);
                    const pathTrack = pathEntity as CPathTrack
                    pathArray.push(pathTrack);
                }
                currentMap.set(letter, pathArray);
            }
        }
    }
}
