import { world, system, ItemStack} from "@minecraft/server";

/*
|--------------------------------------------------------------------------
| 설정
|--------------------------------------------------------------------------
*/









//0:일 1:월 2:화 3:수 4:목 5:금 6:토 
const OPEN_DAY = 0; 
const OPEN_HOUR = 8;
const OPEN_MINUTE = 48;

const OVERWORLD_SPAWN = {
    x: -24,
    y: 174,
    z: -8
};

const END_SPAWN = {
    x: 0,
    y: 80,
    z: 0
};

const PORTAL_POS1 = {
    x: -26,
    y: 173,
    z: -14
};

const PORTAL_POS2 = {
    x: -22,
    y: 173,
    z: -10
};


// 엔드 시티 방지용
// 중앙 섬 기준 반경
const MAIN_ISLAND_RADIUS = 1000;

let dragonSpawnedThisCycle = false;
let dragonStartedThisCycle = false;

const damageMap = new Map();
const MIN_DAMAGE = 30; // 최소 기여도

/*
|--------------------------------------------------------------------------
| Dynamic Property
|--------------------------------------------------------------------------
*/

const DP_OPEN = "end_open";
const DP_OPEN_TIME = "end_open_time";
const DP_CLOSING = "end_closing";

/*
|--------------------------------------------------------------------------
| 상태 함수
|--------------------------------------------------------------------------
*/

function isEndOpen() {
    return world.getDynamicProperty(DP_OPEN) === true;
}

function setEndOpen(value) {
    world.setDynamicProperty(DP_OPEN, value);
}

function getOpenTime() {
    return Number(world.getDynamicProperty(DP_OPEN_TIME) ?? 0);
}

function setOpenTime(time) {
    world.setDynamicProperty(DP_OPEN_TIME, time);
}

function isClosing() {
    return world.getDynamicProperty(DP_CLOSING) === true;
}

function setClosing(value) {
    world.setDynamicProperty(DP_CLOSING, value);
}

/*
|--------------------------------------------------------------------------
| 공지
|--------------------------------------------------------------------------
*/

function announce(message) {
    world.sendMessage(`§6[엔드 레이드] §r${message}`);
}

/*
|--------------------------------------------------------------------------
| 엔드 오픈
|--------------------------------------------------------------------------
*/

function openEnd() {

    if (isEndOpen()) return;

    setEndOpen(true);
    setClosing(false);
    setOpenTime(Date.now());

    damageMap.clear();
    lastAttacker.clear();
    
    

    dragonStartedThisCycle = false;

    announce("엔드 차원이 개방되었습니다!");
    announce("제한 시간은 1시간입니다.");

    const overworld =
        world.getDimension("minecraft:overworld");

    const end =
        world.getDimension("minecraft:the_end");

    // 포탈 생성
    try {
        overworld.runCommand(
        `structure load mystructure:fountain_end -8 173 27`
        );

        overworld.runCommand(
        `setblock 4 189 39 air`
        );

        overworld.runCommand(
        `setblock 4 189 39 stone_brick_wall`
        );
    } catch (e) {
        world.sendMessage(`§c구조물 불러오기 실패: ${e}`);
    }

    
    // 사운드
    try {

        world.getDimension("minecraft:overworld").runCommand(
            "playsound mob.enderdragon.growl @a ~ ~ ~ 0.55 1"
        );

    } catch (e) {

        console.warn(e);

    }


    try {

        world.getDimension("minecraft:overworld").runCommand(
            `tellraw @a {"rawtext":[{"text":"§u광장 분수대에 수상한 기운이 감돕니다..."}]}`
        );

    } catch (e) {

        console.warn(e);

    }
    
}

/*
|--------------------------------------------------------------------------
| 엔드 종료
|--------------------------------------------------------------------------
*/

function closeEnd(reason) {

    if (!isEndOpen()) return;

    setEndOpen(false);
    setClosing(false);

    

    dragonStartedThisCycle = false;
    sessions.clear();   // ← 세션 상태 초기화

    // ▼ 드래곤 풀피 회복 ▼
    try {
        const endDim = world.getDimension("minecraft:the_end");
        const dragons = endDim.getEntities({ type: "minecraft:ender_dragon" });
        for (const dragon of dragons) {
            const health = dragon.getComponent("minecraft:health");
            if (health) {
                health.setCurrentValue(health.effectiveMax);
            }
            dragon.nameTag = ""; // 혹시 Shield/Groggy 네임태그 남아있으면 초기화
        }
    } catch (e) {}

    const overworld = world.getDimension("minecraft:overworld");

    for (const player of world.getAllPlayers()) {

        // ▼ 저주 해제 추가 ▼
        if (player.hasTag(CONFIG.CURSE_TAG)) {
            player.removeTag(CONFIG.CURSE_TAG);
            try { player.removeEffect("poison"); } catch (e) {}
        }
        // ▲ 여기까지 ▲

        if (player.dimension.id !== "minecraft:the_end") continue;

        try {

            player.teleport(
                OVERWORLD_SPAWN,
                {
                    dimension: overworld
                }
            );

        } catch {}
    }

    announce(`§c엔드가 폐쇄되었습니다. (${reason})`);

    overworld.runCommand(
        `structure load mystructure:fountain -8 173 27`
    );

}

/*
|--------------------------------------------------------------------------
| 종료 예약
|--------------------------------------------------------------------------
*/

function scheduleClose(reason) {


    if (!isEndOpen()) {
        
        return;
    }

    if (isClosing()) {
       
        return;
    }

    setClosing(true);

    announce(reason);
    announce("§c1분 후 엔드 차원이 폐쇄됩니다.");

    system.runTimeout(() => {

       

        closeEnd(reason);

    }, 20 * 60);
}

/*
|--------------------------------------------------------------------------
| 일요일 20시 자동 오픈
|--------------------------------------------------------------------------
*/

let openHistory = "";

system.runInterval(() => {

    const now = new Date();

    const kst = new Date(
        now.toLocaleString(
            "en-US",
            {
                timeZone: "Asia/Seoul"
            }
        )
    );

    const key =
        `${kst.getFullYear()}-` +
        `${kst.getMonth()}-` +
        `${kst.getDate()}`;

    if (
        kst.getDay() === OPEN_DAY &&
        kst.getHours() === OPEN_HOUR &&
        kst.getMinutes() === OPEN_MINUTE
    ) {

        if (openHistory !== key) {

            openHistory = key;
            openEnd();
        }
    }

}, 20 );

/*
|--------------------------------------------------------------------------
| 1시간 제한
|--------------------------------------------------------------------------
*/

system.runInterval(() => {

    if (!isEndOpen()) return;
    if (isClosing()) return;

    const elapsed =
        Date.now() - getOpenTime();

    if (
        elapsed >=
        60 * 60 * 1000
    ) {

        scheduleClose(
            "운영 시간이 종료되었습니다."
        );
    }

}, 20 * 10);

/*
|--------------------------------------------------------------------------
| 드래곤 처치
|--------------------------------------------------------------------------
*/
    world.afterEvents.entityHitEntity.subscribe((ev) => {

        if (!isEndOpen()) return;

        if (
            ev.hitEntity.typeId !==
            "minecraft:ender_dragon"
        ) return;

        if (
            ev.damagingEntity.typeId !==
            "minecraft:player"
        ) return;

        lastAttacker.set(
            ev.hitEntity.id,
            ev.damagingEntity.name
        );

    });

    world.afterEvents.entityHurt.subscribe((ev) => {

        if (!isEndOpen()) return;

        if (
            ev.hurtEntity.typeId !==
            "minecraft:ender_dragon"
        ) return;

        const name =
            lastAttacker.get(
                ev.hurtEntity.id
            );

        if (!name) return;

        const total =
            (damageMap.get(name) ?? 0) +
            ev.damage;

        damageMap.set(name, total);

    });





    world.afterEvents.entityDie.subscribe((event) => {

    if (
        event.deadEntity.typeId !==
        "minecraft:ender_dragon"
    ) return;

    const overworld =
        world.getDimension(
            "minecraft:overworld"
        );

    const ranking =
        [...damageMap.entries()]
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    world.sendMessage(
        "§6===== 엔드 레이드 결과 =====\n\n§r--------------------"
    );

    let place = 1;

    for (const [name, damage] of ranking) {

            if (damage < MIN_DAMAGE) {

        const player = world.getPlayers({
            name: name
        })[0];

        if (player) {

            player.sendMessage(
                "§c데미지 20을 초과하지 못하여 보상이 주어지지 않습니다.\n§7다음에 다시 도전하세요!"
            );

        }

        continue;
    }

        const money =
            Math.floor(
                damage * 1000
            );

        const gem =
            Math.floor(
                damage * 10
            );

        try {

            overworld.runCommand(
                `scoreboard players add "${name}" Money ${money}`
            );

            overworld.runCommand(
                `scoreboard players add "${name}" Gem ${gem}`
            );

            overworld.runCommand(
                `give "${name}" nether_star 1`
            );

            overworld.runCommand(
                `give "${name}" netherite_ingot 1`
            );

            overworld.runCommand(
                `give "${name}" pa:end_capsule 1`
            );


        } catch {}

        let medal = "§7";

        if (place === 1)
            medal = "";

        else if (place === 2)
            medal = "";

        else if (place === 3)
            medal = "";

        world.sendMessage(
            `${medal} §e${place}위 §f${name}\n\n` +
            `§7피해량 §f${damage.toFixed(2)}\n` +
            ` §f+${money}\n` +
            ` §f+${gem} \n` +
            ` §f엔드 캡슐 x1\n
            --------------------`
        );

        place++;
    }

    damageMap.clear();
    lastAttacker.clear();

    scheduleClose(
        "엔더 드래곤이 처치되었습니다."
    );

});


/*
|--------------------------------------------------------------------------
| 드래곤 데미지 기여도 기록
|--------------------------------------------------------------------------
*/

    world.afterEvents.entityHurt.subscribe((ev) => {

    if (ev.hurtEntity.typeId !== "minecraft:ender_dragon") return;

    const name = lastAttacker.get(ev.hurtEntity.id);

    if (!name) return;

    const total =
        (damageMap.get(name) ?? 0) + ev.damage;

    damageMap.set(name, total);

    
});





        const lastAttacker = new Map();

    world.afterEvents.entityHitEntity.subscribe((ev) => {

    if (ev.hitEntity.typeId !== "minecraft:ender_dragon") return;
    if (ev.damagingEntity.typeId !== "minecraft:player") return;

    lastAttacker.set(
        ev.hitEntity.id,
        ev.damagingEntity.name
    );

    
});






    world.afterEvents.entityHurt.subscribe((ev) => {

        if (ev.hurtEntity.typeId !== "minecraft:ender_dragon") return;

        const name = lastAttacker.get(ev.hurtEntity.id);

        if (!name) return;

        damageMap.set(
            name,
            (damageMap.get(name) ?? 0) + ev.damage
        );

    });





/*
|--------------------------------------------------------------------------
| 엔드 입장 차단
|--------------------------------------------------------------------------
*/

world.afterEvents.playerDimensionChange.subscribe((event) => {

    // 엔드가 아니면 아무것도 하지 않음
    if (event.toDimension.id !== "minecraft:the_end") return;

    if (isEndOpen()) {

        if (!dragonStartedThisCycle) {

            dragonStartedThisCycle = true;

            system.runTimeout(() => {

            }, 20);
        }

        return;
    }

    // 엔드 닫힘 상태
    const overworld = world.getDimension("minecraft:overworld");

    system.run(() => {

        try {

            event.player.teleport(
                OVERWORLD_SPAWN,
                {
                    dimension: overworld
                }
            );

            event.player.sendMessage(
                "§c현재 엔드는 봉인되어 있습니다.\n§7(매주 일요일 오후 8시에 오픈됩니다.)"
            );

        } catch {}
    });
});

/*
|--------------------------------------------------------------------------
| 엔드 시티 진입 차단
|--------------------------------------------------------------------------
*/

system.runInterval(() => {

    if (!isEndOpen()) return;

    const overworld =
        world.getDimension(
            "minecraft:overworld"
        );

    for (const player of world.getAllPlayers()) {

        if (
            player.dimension.id !==
            "minecraft:the_end"
        ) continue;

        const loc = player.location;

        const distance =
            Math.sqrt(
                (loc.x * loc.x) +
                (loc.z * loc.z)
            );

        if (
    distance >
    MAIN_ISLAND_RADIUS
) {

        player.sendMessage(
         "§c엔드 시티 지역은 이용할 수 없습니다."
         );

         player.teleport(
        END_SPAWN,
             {
                 dimension: world.getDimension(
                 "minecraft:the_end"
            )
              }
            );
        }
    }

}, 20);

/*
|--------------------------------------------------------------------------
| 서버 재시작 대응
|--------------------------------------------------------------------------
*/

system.run(() => {

    if (!isEndOpen()) return;

    const elapsed =
        Date.now() - getOpenTime();

    if (
        elapsed >=
        60 * 60 * 1000
    ) {

        scheduleClose(
            "운영 시간이 종료되었습니다."
        );
    }
});

system.run(() => {
    for (const player of world.getPlayers({ tags: ["OP"] })) {
        player.sendMessage(`OPEN=${isEndOpen()}`);
    }
});


world.afterEvents.chatSend.subscribe((event) => {

    if (event.message !== "!endclose") return;

    event.cancel = true;

    if (!event.sender.hasTag("OP")) {
        event.sender.sendMessage("§c권한이 없습니다.");
        return;
    }

    closeEnd("디버그 종료");
});

world.afterEvents.chatSend.subscribe((event) => {

    if (event.message !== "!endopen") return;

    event.cancel = true;

    if (!event.sender.hasTag("OP")) {
        event.sender.sendMessage("§c권한이 없습니다.");
        return;
    }

    openEnd();
});











/*
|--------------------------------------------------------------------------
| 필살기
|--------------------------------------------------------------------------
*/




// ─────────────────────────────
// 설정
// ─────────────────────────────
const CONFIG = {
        DRAGON_TYPE_ID: "minecraft:ender_dragon",
        CRYSTAL_TYPE_ID: "minecraft:ender_crystal",
        CRYSTAL_TAG: "phase2_shield_crystal",
        DIMENSION_ID: "minecraft:the_end",

        PHASE2_HP_RATIO: 0.30,       // 이 비율 이하로 떨어지면 트리거
        SHIELD_RADIUS: 20,           // 보호막 반경
        SHIELD_DURATION_SEC: 40,     // 제한시간
        GROGGY_DURATION_SEC: 15,     // 그로기 지속시간
        GROGGY_DAMAGE_MULT_MIN: 1.5, // 그로기 중 받는 피해 배율
        GROGGY_DAMAGE_MULT_MAX: 2.0,

        FAIL_HP_RECOVER_RATIO: 0.30, // 실패 시 회복량(최대체력 대비 %)
        RETRY_COOLDOWN_SEC: 1,      // 실패 후 재시도 가능까지 쿨다운
        SHIELD_DAMAGE_REDUCTION: 0.05,

        UI_MODE: "bossbar",          // "bossbar" | "actionbar"

        CRYSTAL_POSITIONS: [
            { x: -33, y: 76, z: 24 },
            { x: -11, y: 76, z: 39 },
            { x: 12,  y: 76, z: 39 },
            { x: 33,  y: 76, z: 24 },
            { x: 42,  y: 76, z: 0 },
            { x: 33,  y: 76, z: -24 },
            { x: 12,  y: 76, z: -39 },
            { x: -12, y: 76, z: -39 },
            { x: -33, y: 76, z: -24 },
            { x: -42, y: 76, z: 0 },
            
        ],
        ZOMBIE_TAG: "phase2_shield_zombie",
        ZOMBIE_WITHER_RADIUS: 3,          // 좀비 주위 3칸
        ZOMBIE_WITHER_AMPLIFIER: 1,       // 위더 레벨 2
        ZOMBIE_HIT_SLOW_SEC: 2,           // 공격 시 그로기 지속시간
        ZOMBIE_HIT_SLOW_AMPLIFIER: 255,   // 슬로우니스 255
        FAIL_POISON_AMPLIFIER: 0,           // 독 레벨 1
        CURSE_TAG: "phase2_cursed_poison",  // 저주 상태 추적용 태그
        CURSE_POISON_DURATION_TICKS: 100,   // 한 번 걸릴 때 지속시간 (5초)
        CURSE_REFRESH_INTERVAL_TICKS: 60,   // 3초마다 강제 재적용


        };

        // 드래곤 id -> 세션 상태
        // state: "idle" | "shield" | "groggy" | "cooldown"
        const sessions = new Map();

        function randRange(min, max) {
        return min + Math.random() * (max - min);
        }

        function getHpRatio(entity) {
        const hp = entity.getComponent("minecraft:health");
        if (!hp) return 1;
        return hp.currentValue / hp.effectiveMax;
        }

        function getSession(dragon) {
        let s = sessions.get(dragon.id);
        if (!s) {
            s = {
            state: "idle",
            remainingCrystals: 0,
            sessionTag: null,
            shieldTicksLeft: 0,
            groggyTicksLeft: 0,
            cooldownTicksLeft: 0,
            originalNameTag: dragon.nameTag,
            lockLocation: null,
            triggeredOnce: false, // 성공 시 영구적으로 다시 안 뜨게
            };
            sessions.set(dragon.id, s);
        }
        return s;
        }

        // ─────────────────────────────
        // 트리거 감시 (0.5초마다)
        // ─────────────────────────────
        system.runInterval(() => {
        const dim = world.getDimension(CONFIG.DIMENSION_ID);
        const dragons = dim.getEntities({ type: CONFIG.DRAGON_TYPE_ID });

        for (const dragon of dragons) {
            if (!dragon.isValid) continue;
            const s = getSession(dragon);

            if (s.state === "cooldown") {
                s.cooldownTicksLeft -= 10;
                if (s.cooldownTicksLeft <= 0) s.state = "idle";
                continue;
            }

            if (s.state === "shield") {
                tickShield(dragon, s);
                continue;
            }

            if (s.state === "groggy") {
                tickGroggy(dragon, s);
                continue;
            }

            if (s.state !== "idle") continue;
            if (s.triggeredOnce) continue;

            if (getHpRatio(dragon) <= CONFIG.PHASE2_HP_RATIO) {
                startShieldPattern(dragon, s);
            }
        }
    }, 10);

    // groggy 종료 처리용 함수 추가
    function tickGroggy(dragon, s) {
        s.groggyTicksLeft -= 10;
        if (s.groggyTicksLeft <= 0) {
            s.state = "cooldown";
            s.cooldownTicksLeft = CONFIG.RETRY_COOLDOWN_SEC * 20;
            dragon.nameTag = s.originalNameTag ?? "";
            // 드래곤이 다시 날게 하는 트리거가 필요하면 여기에 추가
            // 예: dragon.triggerEvent("minecraft:start_fly"); (실제 이벤트명은 엔티티 정의에서 확인 필요)
        }
    }

        // ─────────────────────────────
        // 패턴 시작
        // ─────────────────────────────
        function startShieldPattern(dragon, s) {
        s.state = "shield";
        s.shieldTicksLeft = CONFIG.SHIELD_DURATION_SEC * 20;
        s.sessionTag = `phase2_${dragon.id}_${Date.now()}`;
        s.originalNameTag = dragon.nameTag;

        dragon.triggerEvent("minecraft:start_land");

        // ▼ 무적 부여 ▼
        try {
            dragon.addEffect("resistance", (CONFIG.SHIELD_DURATION_SEC + 5) * 20, {
                amplifier: 4,
                showParticles: false,
            });
        } catch (e) {}
        // ▲ 여기까지 ▲

        const dim = dragon.dimension;
    
        let count = 0;
        for (const pos of CONFIG.CRYSTAL_POSITIONS) {
            try {
                const crystal = dim.spawnEntity(CONFIG.CRYSTAL_TYPE_ID, pos);
                crystal.addTag(CONFIG.CRYSTAL_TAG);
                crystal.addTag(s.sessionTag);
                count++;
            } catch (e) {
                console.warn(`크리스탈 소환 실패 (${pos.x},${pos.y},${pos.z}): ${e}`);
            }
        }
        s.remainingCrystals = count;

        // 좀비 소환 (엔드에 있는 인원 수만큼, 각자 위치에)
        for (const player of dragon.dimension.getPlayers()) {
            try {
                const zombie = dim.spawnEntity("minecraft:zombie", player.location);
                zombie.addTag(CONFIG.ZOMBIE_TAG);
                zombie.addTag(s.sessionTag);
                zombie.nameTag = "§kAAAAAA";

                zombie.addEffect("resistance", 999999, {
                    amplifier: 4,
                    showParticles: false,
                });
            } catch (e) {
                console.warn(`좀비 소환 실패: ${e}`);
            }
        }

        

        world.sendMessage("§b§l드래곤이 보호막을 전개합니다! 엔드 크리스탈 10개를 파괴하세요!");
}

        function tickShield(dragon, s) {
    const loc = dragon.location;
    const players = dragon.dimension.getPlayers({
        location: loc,
        maxDistance: CONFIG.SHIELD_RADIUS,
    });
    for (const player of players) {
        const dx = player.location.x - loc.x;
        const dz = player.location.z - loc.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
        const nx = dx / dist;
        const nz = dz / dist;
        player.applyKnockback({ x: nx * 1.4, z: nz * 1.4 }, 0.25);
    }

    s.shieldTicksLeft -= 4;
    const remainingSec = Math.max(0, Math.ceil(s.shieldTicksLeft / 20));

    const remaining = dragon.dimension.getEntities({
        type: CONFIG.CRYSTAL_TYPE_ID,
        tags: [s.sessionTag],
    }).length;
    s.remainingCrystals = remaining;

    updateUI(dragon, remainingSec, remaining);

    // 좀비 위더 오라
    const zombies = dragon.dimension.getEntities({
        type: "minecraft:zombie",
        tags: [s.sessionTag],
    });

    for (const zombie of zombies) {
        if (!zombie.isValid) continue;

        const nearby = dragon.dimension.getPlayers({
            location: zombie.location,
            maxDistance: CONFIG.ZOMBIE_WITHER_RADIUS,
        });

        for (const p of nearby) {
            try {
                p.addEffect("wither", 20, {
                    amplifier: CONFIG.ZOMBIE_WITHER_AMPLIFIER,
                    showParticles: true,
                });
            } catch (e) {}
        }
    }

    if (remaining <= 0) {
        onShieldSuccess(dragon, s);
        return;
    }

    if (s.shieldTicksLeft <= 0) {
        onShieldFail(dragon, s);
        return;
    }
}


        function updateUI(dragon, remainingSec, remainingCrystals) {
        if (CONFIG.UI_MODE === "bossbar") {
            dragon.nameTag = `§bShield §7: §f${remainingSec}s §7(§c${remainingCrystals}§7/10)`;
        } else {
            for (const player of world.getAllPlayers()) {
            player.onScreenDisplay.setActionBar(
                `§bDragon Shield §7| §f${remainingSec}s §7| 크리스탈 §c${remainingCrystals}§7/10`
            );
            }
        }
        }

        // ─────────────────────────────
        // 성공 -> 그로기 진입
        // ─────────────────────────────
        function onShieldSuccess(dragon, s) {
        s.state = "groggy";
        s.groggyTicksLeft = CONFIG.GROGGY_DURATION_SEC * 20;
        s.lockLocation = { ...dragon.location };
        s.triggeredOnce = true;

        // ▼ 무적 해제 (그로기 중엔 데미지 정상적으로 받아야 하니까) ▼
        try { dragon.removeEffect("resistance"); } catch (e) {}
        // ▲

    

        // 저주 해제
        for (const player of dragon.dimension.getPlayers()) {
            if (player.hasTag(CONFIG.CURSE_TAG)) {
                player.removeTag(CONFIG.CURSE_TAG);
                try { player.removeEffect("poison"); } catch (e) {}
            }
        }

        // ▼▼▼ 좀비 정리 ▼▼▼
        const zombies = dragon.dimension.getEntities({
            type: "minecraft:zombie",
            tags: [s.sessionTag],
        });
        for (const z of zombies) {
            try {
                dragon.dimension.spawnParticle("minecraft:basic_smoke_particle", z.location);
            } catch (e) {}
            z.remove();
        }
        // ▲▲▲ 여기까지 ▲▲▲

        dragon.nameTag = "§e§lGroggy!";
        

        world.sendMessage("§a§l크리스탈 파괴 성공! 드래곤이 그로기 상태에 빠졌습니다!");
    }
        // ─────────────────────────────
        // 실패
        // ─────────────────────────────
        function onShieldFail(dragon, s) {
        s.state = "cooldown";
        s.cooldownTicksLeft = CONFIG.RETRY_COOLDOWN_SEC * 20;

        // ▼ 무적 해제 ▼
        try { dragon.removeEffect("resistance"); } catch (e) {}
        // ▲

        // 체력 회복
    
    const health = dragon.getComponent("minecraft:health");
    if (health) {
        const max = health.effectiveMax;
        const recover = max * CONFIG.FAIL_HP_RECOVER_RATIO;
        health.setCurrentValue(
            Math.min(max, health.currentValue + recover)
        );
    }

    // 남은 크리스탈 제거
    const leftover = dragon.dimension.getEntities({
        type: CONFIG.CRYSTAL_TYPE_ID,
        tags: [s.sessionTag],
    });
    for (const c of leftover) c.remove();

    // 좀비 제거 (연기 + 전원 영구 독)
    const zombies = dragon.dimension.getEntities({
        type: "minecraft:zombie",
        tags: [s.sessionTag],
    });
    for (const z of zombies) {
        try {
            dragon.dimension.spawnParticle("minecraft:basic_smoke_particle", z.location);
        } catch (e) {}
        z.remove();
    }

    for (const player of dragon.dimension.getPlayers()) {
        try {
            player.addTag(CONFIG.CURSE_TAG);
            player.addEffect("poison", CONFIG.CURSE_POISON_DURATION_TICKS, {
                amplifier: CONFIG.FAIL_POISON_AMPLIFIER,
                showParticles: true,
            });
        } catch (e) {}
    }

    world.sendMessage("§c§l당신의 분신들이 당신에게 영구적인 저주를 남깁니다");

    dragon.nameTag = s.originalNameTag ?? "";

    try {
        dragon.triggerEvent("minecraft:roar");
    } catch (e) {}
    dragon.dimension.playSound("mob.enderdragon.growl", dragon.location);

    const loc = dragon.location;
    const players = dragon.dimension.getPlayers({ location: loc, maxDistance: 50 });
    for (const player of players) {
        const dx = player.location.x - loc.x;
        const dz = player.location.z - loc.z;
        const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
        const nx = dx / dist;
        const nz = dz / dist;
        player.applyKnockback({ x: nx * 2, z: nz * 2 }, 0.4);
    }
}

    


world.afterEvents.itemCompleteUse.subscribe((ev) => {
    if (ev.itemStack.typeId !== "minecraft:milk_bucket") return;

    const player = ev.source;
    if (!player.hasTag(CONFIG.CURSE_TAG)) return;

    // 우유로 지워지자마자(1~2틱 뒤) 다시 중독시킴
    system.runTimeout(() => {
        try {
            player.addEffect("poison", CONFIG.CURSE_POISON_DURATION_TICKS, {
                amplifier: CONFIG.FAIL_POISON_AMPLIFIER,
                showParticles: true,
            });
        } catch (e) {}
    }, 2);
});


world.afterEvents.itemCompleteUse.subscribe((ev) => {
    if (ev.itemStack.typeId !== "minecraft:milk_bucket") return;

    const player = ev.source;
    if (!player.hasTag(CONFIG.CURSE_TAG)) return;

    system.runTimeout(() => {
        try {
            player.addEffect("poison", CONFIG.CURSE_POISON_DURATION_TICKS, {
                amplifier: CONFIG.FAIL_POISON_AMPLIFIER,
                showParticles: true,
            });
        } catch (e) {}
    }, 2);
});

// ▼ 여기 추가 ▼
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (!player.hasTag(CONFIG.CURSE_TAG)) continue;
        try {
            player.addEffect("poison", CONFIG.CURSE_POISON_DURATION_TICKS, {
                amplifier: CONFIG.FAIL_POISON_AMPLIFIER,
                showParticles: true,
            });
        } catch (e) {}
    }
}, CONFIG.CURSE_REFRESH_INTERVAL_TICKS);
// ▲ 여기까지 ▲

// 좀비가 맞으면 좀비 본인에게 슬로우 적용
world.afterEvents.entityHurt.subscribe((ev) => {
    if (!ev.hurtEntity.hasTag(CONFIG.ZOMBIE_TAG)) return;

    try {
        ev.hurtEntity.addEffect("slowness", CONFIG.ZOMBIE_HIT_SLOW_SEC * 20, {
            amplifier: CONFIG.ZOMBIE_HIT_SLOW_AMPLIFIER,
            showParticles: true,
        });
    } catch (e) {}
});



export function getDragonPhase2Info() {
    const dim = world.getDimension(CONFIG.DIMENSION_ID);
    const dragon = dim.getEntities({ type: CONFIG.DRAGON_TYPE_ID })[0];

    if (!dragon || !dragon.isValid) return null;

    const health = dragon.getComponent("minecraft:health");
    const hpRatio = health ? health.currentValue / health.effectiveMax : 0;

    const s = sessions.get(dragon.id);

    return {
        hpRatio,
        state: s?.state ?? "idle",
        shieldTicksLeft: s?.shieldTicksLeft ?? 0,
        shieldDurationTicks: CONFIG.SHIELD_DURATION_SEC * 20,
    };
}







/*
|--------------------------------------------------------------------------
| 엔드 캡슐 오픈
|--------------------------------------------------------------------------
*/

const capsuleCooldown = new Map();
const CAPSULE_COOLDOWN = 5000; // 5초

const CAPSULE_ITEM = "pa:end_capsule";

function hasEmptySlots(player, need = 5) {



    const inv = player
        .getComponent("minecraft:inventory")
        .container;

    let empty = 0;

    for (let i = 0; i < inv.size; i++) {

        if (!inv.getItem(i))
            empty++;

    }

    return empty >= need;



}


function randomGoldNuggets() {

    const r = Math.random() * 100;

    if (r < 55) return 3;
    if (r < 85) return 5;

    return 8;

}

function randomGoldIngots() {

    const r = Math.random() * 100;

    if (r < 60) return 2;
    if (r < 90) return 4;

    return 6;

}

world.beforeEvents.itemUse.subscribe(ev => {

    if (
        ev.itemStack.typeId !==
        CAPSULE_ITEM
    ) return;

    const player = ev.source;

    const last =
        capsuleCooldown.get(player.id) ?? 0;

    const remain =
        CAPSULE_COOLDOWN - (Date.now() - last);

    if (remain > 0) {

        ev.cancel = true;

        

        return;

    }

    if (!hasEmptySlots(player, 5)) {

        ev.cancel = true;

        player.sendMessage(
            "§c가방에 빈 공간이 최소 5칸 이상 필요합니다."
        );

        return;

    }

    // 사용 허용 -> 쿨타임 시작
    capsuleCooldown.set(
        player.id,
        Date.now()
    );

});

world.afterEvents.itemUse.subscribe(ev => {

    if (
        ev.itemStack.typeId !==
        CAPSULE_ITEM
    ) return;

    const player = ev.source;

    const inv =
        player.getComponent(
            "minecraft:inventory"
        ).container;

    // 결과를 먼저 확정
    const nuggets = randomGoldNuggets();
    const ingots = randomGoldIngots();
    const star = Math.random() < 0.0005; // 테스트용 (실사용 0.0005)

    player.sendMessage(
        "§d엔드 캡슐을 개봉합니다..."
    );

        player.runCommand(`clear @s pa:end_capsule 0 1`);

    // 1초
    system.runTimeout(() => {

        inv.addItem(
            new ItemStack(
                "pa:end_feather",
                nuggets
            )
        );

        player.playSound("random.pop");

        player.sendMessage(
            `§7------엔드 캡슐 보상------\n\n§d엔드 깃털 §fx${nuggets}`
        );

    }, 20);

    // 2초
    system.runTimeout(() => {

        inv.addItem(
            new ItemStack(
                "minecraft:shulker_shell",
                ingots
            )
        );

        player.playSound("random.pop");

        player.sendMessage(
            `§u셜커 껍질 §fx${ingots}\n\n§7-------------------------`
        );

    }, 40);

    // 3초
    system.runTimeout(() => {

        player.sendMessage(
            "§7마지막 보상..."
        );

    }, 60);

    // 5초
    system.runTimeout(() => {

        if (star) {

            inv.addItem(
                new ItemStack(
                    "pa:levitaion_stone",
                    1
                )
            );

            player.sendMessage(
                "§e축하합니다! §f당신은 엔드 캡슐에서 §d<비행석>§f을 획득하였습니다."
            );

            world.sendMessage(
                "§e축하합니다! §f누군가가 §b1/2000§f의 행운으로 §d<비행석>§f을 획득했습니다!"
            );

            player.playSound(
                "random.levelup"
            );

        } else {

            player.sendMessage(
                "§7꽝! 추가 보상은 없었습니다."
            );

        }

    }, 100);

});