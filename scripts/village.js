import {
    world,
    system
} from "@minecraft/server";

import {
    ActionFormData,
    ModalFormData
} from "@minecraft/server-ui";

import { showMainMenu } from "./clover.js";



const VILLAGE_DIMENSION_ID = "custom:village"; // 실제 마을 차원 ID
const ALLOWED_TYPES = new Set([
  "minecraft:villager",
  "minecraft:player"
]);

world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;
  if (!entity.isValid) return;
  if (entity.dimension.id !== VILLAGE_DIMENSION_ID) return;
  if (ALLOWED_TYPES.has(entity.typeId)) return;

  entity.remove();
});


system.runInterval(() => {

    for (const player of world.getAllPlayers()) {

        if (!player.hasTag("OP"))
            continue;

        // 마을 생성 쿨타임 초기화
        const key = villageManager.getPlayerKey(player);
        delete villageManager.data.createCooldown[key];

    }

}, 20);





console.warn("[Village] File Loaded");

system.run(() => {
    console.warn("[Village] System Ready");

    
});

world.afterEvents.playerSpawn.subscribe((event) => {
    if (!event.initialSpawn) return;

    console.warn(`[Village] ${event.player.name} Joined`);
});








const DATA_KEY = "village:data";

const CREATE_COST = 10000;
const VILLAGE_RADIUS = 1000;
const CREATE_COOLDOWN = 24 * 60 * 60 * 1000;


const VISIT_PROPERTY = "VillageVisit";

const VILLAGE_DIMENSION = "custom:village";

const VILLAGE_SLOTS = [

    { x: 1000, y: 40, z: 1000 },
    { x: 4000, y: 40, z: 4000 },
    { x: 7000, y: 40, z: 7000 },
    { x: 10000, y: 40, z: 10000 },
    { x: 13000, y: 40, z: 13000 },
    { x: 16000, y: 40, z: 16000 },
    { x: 19000, y: 40, z: 19000 },
    { x: 22000, y: 40, z: 22000 },
    { x: 25000, y: 40, z: 25000 },
    { x: 28000, y: 40, z: 28000 },

    { x: -1000, y: 40, z: -1000 },
    { x: -4000, y: 40, z: -4000 },
    { x: -7000, y: 40, z: -7000 },
    { x: -10000, y: 40, z: -10000 },
    { x: -13000, y: 40, z: -13000 },
    { x: -16000, y: 40, z: -16000 },
    { x: -19000, y: 40, z: -19000 },
    { x: -22000, y: 40, z: -22000 },
    { x: -25000, y: 40, z: -25000 },
    { x: -28000, y: 40, z: -28000 },

    { x: 1000, y: 40, z: -1000 },
    { x: 4000, y: 40, z: -4000 },
    { x: 7000, y: 40, z: -7000 },
    { x: 10000, y: 40, z: -10000 },
    { x: 13000, y: 40, z: -13000 },
    { x: 16000, y: 40, z: -16000 },
    { x: 19000, y: 40, z: -19000 },
    { x: 22000, y: 40, z: -22000 },
    { x: 25000, y: 40, z: -25000 },
    { x: 28000, y: 40, z: -28000 },

    { x: -1000, y: 40, z: 1000 },
    { x: -4000, y: 40, z: 4000 },
    { x: -7000, y: 40, z: 7000 },
    { x: -10000, y: 40, z: 10000 },
    { x: -13000, y: 40, z: 13000 },
    { x: -16000, y: 40, z: 16000 },
    { x: -19000, y: 40, z: 19000 },
    { x: -22000, y: 40, z: 22000 },
    { x: -25000, y: 40, z: 25000 },
    { x: -28000, y: 40, z: 28000 }

];

function showForm(player, form) {

    return new Promise((resolve) => {

        const open = () => {

            form.show(player).then((result) => {

                if (result.cancelationReason === "UserBusy") {

                    system.run(open);
                    return;

                }

                resolve(result);

            }).catch(() => {

                system.run(open);

            });

        };

        // 반드시 다음 틱에 실행
        system.run(open);

    });

}

export async function showVillageMenu(player) {

    const hasVillage = villageManager.has(player);
    const form = new ActionFormData()
        .title("마을")
        .body("  ");

    const buttons = [];

        
    if (!hasVillage) {

    form.button("마을 생성","textures/formicon/Icons_11.png");
    buttons.push("create");

    form.button("마을 가입","textures/formicon/Icons_28.png");
    buttons.push("join");

    form.button("마을 방문","textures/formicon/Icons_07.png");
    buttons.push("visit");

    }    else {

    form.button("마을 이동","textures/formicon/Icons_03.png");
    buttons.push("move");

    form.button("마을 정보","textures/formicon/Icons_29.png");
    buttons.push("info");

    form.button("마을 기부","textures/formicon/Icons_01.png");
    buttons.push("donate");

    // 이장만 보이는 버튼
    if (villageManager.isHead(player)) {

        form.button("가입 신청","textures/formicon/Icons_28.png");
        buttons.push("applications");

        form.button("마을 관리","textures/formicon/Icons_34.png");
        buttons.push("manage");

    }

    form.button("마을 방문","textures/formicon/Icons_07.png");
    buttons.push("visit");

    form.button(" §c마을 탈퇴 ");
    buttons.push("leave");

    

    }

    form.button("⬅ 뒤로");
    buttons.push("back");

    const result = await showForm(player, form);

    if (result.canceled) return;

    switch (buttons[result.selection]) {

        case "create":
            villageManager.showCreateForm(player);
            break;

        case "move":
            villageManager.teleport(player);
            break;

        case "info":
            villageManager.showInfo(player);
            break;

        case "leave":
            await villageManager.showLeaveConfirm(player);
            break;

        case "back":
            showMainMenu(player);
            break;

        case "join":
            villageManager.showVillageList(player);
            break;

            case "manage":
            await villageManager.showManageMenu(player);
            break;

            case "donate":
            await villageManager.showDonateMenu(player);
            break;

            case "visit":
            villageManager.showVisitList(player);
            break;

            case "applications":
            await villageManager.showApplications(player);
            break;

    }

}

class VillageManager {

    constructor() {

       this.data = {

            villages: {},

            playerVillage: {},

            disabledSlots: [],

            createCooldown: {}

        };

        this.load();

    }

    load() {

        try {

            const raw = world.getDynamicProperty(DATA_KEY);

            if (!raw) return;

            this.data = JSON.parse(raw);

        } catch {

            this.data = {

                villages: {},

                playerVillage: {},

                disabledSlots: [],

                createCooldown: {}

            };
        }

        if (!this.data.playerVillage) {

        this.data.playerVillage = {};

    }

        if (!this.data.villages) {

        this.data.villages = {};

    }

        if (!this.data.disabledSlots) {

        this.data.disabledSlots = [];

    }

        if (!this.data.createCooldown) {

        this.data.createCooldown = {};

    }

    for (const village of Object.values(this.data.villages)) {

        if (village.visitOpen === undefined) {
            village.visitOpen = false;
        }

        if (!village.donations) {
            village.donations = {};
        }

        if (!village.visitors) {
            village.visitors = {};
        }

    }

    }

    

    save() {

        world.setDynamicProperty(
            DATA_KEY,
            JSON.stringify(this.data)
        );

    }

    reset() {

        this.data = {

                villages: {},

                playerVillage: {},

                disabledSlots: [],

                createCooldown: {}

            };


        for (const player of world.getPlayers()) {

            player.removeTag("VillageHead");

        }

        this.save();

    }

    get(player) {

    const key = this.getPlayerKey(player);

    const villageId = this.data.playerVillage[key];


    if (!villageId) return null;

    return this.data.villages[villageId];

}

    has(player) {

        return this.get(player) != null;

    }

    getPlayerKey(player) {

        return player.name;

    }

            getNextVillageCenter() {

            const used = new Set();

            // 현재 사용 중
            for (const village of Object.values(this.data.villages)) {

                if (village.slot !== undefined) {

                    used.add(village.slot);

                }

            }

            // 폐기된 슬롯도 사용 금지
            for (const slot of this.data.disabledSlots) {

                used.add(slot);

            }

            for (let i = 0; i < VILLAGE_SLOTS.length; i++) {

                if (!used.has(i)) {

                    return {

                        slot: i,
                        center: VILLAGE_SLOTS[i]

                    };

                }

            }

            return null;

        }


    getMoney(player) {

        try {

            const objective =
                world.scoreboard.getObjective("Money");

            if (!objective) return 0;

            return objective.getScore(
                player.scoreboardIdentity
            ) ?? 0;

        } catch {

            return 0;

        }

    }

    getGem(player) {

        try {

            const objective =
                world.scoreboard.getObjective("Gem");

            if (!objective) return 0;

            return objective.getScore(
                player.scoreboardIdentity
            ) ?? 0;

        } catch {

            return 0;

        }

    }

    getLevel(player){

    try{

        const objective =
            world.scoreboard.getObjective("Level");

        if(!objective) return 0;

        return objective.getScore(
            player.scoreboardIdentity
        ) ?? 0;

    }catch{

        return 0;

    }

}



    setMoney(player, value) {

        const objective =
            world.scoreboard.getObjective("Money");

        if (!objective) return;

        objective.setScore(
            player.scoreboardIdentity,
            value
        );

    }

    setGem(player, value) {

        const objective =
            world.scoreboard.getObjective("Gem");

        if (!objective) return;

        objective.setScore(
            player.scoreboardIdentity,
            value
        );

    }


        create(player, name) {

            const key = this.getPlayerKey(player);

                    const cooldown =
                        this.data.createCooldown[key];

                    if (
                        cooldown &&
                        Date.now() < cooldown
                    ) {

                        const remain =
                            cooldown - Date.now();

                        const hour =
                            Math.ceil(
                                remain / 3600000
                            );

                        return {

                            ok: false,

                            message:
                                `§c마을을 다시 생성하려면 ${hour}시간 남았습니다.`

                        };

                    }

        if (this.has(player)) {
            return {
                ok: false,
                message: "§c이미 마을이 있습니다."
            };
        }

        const money = this.getMoney(player);

        if (money < CREATE_COST) {
            return {
                ok: false,
                message: `§cMoney가 ${CREATE_COST} 필요합니다.`
            };
        }

        const location = this.getNextVillageCenter();

                if (!location) {

                    return {

                        ok: false,
                        message: "§c더 이상 생성 가능한 마을이 없습니다."

                    };

                }

                const center = location.center;

        this.setMoney(
            player,
            money - CREATE_COST
        );

        const villageId =
        "village_" +
        Date.now();
        
        this.data.villages[villageId] = {

            id:villageId,

            slot: location.slot,

            visitOpen: true,

            visitors: {},

            owner: player.id,

            ownerName: player.name,

            name,

            level: 1,

            donate: 0,

            donations: {},

            members: [

                {

                    id: player.id,

                    name: player.name,

                    role: "head",

                    level: this.getLevel(player),

                    donate: 0,

                    joinTime: Date.now()

                }

            ],

            applications: [],

            center

        };

        this.data.playerVillage[
            this.getPlayerKey(player)
        ] = villageId;

        player.addTag("VillageHead");

        this.save();

        return {
        ok: true,
        village: this.data.villages[villageId]
    };
        

    }
    

    teleport(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage("§c소속된 마을이 없습니다.");

        return;

    }

    // 방문 상태 해제
    player.setDynamicProperty(
        VISIT_PROPERTY,
        undefined
    );

    player.teleport(
            {
                x: village.center.x + 1.5,
                y: village.center.y,
                z: village.center.z
            },
            {
                dimension:
                    world.getDimension(
                        VILLAGE_DIMENSION
                    )
            }
        );

        const guideKey = `VillageGuide_${village.id}`;
        if (!player.getDynamicProperty(guideKey)) {
            player.setDynamicProperty(guideKey, true);
            system.runTimeout(() => {
                this.showVillageGuide(player);
            }, 20);
        }

}


    async showCreateForm(player) {

        const form =
            new ModalFormData();

        form.title("마을 생성");

        form.textField(
            "\n\n마을 이름을 입력하세요. (필요 : 10,000G)  \n§c[주의] 생성 즉시 마을로 이동됩니다.\n\n\n\n ",
            "예) 새싹마을"
        );

       const result =
        await showForm(player, form);
 
        if (
            result.canceled
        ) return;

        const name =
            result.formValues[0]
                ?.trim();

        if (!name) {

            player.sendMessage(
                "§c이름을 입력하세요."
            );

            return;

        }

                if (
            name.length < 2 ||
            name.length > 12
        ) {

            player.sendMessage(
                "§c2~12글자로 입력하세요."
            );

            return;

        }

        // ⭐ 길이 검사가 끝난 뒤 중복 검사
        if (this.villageNameExists(name)) {

            player.sendMessage(
                "§c이미 존재하는 마을 이름입니다."
            );

            return;

        }

        const success =
            this.create(
                player,
                name
            );

        if (!success.ok) {

            player.sendMessage(
                success.message
            );

            return;

        }

        player.sendMessage(
            `§a${name} 마을이 생성되었습니다.`
        );

        placeStarterVillage(player);

        player.sendMessage(
        "§6[마을] §f클로버 - 마을 탭에서 소속된 마을로 이동 할 수 있습니다."
    );

        

        }

        showInfo(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage(
            "§c소속된 마을이 없습니다."
        );

        return;

    }

    let membersText = "";

    for (const member of village.members) {

        const online = [...world.getPlayers()].find(
            p => p.id === member.id
        );

       const role =
        member.role === "head"
            ? "§e[이장]"
            : "§f[마을원]";

        const status =
            online
                ? "§a●"
                : "§7●";



        const level = online
            ? this.getLevel(online)
            : member.level;

       membersText +=
        `${role} §f${member.name} §7(Lv.${level}) ${status}§7\n`;

    }

    player.sendMessage(
`§6========== 마을 정보 ==========

§e이름 §f: ${village.name}
§e레벨 §f: ${village.level}
§e인원 §f: ${village.members.length}
§e기부금 §f: ${this.formatMoney(village.donate)}G

§7━━━━━━ 마을 인원 ━━━━━━
${membersText}
§6===============================`
    );

}

        isHead(player) {

        const village = this.get(player);

        if (!village) return false;

        const member = village.members.find(
            m => m.id === player.id
        );

        if (!member) return false;

        return member.role === "head";

    }


    getNextHead(village){

    let highest = -1;

    let candidates = [];

    for(const member of village.members){

        const player =
            [...world.getPlayers()]
            .find(p => p.id === member.id);

        if(!player) continue;

        const level =
            this.getLevel(player);

        if(level > highest){

            highest = level;

            candidates = [
                member
            ];

        }else if(level === highest){

            candidates.push(
                member
            );

        }

    }

    if(candidates.length === 0)
        return null;

    return candidates[
        Math.floor(
            Math.random() *
            candidates.length
        )
    ];

}

    leave(player) {

    const village = this.get(player);

    if (!village) {
        player.sendMessage("§c소속된 마을이 없습니다.");
        return;
    }

    const index = village.members.findIndex(
        m => m.id === player.id
    );

    if (index === -1) return;

    const me = village.members[index];

    // ===== 일반 멤버 =====
    if (me.role !== "head") {

        village.members.splice(index, 1);

        

        delete this.data.playerVillage[
        this.getPlayerKey(player)
    ];


    player.setDynamicProperty(
    "VillageGuide",
    undefined
);

        this.save();

        player.sendMessage("§a마을을 탈퇴했습니다.");

        return;
    }

    // ===== 이장이 혼자인 경우 =====
    if (village.members.length === 1) {


        // 슬롯 폐기
        if (!this.data.disabledSlots.includes(village.slot)) {

            this.data.disabledSlots.push(village.slot);

        }


        this.data.createCooldown[
            this.getPlayerKey(player)
        ] =
            Date.now() +
            CREATE_COOLDOWN;

            
        delete this.data.villages[village.id];

        delete this.data.playerVillage[
        this.getPlayerKey(player)
    ];

        player.removeTag("VillageHead");

        this.save();

        player.sendMessage("§c마을이 해체되었습니다.");

        return;
    }

    // ===== 이장 변경 =====

    village.members.splice(index, 1);

    let highest = -1;
    let candidates = [];

    for (const member of village.members) {

        if (member.level > highest) {

            highest = member.level;
            candidates = [member];

        } else if (member.level === highest) {

            candidates.push(member);

        }

    }

    const newHead =
        candidates[
            Math.floor(Math.random() * candidates.length)
        ];

    newHead.role = "head";

    
    delete this.data.playerVillage[
            this.getPlayerKey(player)
        ];

    player.removeTag("VillageHead");

    const online = [...world.getPlayers()].find(
        p => p.id === newHead.id
    );

    if (online) {

        online.addTag("VillageHead");

        online.sendMessage(
            `§6${village.name}의 새 이장이 되었습니다.`
        );

    }

    this.save();

    player.sendMessage("§a마을을 탈퇴했습니다.");

}

    async showMainMenu(player) {

    try {

        const form = new ActionFormData();

        form.title("마을");
        form.body("원하는 메뉴를 선택하세요.");

        form.button("🏠 마을 생성");
        form.button("🚪 마을 이동");
        form.button("📜 마을 정보");

        const result = await showForm(player, form);

        console.warn(JSON.stringify(result));

        if (result.canceled) {
            console.warn("FORM CANCELED");
            return;
        }

        switch (result.selection) {
            case 0:
                await this.showCreateForm(player);
                break;

            case 1:
                this.teleport(player);
                break;

            case 2:
                this.showInfo(player);
                break;
        }

    } catch (e) {

        console.warn("FORM ERROR");
        console.warn(e);

    }
}

async showVillageList(player) {

    const form = new ActionFormData();

    form.title("마을 가입");

    form.body("가입할 마을을 선택하세요.");

    const villages =
        Object.values(this.data.villages);

    if (villages.length === 0) {

        player.sendMessage("§c생성된 마을이 없습니다.");

        return;

    }

    for (const village of villages) {

        form.button(village.name);

    }

    form.button("⬅ 뒤로");

    const result =
    await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === villages.length) {

        showVillageMenu(player);

        return;

    }

    await this.showVillageDetail(
        player,
        villages[result.selection]
    );

}


async showVillageDetail(player, village) {

    const form =
        new ActionFormData();

    form.title(village.name);

    const head =
        village.members.find(
            m => m.role === "head"
        );

    form.body(

`§e이름§f : ${village.name}

§e레벨§f : ${village.level}

§e인원§f : ${village.members.length}

§e기부§f : ${this.formatMoney(village.donate)}

§e이장§f : ${head ? head.name : "없음"}`

    );

    form.button("✅ 가입 신청");

    form.button("⬅ 뒤로");

    const result =
    await showForm(player, form);

    if (result.canceled) return;

    switch(result.selection){

        case 0:

            this.applyVillage(
                player,
                village.id
            );

    break;

        case 1:

            await this.showVillageList(player);

            break;

    }

}


async showApplications(player) {

    const village = this.get(player);

    if (!village) return;

    const form = new ActionFormData();

    form.title("📨 가입 신청");

    if (village.applications.length === 0) {

        form.body("가입 신청이 없습니다.");

        form.button("뒤로");

        await showForm(player, form);

        return;

    }

    for (const app of village.applications) {

        form.button(
            `${app.name}\nLv.${app.level}`
        );

    }

    form.button("뒤로");

    const result =
    await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === village.applications.length) {

        return;

    }

    await this.showApplicationDetail(
        player,
        village,
        result.selection
    );

}


async showApplicationDetail(player, village, index) {

    const app = village.applications[index];

    const form = new ActionFormData();

    form.title(app.name);

    form.body(

`닉네임 : ${app.name}

티어 : ${app.level}`

    );

    form.button("✅ 승인");

    form.button("❌ 거절");

    form.button("⬅ 뒤로");

    const result =
    await showForm(player, form);

    if(result.canceled) return;

    switch(result.selection){

        case 0:

            this.acceptApplication(
                village,
                app
            );

            player.sendMessage(
                `${app.name}님의 가입을 승인했습니다.`
            );

            break;

        case 1:

            village.applications.splice(
                index,
                1
            );

            this.save();

            player.sendMessage(
                `${app.name}님의 신청을 거절했습니다.`
            );

            break;

        case 2:

            await this.showApplications(player);

            break;

    }

}

acceptApplication(village, app){

    village.members.push({
        id: app.id,
        name: app.name,
        role: "member",
        level: app.level,
        donate: 0,
        joinTime: Date.now()
    });

    this.data.playerVillage[app.key] = village.id;

    village.applications =
        village.applications.filter(
            p => p.id !== app.id
        );

    this.save();

    const joinedPlayer =
        [...world.getPlayers()]
            .find(p => p.id === app.id);

    if (joinedPlayer) {
        joinedPlayer.sendMessage(
            `§a'${village.name}' 마을 가입이 승인되었습니다.`
        );
        joinedPlayer.sendMessage(
            "§6[마을] §f자세한 마을 이용 규칙은 §e!마을규칙 §f명령어를 통해 확인할 수 있습니다."
        );

        // 마을별 첫 입장 안내 플래그로 변경
        const guideKey = `VillageGuide_${village.id}`;
        if (!joinedPlayer.getDynamicProperty(guideKey)) {
            joinedPlayer.setDynamicProperty(guideKey, true);
            system.runTimeout(() => {
                this.showVillageGuide(joinedPlayer);
            }, 20);
        }
    }

    // 기존 마을원들에게 신규 가입 알림
    for (const member of village.members) {

        // 새로 가입한 사람은 제외
        if (member.id === app.id) continue;

        const online = [...world.getPlayers()]
            .find(p => p.id === member.id);

        if (!online) continue;

        online.playSound("notification");

        online.sendMessage(
            `§6[마을] §f새로운 마을원, §a${app.name}§f님을 환영해주세요!`
        );
    }

}


applyVillage(player, villageId) {

    if (this.has(player)) {
        player.sendMessage("§c이미 마을에 소속되어 있습니다.");
        return;
    }

    const village = this.data.villages[villageId];

    if (!village) {
        player.sendMessage("§c마을을 찾을 수 없습니다.");
        return;
    }

    if (village.applications.some(a => a.id === player.id)) {
        player.sendMessage("§c이미 가입 신청을 보냈습니다.");
        return;
    }

    village.applications.push({

    id: player.id,

    key: this.getPlayerKey(player),

    name: player.name,

    level: this.getLevel(player),

    applyTime: Date.now()

        });

    this.save();

            // 이장에게 가입 신청 알림
        const head = [...world.getPlayers()].find(p => {
            const member = village.members.find(m => m.role === "head");
            return member && p.id === member.id;
        });

        if (head) {
            head.playSound("notification");

            head.sendMessage(
                `§6[마을] §e${player.name}§f님이 §a${village.name}§f 마을에 가입을 신청했습니다.`
            );
        }

    player.sendMessage("§a가입 신청을 보냈습니다.");

}


async showLeaveConfirm(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage("§c소속된 마을이 없습니다.");

        return;

    }

    const form = new ActionFormData();

    form.title("⚠ 마을 탈퇴");

    form.body(
`\n\n§f정말 §e'${village.name}' §f마을을 탈퇴하시겠습니까?

§c※ 이 작업은 되돌릴 수 없으며 마지막 남은 인원이 탈퇴 할 시 마을은 영구적으로 해체됩니다. \n \n \n `
    );

    form.button("§c탈퇴");

    form.button("취소");

   const result = await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:

            this.leave(player);

            break;

        case 1:

            return;

    }

}


villageNameExists(name) {

    name = name.trim().toLowerCase();

    return Object.values(this.data.villages).some(village =>
        village.name.trim().toLowerCase() === name
    );

}


async showVillageGuide(player, ruleRead = false, commandRead = false) {



    const form = new ActionFormData();

    form.title("마을 안내");

    form.body(
        "\n§f마을 이용 전 아래 내용을 모두 읽어주세요. \n\n§c[경고] 본 사항을 숙지하지 않아 받게되는 불이익은 서버에서 책임지지 않습니다.\n\n\n"
    );

    form.button(
        `${ruleRead ? "§a✔" : "§c✖"} 마을 규칙`
    );

    form.button(
        `${commandRead ? "§a✔" : "§c✖"} 마을 명령어`
    );

    form.button("§e확인");

    const result = await showForm(player, form);

    // X 누름
    if (result.canceled) {

    system.runTimeout(() => {


        this.showVillageGuide(player);

    }, 60);

    return;

}

    switch (result.selection) {

        case 0:

            await this.showVillageRule(
                player,
                commandRead
            );

            break;

        case 1:

            await this.showVillageCommand(
                player,
                ruleRead
            );

            break;

        case 2:

            if (!ruleRead || !commandRead) {

                player.sendMessage(
                    "§c모든 안내를 읽어주세요."
                );

                return this.showVillageGuide(
                    player,
                    ruleRead,
                    commandRead
                );

            }

            

            player.sendMessage(
                "§a마을 안내를 완료했습니다."
            );

            break;

    }

}




async showVillageRule(player, commandRead) {

    const form = new ActionFormData();

    form.title("📖 마을 규칙");

    form.body(`§7환영합니다. 마을에 새로오신 분! 본 사항은 여러분이 마을 시스템을 보다 더 쾌적하게 이용하기 위하여 준수해야 하는 몇 가지 규칙들 입니다.

 
 §e[1]§f 마을의 중앙 기준 블록으로부터 3 X 3 구역은 마을의 안전을 위하여 빈 공간으로 지정되어있습니다. 해당 구역에는 블록을 설치할 수 없습니다.

 §e[2]§f 마을원의 구성은 마을을 대표하는 이장과 마을을 이루는 마을원으로 나뉘어있습니다. 마을 대부분의 권한은 이장에게 있으며 만약 이장이 마을을 떠날 시, 마을 원 중 무작위로 1명이 이장으로 선출됩니다.

 §e[3]§f 최후의 마을 인원마저 떠날 경우 그 마을은 즉시 폐쇄되며 이는 돌이킬 수 없는 행동이니 주의해 주시길 바랍니다.

 §e[4]§f 마을원들은 마을 중앙 기준 블록으로부터 반경 500블록 ( 총 1000 X 1000 ) 이내에서만 행동 및 건축 할 수 있습니다.

 §e[5]§f 마을을 생성 후 24시간 동안은 마을을 만들 수 없습니다.

 §e[6]§f 마을은 중복된 이름으로 생성될 수 없습니다.

 §e[7]§f 마을을 방문한 방문자에겐 기본적으로 건축이 제한되며, 이장은 마을 관리에서 방문객에게 건축 권한을 줄 수 있습니다.

 §e[8]§f 방문자는 마을 내에 컨테이너 블록(상자/호퍼/드로퍼와 디스펜서 등)에 접근 할 수 없으며, 컨테이너 내부에 아이템이 있는 경우 파괴가 제한됩니다.


`);

    form.button("확인했습니다.");

    const result = await showForm(player, form);

    if (result.canceled) {

        return this.showVillageGuide(player);

    }

    return this.showVillageGuide(
        player,
        true,
        commandRead
    );

}



async showVillageCommand(player, ruleRead) {

    const form = new ActionFormData();

    form.title("⌨ 마을 명령어");

    form.body(`§7모든 명령어는 퀵 탭 (클로버) 를 통해서도 접근 할 수 있습니다.

§f!마을
§7=마을 관련 명령어를 보여줍니다.

§f!마을정보
§7=소속된 마을의 정보를 출력합니다.

§f!마을이동
§7=소속된 마을로 이동합니다.

§f!마을생성
§7=마을을 생성합니다.

§f!마을가입
§7=가입이 가능한 마을의 목록을 출력합니다.

§f!마을탈퇴
§7=소속된 마을을 탈퇴합니다.

§f!마을기부
§7=마을에 기부금을 송금합니다.

§f!마을방문
§7=방문이 공개된 마을의 목록을 출력합니다.



`);

    form.button("확인했습니다.");

    const result = await showForm(player, form);

    if (result.canceled) {

        return this.showVillageGuide(player);

    }

    return this.showVillageGuide(
        player,
        ruleRead,
        true
    );

}




async showDonateMenu(player) {

    const form = new ActionFormData();

    form.title("💰 기부");

    form.button("🏆 기부 랭킹");
    form.button(" 마을 기부금 보내기");
    form.button("⬅ 뒤로");

    const result = await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:
            await this.showDonateRanking(player);
            break;

        case 1:
            await this.showDonateForm(player);
            break;

        case 2:
            showVillageMenu(player);
            break;
    }
}

async showDonateRanking(player) {

    const village = this.get(player);

    if (!village) {
        player.sendMessage("§c소속된 마을이 없습니다.");
        return;
    }

    const ranking = village.members
        .map(member => {

            const online = [...world.getPlayers()]
                .find(p => p.id === member.id);

            return {

                ...member,

                level: online
                    ? this.getLevel(online)
                    : member.level,

                donate:
                    village.donations?.[member.id] ?? 0

            };

        })
        .sort((a, b) => b.donate - a.donate);

    let text = "";

    ranking.forEach((member, index) => {

        let medal = "🏅";

        if (index === 0) medal = "🥇";
        else if (index === 1) medal = "🥈";
        else if (index === 2) medal = "🥉";

        text +=
`${medal} ${index + 1}위

§f${member.name}
§7Lv.${member.level}
§6기부금 §e${this.formatMoney(member.donate)}

`;

    });

    const form = new ActionFormData();

    form.title("🏆 기부 랭킹");

    form.body(text || "기부 내역이 없습니다.");

    form.button("⬅ 뒤로");

    const result = await showForm(player, form);

    if (result.canceled) return;

    await this.showDonateMenu(player);

}

async showDonateForm(player) {

    const village = this.get(player);

    if (!village) {
        player.sendMessage("§c소속된 마을이 없습니다.");
        return;
    }

    const form = new ModalFormData();

    form.title("💸 마을 기부");

    form.textField(
        "\n\n기부할 금액을 입력하세요.\n\n\n",
        "예) 50000"
    );

    const result = await showForm(player, form);

    if (result.canceled) {
        await this.showDonateMenu(player);
        return;
    }

    const amount = Number(result.formValues[0]);

    if (!Number.isInteger(amount) || amount <= 0) {
        player.sendMessage("§c올바른 금액을 입력해주세요.");
        return;
    }

    const money = world.scoreboard.getObjective("Money");

    const balance =
        money.getScore(player.scoreboardIdentity) ?? 0;

    if (balance < amount) {
        player.sendMessage("§c소지금이 부족합니다.");
        return;
    }

    // 돈 차감
    money.setScore(
        player.scoreboardIdentity,
        balance - amount
    );

    // 총 기부량(scoreboard)
    const donationObj =
        world.scoreboard.getObjective("villagedonations");

    donationObj.addScore(
        player.scoreboardIdentity,
        amount
    );

    // 마을 총 기부금
    village.donate += amount;

    // 개인 기부 기록
    village.donations ??= {};

    village.donations[player.id] ??= 0;

    village.donations[player.id] += amount;

    this.save();

    for (const member of village.members) {

    const target = [...world.getPlayers()]
        .find(p => p.id === member.id);

    if (!target) continue;

    target.sendMessage(
        `§6[마을] §e${player.name}§f님이 §a${this.formatMoney(amount)}§f를 마을에 기부했습니다!\n` +
        `§7현재 마을 기부금: §e${this.formatMoney(village.donate)}`
    );

}

    player.sendMessage(
    `§a${this.formatMoney(amount)}를 기부했습니다.`
        );

}

formatMoney(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}



async showManageMenu(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage("§c소속된 마을이 없습니다.");
        return;

    }

    if (!this.isHead(player)) {

        player.sendMessage("§c이장만 사용할 수 있습니다.");
        return;

    }

            const form = new ActionFormData();

        form.title("마을 관리");

        form.body(`

 §f마을 이름 : ${village.name}

 방문 상태 : ${
            village.visitOpen
                ? "§a공개"
                : "§c비공개"
        }

        `);

        form.button("마을 이름 변경");

        form.button(
            village.visitOpen
                ? "방문 비공개"
                : "방문 공개"
        );

        form.button("마을원 관리");

        form.button("방문객 관리");

        form.button("⬅ 뒤로");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:
            await this.showRenameVillageForm(player);
            break;

        case 1:
            this.toggleVillageVisit(player);
            break;

        case 2:
            await this.showMemberList(player);
            break;

        case 3:
            await this.showVisitorList(player);
            break;

        case 4:
            showVillageMenu(player);
            break;
    }

}


toggleVillageVisit(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage("§c소속된 마을이 없습니다.");
        return;

    }

    if (!this.isHead(player)) {

        player.sendMessage("§c이장만 사용할 수 있습니다.");
        return;

    }

    village.visitOpen = !village.visitOpen;

    this.save();

    player.sendMessage(

        village.visitOpen
            ? "§a마을 방문을 공개했습니다."
            : "§e마을 방문을 비공개했습니다."

    );

}

async showRenameVillageForm(player) {

    const village = this.get(player);

    if (!village) {

        player.sendMessage("§c소속된 마을이 없습니다.");
        return;

    }

    if (!this.isHead(player)) {

        player.sendMessage("§c이장만 사용할 수 있습니다.");
        return;

    }

    const form = new ModalFormData();

    form.title("마을 이름 변경");

    form.textField(
        "새로운 마을 이름을 입력하세요.\n§7(100 Gem 필요)",
        village.name
    );

    const result = await showForm(player, form);

    if (result.canceled) {

        await this.showManageMenu(player);
        return;

    }

    const name =
        result.formValues[0]
            ?.trim();

    if (!name) {

        player.sendMessage("§c이름을 입력하세요.");
        return;

    }

    if (
        name.length < 2 ||
        name.length > 12
    ) {

        player.sendMessage("§c2~12글자로 입력하세요.");
        return;

    }

    if (
        name.toLowerCase() ===
        village.name.toLowerCase()
    ) {

        player.sendMessage("§c현재 마을 이름과 같습니다.");
        return;

    }

    if (this.villageNameExists(name)) {

        player.sendMessage("§c이미 존재하는 마을 이름입니다.");
        return;

    }

    const gem = this.getGem(player);

    if (gem < 100) {

        player.playSound(
            "negative.notification"
        );

        player.sendMessage("§cGem이 100개 필요합니다.");
        return;

    }

    this.setGem(
        player,
        gem - 100
    );

    const oldName = village.name;

    village.name = name;

    this.save();

    for (const member of village.members) {

        const target =
            [...world.getPlayers()]
            .find(p => p.id === member.id);

        if (!target) continue;
        
        target.playSound(
            "notification"
        )

        target.sendMessage(
            `§6[마을] §e${oldName}§f 마을의 이름이 §a${name}§f(으)로 변경되었습니다.`
        );

    }

    player.sendMessage(
        "§a마을 이름을 변경했습니다."
    );

}

async showVisitList(player) {

    const myVillage = this.get(player);

    const villages = Object.values(this.data.villages)
    .filter(v =>
        !myVillage || v.id !== myVillage.id
    );

    if (villages.length === 0) {

        player.sendMessage(
            "§c방문 가능한 마을이 없습니다."
        );

        return;

    }

    const form = new ActionFormData();

    form.title("마을 방문");

    form.body("§f방문할 마을을 선택하세요.");

    for (const village of villages) {

        form.button(
        `${village.name}
§6Lv.${village.level} §f| 방문 여부 : ${village.visitOpen ? "§a공개" : "§c비공개"}`
        );

    }

    form.button("⬅ 뒤로");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === villages.length) {

        return;

    }

    const village = villages[result.selection];

        if (!village.visitOpen) {

            player.sendMessage(
                "§c현재 방문이 비공개인 마을입니다."
            );

            return;

        }

        await this.visitVillage(
            player,
            village
        );

}


async visitVillage(player, village) {

    player.setDynamicProperty(
        VISIT_PROPERTY,
        village.id
    );

    village.visitors ??= {};

    village.visitors[player.id] = {
        id: player.id,
        name: player.name,
        canBuild: false,
        visitTime: Date.now()
    };

    this.save();

            for (const member of village.members) {

            const online = [...world.getPlayers()]
                .find(p => p.id === member.id);

            if (!online) continue;

            online.playSound("notification");

            online.sendMessage(
                `§6[마을] §e${player.name}§f님이 마을을 방문했습니다.`
            );

        }

    player.teleport(
            {
                x: village.center.x + 1,
                y: village.center.y,
                z: village.center.z
            },
            {
                dimension:
                    world.getDimension(
                        VILLAGE_DIMENSION
                    )
            }
        );

    system.runTimeout(() => {
            player.playSound("notification");

            player.sendMessage(
                `§a'${village.name}' 마을을 방문합니다.`
                );
            }, 2);

}


async showMemberList(player) {

    const village = this.get(player);

    if (!village) return;

    const form = new ActionFormData();

    form.title("마을원 관리");

    const members = village.members.filter(
        m => m.role !== "head"
    );

    if (members.length === 0) {

        form.body("\n\n\n§f마을원이 없습니다.\n\n\n");

    } else {

        for (const member of members) {

            const online =
                [...world.getPlayers()]
                .find(p => p.id === member.id);

            const level =
                online
                    ? this.getLevel(online)
                    : member.level;

            form.button(
                `${member.name} (Lv.${level})`
            );

        }

    }

    form.button("⬅ 뒤로");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === members.length) {

        return this.showManageMenu(player);

    }

    await this.showMemberDetail(
        player,
        members[result.selection]
    );

}

async showVisitorList(player) {

    const village = this.get(player);

    if (!village) return;

    const visitors =
        Object.values(
            village.visitors ?? {}
        );

    const form =
        new ActionFormData();

    form.title("방문객 관리");

    if (visitors.length === 0) {

        form.body(
            "\n\n\n§f현재 방문객이 없습니다.\n\n\n"
        );

    } else {

        for (const visitor of visitors) {

            const online =
                [...world.getPlayers()]
                .find(p => p.id === visitor.id);

            const level =
                online
                    ? this.getLevel(online)
                    : "?";

            form.button(
                `${visitor.name} (Lv.${level}) ${visitor.canBuild ? "O" : "X"}`
            );

        }

    }

    form.button("⬅ 뒤로");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === visitors.length) {

        return this.showManageMenu(player);

    }

    await this.showVisitorDetail(
        player,
        visitors[result.selection]
    );

}


async showMemberDetail(player, member) {

    const village = this.get(player);

    if (!village) return;

    const online =
        [...world.getPlayers()]
        .find(p => p.id === member.id);

    const level =
        online
            ? this.getLevel(online)
            : member.level;

    const donate =
        village.donations?.[member.id] ?? 0;

    const joinDate =
        new Date(member.joinTime)
            .toISOString()
            .split("T")[0];

    const form = new ActionFormData();

    form.title("마을원 정보");

    form.body(
`§f
닉네임 : ${member.name}

티어 : ${level}

기여한 기부금 : ${this.formatMoney(donate)}G

가입일 : ${joinDate} ( UTC )


`   );

    form.button("🚫 추방하기");
    form.button("⬅ 닫기");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:

            await this.showKickConfirm(player, member);

            break;

        case 1:

            await this.showMemberList(player);

            break;

    }

}

async showKickConfirm(player, member) {

    const village = this.get(player);

    if (!village) return;

    const form = new ActionFormData();

    form.title("⚠ 추방");

    form.body(
`
정말 '${member.name}'님을 추방하시겠습니까?

§c추방된 플레이어는 다시 가입 신청을 해야 합니다.



`
    );

    form.button("§c추방");
    form.button("취소");

    const result = await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:

            this.kickMember(player, member);

            break;

        case 1:

            await this.showMemberDetail(
                player,
                member
            );

            break;

    }

}

kickMember(player, member) {

    const village = this.get(player);

    if (!village) return;

    const index = village.members.findIndex(
        m => m.id === member.id
    );

    if (index === -1) return;

    village.members.splice(index, 1);

    delete this.data.playerVillage[
        member.name
    ];

    this.save();

    const target =
        [...world.getPlayers()]
        .find(p => p.id === member.id);

    if (target) {

        target.sendMessage(
            `§c'${village.name}' 마을에서 추방되었습니다.`
        );

        target.setDynamicProperty(
            "VillageGuide",
            undefined
        );

    }

    player.sendMessage(
        `§a${member.name}님을 추방했습니다.`
    );

}

async showVisitorList(player) {

    const village = this.get(player);

    if (!village) return;

    const visitors =
        Object.values(
            village.visitors ?? {}
        );

    const form = new ActionFormData();

    form.title("👤 방문객 관리");

    if (visitors.length === 0) {

        form.body("\n\n\n현재 방문객이 없습니다.\n\n\n");

    } else {

        for (const visitor of visitors) {

            const online =
                [...world.getPlayers()]
                .find(p => p.id === visitor.id);

            const level =
                online
                    ? this.getLevel(online)
                    : "?";

            form.button(
                `${visitor.name} (Lv.${level}) ${visitor.canBuild ? "O" : "X"}`
            );

        }

    }

    form.button("⬅ 뒤로");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === visitors.length) {

        return this.showManageMenu(player);

    }

    await this.showVisitorDetail(
        player,
        visitors[result.selection]
    );

}



async showVisitorDetail(player, visitor) {

    const village = this.get(player);

    if (!village) return;

    const online =
        [...world.getPlayers()]
        .find(p => p.id === visitor.id);

    const level =
        online
            ? this.getLevel(online)
            : "?";

    const form = new ActionFormData();

    form.title("👤 방문객 정보");

    form.body(
`닉네임 : ${visitor.name}
티어 : ${level}
방문 레벨 : ${
    visitor.canBuild
        ? "건설자"
        : "방문자"
}`
    );

            form.button(
            visitor.canBuild
                ? "🔒 건축 권한 회수"
                : "🔓 건축 권한 부여"
        );

        form.button("🚪 마을에서 내보내기");

        form.button("⬅ 닫기");

    const result =
        await showForm(player, form);

    if (result.canceled) return;

            switch (result.selection) {

                case 0:

                    await this.showVisitorPermissionConfirm(
                        player,
                        visitor
                    );

                    break;

                case 1:

                    await this.showKickVisitorConfirm(
                        player,
                        visitor
                    );

                    break;

                case 2:

                    await this.showVisitorList(player);

                    break;

            }

}


async showVisitorPermissionConfirm(player, visitor) {

    const village = this.get(player);

    if (!village) return;

    const form = new ActionFormData();

    const isBuilder = visitor.canBuild;

    form.title(
        isBuilder
            ? "🔒 건축 권한 회수"
            : "🔓 건축 권한 부여"
    );

    form.body(
isBuilder
? `정말 '${visitor.name}'님의 건축 권한을 회수하시겠습니까?

§c즉시 블록 설치 및 파괴가 불가능해집니다.`
: `정말 '${visitor.name}'님에게 건축 권한을 부여하시겠습니까?

§e해당 플레이어는 이번 방문 동안만
마을의 블록을 설치 및 파괴할 수 있습니다.

§7마을을 나가면 권한은 자동으로 초기화됩니다.`
    );

    form.button(
        isBuilder
            ? "§c권한 회수"
            : "§a권한 부여"
    );

    form.button("취소");

    const result = await showForm(player, form);

    if (result.canceled) return;

    switch (result.selection) {

        case 0:

            visitor.canBuild = !visitor.canBuild;

            this.save();

            player.sendMessage(
                visitor.canBuild
                    ? `§a${visitor.name}님에게 건축 권한을 부여했습니다.`
                    : `§e${visitor.name}님의 건축 권한을 회수했습니다.`
            );

            await this.showVisitorDetail(
                player,
                visitor
            );

            break;

        case 1:

            await this.showVisitorDetail(
                player,
                visitor
            );

            break;

    }

}

async showKickVisitorConfirm(player, visitor) {

    const form = new ActionFormData();

    form.title("🚪 방문객 내보내기");

    form.body(
`정말 '${visitor.name}'님을
마을 밖으로 내보내시겠습니까?`
    );

    form.button("§c내보내기");
    form.button("취소");

    const result = await showForm(player, form);

    if (result.canceled) return;

    if (result.selection === 0) {

        this.kickVisitor(
            player,
            visitor
        );

    } else {

        await this.showVisitorDetail(
            player,
            visitor
        );

    }

}


kickVisitor(player, visitor) {

    const village = this.get(player);

    if (!village) return;

    const target =
        [...world.getPlayers()]
        .find(p => p.id === visitor.id);

    if (target) {

        target.setDynamicProperty(
            VISIT_PROPERTY,
            undefined
        );

        delete village.visitors[target.id];

        target.teleport(
            { x: 0, y: 180, z: 0 },
            {
                dimension:
                    world.getDimension(
                        "overworld"
                    )
            }
        );

        target.sendMessage(
            `§c'${village.name}' 마을에서 퇴장되었습니다.`
        );

    } else {

        delete village.visitors[visitor.id];

    }

    this.save();

    player.sendMessage(
        `§a${visitor.name}님을 내보냈습니다.`
    );

}

}
//-----------



export let villageManager;

system.run(() => {

    villageManager =
        new VillageManager();

});






/* ===========================
   마을 경계
=========================== */

system.runInterval(() => {

    if (!villageManager) return;

    let villageDimension;

    try {

        villageDimension =
            world.getDimension(VILLAGE_DIMENSION);

    } catch {

        return;

    }

    const overworld =
        world.getDimension("overworld");

    for (const player of world.getPlayers()) {

        // custom:village 차원이 아니면 방문 상태 해제
                if (
                player.dimension.id !==
                villageDimension.id
            ) {

                const visitId =
                    player.getDynamicProperty(
                        VISIT_PROPERTY
                    );

                if (visitId) {

                    const village =
                        villageManager.data.villages[
                            visitId
                        ];

                    if (village?.visitors) {

                        delete village.visitors[player.id];

                        villageManager.save();

                    }

                    player.setDynamicProperty(
                        VISIT_PROPERTY,
                        undefined
                    );

                }

                continue;

            }

        

        if (player.getDynamicProperty("NeedVillageGuide")) {


            player.setDynamicProperty(
                "NeedVillageGuide",
                undefined
            );

            system.runTimeout(() => {


                villageManager.showVillageGuide(player);

            }, 5);

        }

        // OP는 모든 제한 무시
        if (player.hasTag("OP"))
            continue;

        //--------------------------------------------------
        // 기준이 되는 마을 찾기
        //--------------------------------------------------

        let village = null;

        // 방문 중인지 확인
        const visitId =
            player.getDynamicProperty(
                VISIT_PROPERTY
            );

        if (visitId) {

            village =
                villageManager.data.villages[
                    visitId
                ];

        } else {

            village =
                villageManager.get(player);

        }

        //--------------------------------------------------
        // 마을도 없고 방문도 아님
        //--------------------------------------------------

        if (!village) {

            player.teleport(

                {
                    x: 0,
                    y: 180,
                    z: 0
                },

                {
                    dimension: overworld
                }

            );

            player.sendMessage(
                "§c마을 차원에 입장할 수 없습니다."
            );

            continue;

        }

        //--------------------------------------------------
        // 반경 검사
        //--------------------------------------------------

        const dx =
            player.location.x -
            village.center.x;

        const dz =
            player.location.z -
            village.center.z;

        const distance =
            dx * dx +
            dz * dz;

        if (
            distance >
            VILLAGE_RADIUS *
            VILLAGE_RADIUS
        ) {

            player.teleport(

                village.center,

                {
                    dimension:
                        villageDimension
                }

            );

            player.sendMessage(
                "§c마을 경계를 벗어날 수 없습니다. (반경 500블록)"
            );

        }

    }

},20);

/* ===========================
   유틸
=========================== */

function isValidVillageName(name) {

    if (!name) return false;

    name = name.trim();

    if (name.length < 2) return false;

    if (name.length > 12) return false;

    const regex =
        /^[가-힣a-zA-Z0-9]+$/;

    return regex.test(name);

}



/* ===========================
   관리자
=========================== */

globalThis.village = {

    manager:
        villageManager,

    reload(){

        villageManager.load();

    },

    save(){

        villageManager.save();

    },

    list(){

        console.warn(
            villageManager.data
        );

    }

};

/* ===========================
   플레이어 입장
=========================== */

world.afterEvents.playerSpawn.subscribe(event => {

    if (!event.initialSpawn) return;

    const player = event.player;

    if (!villageManager.has(player)) return;

    player.sendMessage(
        "§a마을 데이터가 로드되었습니다."
    );

});

/* ===========================
   자동 저장
=========================== */

system.runInterval(() => {

    if (!villageManager) return;

    villageManager.save();

}, 20 * 60);

/* ===========================
   추가 명령어
=========================== */

world.beforeEvents.chatSend.subscribe(event => {

    console.warn("CHAT:", event.message);

    if (!villageManager) return;

    const player = event.sender;
    const msg = event.message.trim();

                if (msg === "!마을") {

                event.cancel = true;

                player.sendMessage(
`§7========== §6마을 명령어 §7==========

    §f!마을
    §7=마을 관련 명령어를 표시합니다.

    §f!마을정보
    §7=소속된 마을의 정보를 표시합니다.

    §f!마을규칙
    §7=마을 규칙을 표시합니다

    §f!마을이동
    §7=소속된 마을로 이동합니다.

    §f!마을생성
    §7=마을을 생성합니다.

    §f!마을가입
    §7=가입이 가능한 마을의 목록을 표시합니다.

    §f!마을탈퇴
    §7=소속된 마을을 탈퇴합니다.

    §f!마을기부
    §7=마을에 기부금을 송금합니다.

    §f!마을방문
    §7=방문이 공개된 마을의 목록을 표시합니다.

§7===============================`
                );

                return;

            }


            if (msg === "!마을규칙") {

            event.cancel = true;

            system.run(() => {

                villageManager.showVillageRule(player, true);

            });

            return;

        }

        if (msg === "!마을정보") {

            event.cancel = true;

            system.run(() => {

                villageManager.showInfo(player);

            });

            return;

        }
    

        if (msg === "!villagereset") {

        event.cancel = true;

        system.run(() => {

            villageManager.reset();

        });

        player.sendMessage("§a모든 마을 데이터를 초기화했습니다.");

        return;

    }








    if (msg === "!마을이동") {

        event.cancel = true;

        system.run(() => {

            villageManager.teleport(player);

        });

        return;
    }


        if (msg === "!마을방문") {

        event.cancel = true;

        system.run(() => {

            villageManager.showVisitList(player);

        });

        return;

    }


    if (msg === "!마을정보") {

        event.cancel = true;

        system.run(() => {

            villageManager.showInfo(player);

        });

        return;
    }

    if (msg === "!마을생성") {

        event.cancel = true;

        if (villageManager.has(player)) {

            player.sendMessage("§c이미 마을에 소속되어 있습니다.");
            return;

        }

        system.run(() => {

            villageManager.showCreateForm(player);

        });

        return;

    }

    if (msg === "!마을가입") {

        event.cancel = true;

        if (villageManager.has(player)) {

            player.sendMessage("§c이미 마을에 소속되어 있습니다.");
            return;

        }

        system.run(() => {

            villageManager.showVillageList(player);

        });

        return;

    }

    if (msg === "!마을탈퇴") {

        event.cancel = true;

        if (!villageManager.has(player)) {

            player.sendMessage("§c소속된 마을이 없습니다.");
            return;

        }

        system.run(() => {

            villageManager.showLeaveConfirm(player);

        });

        return;

    }

    if (msg === "!마을기부") {

        event.cancel = true;

        if (!villageManager.has(player)) {

            player.sendMessage("§c소속된 마을이 없습니다.");
            return;

        }

        system.run(() => {

            villageManager.showDonateMenu(player);

        });

        return;

    }

});

/* ===========================
   Structure
=========================== */

function placeStarterVillage(player) {

    const village =
        villageManager.get(player);

    if (!village) return;

    try {

        world.structureManager.place(
            "villageplate",
            world.getDimension(VILLAGE_DIMENSION),
            {
                x: village.center.x - 2,
                y: village.center.y - 1,
                z: village.center.z - 2
            }
        );

    } catch (e) {

        console.warn(e);

    }

}

//--------- 마을 중심 보호-------------
world.beforeEvents.playerPlaceBlock.subscribe(event => {

    if (!villageManager) return;

    const player = event.player;

    if (player.hasTag("OP")) return;

    let village;

    // 방문 중인지 확인
    const visitId =
        player.getDynamicProperty(
            VISIT_PROPERTY
        );

    if (visitId) {

        village =
            villageManager.data.villages[
                visitId
            ];

        if (!village) return;

        const visitor =
            village.visitors?.[
                player.id
            ];

        // 방문자인데 건축 권한이 없으면 설치 금지
        if (!visitor?.canBuild) {

            event.cancel = true;

            player.sendMessage(
                "§c건축 권한이 없습니다."
            );

            return;

        }

    } else {

        // 자기 마을
        village =
            villageManager.get(player);

        if (!village) return;

    }

    // 마을 차원 아니면 무시
    if (player.dimension.id !== VILLAGE_DIMENSION)
        return;

    // ===== 마을 중심 보호 =====

    const block = event.block;

    if (
    Math.abs(block.location.x - village.center.x) <= 2 &&
    Math.abs(block.location.z - village.center.z) <= 2 &&
    block.location.y >= village.center.y - 3 &&
    block.location.y <= village.center.y + 10
        ) {

        event.cancel = true;

        player.sendMessage(
            "§c마을 중심 보호구역에는 블록을 설치할 수 없습니다."
        );

        return;

    }

});

world.beforeEvents.playerBreakBlock.subscribe(event => {

    if (!villageManager) return;

    const player = event.player;

    if (player.hasTag("OP")) return;

    const visitId =
        player.getDynamicProperty(
            VISIT_PROPERTY
        );

    if (visitId) {

        const village =
            villageManager.data.villages[
                visitId
            ];

        const visitor =
            village?.visitors?.[
                player.id
            ];

        if (!visitor?.canBuild) {

            event.cancel = true;

            player.sendMessage(
                "§c건축 권한이 없습니다."
            );

        }

        const block = event.block;

            if (
                CONTAINER_BLOCKS.includes(block.typeId)
            ) {

                const inventory =
                    block.getComponent("minecraft:inventory")?.container;

                if (inventory) {

                    let hasItem = false;

                    for (let i = 0; i < inventory.size; i++) {

                        if (inventory.getItem(i)) {

                            hasItem = true;
                            break;

                        }

                    }

                    if (hasItem) {

                        event.cancel = true;

                        player.sendMessage(
                            "§c내용물이 있는 컨테이너는 파괴할 수 없습니다."
                        );

                        return;

                    }

                }

            }

    }

});



const BUILD_ITEMS = [


    // 물/용암
    "minecraft:water_bucket",
    "minecraft:lava_bucket",

    // 물고기 양동이
    "minecraft:cod_bucket",
    "minecraft:salmon_bucket",
    "minecraft:pufferfish_bucket",
    "minecraft:tropical_fish_bucket",
    "minecraft:axolotl_bucket",
    "minecraft:tadpole_bucket",

    // 기타
    "minecraft:powder_snow_bucket",

    // 불
    "minecraft:flint_and_steel",
    "minecraft:fire_charge",

    // 성장
    "minecraft:bone_meal"

];

world.beforeEvents.playerInteractWithBlock.subscribe(event => {

    if (!villageManager) return;

    const player = event.player;

    if (player.hasTag("OP")) return;

    // 자기 마을원은 허용
    if (villageManager.has(player)) return;

    const visitId =
        player.getDynamicProperty(VISIT_PROPERTY);

    if (!visitId) return;

    const village =
        villageManager.data.villages[visitId];

    if (!village) return;

    const visitor =
        village.visitors?.[player.id];

    if (visitor?.canBuild) return;

    const item = event.itemStack;

    if (!item) return;

    if (!BUILD_ITEMS.includes(item.typeId))
        return;

    event.cancel = true;

    player.sendMessage(
        "§c건축 권한이 없습니다."
    );

});

const CONTAINER_BLOCKS = [

    "minecraft:chest",
    "minecraft:trapped_chest",
    "minecraft:barrel",

    "minecraft:hopper",

    "minecraft:dropper",
    "minecraft:dispenser",

    "minecraft:furnace",
    "minecraft:blast_furnace",
    "minecraft:smoker",

    "minecraft:crafter",

    "minecraft:brewing_stand",

    "minecraft:chiseled_bookshelf",

    "minecraft:lectern"

];

world.beforeEvents.playerInteractWithBlock.subscribe(event => {

    if (!villageManager) return;

    const player = event.player;

    if (player.hasTag("OP")) return;

    // 자기 마을원이면 통과
    if (villageManager.has(player))
        return;

    const visitId =
        player.getDynamicProperty(
            VISIT_PROPERTY
        );

    if (!visitId) return;

    const village =
        villageManager.data.villages[
            visitId
        ];

    if (!village) return;

    const block = event.block;

    if (!block) return;

    // 엔더상자 / 셜커는 기존 보호 스크립트 사용
    if (
        block.typeId === "minecraft:ender_chest" ||
        block.typeId.includes("shulker_box")
    ) {

        return;

    }

    if (
        CONTAINER_BLOCKS.includes(
            block.typeId
        )
    ) {

        event.cancel = true;

        player.sendMessage(
            "§c해당 블록은 마을원 권한 이상부터 접근할 수 있습니다."
        );

    }

});

/* ===========================
   TODO
=========================== */

/*

v1.1

- 초대
- 탈퇴
- 기부
- 멤버 목록

v1.2

- 레벨업
- 건물

v2

- NPC
- 생산시설
- 창고
- 랭킹
- 길드전

*/