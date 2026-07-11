import { system, world } from "@minecraft/server";

const DIMENSION_ID = "custom:lobby";
const VILLAGE_DIMENSION_ID = "custom:village";

const OVERWORLD_SPAWN = {
    x: 0,
    y: 174,
    z: 0
};

const VILLAGE_SPAWN = {
    x: 0,
    y: 100,
    z: 0
};

// 서버 시작 시 차원 등록
system.beforeEvents.startup.subscribe((event) => {
    event.dimensionRegistry.registerCustomDimension(DIMENSION_ID);
    event.dimensionRegistry.registerCustomDimension(VILLAGE_DIMENSION_ID);
});

// !lobby 입력 시 이동
world.beforeEvents.chatSend.subscribe((event) => {


    if (event.message !== "!lobby") return;

    event.cancel = true;

    system.run(() => {
        const dimension = world.getDimension(DIMENSION_ID);

        event.sender.teleport(
            {
                x: 0,
                y: 100,
                z: 0,
            },
            {
                dimension,
            }
        );
    });
});

