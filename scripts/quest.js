import { world , system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { showMainMenu } from "./clover.js";

const placedLogs = new Set();


// ====================
// 성급별 보상
// ====================

const STAR_REWARD = {

    1: {
        Money: 2000,
        Gem: 5,
        Ticket: 1
    },

    2: {
        Money: 3000,
        Gem: 10,
        Ticket: 2
    },

    3: {
        Money: 7000,
        Gem: 40,
        Ticket: 5
    }

};


// ====================
// 레벨별 등장 확률
// ====================

const LEVEL_RATE = {

    1: [90, 10, 0],

    2: [70, 25, 5],
    3: [70, 25, 5],

    4: [50, 30, 20],
    5: [50, 30, 20],

    6: [20, 45, 35],

    7: [10, 45, 45]

};


// ====================
// 퀘스트 카테고리
// ====================
const QUEST_CATEGORY = [
    "monster",
    "farm",
    "animal",
    "mining",
    "move",
    "eat",
    "wood"
];

// ====================
// 퀘스트 풀
// ====================

const QUEST_POOL = [


    // ====================
    // 몬스터
    // ====================

    {
        id: "monster_1",
        category: "monster",
        star: 1,
        goal: 10,

        title: "몬스터 10마리 처치",
        description: "몬스터를 10마리 처치하세요."
    },

    {
        id: "monster_2",
        category: "monster",
        star: 2,
        goal: 25,

        title: "몬스터 25마리 처치",
        description: "몬스터를 25마리 처치하세요."
    },

    {
        id: "monster_3",
        category: "monster",
        star: 3,
        goal: 40,

        title: "몬스터 40마리 처치",
        description: "몬스터를 40마리 처치하세요."
    },

    // ====================
    // 농사 - 밀
    // ====================

    {
        id: "wheat_1",
        category: "farm",
        block: "minecraft:wheat",
        star: 1,
        goal: 20,

        title: "밀 20개 수확",
        description: "밀을 20개 수확하세요."
    },

    {
        id: "wheat_2",
        category: "farm",
        block: "minecraft:wheat",
        star: 2,
        goal: 40,

        title: "밀 40개 수확",
        description: "밀을 40개 수확하세요."
    },

    {
        id: "wheat_3",
        category: "farm",
        block: "minecraft:wheat",
        star: 3,
        goal: 64,

        title: "밀 64개 수확",
        description: "밀을 64개 수확하세요."
    },

    // ====================
    // 농사 - 당근
    // ====================

    {
        id: "carrot_1",
        category: "farm",
        block: "minecraft:carrots",
        star: 1,
        goal: 20,

        title: "당근 20개 수확",
        description: "당근을 20개 수확하세요."
    },

    {
        id: "carrot_2",
        category: "farm",
        block: "minecraft:carrots",
        star: 2,
        goal: 40,

        title: "당근 40개 수확",
        description: "당근을 40개 수확하세요."
    },

    {
        id: "carrot_3",
        category: "farm",
        block: "minecraft:carrots",
        star: 3,
        goal: 64,

        title: "당근 64개 수확",
        description: "당근을 64개 수확하세요."
    },

    // ====================
    // 농사 - 감자
    // ====================

    {
        id: "potato_1",
        category: "farm",
        block: "minecraft:potatoes",
        star: 1,
        goal: 20,

        title: "감자 20개 수확",
        description: "감자를 20개 수확하세요."
    },

    {
        id: "potato_2",
        category: "farm",
        block: "minecraft:potatoes",
        star: 2,
        goal: 40,

        title: "감자 40개 수확",
        description: "감자를 40개 수확하세요."
    },

    {
        id: "potato_3",
        category: "farm",
        block: "minecraft:potatoes",
        star: 3,
        goal: 64,

        title: "감자 64개 수확",
        description: "감자를 64개 수확하세요."
    },

    // ====================
    // 농사 - 비트
    // ====================

    {
        id: "beetroot_1",
        category: "farm",
        block: "minecraft:beetroot",
        star: 1,
        goal: 20,

        title: "비트 20개 수확",
        description: "비트를 20개 수확하세요."
    },

    {
        id: "beetroot_2",
        category: "farm",
        block: "minecraft:beetroot",
        star: 2,
        goal: 40,

        title: "비트 40개 수확",
        description: "비트를 40개 수확하세요."
    },

    {
        id: "beetroot_3",
        category: "farm",
        block: "minecraft:beetroot",
        star: 3,
        goal: 64,

        title: "비트 64개 수확",
        description: "비트를 64개 수확하세요."
    },


    // ====================
    // 동물 - 돼지
    // ====================

    {
        id: "pig_1",
        category: "animal",
        entity: "minecraft:pig",
        star: 1,
        goal: 5,

        title: "돼지 5마리 처치",
        description: "돼지를 5마리 처치하세요."
    },

    {
        id: "pig_2",
        category: "animal",
        entity: "minecraft:pig",
        star: 2,
        goal: 7,

        title: "돼지 7마리 처치",
        description: "돼지를 7마리 처치하세요."
    },

    {
        id: "pig_3",
        category: "animal",
        entity: "minecraft:pig",
        star: 3,
        goal: 10,

        title: "돼지 10마리 처치",
        description: "돼지를 10마리 처치하세요."
    },

    // ====================
    // 동물 - 양
    // ====================

    {
        id: "sheep_1",
        category: "animal",
        entity: "minecraft:sheep",
        star: 1,
        goal: 5,

        title: "양 5마리 처치",
        description: "양을 5마리 처치하세요."
    },

    {
        id: "sheep_2",
        category: "animal",
        entity: "minecraft:sheep",
        star: 2,
        goal: 7,

        title: "양 7마리 처치",
        description: "양을 7마리 처치하세요."
    },

    {
        id: "sheep_3",
        category: "animal",
        entity: "minecraft:sheep",
        star: 3,
        goal: 10,

        title: "양 10마리 처치",
        description: "양을 10마리 처치하세요."
    },

    // ====================
    // 동물 - 소
    // ====================

    {
        id: "cow_1",
        category: "animal",
        entity: "minecraft:cow",
        star: 1,
        goal: 5,

        title: "소 5마리 처치",
        description: "소를 5마리 처치하세요."
    },

    {
        id: "cow_2",
        category: "animal",
        entity: "minecraft:cow",
        star: 2,
        goal: 7,

        title: "소 7마리 처치",
        description: "소를 7마리 처치하세요."
    },

    {
        id: "cow_3",
        category: "animal",
        entity: "minecraft:cow",
        star: 3,
        goal: 10,

        title: "소 10마리 처치",
        description: "소를 10마리 처치하세요."
    },

    // ====================
    // 동물 - 닭
    // ====================

    {
        id: "chicken_1",
        category: "animal",
        entity: "minecraft:chicken",
        star: 1,
        goal: 5,

        title: "닭 5마리 처치",
        description: "닭을 5마리 처치하세요."
    },

    {
        id: "chicken_2",
        category: "animal",
        entity: "minecraft:chicken",
        star: 2,
        goal: 7,

        title: "닭 7마리 처치",
        description: "닭을 7마리 처치하세요."
    },

    {
        id: "chicken_3",
        category: "animal",
        entity: "minecraft:chicken",
        star: 3,
        goal: 10,

        title: "닭 10마리 처치",
        description: "닭을 10마리 처치하세요."
    },



    // ====================
    // 광질 - 석탄
    // ====================

    {
        id: "coal_1",
        category: "mining",
        blocks: [
            "minecraft:coal_ore",
            "minecraft:deepslate_coal_ore"
        ],
        star: 1,
        goal: 10,

        title: "석탄 10개 채굴",
        description: "석탄 광석을 10개 채굴하세요.\n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "coal_2",
        category: "mining",
        blocks: [
            "minecraft:coal_ore",
            "minecraft:deepslate_coal_ore"
        ],
        star: 2,
        goal: 20,

        title: "석탄 20개 채굴",
        description: "석탄 광석을 20개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "coal_3",
        category: "mining",
        blocks: [
            "minecraft:coal_ore",
            "minecraft:deepslate_coal_ore"
        ],
        star: 3,
        goal: 30,

        title: "석탄 30개 채굴",
        description: "석탄 광석을 30개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 구리
    // ====================

    {
        id: "copper_1",
        category: "mining",
        blocks: [
            "minecraft:copper_ore",
            "minecraft:deepslate_copper_ore"
        ],
        star: 1,
        goal: 15,

        title: "구리 15개 채굴",
        description: "구리 광석을 15개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "copper_2",
        category: "mining",
        blocks: [
            "minecraft:copper_ore",
            "minecraft:deepslate_copper_ore"
        ],
        star: 2,
        goal: 25,

        title: "구리 25개 채굴",
        description: "구리 광석을 25개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "copper_3",
        category: "mining",
        blocks: [
            "minecraft:copper_ore",
            "minecraft:deepslate_copper_ore"
        ],
        star: 3,
        goal: 35,

        title: "구리 35개 채굴",
        description: "구리 광석을 35개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 철
    // ====================

    {
        id: "iron_1",
        category: "mining",
        blocks: [
            "minecraft:iron_ore",
            "minecraft:deepslate_iron_ore"
        ],
        star: 1,
        goal: 5,

        title: "철 5개 채굴",
        description: "철 광석을 5개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "iron_2",
        category: "mining",
        blocks: [
            "minecraft:iron_ore",
            "minecraft:deepslate_iron_ore"
        ],
        star: 2,
        goal: 10,

        title: "철 10개 채굴",
        description: "철 광석을 10개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "iron_3",
        category: "mining",
        blocks: [
            "minecraft:iron_ore",
            "minecraft:deepslate_iron_ore"
        ],
        star: 3,
        goal: 20,

        title: "철 20개 채굴",
        description: "철 광석을 20개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 청금석
    // ====================

    {
        id: "lapis_1",
        category: "mining",
        blocks: [
            "minecraft:lapis_ore",
            "minecraft:deepslate_lapis_ore"
        ],
        star: 1,
        goal: 5,

        title: "청금석 5개 채굴",
        description: "청금석 광석을 5개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "lapis_2",
        category: "mining",
        blocks: [
            "minecraft:lapis_ore",
            "minecraft:deepslate_lapis_ore"
        ],
        star: 2,
        goal: 15,

        title: "청금석 15개 채굴",
        description: "청금석 광석을 15개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "lapis_3",
        category: "mining",
        blocks: [
            "minecraft:lapis_ore",
            "minecraft:deepslate_lapis_ore"
        ],
        star: 3,
        goal: 32,

        title: "청금석 32개 채굴",
        description: "청금석 광석을 32개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 레드스톤
    // ====================

    {
        id: "redstone_1",
        category: "mining",
        blocks: [
            "minecraft:redstone_ore",
            "minecraft:deepslate_redstone_ore"
        ],
        star: 1,
        goal: 10,

        title: "레드스톤 10개 채굴",
        description: "레드스톤 광석을 10개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "redstone_2",
        category: "mining",
        blocks: [
            "minecraft:redstone_ore",
            "minecraft:deepslate_redstone_ore"
        ],
        star: 2,
        goal: 15,

        title: "레드스톤 15개 채굴",
        description: "레드스톤 광석을 15개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "redstone_3",
        category: "mining",
        blocks: [
            "minecraft:redstone_ore",
            "minecraft:deepslate_redstone_ore"
        ],
        star: 3,
        goal: 20,

        title: "레드스톤 20개 채굴",
        description: "레드스톤 광석을 20개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 금
    // ====================

    {
        id: "gold_1",
        category: "mining",
        blocks: [
            "minecraft:gold_ore",
            "minecraft:deepslate_gold_ore"
        ],
        star: 1,
        goal: 5,

        title: "금 5개 채굴",
        description: "금 광석을 5개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "gold_2",
        category: "mining",
        blocks: [
            "minecraft:gold_ore",
            "minecraft:deepslate_gold_ore"
        ],
        star: 2,
        goal: 7,

        title: "금 7개 채굴",
        description: "금 광석을 7개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    {
        id: "gold_3",
        category: "mining",
        blocks: [
            "minecraft:gold_ore",
            "minecraft:deepslate_gold_ore"
        ],
        star: 3,
        goal: 10,

        title: "금 10개 채굴",
        description: "금 광석을 10개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다.§f"
    },

    // ====================
    // 광질 - 다이아몬드
    // ====================

    {
        id: "diamond_3",
        category: "mining",
        blocks: [
            "minecraft:diamond_ore",
            "minecraft:deepslate_diamond_ore"
        ],
        star: 3,
        goal: 5,

        title: "다이아몬드 5개 채굴",
        description: "다이아몬드 광석을 5개 채굴하세요. \n §c※섬세한 손길은 카운트되지 않습니다. §f"
    },



    // ====================
    // 이동
    // ====================

    {
        id: "move_1",
        category: "move",
        star: 1,
        goal: 500,

        title: "500블록 이동",
        description: "총 500블록 이동하세요."
    },

    {
        id: "move_2",
        category: "move",
        star: 2,
        goal: 1000,

        title: "1000블록 이동",
        description: "총 1000블록 이동하세요."
    },

    {
        id: "move_3",
        category: "move",
        star: 3,
        goal: 2000,

        title: "2000블록 이동",
        description: "총 2000블록 이동하세요."
    },

    

    // ====================
    // 나무 베기
    // ====================
            {
            id: "log_1",
            category: "wood",
            goal: 64,
            star: 1,

            title: "나무 64개 베기",
            description: "원목을 64개 채집하세요."
        },
        {
            id: "log_2",
            category: "wood",
            goal: 128,
            star: 2,

            title: "나무 128개 베기",
            description: "원목을 128개 채집하세요."
        },
        {
            id: "log_3",
            category: "wood",
            goal: 200,
            star: 3,

            title: "나무 200개 베기",
            description: "원목을 200개 채집하세요."
        },


    // ====================
    // 음식
    // ====================

    {
        id: "eat_1",
        category: "eat",
        star: 1,
        goal: 3,

        title: "음식 3개 섭취",
        description: "음식을 3개 섭취하세요."
    },

    {
        id: "eat_2",
        category: "eat",
        star: 2,
        goal: 13,

        title: "음식 13개 섭취",
        description: "음식을 13개 섭취하세요."
    },

    {
        id: "eat_3",
        category: "eat",
        star: 3,
        goal: 20,

        title: "음식 20개 섭취",
        description: "음식을 20개 섭취하세요."
    },
];





export async function showQuestMenu(player) {

    const form = new ActionFormData()
        .title("퀘스트")
        .body("\n");

    form.button("❌ 일일 퀘스트", "textures/formicon/Icons_29.png");
    form.button("❌ 주간 퀘스트", "textures/formicon/Icons_29.png");
    form.button("⬅ 뒤로");

    const result = await form.show(player);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:
            showDailyQuestMenu(player);
            break;

        case 1:
            player.sendMessage("§7아직 구현되지 않았습니다.");
            break;

        case 2:
            showMainMenu(player);
            break;
    }
}

    async function showQuestDetail(
        player,
        daily,
        saveQuest,
        quest
    ) {

    const reward = STAR_REWARD[quest.star];

    const percent = Math.floor(
        saveQuest.progress / quest.goal * 100
    );

    const form = new ActionFormData()
        .title(quest.title)
        .body(
` 
  §f설명
  ${quest.description}

  진행률
  ${saveQuest.progress}/${quest.goal} §7(${percent}%%)

  보상
  +${reward.Money}
  +${reward.Gem}
  레벨업 티켓 ×${reward.Ticket}
 `
        );

    if (saveQuest.claimed) {

        form.button("이미 수령했습니다.");

    } else if (saveQuest.progress >= quest.goal) {

        form.button("보상 받기");

    } else {

        form.button("보상 받기 \n§7(아직 완료되지 않았습니다.)");

    }

    form.button("⬅ 뒤로");

    const result = await form.show(player);

    if (result.canceled)
        return;

    switch (result.selection) {

        case 0:

            if (saveQuest.claimed) {

                showQuestDetail(player, daily, saveQuest, quest);

                return;

            }

            if (saveQuest.progress < quest.goal) {

                showQuestDetail(player, daily, saveQuest, quest);

                return;

            }

            // TODO : 보상 지급
            player.sendMessage("§a보상을 지급했습니다.");

            saveQuest.claimed = true;

            saveDailyQuest(player, daily);

            showDailyQuestMenu(player);

            break;

        case 1:

            showDailyQuestMenu(player);

            break;

        case 2:
                player.sendMessage("§c퀘스트를 완료하세요.");

        break;

    }

}

async function showDailyQuestMenu(player) {

    

    const form = new ActionFormData()
        .title("일일 퀘스트")
        .body("\n");

    const daily = checkDailyReset(player);

        for (const saveQuest of daily.quests) {

            const quest = getQuest(saveQuest.id);

            const iconPath = getQuestIconPath(quest, saveQuest);

            form.button(quest.title, iconPath);

        }

        
        
    form.button("⬅ 뒤로");

    const result = await form.show(player);

    if (result.canceled) return;

            if (result.selection === daily.quests.length) {

            showQuestMenu(player);
            return;

        }

        const saveQuest = daily.quests[result.selection];

        const quest = getQuest(saveQuest.id);

        showQuestDetail(
            player,
            daily,
            saveQuest,
            quest
        );
}











function getPlayerLevel(player) {

    const objective = world.scoreboard.getObjective("Level");

    if (!objective)
        return 1;

    const score = objective.getScore(player);

    if (score === undefined)
        return 1;

    return Math.min(score, 7);
}




function getRandomStar(level) {

    const rate = LEVEL_RATE[level];

    const random = Math.random() * 100;

    if (random < rate[0])
        return 1;

    if (random < rate[0] + rate[1])
        return 2;

    return 3;

}




function getRandomQuest(category, level) {

    const candidates = QUEST_POOL.filter(
        quest => quest.category === category
    );

    if (candidates.length === 0)
        return null;

    const availableStars = [...new Set(
        candidates.map(q => q.star)
    )];

    let star;

    do {
        star = getRandomStar(level);
    } while (!availableStars.includes(star));

    const pool = candidates.filter(
        q => q.star === star
    );

    return pool[
        Math.floor(Math.random() * pool.length)
    ];

}




function generateDailyQuest(player) {

    const level = getPlayerLevel(player);

    const categories = shuffle([...QUEST_CATEGORY]);

    const quests = [];

    for (let i = 0; i < 5; i++) {

        const category = categories[i];

        let quest = null;

        while (!quest) {

            const star = getRandomStar(level);

            quest = getRandomQuest(category, star);

        }

        quests.push({
            id: quest.id,
            progress: 0,
            claimed: false
        });

    }

    return quests;

}


function generateStars(level) {

    const stars = [];

    for (let i = 0; i < 5; i++) {
        stars.push(getRandomStar(level));
    }

    return stars;

}


function shuffle(array) {

    for (let i = array.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [array[i], array[j]] = [array[j], array[i]];

    }

    return array;

}



function saveDailyQuest(player, data) {

    player.setDynamicProperty(
        "DailyQuest",
        JSON.stringify(data)
    );

}


function getDailyQuest(player) {

    const data = player.getDynamicProperty("DailyQuest");

    if (!data)
        return null;

    return JSON.parse(data);

}


function getQuestDate() {

    const now = new Date();

    now.setHours(now.getHours() + 9);

    return Number(
        now.toISOString()
            .slice(0, 10)
            .replace(/-/g, "")
    );

}


    function checkDailyReset(player) {

        const today = getQuestDate();

        let data = getDailyQuest(player);

        if (data && data.date === today)
            return data;

        data = {

            date: today,

            quests: generateDailyQuest(player)

        };

        saveDailyQuest(player, data);

        player.sendMessage(
            "§6[퀘스트] §a일일 퀘스트가 초기화되었습니다! §7새로운 퀘스트를 확인해보세요."
        );

        return data;

    }


function getQuest(id) {

    return QUEST_POOL.find(quest => quest.id === id);

}

function getStarText(star) {

    switch (star) {

        case 1: return "★☆☆";
        case 2: return "★★☆";
        case 3: return "★★★";

    }

}

function getQuestIcon(progress, goal, claimed) {

    if (claimed)
        return "📦";

    if (progress >= goal)
        return "🎁";

    return null;

}



function getQuestIconPath(quest, saveQuest) {

    if (saveQuest.claimed) //보상 받기 완료
        return "textures/formicon/Icons_43.png";

    if (saveQuest.progress >= quest.goal) //보상 수령 가능
        return "textures/formicon/Icons_44.png";

    // 아직 진행 중 -> 성급에 맞는 별 아이콘
    return `textures/formicon/star0${quest.star}.png`;

}



        export function addQuestProgress(
            player,
            category,
            value = 1,
            extra = {}
        ) {

            const daily = checkDailyReset(player);

            let changed = false;

            for (const saveQuest of daily.quests) {

                if (saveQuest.claimed)
                    continue;

                const quest = getQuest(saveQuest.id);

                if (!quest)
                    continue;

                if (quest.category !== category)
                    continue;

                switch (category) {

                    case "animal":

                        if (quest.entity !== extra.entity)
                            continue;

                        break;

                    case "farm":

                        if (quest.block !== extra.block)
                            continue;

                        break;

                    case "mining":

                        if (!quest.blocks.includes(extra.block))
                            continue;

                        break;

                        case "wood":

                        if (!extra.block.endsWith("_log") &&
                            extra.block !== "minecraft:crimson_stem" &&
                            extra.block !== "minecraft:warped_stem")
                            continue;

                        break;
                }

                const before = saveQuest.progress;

                saveQuest.progress = Math.min(
                    before + value,
                    quest.goal
                );

                changed = true;

                if (
                    before < quest.goal &&
                    saveQuest.progress >= quest.goal
                ) {

                    player.sendMessage(
                        `§e[퀘스트] §a${quest.title} 완료! \n§7퀘스트 탭에서 보상을 받을 수 있습니다.`
                    );
                }
            }

            if (changed)
                saveDailyQuest(player, daily);
        }


        function hasSilkTouch(item) {

        if (!item)
            return false;

        const enchantable = item.getComponent("minecraft:enchantable");

        if (!enchantable)
            return false;

        return enchantable.hasEnchantment("silk_touch");

    }


            // ====================
            // 퀘스트 프로그레스
            // ====================

        function isMonster(typeId) {

            const monsters = [
                "minecraft:zombie",
                "minecraft:skeleton",
                "minecraft:creeper",
                "minecraft:spider",
                "minecraft:cave_spider",
                "minecraft:enderman",
                "minecraft:witch",
                "minecraft:husk",
                "minecraft:stray",
                "minecraft:drowned",
                "minecraft:slime",
                "minecraft:magma_cube",
                "minecraft:phantom",
                "minecraft:warden",
                "minecraft:blaze",
                "minecraft:ghast",
                "minecraft:piglin",
                "minecraft:piglin_brute",
                "minecraft:zombified_piglin",
                "minecraft:wither_skeleton",
                "minecraft:hoglin",
                "minecraft:zoglin",
                "minecraft:silverfish",
                "minecraft:endermite"
            ];

            return monsters.includes(typeId);
}


        world.afterEvents.entityDie.subscribe(event => {

        const player = event.damageSource?.damagingEntity;

        if (!player || player.typeId !== "minecraft:player")
            return;

        const dead = event.deadEntity;

        // 몬스터 퀘스트
        if (isMonster(dead.typeId)) {
            addQuestProgress(player, "monster");
        }

        // 동물 퀘스트
        addQuestProgress(player, "animal", 1, {
            entity: dead.typeId
        });

    });




        world.afterEvents.playerBreakBlock.subscribe(event => {

            const player = event.player;
            const block = event.brokenBlockPermutation.type.id;

            // 플레이어가 설치한 원목인지 확인
            const key =
                `${event.block.dimension.id}:${event.block.location.x}:${event.block.location.y}:${event.block.location.z}`;

            const placed = placedLogs.has(key);

            if (placed)
                placedLogs.delete(key);

            // 섬세한 손길로 캤는지 확인
            const silkTouch = hasSilkTouch(event.itemStackBeforeBreak);

            // 광질 (섬세한 손길이면 카운트 안 함)
            if (!silkTouch) {
                addQuestProgress(player, "mining", 1, {
                    block
                });
            }

            // 농사
            addQuestProgress(player, "farm", 1, {
                block
            });

            // 자연 원목만 카운트
            if (!placed) {
                addQuestProgress(player, "wood", 1, {
                    block
                });
            }

        });



        const lastPosition = new Map();

        system.runInterval(() => {

    for (const player of world.getPlayers()) {

        const current = player.location;
        const last = lastPosition.get(player.id);

        if (!last) {

            lastPosition.set(player.id, {
                x: current.x,
                y: current.y,
                z: current.z
            });

            continue;
        }

        const dx = current.x - last.x;
        const dy = current.y - last.y;
        const dz = current.z - last.z;

        const distance = Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );

        if (distance >= 1) {

            addQuestProgress(
                player,
                "move",
                Math.floor(distance)
            );

            lastPosition.set(player.id, {
                x: current.x,
                y: current.y,
                z: current.z
            });
        }

    }

}, 20);




function isFood(typeId) {

    const foods = [
        "minecraft:apple",
        "minecraft:baked_potato",
        "minecraft:beef",
        "minecraft:beetroot",
        "minecraft:beetroot_soup",
        "minecraft:bread",
        "minecraft:carrot",
        "minecraft:chicken",
        "minecraft:chorus_fruit",
        "minecraft:cooked_beef",
        "minecraft:cooked_chicken",
        "minecraft:cooked_cod",
        "minecraft:cooked_mutton",
        "minecraft:cooked_porkchop",
        "minecraft:cooked_rabbit",
        "minecraft:cooked_salmon",
        "minecraft:cod",
        "minecraft:cookie",
        "minecraft:dried_kelp",
        "minecraft:enchanted_golden_apple",
        "minecraft:golden_apple",
        "minecraft:golden_carrot",
        "minecraft:honey_bottle",
        "minecraft:melon_slice",
        "minecraft:mushroom_stew",
        "minecraft:mutton",
        "minecraft:poisonous_potato",
        "minecraft:porkchop",
        "minecraft:potato",
        "minecraft:pufferfish",
        "minecraft:pumpkin_pie",
        "minecraft:rabbit",
        "minecraft:rabbit_stew",
        "minecraft:rotten_flesh",
        "minecraft:salmon",
        "minecraft:spider_eye",
        "minecraft:suspicious_stew",
        "minecraft:sweet_berries",
        "minecraft:glow_berries",
        "minecraft:tropical_fish",
        "minecraft:milk_bucket"
    ];

    return foods.includes(typeId);

}


//---음식 섭취---
world.afterEvents.itemCompleteUse.subscribe(event => {

    const item = event.itemStack;

    if (!item)
        return;

    if (!isFood(item.typeId))
        return;

    addQuestProgress(event.source, "eat", 1, {
        item: item.typeId
    });

});



//---나무 베기---
world.afterEvents.playerPlaceBlock.subscribe(event => {

    const block = event.block;

    if (!block.typeId.endsWith("_log") &&
        block.typeId !== "minecraft:crimson_stem" &&
        block.typeId !== "minecraft:warped_stem")
        return;

    placedLogs.add(
        `${block.dimension.id}:${block.location.x}:${block.location.y}:${block.location.z}`
    );

});


export function resetDailyQuest(player) {

    const data = {

        date: getQuestDate(),

        quests: generateDailyQuest(player)

    };

    saveDailyQuest(player, data);

    player.sendMessage(
        "§6[퀘스트] §a일일 퀘스트가 초기화되었습니다! §7새로운 퀘스트를 확인해보세요."
    );

}


//---일퀘 초기화 명령어 (관리자용)---
world.beforeEvents.chatSend.subscribe((event) => {

    const player = event.sender;
    const message = event.message.trim();

    if (message !== "!일퀘초기화")
        return;

    event.cancel = true;

    if (!player.hasTag("OP")) {
        player.sendMessage("§c권한이 없습니다.");
        return;
    }

    let count = 0;

    for (const target of world.getPlayers()) {

        resetDailyQuest(target);

        count++;
    }

    player.sendMessage(
        `§a모든 플레이어(${count}명)의 일일 퀘스트를 초기화했습니다.`
    );

});