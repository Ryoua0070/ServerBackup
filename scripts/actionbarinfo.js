import { world, system, EnchantmentTypes } from "@minecraft/server";
import { actionbarHidden } from "./clover.js";
import { getDragonPhase2Info } from "./endopen.js";






const MAX_MONEY = 99999999;
const MAX_GEM = 99999;

const TIER_ICON = {
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
};

function getScore(player, objective) {
    try {
        const obj = world.scoreboard.getObjective(objective);
        if (!obj) return 0;

        return obj.getScore(player.scoreboardIdentity) ?? 0;
    } catch {
        return 0;
    }
}

function limit(value, max) {
    return value > max ? `+${max}` : `${value}`;
}

function getTierIcon(tier) {
    return TIER_ICON[tier] ?? "◇";
}

function createGauge(percent) {

    percent = Math.max(0, Math.min(100, percent));

    const filled = Math.floor(percent / 10);

    let gauge = "";

    gauge += filled >= 1 ? "" : "";

    for (let i = 2; i <= 9; i++) {
        gauge += filled >= i ? "" : "";
    }

    gauge += percent >= 100 ? "" : "";

    return gauge;
}

function createDragonGauge(percent) {

    percent = Math.max(0, Math.min(100, percent));

    const filled = Math.floor(percent / 10);

    let gauge = "";

    gauge += filled >= 1 ? "" : "";

    for (let i = 2; i <= 9; i++) {
        gauge += filled >= i ? "" : "";
    }

    gauge += percent >= 100 ? "" : "";

    return gauge;
}

function createEndDragonUI() {

    const info = getDragonPhase2Info();

    if (!info) {
        return "§7드래곤이 격파 되었습니다.";
    }

    if (info.state === "shield") {

        const percent = info.shieldDurationTicks > 0
            ? (info.shieldTicksLeft / info.shieldDurationTicks) * 100
            : 0;

        const remainSec = Math.max(0, Math.ceil(info.shieldTicksLeft / 20));

        return `§b쉴드 §7: ${createDragonGauge(percent)} §f${remainSec}s`;
    }

    const hpPercent = info.hpRatio * 100;

    return `§c드래곤 체력 §7: ${createDragonGauge(hpPercent)} §f${hpPercent.toFixed(0)}%`;
}


function createBaseUI(player) {

    const tier = getScore(player, "Level");
    const money = formatMoney(getScore(player, "Money"), player.isSneaking);
    const gem = limit(getScore(player, "Gem"), MAX_GEM);

    return (
        `§f티어 §7: §7${getTierIcon(tier)} (${tier})` +
        `   §f §7: §a${money}` +
        `   §f §7: §b${gem}`
    );
}


function createGaugeUI(player) {

    const gauges = [];

    const miner = createMinerUI(player);
    if (miner)
        gauges.push(miner);


    return gauges;
}

function createMinerUI(player) {

    const level = getScore(player, "MinerLv");
    if (level < 2) return null;

    const item = player.getComponent("minecraft:equippable")
        ?.getEquipment("Mainhand");

    if (!item || !item.typeId.endsWith("_pickaxe"))
        return null;

    // 섬세한 손길 체크
    const enchantable = item.getComponent("minecraft:enchantable");

    try {
        if (enchantable?.hasEnchantment("silk_touch")) {

            const baseText = createBaseUI(player);
            const visibleLength = baseText.replace(/§./g, "").length;
            const space = " ".repeat(Math.max(0, Math.floor(visibleLength / 2) - 5));

            return `§c섬세한 손길은 게이지가 채워지지 않습니다.`;
        }
    } catch {}

    const mineCount = getScore(player, "MinerCount");
    const feverTimer = getScore(player, "MinerFeverTimer");

    const percent = feverTimer > 0 ? 100 : Math.min(100, mineCount);

    const baseText = createBaseUI(player);
    const visibleLength = baseText.replace(/§./g, "").length;
    const space = " ".repeat(Math.max(0, Math.floor(visibleLength / 2) - 5));

    return `${space}§6${createGauge(percent)} §7(${percent}%)`;
}



function addComma(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


function formatMoney(value, full = false) {

    if (full)
        return value > MAX_MONEY
            ? `${addComma(MAX_MONEY)}+`
            : addComma(value);

    if (value >= 100000000) {
        const n = (Math.floor(value / 10000000) / 10).toString().replace(".0", "");
        return `${n}억`;
    }

    if (value >= 10000) {
        const n = (Math.floor(value / 1000) / 10).toString().replace(".0", "");
        return `${n}만`;
    }

    return addComma(value);
}





system.runInterval(() => {

    for (const player of world.getPlayers()) {

        if (!player.hasTag("player"))
            continue;

        if (actionbarHidden.get(player.id)) {
            player.runCommand(
                `titleraw @s actionbar {"rawtext":[{"text":""}]}`
            );
            continue;
        }

        // ▼ 엔드에 있으면 드래곤 UI로 대체 ▼
        if (player.dimension.id === "minecraft:the_end") {

            const dragonUI = createEndDragonUI();

            player.runCommand(
                `titleraw @s actionbar {"rawtext":[{"text":"${dragonUI}"}]}`
            );

            continue;
        }
        // ▲ 여기까지 ▲

        const lines = [];

        if (player.hasTag("OP")) {
            lines.push("§7현재 OP 상태입니다. 원활한 게임 진행을 위해 tag를 삭제해주세요.");
        }

        lines.push(...createGaugeUI(player));
        lines.push(createBaseUI(player));

        player.runCommand(
            `titleraw @s actionbar {"rawtext":[{"text":"${lines.join("\n")}"}]}`
        );
    }

}, 1);