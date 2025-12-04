import { Instance, Entity, BaseModelEntity} from "cs_script/point_script";

export class CFuncTrackTrain extends Entity{
    /**
     * Teleports the train to a path node and starts it moving at a specified speed.
     */
    public teleportToPathAndStart(teleportToNode: CPathTrack, speedValue: number): void {
        const pathNodeName = teleportToNode.GetEntityName();
        Instance.EntFireAtTarget({ target: this, input: "TeleportToPathNode", value: pathNodeName });
        this.setSpeed(speedValue);
        Instance.EntFireAtTarget({ target: this, input: "StartForward" });
    }

    /**
     * Sets the speed of the train.
     */
    public setSpeed(speedValue: number): void {
        Instance.EntFireAtTarget({ target: this, input: "SetSpeedReal", value: speedValue });
    }
}

export class CPropPhysicsMultiplayer extends Entity {
    /**
     * Subscribes to health changes on this prop.
     * @param callback Function to call when health changes. Receives the new health value.
     * @returns The connection ID that can be used to disconnect the output later, or undefined if failed.
     */
    public subscribeToHealthChanges(callback: (newHealth: number) => void): number | undefined {
        return Instance.ConnectOutput(
            this,
            "OnHealthChanged",
            (inputData) => {
                // The value parameter contains the new health value
                if (typeof inputData.value === 'number') {
                    callback(inputData.value);
                }
            }
        );
    }
}

export class CPathTrack extends Entity {
    
}

export class CFuncMoveLinear extends Entity {
    
}
