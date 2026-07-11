import { world, system , ItemStack } from "@minecraft/server";






/*
|--------------------------------------------------------------------------
| 씨앗 심기 시 일정 확률로 즉시 성장
|--------------------------------------------------------------------------
*/

function getScore(player, objectiveName) {
    const objective = world.scoreboard.getObjective(objectiveName);
    return objective?.getScore(player) ?? 0;
}

const CROPS = {
    "minecraft:wheat": 7,
    "minecraft:carrots": 7,
    "minecraft:potatoes": 7,
    "minecraft:beetroot": 7,
    "minecraft:nether_wart": 3
};

world.afterEvents.playerPlaceBlock.subscribe((event) => {
    const { player } = event;

    // 농부 Lv2 이상만
    if (getScore(player, "FarmerLv") < 4) return;

    // 5% 확률
    if (Math.random() >= 0.2) return;

    system.run(() => {
        const block = event.block;
        const maxGrowth = CROPS[block.typeId];
        if (maxGrowth === undefined) return;

        try {
            const perm = block.permutation;
            block.setPermutation(
                perm.withState("growth", maxGrowth)
            );

            player.runCommand(
                `particle minecraft:crop_growth_emitter ${block.location.x} ${block.location.y} ${block.location.z}`
            );
            player.playSound("item.bone_meal.use");
        } catch (e) {
            console.warn(e);
        }
    });
});





/*
|--------------------------------------------------------------------------
| 수확 시 작물에 특수 상태 부여
|--------------------------------------------------------------------------
*/


world.afterEvents.playerBreakBlock.subscribe((event) => {
    const { player, block, dimension, brokenBlockPermutation } = event;

    // 농부 Lv5 이상
    if (getScore(player, "FarmerLv") < 5) return;

    // 감자만
    if (brokenBlockPermutation.type.id !== "minecraft:potatoes") return;

    // 완전히 성장한 감자만
    if (brokenBlockPermutation.getState("growth") !== 7) return;

    const chance = Math.random();

    const pos = {
        x: block.location.x + 0.5,
        y: block.location.y + 0.5,
        z: block.location.z + 0.5
    };

    if (chance < 0.003) {

        dimension.spawnItem(
            new ItemStack("pa:rainbow_potato", 1),
            pos
        );

        player.sendMessage("§d🌈 희귀한 레인보우 감자를 발견했습니다!");

    } else if (chance < 0.03) {

        dimension.spawnItem(
            new ItemStack("pa:golden_potato", 1),
            pos
        );

        player.sendMessage("§6✨ 희귀한 골든 감자를 발견했습니다!");
    }
});