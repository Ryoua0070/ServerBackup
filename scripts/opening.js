import { world, system, GameMode } from "@minecraft/server";
import { showNicknameForm } from "./namesystem";


const WAIT_INPUT = 0;
const INTRO = 1;
const FORM = 2;

// 텔레포트 직후 이 틱 수만큼은 이동 감지를 무시 (grace period, 안전장치)
const GRACE_TICKS = 5;

// 방향키/스틱 입력 크기가 이 값 이상이면 "실제 입력"으로 판단 (0~1 범위)
const INPUT_THRESHOLD = 0.1;

const openingPlayers = new Map();

/*
{
    state,
    graceUntil
}
*/

function startOpening(player) {

    try {
        player.runCommand("camera @s clear");
    } catch {}

    // 인트로 도중 초기화될 경우를 대비해 spectator였다면 복구
    try {
        player.setGameMode(GameMode.Survival);
    } catch (e) {
        console.warn(e);
    }

    // 이동 입력 비활성화
    try {
        player.runCommand("inputpermission set @s movement disabled");
    } catch {}

    try {
        player.runCommand("hud @s hide all");
    } catch {}

    // 투명화 (사실상 무제한 지속시간, 인트로 종료 시 removeEffect로 명시적으로 해제됨)
    try {
        player.addEffect("invisibility", 999999, {
            amplifier: 1,
            showParticles: false
        });
    } catch (e) {
        console.warn(e);
    }

    player.teleport(
        {
            x: 1000,
            y: 100,
            z: 1000
        },
        {
            dimension: world.getDimension("custom:lobby")
        }
    );

    openingPlayers.set(player.id, {
        state: WAIT_INPUT,
        // 텔레포트 자체가 "움직임"으로 오인되지 않도록 유예 틱 설정
        graceUntil: system.currentTick + GRACE_TICKS
    });
}

world.afterEvents.playerSpawn.subscribe((ev) => {

    const player = ev.player;

    if (player.hasTag("player"))
        return;

    // 이미 오프닝이 진행 중이면 중복 실행하지 않음
    // (죽었다가 리스폰되는 등으로 playerSpawn이 다시 불릴 수 있음)
    if (openingPlayers.has(player.id))
        return;

    startOpening(player);

});

world.afterEvents.playerLeave.subscribe((ev) => {

    openingPlayers.delete(ev.playerId);

});



system.runInterval(() => {

    for (const player of world.getPlayers()) {

        const data = openingPlayers.get(player.id);

        if (!data) continue;

        if (data.state !== WAIT_INPUT)
            continue;

        player.onScreenDisplay.setActionBar(
            "아무 방향키를 눌러 게임을 시작"
        );

        // 유예 시간 동안에는 검사하지 않는다 (안전장치)
        if (system.currentTick < data.graceUntil) {
            continue;
        }

        // 실제 방향키/스틱 입력을 직접 읽는다.
        // inputpermission으로 이동이 막혀 있어도 원시 입력값은 읽을 수 있어서
        // 낙하 등 물리적 좌표 변화와 무관하게 "진짜 키 입력"만 감지한다.
        let moveVec;

        try {
            moveVec = player.inputInfo.getMovementVector();
        } catch {
            continue;
        }

        const magSq = moveVec.x * moveVec.x + moveVec.y * moveVec.y;

        if (magSq < INPUT_THRESHOLD * INPUT_THRESHOLD)
            continue;

        data.state = INTRO;

        beginIntro(player);

    }

}, 1);


function beginIntro(player) {

    

    // 연출 중 낙하/충돌 방지를 위해 spectator로 전환 (중력 없음)
    try {
        player.setGameMode(GameMode.Spectator);
    } catch (e) {
        console.warn(e);
    }

    try {
        player.runCommand("camera @s fade time 0 2 1 color 0 0 0");
    } catch (e) {
        console.warn(e);
    }

    // 2초 후 텔레포트 및 카메라 설정
    system.runTimeout(() => {

       

        if (!openingPlayers.has(player.id))
            return;

        const data = openingPlayers.get(player.id);

        if (!data || data.state !== INTRO)
            return;

        player.teleport(
            {
                x: 1050,
                y: 100,
                z: 1050
            },
            {
                dimension: world.getDimension("custom:lobby")
            }
        );

        try {

            player.runCommand(
                "camera @s set minecraft:free pos 1050 100 1050 facing 1060 100 1060"
            );

        } catch (e) {
            console.warn(e);
        }

        data.state = FORM;

        // 카메라 연출 유지 후 닉네임 폼
        system.runTimeout(async () => {

            

            const current = openingPlayers.get(player.id);

            if (!current || current.state !== FORM)
                return;

            try {

                await showNicknameForm(player);

                if (!player.isValid)
                    return;

                if (!openingPlayers.has(player.id))
                    return;

                player.addTag("player");

                try {
                    player.runCommand("camera @s clear");
                } catch {}

                // 투명 해제 (걸려있는 모든 이펙트를 스크립트 API로 직접 제거)
                try {
                    for (const effect of player.getEffects()) {
                        player.removeEffect(effect.typeId);
                    }
                } catch (e) {
                    console.warn(e);
                }

                try {
                    player.runCommand("loot give @s mine 1000 104 1000");
                } catch {}

                try {
                    player.runCommand("hud @s reset all");
                } catch {}

                
                try {
                    player.runCommand("inputpermission set @s movement enabled");
                } catch {}

                // spectator 해제, 원래 게임모드로 복구
                // (서버 기본 게임모드가 survival이 아니라면 GameMode.Survival을 바꿔주세요)
                try {
                    player.setGameMode(GameMode.Survival);
                } catch (e) {
                    console.warn(e);
                }

                player.teleport(
                    {
                        x: 0,
                        y: 180,
                        z: 0
                    },
                    {
                        dimension: world.getDimension("minecraft:overworld")
                    }
                );

                openingPlayers.delete(player.id);

            } catch (e) {

                console.warn(e);

            }

        }, 200); // 5초

    }, 40); // 2초
}



world.beforeEvents.chatSend.subscribe((event) => {

    const { sender, message } = event;

    if (message !== "!오프닝초기화")
        return;

    event.cancel = true;

    system.run(() => {

        sender.removeTag("player");

        openingPlayers.delete(sender.id);

        startOpening(sender);

        sender.sendMessage("§a오프닝이 초기화되었습니다.");

    });

});