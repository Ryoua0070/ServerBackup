import { world, system, ItemStack } from "@minecraft/server";

const RADIUS = 15;
const CHECK_INTERVAL = 2;

system.run(() => {

    system.runInterval(() => {

        const dim = world.getDimension("overworld");

        for (const itemEntity of dim.getEntities({ type: "minecraft:item" })) {

        if (itemEntity.hasTag("gachaReward"))
            continue;

        const itemComp = itemEntity.getComponent("minecraft:item");
        if (!itemComp) continue;

            const item = itemComp.itemStack;

            // 물 속인지 확인
            const block = dim.getBlock(itemEntity.location);
            if (!block || block.typeId !== "minecraft:water")
                continue;

            // wishgacha 아머스탠드 확인
            let found = false;

            for (const stand of dim.getEntities({
                type: "minecraft:armor_stand",
                location: itemEntity.location,
                maxDistance: RADIUS
            })) {
                if (stand.hasTag("wishgacha")) {
                    found = true;
                    break;
                }
            }

            if (!found)
                continue;

            // 코인이 아닌 경우
            if (item.typeId !== "pa:coin") {

                if (itemEntity.hasTag("checked"))
                    continue;

                itemEntity.addTag("checked");

                const pos = itemEntity.location;

                for (const player of dim.getPlayers({
                    location: pos,
                    maxDistance: RADIUS
                })) {
                    player.applyDamage(5);
                    player.sendMessage("§c[경고] §7분수대에 쓰레기를 버리지 마세요.");
                }

                continue;
            }

            // ===== 코인 처리 =====

            const pos = {
                x: itemEntity.location.x,
                y: itemEntity.location.y,
                z: itemEntity.location.z
            };

            let rewardId;
            let jackpot = false;

            const r = Math.random() * 100;

            if (r < 10) {
                rewardId = "minecraft:elytra";
                jackpot = true;
            } else if (r < 20) {
                rewardId = "minecraft:dragon_egg";
                jackpot = true;
            } else if (r < 50) {
                rewardId = "minecraft:netherite_ingot";
            } else {
                rewardId = "minecraft:gold_ingot";
            }

            itemEntity.remove();

            const reward = dim.spawnItem(new ItemStack(rewardId, 1), pos);
            reward.addTag("gachaReward");

            if (jackpot) {
                try {
                    dim.runCommand(
                        `summon fireworks_rocket ${pos.x} ${pos.y + 0.2} ${pos.z}`
                    );
                } catch {}
            }
        }

    }, CHECK_INTERVAL);

});