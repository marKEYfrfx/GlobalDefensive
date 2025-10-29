import { Instance } from "cs_script/point_script";

/**
 * kzExecCommands
 *
*/
export function kzExecCommands() {
    Instance.ServerCommand("sv_airaccelerate 100.000000");
    Instance.ServerCommand("sv_enablebunnyhopping true");
    Instance.ServerCommand("sv_autobunnyhopping false");
    Instance.ServerCommand("sv_falldamage_scale 0.000000");
    Instance.ServerCommand("sv_staminajumpcost 0.000000");
    Instance.ServerCommand("sv_staminalandcost 0.000000");
    Instance.ServerCommand("sv_timebetweenducks 0.000000");
    Instance.ServerCommand("sv_staminarecoveryrate 60.000000");
    Instance.ServerCommand("sv_staminamax 0.000000");
    Instance.ServerCommand("sv_ladder_scale_speed 1.000000");
    Instance.ServerCommand("sv_jump_impulse 301.993378");
    Instance.ServerCommand("sv_friction 5.000000");
    Instance.ServerCommand("sv_accelerate_use_weapon_speed false");
    Instance.ServerCommand("sv_accelerate 6.500000");
    Instance.ServerCommand("sv_maxvelocity 2000.000000");
    Instance.ServerCommand("sv_air_max_wishspeed 30.000000");
    Instance.ServerCommand("sv_gravity 800.000000");
    Instance.ServerCommand("sv_standable_normal 0.700000");
    Instance.ServerCommand("sv_wateraccelerate 10.000000");
    Instance.ServerCommand("sv_disable_radar 1");
}
