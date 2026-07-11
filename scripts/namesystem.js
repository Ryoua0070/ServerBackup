import { world, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { villageManager } from "./village";






export function getItemDisplayName(item) {

    if (item.nameTag) {
        return item.nameTag;
    }

    return item.typeId
        .replace("minecraft:", "")
        .split("_")
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(" ");
}




const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;

const BANNED_WORDS = [
    // 권한 관련
    "관리자",
    "운영자",
    "admin",
    "administrator",
    "op",
    "gm",
    "staff",
    "owner",

    // 욕설 (예시)
    "시발",
    "씨발",
    "ㅅㅂ",
    "병신",
    "븅신",
    "ㅂㅅ",
    "좆",
    "존나",
    "개새끼",
    "새끼",
    "지랄",
    "애미",
    "애비",
    "느금",
    "니애미",
    "니애비",
    "씹",
    "ㅄ"
];











world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    if (!item) return;

    if (item.typeId !== "minecraft:stick") return;

    showNicknameForm(player);
});



export function getVillageName(player) {

    if (!villageManager)
        return "무소속";

    const village = villageManager.get(player);

    if (!village)
        return "무소속";

    return village.name;

}

function getNicknameList() {
    return JSON.parse(
        world.getDynamicProperty("nicknames") ?? "{}"
    );
}

function saveNicknameList(list) {
    world.setDynamicProperty(
        "nicknames",
        JSON.stringify(list)
    );
}

function isNicknameTaken(nickname) {
    const list = getNicknameList();
    return list[nickname.toLowerCase()] === true;
}

function getTierIcon(level) {
    switch (level) {
        case 1: return "";
        case 2: return "";
        case 3: return "";
        case 4: return "";
        case 5: return "";
        case 6: return "";
        case 7: return "";
        default: return "";
    }
}

const openingPlayers = new Set();



/**
 * 플레이어의 NameTag를 갱신합니다.
 * @param {import("@minecraft/server").Player} player
 */
function updateNameTag(player) {
    // 임시 데이터
    const town = getVillageName(player);

    const objective = world.scoreboard.getObjective("Level");
    const level = objective?.getScore(player) ?? 0;
    const tier = getTierIcon(level);

    player.nameTag =
    `§b[${town}]
   ${tier} §f${getDisplayName(player)}  `;


}

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        updateNameTag(player);
    }
}, 20); // 20틱 = 1초


export function getDisplayName(player) {
    return player.getDynamicProperty("nickname") ?? player.name;
}


function escapePercent(str) {
    return String(str).replace(/%/g, "%%");
}

world.afterEvents.playerSpawn.subscribe((event) => {

    if (!event.initialSpawn) return;

    const player = event.player;

    system.runTimeout(() => {

        if (!player.getDynamicProperty("nickname")) {
            showNicknameForm(player);
        }

    }, 40); // 2초 후

});





export async function showNicknameForm(player) {

    if (openingPlayers.has(player.id)) return;

    openingPlayers.add(player.id);

    try {

        while (true) {

            const form = new ModalFormData()
                .title("닉네임 생성")
                .textField(" \n\n 환영합니다. 서버에서 사용할 닉네임을 입력하세요. \n §7( 2-10글자 / 한글,영어,숫자만 사용가능 )\n\n ", "예: 바보");

            let result;

            try {
                result = await form.show(player);
            } catch (e) {

                // 다른 UI를 열고 있는 경우 잠시 후 다시 시도
                if (String(e).includes("UserBusy")) {
                    await new Promise(resolve => system.runTimeout(resolve, 20));
                    continue;
                }

                throw e;
            }

            if (result.canceled) {
                player.sendMessage("§c닉네임을 설정해야 게임을 시작할 수 있습니다.");
                continue;
            }

            const nickname = result.formValues[0].trim();

            // 허용 문자 검사
            if (!NICKNAME_REGEX.test(nickname)) {
                player.sendMessage(
                    "§c닉네임은 한글, 영문, 숫자만 사용할 수 있습니다."
                );
                continue;
            }

            // 금칙어 검사
            const lower = nickname.toLowerCase();

            if (
                BANNED_WORDS.some(word =>
                    lower.includes(word.toLowerCase())
                )
            ) {
                player.sendMessage(
                    "§c사용할 수 없는 닉네임입니다."
                );
                continue;
            }

            if (nickname.length < 2) {
                player.sendMessage("§c닉네임은 2글자 이상이어야 합니다.");
                continue;
            }

            if (nickname.length > 10) {
                player.sendMessage("§c닉네임은 최대 10글자입니다.");
                continue;
            }

            if (nickname.includes("§") || nickname.includes("\n") || nickname.includes("\r")) {
                player.sendMessage("§c사용할 수 없는 문자가 포함되어 있습니다.");
                continue;
            }

            if (isNicknameTaken(nickname)) {
                player.sendMessage("§c이미 사용 중인 닉네임입니다.");
                continue;
            }

            const oldNickname = player.getDynamicProperty("nickname");

                if (oldNickname) {
                    const list = getNicknameList();
                    delete list[oldNickname.toLowerCase()];
                    saveNicknameList(list);
                }

                const list = getNicknameList();
                list[nickname.toLowerCase()] = true;
                saveNicknameList(list);

                player.setDynamicProperty("nickname", nickname);

                console.warn("SET:", player.getDynamicProperty("nickname"));
                console.warn("LIST:", JSON.stringify(getNicknameList()));

                updateNameTag(player);

                // ===== 오프닝 완료 처리 =====

                // 앞으로는 오프닝을 다시 실행하지 않음
                player.addTag("player");

                // 카메라 원상복구
                player.runCommand("camera @s clear");

                // 오버월드 이동
                player.teleport(
                    { x: 0, y: 180, z: 0 },
                    {
                        dimension: world.getDimension("minecraft:overworld")
                    }
                );

                player.sendMessage("§a닉네임이 설정되었습니다.");

                return;
        }

    } finally {

        openingPlayers.delete(player.id);

    }
}

export async function showChangeNicknameForm(player) {

    const objective = world.scoreboard.getObjective("Gem");

    if (!objective) {
        player.sendMessage("§cGem 스코어보드가 없습니다.");
        return;
    }

    const gem = objective.getScore(player) ?? 0;

    if (gem < 100) {
        player.sendMessage("§c닉네임 변경에는 Gem 100개가 필요합니다.");
        return;
    }

    while (true) {

        const form = new ModalFormData()
            .title("닉네임 변경")
            .textField(
                "\n\n §f새 닉네임을 입력하세요.\n\n §7( 비용 : 100 ) ( 한글/영문/숫자 ) \n\n\n\n\n",
                "예: 바보"
            );

        let result;

        try {
            result = await form.show(player);
        } catch (e) {

            if (String(e).includes("UserBusy")) {
                await new Promise(resolve => system.runTimeout(resolve, 20));
                continue;
            }

            throw e;
        }

        if (result.canceled)
            return;

        const nickname = result.formValues[0].trim();

        if (!NICKNAME_REGEX.test(nickname)) {
            player.sendMessage("§c닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.");
            continue;
        }

        const lower = nickname.toLowerCase();

        if (BANNED_WORDS.some(word =>
            lower.includes(word.toLowerCase())
        )) {
            player.sendMessage("§c사용할 수 없는 닉네임입니다.");
            continue;
        }

        if (
            nickname.includes("§") ||
            nickname.includes("\n") ||
            nickname.includes("\r")
        ) {
            player.sendMessage("§c사용할 수 없는 문자가 포함되어 있습니다.");
            continue;
        }

        if (isNicknameTaken(nickname)) {
            player.sendMessage("§c이미 사용 중인 닉네임입니다.");
            continue;
        }

        // Gem 차감
        objective.setScore(player, gem - 100);

        // 기존 닉네임 제거
        const oldNickname = player.getDynamicProperty("nickname");

        if (oldNickname) {
            const list = getNicknameList();
            delete list[oldNickname.toLowerCase()];
            saveNicknameList(list);
        }

        // 새 닉네임 등록
        const list = getNicknameList();
        list[nickname.toLowerCase()] = true;
        saveNicknameList(list);

        player.setDynamicProperty("nickname", nickname);

        updateNameTag(player);

        player.sendMessage(
            `§a닉네임이 '${nickname}'(으)로 변경되었습니다.\n§7Gem -100`
        );

        return;
    }
}

world.beforeEvents.chatSend.subscribe((event) => {

    const player = event.sender;
    const message = event.message.trim();

    // 오프닝이 끝나지 않은 플레이어는 채팅 차단
    if (!player.hasTag("player")) {
        event.cancel = true;
        return;
    }

    // !명령어인 경우
    if (message.startsWith("!")) {

        // NameSystem 명령이면 취소
        if (handleCommand(player, message)) {
            event.cancel = true;
        }

        return;
    }

    // 일반 채팅은 NameSystem에서 처리
    event.cancel = true;
    sendChat(player, message);

});

function sendChat(player, message) {

    const objective = world.scoreboard.getObjective("Level");
    const level = objective?.getScore(player) ?? 0;

    const tier = getTierIcon(level);
    const name = getDisplayName(player);

    world.sendMessage(
        `${tier} §f${name} : §7${escapePercent(message)}`
    );

}

function handleCommand(player, message) {

    switch (message.toLowerCase()) {

        case "!닉네임초기화": {

            world.setDynamicProperty("nicknames", "{}");

            for (const target of world.getPlayers()) {
                target.setDynamicProperty("nickname", "");
                target.sendMessage("§e닉네임이 초기화되었습니다.");
            }

            player.sendMessage("§a모든 플레이어의 닉네임을 초기화했습니다.");
            return true;
        }

        case "!닉목록": {

            console.warn(JSON.stringify(getNicknameList()));
            player.sendMessage("§a콘솔을 확인하세요.");
            return true;
        }

        case "!닉초기화전체": {

            world.setDynamicProperty("nicknames", "{}");
            player.sendMessage("§a닉네임 목록 초기화 완료");
            return true;
        }

        default:
            return false; // NameSystem이 처리하지 않는 명령
    }

}