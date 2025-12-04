import { Instance, CSPlayerPawn, PointTemplate, CSPlayerController} from "cs_script/point_script";
import { CGameEntities } from "./CGameEntities";
import { CTroop } from "./CTroop";
import { CDebugMenu } from "./CDebugMenu";
import { kzExecCommands } from "./CKZExec";

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

const TEAM_T = 2;
const TEAM_CT = 3;

/*
* Singleton/Global
*/
var g_mapEntities = new CGameEntities();
var g_debugMenu = new CDebugMenu();
kzExecCommands();
g_debugMenu.addColumn(g_mapEntities.m_attackingT);
g_debugMenu.addColumn(g_mapEntities.m_attackingCT);

Instance.SetThink(() => {
    g_debugMenu.displayGameTime();
    g_debugMenu.displayColumns();
    Instance.SetNextThink(Instance.GetGameTime() + 0.125);
});
Instance.SetNextThink(Instance.GetGameTime());

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

    const playerTeam = player.GetTeamNumber();
    let spawnPaths;
    let attackingArray;

    if (playerTeam === TEAM_CT) {
        spawnPaths = g_mapEntities.m_tPaths;
        attackingArray = g_mapEntities.m_attackingT;
    } else if (playerTeam === TEAM_T) {
        spawnPaths = g_mapEntities.m_ctPaths;
        attackingArray = g_mapEntities.m_attackingCT;
    } else {
        Instance.Msg("You must be on a team to spawn troops.");
        return;
    }

    const pathA = spawnPaths.get('a');
    if (!pathA || pathA.length === 0) {
        Instance.Msg("Opposing team's spawn path 'a' is not available.");
        return;
    }

    const spawnNode = pathA[0];
    const command = text.trim();
    const template = commandToTemplate.get(command);

    if (template) {
        try {
            // Create a new troop from the template, which also spawns its entities.
            const troop = new CTroop(template, spawnNode);
            attackingArray.addTroop(troop); // Keep track of the active troop

            Instance.Msg(`${troop.getTroopType().toLowerCase()} spawned at the opposing team's track and is now moving.`);
        } catch (error) {
            Instance.Msg(`Error creating troop: ${error}`);
        }
    } else {
        Instance.Msg("Invalid Command");
    }
});
