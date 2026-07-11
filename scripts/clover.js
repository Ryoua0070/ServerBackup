import { world , EffectTypes ,system } from "@minecraft/server";
import { ActionFormData , ModalFormData } from "@minecraft/server-ui";
import { showEtcMenu, tpaDisabled , showHomeSaveForm } from "./etc.js";
import { villageManager, showVillageMenu } from "./village.js";
import { showQuestMenu } from "./quest.js";
import { getDisplayName,getVillageName  } from "./namesystem.js";


const ignoreNextItemUse = new Set();
export const nightVisionSetting = new Map();



world.afterEvents.itemUse.subscribe((event) => {

    if (event.itemStack.typeId !== "pa:clover")
        return;

    if (ignoreNextItemUse.has(event.source.id)) {
        ignoreNextItemUse.delete(event.source.id);
        return;
    }

    showMainMenu(event.source);

});

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    if (ev.itemStack?.typeId !== "pa:clover") return;
    if (ev.target.typeId !== "minecraft:player") return;

        // 클로버 기본 사용 막기
        ev.cancel = true;

        // 다음 itemUse는 무시
        ignoreNextItemUse.add(ev.player.id);

    
        system.run(async () => {
        const target = ev.target;

        const nickname = getDisplayName(target);

        const objective = world.scoreboard.getObjective("Level");
        const level = objective?.getScore(target) ?? 0;

        const village = getVillageName(target);

        const form = new ActionFormData()
                .title("플레이어 정보")
                .body(
            ` \n §f닉네임 : §b${nickname} §7(@${target.name})

 §f티어 : §b${level}

 §f마을 : §b${village}\n\n`
                )
                .button("송금하기","textures/formicon/Icons_01.png")
                .button("닫기");

            const result = await form.show(ev.player);

            if (result.canceled) return;

            switch (result.selection) {
                case 0:
                    showMoneyTransferForm(ev.player, target);
                    break;
            }
    });
});

async function showMoneyTransferForm(sender, target) {

    if (moneyDisabled.get(target.id)) {
        sender.sendMessage("§c해당 플레이어는 송금을 받지 않습니다.");
        return;
    }

    const form = new ModalFormData()
        .title("송금")
        .textField(
            `
§e${getDisplayName(target)}§f님에게 보낼 금액
            
            `,
            "1000"
        );

    const result = await form.show(sender);

    if (result.canceled) return;

    const amount = Number(result.formValues[0]);

    if (!Number.isInteger(amount) || amount <= 0) {
        sender.sendMessage("§c올바른 금액을 입력하세요.");
        return;
    }

    const objective = world.scoreboard.getObjective("Money");

    if (!objective) {
        sender.sendMessage("§cMoney 스코어보드가 없습니다.");
        return;
    }

    const myMoney = objective.getScore(sender) ?? 0;

    if (myMoney < amount) {
        sender.sendMessage("§c돈이 부족합니다.");
        return;
    }

    objective.setScore(sender, myMoney - amount);
    objective.setScore(target, (objective.getScore(target) ?? 0) + amount);

    sender.sendMessage(
        `§a${getDisplayName(target)}님에게 ${amount.toLocaleString()}원을 송금했습니다.`
    );

    target.sendMessage(
        `§a${getDisplayName(sender)}님에게 ${amount.toLocaleString()}원을 송금받았습니다.`
    );

    target.playSound("notification");
}

export async function showMainMenu(player) {

    const form = new ActionFormData()
        .title("  ")
        .body("\n");

    form.button("텔레포트","textures/formicon/Icons_03.png");
    form.button("퀘스트","textures/formicon/Icons_29.png");
    form.button("마을","textures/formicon/Icons_02.png");
    form.button("설정","textures/formicon/Icons_34.png");
    form.button("기타","textures/formicon/Icons_11.png");

    const result = await form.show(player);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:
            showTpMenu(player);
            break;

        case 1:
            showQuestMenu(player);
            break;

        case 2:
            showVillageMenu(player);
            break;

        case 3:
            return showSettingMenu(player);
            break;

        case 4:
            showEtcMenu(player);
            break;
    }
}





export const moneyDisabled = new Map();
export const actionbarHidden = new Map();

async function showSettingMenu(player) {



    const hasNightVision =
    nightVisionSetting.get(player.id) ?? true;

    const hideActionbarDefault =
    actionbarHidden.get(player.id) ?? false;

    const form = new ModalFormData()
        .title("설정")
        .label("\n           §7 설정을 변경하고 저장하세요. \n-----------------------------------------\n")
        .toggle("§7============================= §f야간투시", {
            defaultValue: hasNightVision
        })
        .toggle("§7============================= §f배경음악", {
            defaultValue: true
        })
        .toggle("§7====================== §fTP 요청 받지않기", {
            defaultValue: tpaDisabled.get(player.id) ?? false
        })
        .toggle("§7======================== §f송금 받지않기", {
            defaultValue: moneyDisabled.get(player.id) ?? false
        })
        .toggle("§7================= §f화면 하단 정보 숨기기", {
            defaultValue: hideActionbarDefault
        })
        
        .submitButton("적용");

   const result = await form.show(player);

        if (result.canceled) {
            return showMainMenu(player);
        }

       const [, nightVision, bgm, noTpa, noMoney, hideActionbar] = result.formValues;

            const oldNoTpa = tpaDisabled.get(player.id) ?? false;
             const oldNoMoney = moneyDisabled.get(player.id) ?? false;
             const oldHideActionbar = actionbarHidden.get(player.id) ?? false;

            nightVisionSetting.set(player.id, nightVision);
            tpaDisabled.set(player.id, noTpa);
            moneyDisabled.set(player.id, noMoney);
            actionbarHidden.set(player.id, hideActionbar);

            if (nightVision) {
                player.runCommand("effect @s night_vision infinite 0 true");
            } else {
                player.runCommand("effect @s clear night_vision");
            }

            if (!oldNoTpa && noTpa) {
                player.sendMessage("§aTP 요청 받지않기가 활성화되었습니다.");
            } else if (oldNoTpa && !noTpa) {
                player.sendMessage("§7TP 요청을 다시 받을 수 있습니다.");
            }

            if (!oldNoMoney && noMoney) {
                player.sendMessage("§a송금을 받지 않도록 설정되었습니다.");
            } else if (oldNoMoney && !noMoney) {
                player.sendMessage("§7다시 송금을 받을 수 있습니다.");
            }
            if (!oldHideActionbar && hideActionbar) {
                player.sendMessage("§7액션바 UI가 숨겨졌습니다.");
            } else if (oldHideActionbar && !hideActionbar) {
                player.sendMessage("§7액션바 UI를 다시 표시합니다.");
            };
}

system.runInterval(() => {

    for (const player of world.getPlayers()) {

        if (!(nightVisionSetting.get(player.id) ?? true))
            continue;

        const hasNightVision = player.getEffects()
            .some(effect => effect.typeId === "minecraft:night_vision");

        if (hasNightVision)
            continue;

        try {
            player.addEffect("night_vision", 999999, {
                amplifier: 0,
                showParticles: false
            });
        } catch {}

    }

}, 20); // 5초마다










async function showTpMenu(player) {

    const hasHome2 = player.hasTag("sethome2");

    const home1 = JSON.parse(player.getDynamicProperty("home1") ?? "null");
    const home2 = JSON.parse(player.getDynamicProperty("home2") ?? "null");

    const form = new ActionFormData()
        .title("순간이동")
        .body("§f이동할 위치를 선택하세요.");

    const actions = [];

    // 광장
    form.button("광장", "textures/formicon/Icons_");
    actions.push("spawn");

    // 홈1 (저장되어 있을 때만)
    if (home1) {
        form.button(`${home1.name}\n§7( 저장됨 )`, "textures/formicon/Icons_41");
        actions.push("home1");
    }

    // 홈2 (잠금 해제 + 저장되어 있을 때만)
    if (hasHome2 && home2) {
        form.button(`${home2.name}\n§7( 저장됨 )`, "textures/formicon/Icons_41");
        actions.push("home2");
    }

    // 뒤로
    form.button("⬅ 뒤로");
    actions.push("back");

    const result = await form.show(player);

    if (result.canceled) return;

    switch (actions[result.selection]) {

        case "spawn":
            player.teleport(
                { x: 0, y: 180, z: 0 },
                {
                    dimension: world.getDimension("overworld")
                }
            );
            break;

        case "home1":
            player.teleport(home1.location, {
                dimension: world.getDimension(home1.dimension)
            });
            player.sendMessage(`§a'${home1.name}'(으)로 이동했습니다.`);
            break;

        case "home2":
            player.teleport(home2.location, {
                dimension: world.getDimension(home2.dimension)
            });
            player.sendMessage(`§a'${home2.name}'(으)로 이동했습니다.`);
            break;

        case "back":
            showMainMenu(player);
            break;
    }
}


