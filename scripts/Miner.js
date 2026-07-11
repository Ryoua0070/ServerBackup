import { world, system , ItemStack , EnchantmentTypes , EquipmentSlot } from "@minecraft/server";

const golemRewards = new Map();
const spawnCooldown = new Map();

const ORES = new Set([
    "minecraft:coal_ore",
    "minecraft:deepslate_coal_ore",

    "minecraft:iron_ore",
    "minecraft:deepslate_iron_ore",

    "minecraft:copper_ore",
    "minecraft:deepslate_copper_ore",

    "minecraft:gold_ore",
    "minecraft:deepslate_gold_ore",

    "minecraft:redstone_ore",
    "minecraft:deepslate_redstone_ore",

    "minecraft:lapis_ore",
    "minecraft:deepslate_lapis_ore",

    "minecraft:diamond_ore",
    "minecraft:deepslate_diamond_ore",

    "minecraft:emerald_ore",
    "minecraft:deepslate_emerald_ore",

    "minecraft:nether_gold_ore",
    "minecraft:nether_quartz_ore",

]);



world.afterEvents.playerBreakBlock.subscribe((ev) => {

    const player = ev.player;
    const block = ev.brokenBlockPermutation.type.id;

    if (!ORES.has(block))
        return;

    const equippable = player.getComponent("minecraft:equippable");
    const tool = equippable?.getEquipment(EquipmentSlot.Mainhand);

    const enchantable = tool?.getComponent("minecraft:enchantable");

    if (enchantable?.hasEnchantment("minecraft:silk_touch")) {
        return;
    }

    // MinerLv 확인
    let minerLv = 0;

    try {
        const obj = world.scoreboard.getObjective("MinerLv");
        minerLv = obj.getScore(player) ?? 0;
    } catch {
        return;
    }

    if (minerLv < 5)
        return;

    
    // MinerLv 확인 끝난 뒤

    if (spawnCooldown.has(player.id))
        return;

    // 20%
    if (Math.random() >= 0.05)
        return;

    // 쿨타임 시작 (1초)
    spawnCooldown.set(player.id, true);

    system.runTimeout(() => {
        spawnCooldown.delete(player.id);
    }, 20);

    const pos = {
        x: ev.block.location.x + 0.5,
        y: ev.block.location.y,
        z: ev.block.location.z + 0.5
    };

    const golem = player.dimension.spawnEntity(
        "pa:ore_golem",
        pos
    );

    golem.addTag("ore_golem");

    golemRewards.set(golem.id, block);

    // 10초 후 삭제
    system.runTimeout(() => {
        if (golem.isValid) {
            golem.remove();
        }
    }, 400);

});


world.afterEvents.entityDie.subscribe((ev) => {

    const entity = ev.deadEntity;

    if (!entity.hasTag("ore_golem"))
        return;

    const ore = golemRewards.get(entity.id);
    golemRewards.delete(entity.id);

    if (!ore)
        return;

    const rewards = {
        "minecraft:coal_ore": "minecraft:coal_block",
        "minecraft:deepslate_coal_ore": "minecraft:coal_block",

        "minecraft:iron_ore": "minecraft:iron_block",
        "minecraft:deepslate_iron_ore": "minecraft:iron_block",

        "minecraft:copper_ore": "minecraft:copper_block",
        "minecraft:deepslate_copper_ore": "minecraft:copper_block",

        "minecraft:gold_ore": "minecraft:gold_block",
        "minecraft:deepslate_gold_ore": "minecraft:gold_block",

        "minecraft:redstone_ore": "minecraft:redstone_block",
        "minecraft:deepslate_redstone_ore": "minecraft:redstone_block",

        "minecraft:lapis_ore": "minecraft:lapis_lazuli_block",
        "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli_block",

        "minecraft:diamond_ore": "minecraft:diamond_block",
        "minecraft:deepslate_diamond_ore": "minecraft:diamond_block",

        "minecraft:emerald_ore": "minecraft:emerald_block",
        "minecraft:deepslate_emerald_ore": "minecraft:emerald_block",

        "minecraft:ancient_debris": "minecraft:ancient_debris"
    };

    const reward = rewards[ore];
    if (!reward)
        return;

    const amount = Math.floor(Math.random() * 3) + 3; // 3~5개

    entity.dimension.spawnItem(
        new ItemStack(reward, amount),
        entity.location
    );
});