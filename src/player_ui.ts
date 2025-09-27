import { BaseModelEntity, Instance, QAngle, Vector, CSPlayerController, Entity, CSPlayerPawn } from "cs_script/point_script";

Instance.ServerCommand("mp_warmup_offline_enabled 1");
Instance.ServerCommand("mp_warmup_pausetimer 1");

function GetForwardVector(origin : Vector, angles : QAngle, distance : number) {
    let pitch = (angles.pitch * Math.PI) / 180;
    let yaw = (angles.yaw * Math.PI) / 180;

    let x = Math.cos(pitch) * Math.cos(yaw);
    let y = Math.cos(pitch) * Math.sin(yaw);
    let z = -Math.sin(pitch);

    return {
        x: origin.x + x * distance,
        y: origin.y + y * distance,
        z: origin.z + z * distance,
    };
}

Instance.SetThink(() => {
    Instance.Msg("Thinking")
    Instance.DebugScreenText(Instance.GetGameTime(), 10, 10, 0, { r: 0xff, g: 0, b: 0xff });
    let playerController: CSPlayerController | undefined = Instance.GetPlayerController(0);
    let panel: Entity | undefined = Instance.FindEntityByName("ui.prop");
    if (playerController) {
        Instance.Msg("PlayerControllerFound");
        let playerPawn : CSPlayerPawn | undefined = playerController.GetPlayerPawn();
        if (playerPawn) {
                Instance.Msg("PlayerPawnFound");
                let eyePos : Vector = playerPawn.GetEyePosition();
                let eyeAng : QAngle = playerPawn.GetEyeAngles();
            if (panel) {
                Instance.Msg("PropFound");
                let panelTargetPos = GetForwardVector(eyePos, eyeAng, 50);
                panel.Teleport(panelTargetPos, eyeAng, null);
            }
        }
    }
    Instance.SetNextThink(1/128);
});
Instance.SetNextThink(1/1024);
