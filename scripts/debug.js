import { BlockPermutation, world, system, Player } from "@minecraft/server";

const blockStates = {
    "active": [true, false],
    "age": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "age_bit": [true, false],
    "allow_underwater_bit": [true, false],
    "attached_bit": [true, false],
    "attachment": ['standing', 'hanging', 'side', 'multiple'],
    "bamboo_leaf_size": ['no_leaves', 'small_leaves', 'large_leaves'],
    "bamboo_stalk_thickness": ['thin', 'thick'],
    "big_dripleaf_tilt": ['none', 'unstable', 'partial_tilt', 'full_tilt'],
    "bite_counter": [0, 1, 2, 3, 4, 5, 6],
    "block_face": ['down', 'up', 'north', 'south', 'east', 'west'],
    "block_light_level": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "brewing_stand_slot_a_bit": [true, false],
    "brewing_stand_slot_b_bit": [true, false],
    "brewing_stand_slot_c_bit": [true, false],
    "button_pressed_bit": [true, false],
    "candles": [0, 1, 2, 3],
    "cardinal_direction": ['north', 'south', 'east', 'west'],
    "cauldron_liquid": ['water', 'lava'],
    "chemistry_table_type": ['compound_creator', 'material_reducer', 'element_constructor', 'lab_table'],
    "chisel_type": ['default', 'chiseled', 'lines', 'smooth'],
    "cluster_count": [0, 1, 2, 3],
    "color": ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'silver', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'],
    "color_bit": [true, false],
    "composter_fill_level": [0, 1, 2, 3, 4, 5, 6, 7, 8],
    "conditional_bit": [true, false],
    "coral_color": ['blue', 'pink', 'purple', 'red', 'yellow', 'blue dead', 'pink dead', 'red dead', 'yellow dead'],
    "coral_direction": [0, 1, 2, 3],
    "coral_fan_direction": ['0', '1'],
    "coral_hang_type_bit": [true, false],
    "covered_bit": [true, false],
    "cracked_state": ['no_cracks', 'cracked', 'max_cracked'],
    "damage": ['undamaged', 'slightly_damaged', 'very_damaged', 'broken'],
    "deprecated": ['<em>none</em>'],
    "dead_bit": [true, false],
    "direction": [0, 1, 2, 3],
    "dirt_type": ['normal', 'coarse'],
    "disarmed_bit": [true, false],
    "door_hinge_bit": [true, false],
    "double_plant_type": ['sunflower', 'syringa', 'grass', 'fern', 'rose', 'peony'],
    "drag_down": [true, false],
    "dripstone_thickness": ['tip', 'frustum', 'base', 'middle', 'merge'],
    "end_portal_eye_bit": [true, false],
    "explode_bit": [true, false],
    "extinguished": [true, false],
    "facing_direction": [0, 1, 2, 3, 4, 5],
    "fill_level": [0, 1, 2, 3, 4, 5, 6],
    "flower_type": ['poppy', 'orchid', 'allium', 'houstonia', 'tulip_red', 'tulip_orange', 'tulip_white', 'tulip_pink', 'oxeye', 'cornflower', 'lily_of_the_valley'],
    "growth": [0, 1, 2, 3, 4, 5, 6, 7],
    "hanging_bit": [true, false],
    "head_piece_bit": [true, false],
    "height": [0, 1, 2, 3, 4, 5, 6, 7],
    "honey_level": [0, 1, 2, 3, 4, 5],
    "huge_mushroom_bits": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "infiniburn_bit": [true, false],
    "in_wall_bit": [true, false],
    "item_frame_map_bit": [true, false],
    "item_frame_photo_bit": [true, false],
    "kelp_age": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
    "lever_direction": ['down_east_west', 'east', 'west', 'south', 'north', 'up_north_south', 'up_east_west', 'down_north_south'],
    "liquid_depth": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "lit": [true, false],
    "minecraft:cardinal_direction": ["north", "south", "east", "west"],
    "moisturized_amount": [0, 1, 2, 3, 4, 5, 6, 7],
    "monster_egg_stone_type": ['stone', 'cobblestone', 'stone_brick', 'mossy_stone_brick', 'cracked_stone_brick', 'chiseled_stone_brick'],
    "multi_face_direction_bits": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63],
    "new_leaf_type": ['acacia', 'dark_oak'],
    "new_log_type": ['acacia', 'dark_oak'],
    "occupied_bit": [true, false],
    "old_leaf_type": ['oak', 'spruce', 'birch', 'jungle'],
    "old_log_type": ['oak', 'spruce', 'birch', 'jungle'],
    "ominous": [true, false],
    "open_bit": [true, false],
    "output_lit_bit": [true, false],
    "output_subtract_bit": [true, false],
    "persistent_bit": [true, false],
    "pillar_axis": ['x', 'y', 'z'],
    "portal_axis": ['unknown', 'x', 'z'],
    "powered_bit": [true, false],
    "prismarine_block_type": ['default', 'dark', 'bricks'],
    "rail_data_bit": [true, false],
    "rail_direction": [0, 1, 2, 3, 4, 5, 6, 7, 8],
    "redstone_signal": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "repeater_delay": [0, 1, 2, 3],
    "respawn_anchor_charge": [0, 1, 2, 3, 4],
    "rotation": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "sandstone_type": ['default', 'hieroglyphs', 'cut', 'smooth'],
    "sand_type": ['normal', 'red'],
    "sapling_type": ['evergreen', 'birch', 'jungle', 'acacia', 'roofed_oak'],
    "sculk_sensor_phase": ['inactive', 'active', 'cooldown'],
    "sea_grass_type": ['default', 'double_top', 'double_bot'],
    "sponge_type": ['dry', 'wet'],
    "stability": [0, 1, 2, 3, 4, 5, 6, 7],
    "stability_check": [true, false],
    "stone_brick_type": ['default', 'mossy', 'cracked', 'chiseled', 'smooth'],
    "stone_slab_type": ['smooth_stone', 'sandstone', 'wood', 'cobblestone', 'brick', 'stone_brick', 'quartz', 'nether_brick'],
    "stone_slab_type_2": ['red_sandstone', 'purpur', 'prismarine_rough', 'prismarine_dark', 'prismarine_brick', 'mossy_cobblestone', 'smooth_sandstone', 'red_nether_brick'],
    "stone_slab_type_3": ['end_stone_brick', 'smooth_red_sandstone', 'polished_andesite', 'andesite', 'diorite', 'polished_diorite', 'granite', 'polished_granite'],
    "stone_slab_type_4": ['mossy_stone_brick', 'smooth_quartz', 'stone', 'cut_sandstone', 'cut_red_sandstone'],
    "stone_type": ['stone', 'granite', 'granite_smooth', 'diorite', 'diorite_smooth', 'andesite', 'andesite_smooth'],
    "stripped_bit": [true, false],
    "structure_block_type": ['data', 'save', 'load', 'corner', 'invalid', 'export'],
    "structure_void_type": ['void', 'air'],
    "suspended_bit": [true, false],
    "tall_grass_type": ['default', 'tall', 'fern', 'snow'],
    "toggle_bit": [true, false],
    "top_slot_bit": [true, false],
    "torch_facing_direction": ['unknown', 'west', 'east', 'north', 'south', 'top'],
    "triggered_bit": [true, false],
    "turtle_egg_count": ['one_egg', 'two_egg', 'three_egg', 'four_egg'],
    "twisting_vines_age": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    "update_bit": [true, false],
    "upper_block_bit": [true, false],
    "upside_down_bit": [true, false],
    "vertical_half": [true, false],
    "vine_direction_bits": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "wall_block_type": ['cobblestone', 'mossy_cobblestone', 'granite', 'diorite', 'andesite', 'sandstone', 'brick', 'stone_brick', 'mossy_stone_brick', 'nether_brick', 'end_brick', 'prismarine', 'red_sandstone', 'red_nether_brick'],
    "wall_connection_type_east": ['none', 'short', 'tall'],
    "wall_connection_type_north": ['none', 'short', 'tall'],
    "wall_connection_type_south": ['none', 'short', 'tall'],
    "wall_connection_type_west": ['none', 'short', 'tall'],
    "wall_post_bit": [true, false],
    "weeping_vines_age": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    "weirdo_direction": [0, 1, 2, 3],
    "wood_type": ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'],
    "books_stored": Array.from({ length: 64 }, (_, index) => index),
    "ground_sign_direction": Array.from({ length: 16 }, (_, index) => index),
    "hanging": [true, false],
    "brushed_progress": [0, 1, 2, 3]

};//ground

import { ModalFormData, FormResponse } from "@minecraft/server-ui";

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const block = ev.block;
    if (ev.itemStack?.typeId !== 'bcd:id_stick' || !ev.isFirstEvent) return;
    ev.cancel = true;
    const blockOPermutation = block.permutation;
    const states = blockOPermutation.getAllStates();
    if (Object.keys(states).length === 0) return ev.player.sendMessage('§4Este bloque no tiene estados')
    const stateOptions = [];
    for (const state in states) {
        const stateValues = blockStates[state];
        if (stateValues) {
            stateOptions.push({ name: state, options: stateValues })
        }
    }
    if (stateOptions.length == 0) return ev.player.sendMessage('§4No hay estados disponibles para este bloque')
    system.run(() => {
        const menu = new ModalFormData();
        menu.title("Select Block State");
        stateOptions.forEach(state => {
            menu.dropdown(state.name, state.options.map(value => String(value)), { defaultValueIndex: state.options.indexOf(blockOPermutation.getState(state.name)) })
        });
        menu.show(ev.player).then((response) => {
            if (response.canceled) return;
            for (let i = 0; i < stateOptions.length; i++) {
                const blockPermutation = block.permutation;
                const stateName = stateOptions[i].name;
                const selectedValue = stateOptions[i].options[response.formValues[i]];
                try {
                    const newPermutation = blockPermutation.withState(stateName, selectedValue);
                    block.setPermutation(newPermutation);
                    ev.player.sendMessage(`Changed ${stateName} to ${selectedValue}`);
                } catch (error) {
                    ev.player.sendMessage(`Could not change state: ${error}`);
                }
            }
        })
    });
});
