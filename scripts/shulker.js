import { world, system } from "@minecraft/server";

const SHULKER_PREFIX = "shulker_";
const UUID_PREFIX = "uuid_";
const protectedDrops = new Map();
const protectedShulkerItems = new Map();
const pendingShulkerBreaks = new Map();
const shulkerWarnCooldown = new Map();







function generateUUID() {

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(/[xy]/g, c => {

            const r = Math.random() * 16 | 0;
            const v = c === "x"
                ? r
                : (r & 0x3 | 0x8);

            return v.toString(16);

        });

}

function getPlayerUUID(player) {

    const key =
        UUID_PREFIX + player.name;

    let uuid =
        world.getDynamicProperty(key);

    if (typeof uuid === "string")
        return uuid;

    uuid = generateUUID();

    world.setDynamicProperty(
        key,
        uuid
    );

    return uuid;

}

function isShulker(typeId) {

    return typeId.includes("shulker_box");

}

function getShulkerKey(location) {

    return (
        SHULKER_PREFIX +
        location.x + "_" +
        location.y + "_" +
        location.z
    );

}

const BLOCKED_NEAR_SHULKER = [
    "minecraft:piston",
    "minecraft:sticky_piston",
    "minecraft:hopper"
];

world.afterEvents.playerPlaceBlock.subscribe(ev => {

    const block = ev.block;

    if (
        !BLOCKED_NEAR_SHULKER.includes(
            block.typeId
        )
    ) return;

    const { x, y, z } = block.location;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {

                if (
                    dx === 0 &&
                    dy === 0 &&
                    dz === 0
                ) continue;

                const near =
                    block.dimension.getBlock({
                        x: x + dx,
                        y: y + dy,
                        z: z + dz
                    });

                if (!near) continue;

                if (!isShulker(near.typeId))
                    continue;

                system.run(() => {

                    block.setType(
                        "minecraft:air"
                    );

                    block.dimension.spawnItem(
                        block.getItemStack(1),
                        {
                            x: x + 0.5,
                            y: y + 0.5,
                            z: z + 0.5
                        }
                    );

                    ev.player.sendMessage(
                        "§c셜커 상자 주변에는 피스톤과 호퍼를 설치할 수 없습니다."
                    );

                });

                return;

            }
        }
    }

});

world.afterEvents.playerPlaceBlock.subscribe((ev) => {

    system.run(() => {

        const block = ev.block;

        if (!isShulker(block.typeId)) return;

        world.setDynamicProperty(
            getShulkerKey(block.location),
            getPlayerUUID(ev.player)
        );

    });

});



world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {

    if (!isShulker(ev.block.typeId)) return;

    if (ev.player.hasTag("OP")) return;

    const owner = world.getDynamicProperty(
        getShulkerKey(ev.block.location)
    );

    if (!owner) return;

    // 본인 셜커면 허용
    if (owner === getPlayerUUID(ev.player)) return;

    ev.cancel = true;

    const uuid = getPlayerUUID(ev.player);

    const last =
        shulkerWarnCooldown.get(uuid) ?? 0;

    if (Date.now() - last >= 3000) {

        shulkerWarnCooldown.set(
            uuid,
            Date.now()
        );

        ev.player.runCommand(
            `tellraw @s {"rawtext":[{"text":"§c다른 플레이어의 셜커 상자는 열 수 없습니다."}]}`
        );
    }

});


world.beforeEvents.playerBreakBlock.subscribe(ev => {

    if (
        !isShulker(
            ev.block.typeId
        )
    ) return;

    if (
        ev.player.hasTag("OP")
    ) return;

    const owner =
        world.getDynamicProperty(

            getShulkerKey(
                ev.block.location
            )

        );

    if (!owner) return;

    if (
        owner ===
        getPlayerUUID(
            ev.player
        )
    ) return;

    ev.cancel = true;

    ev.player.sendMessage(
        "§c다른 플레이어의 셜커 상자는 파괴할 수 없습니다."
    );

});

world.afterEvents.playerBreakBlock.subscribe((ev) => {

    if (
        !isShulker(
            ev.brokenBlockPermutation.type.id
        )
    ) return;

    const owner = world.getDynamicProperty(
        getShulkerKey(ev.block.location)
    );

    if (!owner) return;

    pendingShulkerBreaks.set(
        getShulkerKey(ev.block.location),
        {
            owner,
            expire: Date.now() + 1000
        }
    );

    world.setDynamicProperty(
        getShulkerKey(ev.block.location),
        undefined
    );

});

world.afterEvents.entitySpawn.subscribe((ev) => {

    if (ev.entity.typeId !== "minecraft:item") return;

    const item =
        ev.entity.getComponent("minecraft:item");

    if (!item) return;

    if (
        !item.itemStack.typeId.includes(
            "shulker_box"
        )
    ) return;

    let nearestKey = null;
    let nearestDist = 999;

    for (const [key, data] of pendingShulkerBreaks) {

        if (Date.now() > data.expire) {
            pendingShulkerBreaks.delete(key);
            continue;
        }

        const [, x, y, z] = key.match(
            /^shulker_(-?\d+)_(-?\d+)_(-?\d+)$/
        );

        const dx =
            ev.entity.location.x - Number(x);

        const dy =
            ev.entity.location.y - Number(y);

        const dz =
            ev.entity.location.z - Number(z);

        const dist =
            dx * dx +
            dy * dy +
            dz * dz;

        if (dist < nearestDist) {

            nearestDist = dist;
            nearestKey = key;

        }
    }

    if (!nearestKey) return;

    const data =
        pendingShulkerBreaks.get(nearestKey);

    pendingShulkerBreaks.delete(nearestKey);

    protectedShulkerItems.set(
        ev.entity.id,
        {
            owner: data.owner,
            expire: Date.now() + 300000
        }
    );

});



world.beforeEvents.entityItemPickup.subscribe((ev) => {

    if (
        ev.entity.typeId !==
        "minecraft:player"
    ) return;

    if (
        ev.entity.hasTag("OP")
    ) return;

    const data =
        protectedShulkerItems.get(
            ev.item.id
        );

    if (!data) return;

    if (Date.now() > data.expire) {

        protectedShulkerItems.delete(
            ev.item.id
        );

        return;

    }

    if (
        getPlayerUUID(ev.entity) ===
        data.owner
    ) return;

    const uuid =
        getPlayerUUID(ev.entity);

    const last =
        shulkerWarnCooldown.get(uuid) ?? 0;

    if (Date.now() - last >= 3000) {

        shulkerWarnCooldown.set(
            uuid,
            Date.now()
        );

        const player = ev.entity;

        system.run(() => {

            player.sendMessage(
                "§c다른 플레이어의 셜커 상자는 주울 수 없습니다.\n§7(소유권을 이전하려면 셜커를 직접 드랍하세요.)"
            );

        });

    }

    ev.cancel = true;

});


system.runInterval(() => {

    const now = Date.now();

    for (const [id, data] of protectedShulkerItems) {

        if (now > data.expire) {

            protectedShulkerItems.delete(id);

        }

    }

    for (const [key, data] of pendingShulkerBreaks) {

        if (now > data.expire) {

            pendingShulkerBreaks.delete(key);

        }

    }

}, 20);


// world.afterEvents.entitySpawn.subscribe((ev) => {

//     if (ev.entity.typeId !== "minecraft:item") return;

//     const item =
//         ev.entity.getComponent("minecraft:item");

//     if (!item) return;

//     if (
//         !item.itemStack.typeId.includes(
//             "shulker_box"
//         )
//     ) return;

//     world.sendMessage(
//         `spawn id=${ev.entity.id}`
//     );

// });

// world.beforeEvents.entityItemPickup.subscribe((ev) => {

//     if (
//         ev.item
//             .getComponent("minecraft:item")
//             .itemStack.typeId
//             .includes("shulker_box")
//     ) {

//         world.sendMessage(
//             `pickup id=${ev.item.id}`
//         );

//     }

// });