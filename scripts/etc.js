import { world, system } from "@minecraft/server";
import { ActionFormData , ModalFormData } from "@minecraft/server-ui";
import { showMainMenu } from "./clover.js";
import { getDisplayName , getItemDisplayName , showChangeNicknameForm } from "./namesystem.js";
export const tpaDisabled = new Map(); // player.id -> true/false







/*
|--------------------------------------------------------------------------
| 난이도 밸런싱
|--------------------------------------------------------------------------
*/

let lastDay = -1;
let currentDifficulty = null;

function getDifficulty(day) {
    if (day <= 1) return "평화로움";
    if (day <= 3) return "보통";
    return "어려움";
}

system.run(() => {
    lastDay = world.getDay();
    currentDifficulty = getDifficulty(lastDay);

    system.runInterval(() => {
        const day = world.getDay();

        // 날짜가 그대로면 아무것도 안 함
        if (day === lastDay) return;

        lastDay = day;

        const newDifficulty = getDifficulty(day);

        if (newDifficulty !== currentDifficulty) {
            const oldDifficulty = currentDifficulty;
            currentDifficulty = newDifficulty;

            world.sendMessage(
                `§6§l[ ! ] §r§e서버 난이도가 상승했습니다! §7[ ${oldDifficulty} §f> §c${newDifficulty} §7]`
            );
        }
    }, 20); // 1초마다 날짜 확인
});



/*
|--------------------------------------------------------------------------
| tpa
|--------------------------------------------------------------------------
*/


const pending = new Map(); // targetId -> [{ requesterId, timeout, type }]
const cooldown = new Map(); // requesterId -> expireTime(ms)

function getPlayerByName(name) {
    return [...world.getPlayers()].find(
        p => p.name.toLowerCase() === name.toLowerCase()
    );
}

function getPlayerById(id) {
    return [...world.getPlayers()].find(
        p => p.id === id
    );
}

function sendRequest(sender, target, type) {

            if (tpaDisabled.get(target.id)) {
            sender.sendMessage("§c해당 플레이어는 TPA(here) 요청을 받지 않습니다.");
            return;
        }

    const now = Date.now();

    const key = `${sender.id}:${type}`;

    const end = cooldown.get(key);

    if (end && end > now) {

        sender.sendMessage(
            `§c${type.toUpperCase()} 쿨타임입니다. ${
                Math.ceil((end - now) / 1000)
            }초 남았습니다.`
        );

        return;
    }

    const list = pending.get(target.id) ?? [];

    if (list.some(r => r.requesterId === sender.id)) {
        sender.sendMessage("§c이미 요청을 보냈습니다.");
        return;
    }

    const timeout = system.runTimeout(() => {

        const requests = pending.get(target.id) ?? [];
        const filtered = requests.filter(r => r.requesterId !== sender.id);

        if (filtered.length) {
            pending.set(target.id, filtered);
        } else {
            pending.delete(target.id);
        }

        sender.sendMessage("§c[TPA] 수신자가 응답이 없으므로 요청을 종료합니다.");
        target.sendMessage(`§7${getDisplayName(sender)}님의 요청이 만료되었습니다.`);

    }, 20 * 60);

    list.push({
        requesterId: sender.id,
        timeout,
        type
    });

    pending.set(target.id, list);

    if (type === "tpa") {

        sender.sendMessage(
            `§a${getDisplayName(target)}님에게 TPA 요청을 보냈습니다.`
        );

        target.playSound("notification");

        target.sendMessage(
        `§e${getDisplayName(sender)}님이 당신에게 순간이동하려고 합니다.\n` +
        `§7현재 요청 수 : ${list.length}\n` +
        `§a!수락 §7= 모든 요청 수락\n` +
        `§c!거절 §7= 모든 요청 거절`
    );

    } else {

        sender.sendMessage(
        `§a${getDisplayName(target)}님에게 TPAHERE 요청을 보냈습니다.`
    );

        target.playSound("notification");

        target.sendMessage(
            `§e${getDisplayName(sender.name)}님이 당신을 자신의 위치로 소환하려고 합니다.\n` +
            `§7현재 요청 수 : ${list.length}\n` +
            `§a!수락 §7= 모든 요청 수락\n` +
            `§c!거절 §7= 모든 요청 거절`
        );
    }
}

world.afterEvents.chatSend.subscribe((event) => {

    const sender = event.sender;
    const msg = event.message.trim();

    if (!msg.startsWith("!")) return;

    const args = msg.split(/\s+/);
    const cmd = args[0].toLowerCase();

    switch (cmd) {

        case "!tpa": {

            if (!args[1]) {
                sender.sendMessage("§c사용법: !tpa @플레이어");
                return;
            }

            const target = getPlayerByName(args[1].replace(/^@/, ""));

            if (!target) {
                sender.sendMessage("§c플레이어를 찾을 수 없습니다.");
                return;
            }

            if (target.id === sender.id) {
                sender.sendMessage("§c자기 자신에게 요청할 수 없습니다.");
                return;
            }

            sendRequest(sender, target, "tpa");
            break;
        }

        case "!tpahere": {

            if (!args[1]) {
                sender.sendMessage("§c사용법: !tpahere @플레이어");
                return;
            }

            const target = getPlayerByName(args[1].replace(/^@/, ""));

            if (!target) {
                sender.sendMessage("§c플레이어를 찾을 수 없습니다.");
                return;
            }

            if (target.id === sender.id) {
                sender.sendMessage("§c자기 자신에게 요청할 수 없습니다.");
                return;
            }

            sendRequest(sender, target, "tpahere");
            break;
        }

        case "!수락": {

            const requests = pending.get(sender.id);

            if (!requests || requests.length === 0) {
                sender.sendMessage("§c대기 중인 요청이 없습니다.");
                return;
            }

            pending.delete(sender.id);

            let success = 0;

            for (const req of requests) {

                system.clearRun(req.timeout);

                const requester = getPlayerById(req.requesterId);

                if (!requester) continue;

                if (req.type === "tpa") {

                    requester.teleport(sender.location, {
                        dimension: sender.dimension
                    });

                    requester.sendMessage(
                        `§a${sender.name}에게 순간이동했습니다.`
                    );

                } else {

                    sender.teleport(requester.location, {
                        dimension: requester.dimension
                    });

                    sender.sendMessage(
                        `§a${requester.name}에게 순간이동했습니다.`
                    );

                    requester.sendMessage(
                        `§a${sender.name}님이 당신의 위치로 순간이동했습니다.`
                    );
                }

                cooldown.set(
                    `${requester.id}:${req.type}`,
                    Date.now() + 60000
                );

                success++;
            }

            sender.sendMessage(
                `§a${success}개의 요청을 수락했습니다.`
            );

            break;
        }

        case "!거절": {

            const requests = pending.get(sender.id);

            if (!requests || requests.length === 0) {
                sender.sendMessage("§c대기 중인 요청이 없습니다.");
                return;
            }

            pending.delete(sender.id);

            for (const req of requests) {

                system.clearRun(req.timeout);

                const requester = getPlayerById(req.requesterId);

                if (requester) {
                    requester.sendMessage(
                        `§c${sender.name}님이 TPA 요청을 거절했습니다.`
                    );
                }
            }

            sender.sendMessage(
                `§7${requests.length}개의 요청을 거절했습니다.`
            );

            break;
        }

    }

});

export async function showEtcMenu(player){

    const form = new ActionFormData();

    form.title("기타");

    form.button("휴지통 §7( 아이템 버리기 )","textures/formicon/Icons_45.png");
    form.button("홈 저장","textures/formicon/Icons_41.png");
    form.button("플레이어에게 TP 요청 보내기","textures/formicon/Icons_42.png");
    form.button("여기에 TP 요청 보내기","textures/formicon/Icons_42.png");
    form.button("받은 요청","textures/formicon/Icons_28.png");
    form.button("서버 닉네임 변경","textures/formicon/Icons_11.png");
    form.button("⬅ 뒤로");

    const result = await form.show(player);

    if(result.canceled) return;

    switch(result.selection){

        case 0:
            openTrash(player);
            break;

        case 1:
            showHomeSaveForm(player);
            break;

        case 2:
            showPlayerList(player,"tpa");
            break;

        case 3:
            showPlayerList(player,"tpahere");
            break;

        case 4:
            showPendingRequests(player);
            break;

        case 5:
            await showChangeNicknameForm(player);
            break;

         case 6:
            showMainMenu(player);
            break;
    }

}






export function openTrash(player) {

    player.runCommand("playsound notification @s");

    player.sendMessage(
        "§a쓰레기통이 생성되었습니다.\n§7우클릭(홀드)하여 쓰레기통을 여세요."
    );

    // 기존 쓰레기통 제거
    for (const entity of player.dimension.getEntities({
        tags: [`trash:${player.id}`]
    })) {

        if (!entity.isValid()) continue;

        clearTrash(entity);
        entity.destroy();
    }

    // 플레이어 앞에 소환
    const dir = player.getViewDirection();

    const location = {
        x: player.location.x + dir.x * 2,
        y: player.location.y,
        z: player.location.z + dir.z * 2
    };

    const trash = player.dimension.spawnEntity("pa:trash_bin", location);

    registerTrashBin(trash, player.id); // ← 추가

    trash.addTag(`trash:${player.id}`);
    trash.setDynamicProperty("ownerId", player.id);
    trash.nameTag = `${getDisplayName(player)}의 쓰레기통`;
    trash.setDynamicProperty("ownerName", player.name);

    return trash;
}

function clearTrash(entity) {

    const inv =
        entity.getComponent("minecraft:inventory")
            ?.container;

    if (!inv) return;

    for (let i = 0; i < inv.size; i++) {
        inv.setItem(i);
    }
}


world.afterEvents.entityContainerOpened.subscribe((event) => {
    const { entity } = event;

    if (entity.typeId !== TRASH_ID) return;

    const data = activeTrashBins.get(entity.id);
    if (!data) return;

    data.opened = true;
});


const TRASH_ID = "pa:trash_bin";

world.afterEvents.entityContainerClosed.subscribe((event) => {
    const { entity } = event;

    if (entity.typeId !== TRASH_ID) return;

   const data = activeTrashBins.get(entity.id);
    if (data) {
        data.opened = false;
        data.confirming = true;
    }

    const ownerId = entity.getDynamicProperty("ownerId");
    const player = world.getAllPlayers().find(p => p.id === ownerId);

    if (!player) {
        entity.remove();
        activeTrashBins.delete(entity.id);
        return;
    }

    system.run(() => confirmDelete(player, entity));
});

function deleteTrash(entity) {
    const container = entity.getComponent("minecraft:inventory")?.container;
    let deleted = 0;

    if (container) {
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) {
                deleted += item.amount;
                container.setItem(i);
            }
        }
    }

    const ownerId = entity.getDynamicProperty("ownerId");

    entity.remove();
    activeTrashBins.delete(entity.id);

    const ownerPlayer = world.getAllPlayers().find(p => p.id === ownerId);

    if (ownerPlayer) {
        ownerPlayer.playSound("random.levelup");
        ownerPlayer.sendMessage(
            `§a${deleted.toLocaleString()}개의 아이템이 삭제되었습니다.\n` +
            `§7쾌적한 서버 환경에 협조해 주셔서 감사합니다!`
        );
    }
}

async function confirmDelete(player, entity) {
    const container = entity.getComponent("minecraft:inventory")?.container;
    if (!container) return;

    const items = [];

    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;

        items.push(item);
    }

    // 비어 있으면 확인창 없이 바로 제거
    if (items.length === 0) {
        entity.remove();
        activeTrashBins.delete(entity.id);
        return;
    }

    // rawtext로 조립해야 클라이언트 언어(한국어)로 아이템 이름이 번역됨
    const bodyRawtext = [
        { text: "§c아래 내용들은 영구적으로 삭제되며 돌이킬 수 없습니다. 신중히 결정하세요\n\n" },{ text: "§f아래 아이템을 삭제합니다.\n\n" }
    ];

    const shown = items.slice(0, 8);

    for (const item of items) {
        bodyRawtext.push({ text: "• " });
        bodyRawtext.push({ translate: item.localizationKey });
        bodyRawtext.push({ text: ` §7×${item.amount}§f\n` });
    }

    // if (items.length > 8) {
    //     bodyRawtext.push({ text: `§7... 외 ${items.length - 8}종` });
    // }

    const result = await new ActionFormData()
        .title("§c쓰레기통 비우기")
        .body({ rawtext: bodyRawtext })
        .button("§c삭제하기")
        .button("§a계속 정리하기")
        .show(player);

        const data = activeTrashBins.get(entity.id);

        if (data) {
            data.confirming = false;
            data.lastInteractTick = system.currentTick;
        }

    if (result.canceled) {
        // ESC도 취소와 동일
        return;
    }

    if (result.selection === 0) {
        deleteTrash(entity);
    } else {
        // TODO: 다시 열기
    }
}


world.beforeEvents.playerInteractWithEntity.subscribe(ev => {

    const entity = ev.target;

    const tag = entity.getTags()
        .find(tag => tag.startsWith("trash:"));

    if (!tag) return;

    if (tag !== `trash:${ev.player.id}`) {

        ev.cancel = true;

        ev.player.sendMessage(
            "§c다른 플레이어의 쓰레기통입니다."
        );
    }

    // 내 쓰레기통을 열려고 했으므로 타이머 초기화
    const data = activeTrashBins.get(entity.id);
    if (data) {
        data.lastInteractTick = system.currentTick;
    }

});


const TRASH_CHECK_INTERVAL_TICKS = 20;       // 1초마다 체크
const TRASH_TIMEOUT_TICKS = 600 * 20;         // 30초
const TRASH_MAX_DISTANCE = 5;

// entity.id -> { ownerId, spawnTick }
const activeTrashBins = new Map();

function registerTrashBin(entity, ownerId) {
    activeTrashBins.set(entity.id, {
        ownerId,
        lastInteractTick: system.currentTick,
        opened: false,
        confirming: false,
    });
}

function despawnTrash(entity, data, reasonMessage) {
    const container = entity.getComponent("minecraft:inventory")?.container;
    if (container) {
        for (let i = 0; i < container.size; i++) {
            container.setItem(i);
        }
    }

    entity.remove();
    activeTrashBins.delete(entity.id);

    const ownerPlayer = world.getAllPlayers().find(p => p.id === data.ownerId);
    if (ownerPlayer) {
        ownerPlayer.sendMessage(reasonMessage);
    }
}

system.runInterval(() => {
    for (const [entityId, data] of activeTrashBins) {

        // 엔티티를 다시 조회 (직접 참조 들고 있으면 stale할 수 있어서 매번 검색)
        const entity = world.getEntity(entityId);

        if (!entity || !entity.isValid) {
            activeTrashBins.delete(entityId);
            continue;
        }

        // 30초 타임아웃 체크
        if (data.opened || data.confirming) {
            continue;
        }

        const elapsed = system.currentTick - data.lastInteractTick;
        if (elapsed >= TRASH_TIMEOUT_TICKS) {
            despawnTrash(entity, data, "§7일정 시간 동안 사용하지 않아 쓰레기통이 사라졌습니다.");
            continue;
        }

        // 거리 체크
        const ownerPlayer = world.getAllPlayers().find(p => p.id === data.ownerId);

        if (!ownerPlayer) {
            // 주인이 오프라인
            despawnTrash(entity, data, "");
            continue;
        }

        const dx = ownerPlayer.location.x - entity.location.x;
        const dy = ownerPlayer.location.y - entity.location.y;
        const dz = ownerPlayer.location.z - entity.location.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq > TRASH_MAX_DISTANCE * TRASH_MAX_DISTANCE) {
            despawnTrash(entity, data, "§7쓰레기통과 너무 멀어져서 자동으로 사라졌습니다.");
        }
    }
}, TRASH_CHECK_INTERVAL_TICKS);







async function showPlayerList(player,type){

    const form = new ActionFormData();

    form.title(
        type === "tpa"
        ? "TPA"
        : "TPAHERE"
    );

    const players =
        [...world.getPlayers()]
        .filter(p=>p.id!==player.id);

    if(players.length===0){

        player.sendMessage("§c온라인 플레이어가 없습니다.");

        return;
    }

    for(const p of players){

       form.button(`${getDisplayName(p)} \n§7( @${p.name} )`);

    }

    form.button("⬅ 뒤로");

    const result =
        await form.show(player);

    if(result.canceled) return;

    if(result.selection===players.length){

        showEtcMenu(player);

        return;

    }

    sendRequest(
        player,
        players[result.selection],
        type
    );

}

async function showPendingRequests(player) {

    const requests = pending.get(player.id);

    if (!requests || requests.length === 0) {
        player.sendMessage("§c받은 요청이 없습니다.");
        return;
    }

    const form = new ActionFormData();

    form.title("받은 요청");

    form.body(
`§f플레이어 이름을 선택하여 요청을 수락합니다.

§7수락하지 않은 요청은 60초 뒤 자동으로 거절됩니다.`
    );

    const valid = [];

    for (const req of requests) {

        const requester = getPlayerById(req.requesterId);

        if (!requester) continue;

        valid.push(req);

        form.button(
    `${getDisplayName(requester)}\n§7@${requester.name} §8• §f${req.type.toUpperCase()}`
);
    }

    form.button("⬅ 뒤로");

    const result = await form.show(player);

    if (result.canceled) return;

    if (result.selection === valid.length) {
        showEtcMenu(player);
        return;
    }

    acceptRequest(player, requests.indexOf(valid[result.selection]));
}

async function showRequestMenu(player,index){

    const requests =
        pending.get(player.id);

    const req =
        requests[index];

    const requester =
        getPlayerById(req.requesterId);

    if(!requester) return;

    const form =
        new ActionFormData();

    form.title(requester.name);

    form.body(req.type);

    form.button("수락");
    form.button("거절");

    const result =
        await form.show(player);

    if(result.canceled) return;

    if(result.selection===0){

        acceptRequest(
            player,
            index
        );

    }else{

        rejectRequest(
            player,
            index
        );

    }

}

function acceptRequest(player,index){

    const requests =
        pending.get(player.id);

    if(!requests) return;

    const req =
        requests[index];

    system.clearRun(req.timeout);

    requests.splice(index,1);

    if(requests.length){

        pending.set(player.id,requests);

    }else{

        pending.delete(player.id);

    }

    const requester =
        getPlayerById(req.requesterId);

    if(!requester) return;

    if(req.type==="tpa"){

        requester.teleport(player.location,{
            dimension:player.dimension
        });

    }else{

        player.teleport(requester.location,{
            dimension:requester.dimension
        });

    }

        cooldown.set(
            `${requester.id}:${req.type}`,
            Date.now() + 60000
        );

    player.sendMessage("§a요청을 수락했습니다.");

    requester.sendMessage("§a요청이 수락되었습니다.");

}

function rejectRequest(player,index){

    const requests =
        pending.get(player.id);

    if(!requests) return;

    const req =
        requests[index];

    system.clearRun(req.timeout);

    requests.splice(index,1);

    if(requests.length){

        pending.set(player.id,requests);

    }else{

        pending.delete(player.id);

    }

    const requester =
        getPlayerById(req.requesterId);

    if(requester){

        requester.sendMessage(
            "§c요청이 거절되었습니다."
        );

    }

    player.sendMessage(
        "§7요청을 거절했습니다."
    );

}









/*
|--------------------------------------------------------------------------
| 아이템 청소
|--------------------------------------------------------------------------
*/


const CLEAN_INTERVAL = 45 * 60;
let remain = CLEAN_INTERVAL;

system.runInterval(() => {

    remain--;

    switch (remain) {

        case 600:
            world.sendMessage("§e§l[서버] §r§610분 후 바닥 아이템이 정리됩니다.");
            break;

        case 300:
            world.sendMessage("§e§l[서버] §r§65분 후 바닥 아이템이 정리됩니다.");
            break;

        case 60:
            world.sendMessage("§e§l[서버] §r§c1분 후 바닥 아이템이 정리됩니다.");
            break;
    }

    // 10~6초
    if (remain <= 10 && remain > 5) {

        world.sendMessage(
            `§e§l[서버] §r§c${remain}초 후 바닥 아이템이 정리됩니다.`
        );

    }

    // 5~1초 (벨 소리)
    if (remain <= 5 && remain > 0) {

        world.sendMessage(
            `§e§l[서버] §r§c${remain}초 후 바닥 아이템이 정리됩니다.`
        );

        world.getDimension("overworld").runCommand(
            "playsound note.bell @a"
        );
    }

    if (remain <= 0) {

        let removed = 0;

        for (const dimension of [
            world.getDimension("overworld"),
            world.getDimension("nether"),
            world.getDimension("the_end"),
            world.getDimension("custom:lobby"),
            world.getDimension("custom:village")
        ]) {

            for (const entity of dimension.getEntities({
                type: "minecraft:item"
            })) {
                entity.remove();
                removed++;
            }
        }

        // 완료 효과음
        world.getDimension("overworld").runCommand(
            "playsound random.levelup @a"
        );

        world.sendMessage(
            `§a§l[서버] §r바닥 아이템 §e${removed}개§r를 정리했습니다.`
        );

        remain = CLEAN_INTERVAL;
    }

}, 20);







/*
|--------------------------------------------------------------------------
| 사망 이벤트
|--------------------------------------------------------------------------
*/

const TIPS = {
    lava: [
        "§e[TIP] §f용암은 수영장이 아닙니다!"
    ],

    fall: [
        "§e[TIP] §f새가 아니여도 날 수 있잖아요. 그렇죠?"
    ],

    drowning: [
        "§e[TIP] §f숨은 주기적으로 쉬어야 합니다."
    ],

    fire: [
        "§e[TIP] §f불장난은 위험합니다."
    ],

    freezing: [
        "§e[TIP] §f따뜻한 곳도 가끔은 좋습니다."
    ],

    starve: [
        "§e[TIP] §f사인은 다름 아닌 배고픔이였습니다."
    ],

    void: [
        "§e[TIP] §f아래에는 아무것도 없습니다."
    ],

    projectile: [
        "§e[TIP] §f피할 수 없으면 즐겨야죠!"
    ],

    entityAttack: [
        "§e[TIP] §f몬스터를 꼭 안아주세요!"
    ],

    entityExplosion: [
        "§e[TIP] §fTNT는 장난감이 아닙니다."
    ],

    blockExplosion: [
        "§e[TIP] §f침대는 잠을 자는 용도입니다. 폭발시키지 마세요!"
    ],

    contact: [
        "§e[TIP] §f선인장을 꼭 안을 필요는 없습니다."
    ]
};

const RARE_TIPS = [
    "§6[TIP] §f사망은 정상적인 게임 플레이의 일부입니다.",
    "§6[TIP] §f\"설마 죽겠어\""
];

world.afterEvents.entityDie.subscribe((event) => {
    const player = event.deadEntity;

    if (player.typeId !== "minecraft:player") return;

    // 20% 확률
    if (Math.random() < 0.4) return;

    // 1% 확률로 희귀 팁
    if (Math.random() < 0.01) {
        const tip = RARE_TIPS[Math.floor(Math.random() * RARE_TIPS.length)];
        world.sendMessage(tip);
        return;
    }

    const cause = event.damageSource.cause;
    const tips = TIPS[cause];

    if (!tips) return;

    const tip = tips[Math.floor(Math.random() * tips.length)];
    world.sendMessage(tip);
});


const SERVER_MESSAGES = [
    "§6[서버] §b익룡의 놀이터 디스코드§f와 §e오픈채팅에 가입하여 더 많은 최신 정보를 얻어보세요!",
    "§6[서버] §b엔드 차원§f은 §e매주 일요일 8시§f에 오픈됩니다. 참여하여 §b특별한 보상§f을 얻어보세요!",
    "§6[서버] §e마을§f에 가입하여 마을원들과 함께 더 많은 컨텐츠를 해금하세요!",
    "§6[서버] §b직업§f을 선택하고 레벨을 올려 §e강력한 전용 능력§f을 해금해보세요!",
    "§6[서버] §b일일 출석§f과 §e퀘스트§f를 통해 다양한 보상을 획득해보세요!",
    "§6[서버] §e건의사항§f이나 §b버그 제보§f는 디스코드를 통해 언제든 남겨주세요! §7(오류 제보 시 소정의 보상이 제공됩니다.)"
];

let lastIndex = -1;

function broadcastRandomMessage() {
    let index;

    do {
        index = Math.floor(Math.random() * SERVER_MESSAGES.length);
    } while (SERVER_MESSAGES.length > 1 && index === lastIndex);

    lastIndex = index;

    world.sendMessage(SERVER_MESSAGES[index]);
}

// 최초 실행 후 5분마다 반복
system.runInterval(() => {
    broadcastRandomMessage();
}, 20 * 60 * 5); // 6000틱 = 5분
















/*
|--------------------------------------------------------------------------
| 홈 저장
|--------------------------------------------------------------------------
*/


const BLOCKED_DIMENSIONS = [
    "minecraft:the_end",
    "custom:village"
];

export async function showHomeSaveForm(player) {
    // 홈 저장 불가 차원
    if (BLOCKED_DIMENSIONS.includes(player.dimension.id)) {
        player.sendMessage("§c이 차원에서는 홈을 저장할 수 없습니다.");
        return;
    }

    // 플레이어 데이터
    const home1 = JSON.parse(player.getDynamicProperty("home1") ?? "null");
    const home2 = JSON.parse(player.getDynamicProperty("home2") ?? "null");

    const hasHome2 = player.hasTag("sethome2");

    const options = [
        home1
            ? `홈 1 ( ${home1.name} )`
            : "홈 1 ( 비어있음 )",

        hasHome2
            ? (home2
                ? `홈 2 (${home2.name})`
                : "홈 2 ( 비어있음 )")
            : "홈 2 ( 잠김 )"
    ];

    const result = await new ModalFormData()
        
        .title("홈 저장")
        .label("§7플레이어는 <홈>으로 현재 위치를 저장하여 자유롭게 TP 할 수 있습니다.")
        .dropdown("저장 위치", options)
        .textField("홈 이름", "예: 집")
        .toggle("§c선택한 홈 삭제", {
            defaultValue: false
        })
        .submitButton("§a확인")
        .show(player);

    if (result.canceled) return;

    const [ , index, inputName, deleteHome] = result.formValues;

    // 홈2 잠금 확인
    if (index === 1 && !hasHome2) {
        player.sendMessage(
            "§c홈 2는 잠겨있습니다.\n§7티어를 올려 잠금을 해제하세요!"
        );
        return;
    }


    if (deleteHome) {

        const home = index === 0
            ? JSON.parse(player.getDynamicProperty("home1") ?? "null")
            : JSON.parse(player.getDynamicProperty("home2") ?? "null");

        if (!home) {
            player.sendMessage("§c삭제할 홈이 없습니다.");
            return;
        }

        const confirm = await new ActionFormData()
            .title("§c홈 삭제")
            .body(
                `\n정말 '${home.name}' 홈을 삭제하시겠습니까?\n\n§c삭제 후 복구할 수 없습니다.\n\n`
            )
            .button("§c삭제")
            .button("§7취소")
            .show(player);

        if (confirm.canceled || confirm.selection === 1) return;

        player.setDynamicProperty(index === 0 ? "home1" : "home2", undefined);

        player.sendMessage(`§a'${home.name}' 홈을 삭제했습니다.`);
        return;
    }

    const homeData = {
        name: inputName.trim() || `홈${index + 1}`,
        dimension: player.dimension.id,
        location: {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z)
        }
    };


    const currentHome = JSON.parse(
        player.getDynamicProperty(index === 0 ? "home1" : "home2") ?? "null"
    );

    if (currentHome) {
        const confirm = await new ActionFormData()
            .title("§6홈 덮어쓰기")
            .body(
                
                `\n현재 저장된 홈 : §a${currentHome.name}\n` +
                `§f새로운 홈 이름 : §e${homeData.name}\n\n` +
                `§f정말 §b홈 ${index + 1}§f에 덮어쓰시겠습니까?\n` +
                `§c(해당 작업은 되돌릴 수 없습니다.)\n\n\n`
                
            )
            .button("§a덮어쓰기")
            .button("§7취소")
            .show(player);

        if (confirm.canceled || confirm.selection === 1) {
            return;
        }
    }

   if (index === 0) {
    player.setDynamicProperty("home1", JSON.stringify(homeData));
        } else {
            player.setDynamicProperty("home2", JSON.stringify(homeData));
        }


    player.sendMessage(
        `§a${homeData.name}을(를) 홈${index + 1}에 저장했습니다.`
    );
}