import { world, system, ItemStack, EntitySwingSource, Player, EquipmentSlot, InputButton, EnchantmentType, ItemLockMode } from "@minecraft/server";



import "./scriptEvent.js";
import "./debug.js";

import "./endopen.js";
import "./actionbarinfo.js";
import "./demenssion.js";
import "./etc.js";
import "./Farmer.js";
import "./wishgacha.js";
import "./Miner.js";
import "./shulker.js";
import "./village.js";
import "./clover.js";
import "./namesystem.js"
import "./quest.js"
import "./opening.js"




const objectives = ["world", "health", "level", "xpEarnedCurrentLevel", "totalXpNeededToNextLevel", "xpNeededToNextLevel", "x", "y", "z", "viewX", "viewY", "viewZ", "disable_message", "selectedSlot", 'velocity', 'damageDealt', 'playerUUID', 'knockbackX', 'knockbackY', 'disable_interact_with_entity', 'disable_item_pickup', 'disable_interact_with_block', 'disable_hurt_with_entity', 'disable_place_block', 'disable_break_block', 'riderSeat', 'moonPhase', 'tpX', 'tpY', 'tpZ', 'spawnX', 'spawnY', 'spawnZ', 'applyKBX', 'applyKBZ', 'applyKBV', 'damageTaken', 'airSupply', 'hunger'];
world.afterEvents.worldLoad.subscribe(() => {
    for (const objective of objectives) {
        if (!world.scoreboard.getObjective(objective)) {
            world.scoreboard.addObjective(objective, objective)
        }
    }
});
const dimensions = ['nether', 'overworld', 'the_end'];
//FUNCTIONS
Object.defineProperty(Player.prototype, 'isCrawling', {
    get() {
        const distance = this.getHeadLocation().y - this.location.y
        return distance < 0.31 && !this.isSwimming && !this.isGliding && !this.isSleeping;
    }
});
function checkDisable(ev, action, obj, target) {
    const player = ev.player ?? ev.sender ?? ev.damageSource?.damagingEntity ?? ev.entity;
    const blockType = target?.replace('minecraft:', '') ?? null;
    if (!player?.hasTag) return;
    if (player && player.hasTag(`disable:${action}`) || (blockType && player.hasTag(`disable:${action}(${blockType})`))) {
        ev.cancel = true;
        return true;
    }
    if (!obj) return false;
    const disabledBlocks = world.scoreboard.getObjective(obj);
    const blocks = disabledBlocks.getParticipants().map(block => block.displayName);
    if (blocks.includes(blockType)) {
        ev.cancel = true;
        return true;
    }
    return false;
}

function addScores(p, amounts, objectives) {
    for (let i = 0; i < amounts.length; i++) {
        setScore(p, objectives[i], amounts[i]);
    }
}

function removeScores(p, objectives) {
    system.runTimeout(() => {
        objectives.forEach(obj => {
            removeScore(p, obj);
        })
    }, 1)
}

const getTpScore = (p, o) => {
    try {
        return world.scoreboard.getObjective(o)?.getScores().find(par => par.participant.getEntity() == p)?.score ?? NaN;
    } catch (error) {
        return NaN
    }
}
const removeScore = (p, o) => {
    world.scoreboard.getObjective(o)?.removeParticipant(p);
}
const setScore = (p, o, a) => {
    let objective = world.scoreboard.getObjective(o);
    if (!objective) {
        objective = world.scoreboard.addObjective(o, o);
    }
    objective.setScore(p, a)
}
function handleBlockEvent(player, id, action, location, dimension = null) {
    const { x, y, z } = location;
    system.run(() => {
        addScores(player, [x, y, z], [`${action}X`, `${action}Y`, `${action}Z`]);
        player.addTag(action + ':' + id);
        player.addTag(action);
        removeTag(player, action);
        removeScores(player, [`${action}X`, `${action}Y`, `${action}Z`]);
    });
}
function rideableFunction(isRiding, player) {
    const seatObjective = world.scoreboard.getObjective('riderSeat');
    const lastTags = player.getTags().filter(tag => tag.startsWith('isRiding'));
    const lastId = lastTags.find(tag => tag.startsWith('isRiding:'))?.slice(9);
    const lastNameTag = lastTags.find(tag => tag.startsWith('isRidingNameTag:'))?.slice(16);

    if (isRiding) {
        const entity = isRiding.entityRidingOn;
        const currentId = entity.typeId.replace('minecraft:', '');
        const currentNameTag = entity.nameTag;

        if (lastId !== currentId || lastNameTag !== currentNameTag) {
            lastTags.forEach(tag => player.removeTag(tag));
        }

        const riders = entity.getComponent('rideable').getRiders();
        const riderIndex = riders.findIndex(rider => rider.id === player.id);
        player.addTag(`isRiding:${currentId}`);
        player.addTag('isRiding');
        if (currentNameTag) player.addTag(`isRidingNameTag:${currentNameTag}`);
        seatObjective?.setScore(player, riderIndex);
    } else if (lastTags.length > 0) {
        seatObjective?.removeParticipant(player);
        lastTags.forEach(tag => player.removeTag(tag));
    }
}

function chatNumberControl(player, numbers) {
    numbers.forEach(({ index, number }) => {
        if (number > 2147483647) return;
        const chatNumber = `chatNumber:${index}`;
        let objective = world.scoreboard.getObjective(chatNumber);
        if (!objective) {
            objective = world.scoreboard.addObjective(chatNumber);
        }
        objective.setScore(player, number);
        system.runTimeout(() => {
            if (world.scoreboard.getObjective(chatNumber).getParticipants().length == 1) {
                world.scoreboard.removeObjective(objective);
            } else {
                objective.removeParticipant(player);
            }
        }, 1)
    })
}

function chatSelectorsAndNumbers(sender, message) {
    const newMessage = message.slice(0, 50);
    const words = newMessage.split(' ');
    const numbers = [];
    let numCounter = 0;
    const updatedWords = words.map((word) => {
        const number = parseInt(word, 10);
        if (!isNaN(number) && word === number.toString()) {
            numbers.push({ index: numCounter, number: number });
            numCounter++;
            return `<chatNumber>`;
        }
        return word;
    });
    let updatedMessage = updatedWords.join(' ');
    const messageTargets = newMessage.match(/@\w+|@"[^"]+"/g) || [];
    const allPlayers = world.getAllPlayers();
    const realTargets = [];
    messageTargets.forEach((target) => {
        const playerName = target.startsWith('@\"') ? target.slice(2, -1) : target.slice(1);
        const player = allPlayers.find(player => player.name === playerName);
        if (player) {
            realTargets.push({ player });
            const regex = target.startsWith('@\"') ? new RegExp(`@\"${playerName}\"`, 'g') : new RegExp(`@${playerName}`, 'g');
            updatedMessage = updatedMessage.replace(regex, '<chatTarget>');
        }
    });
    if (realTargets.length) {
        let tarCounter = 0;
        system.run(() => {
            realTargets.forEach(({ player }) => {
                player.addTag(`chatTarget(${tarCounter})`);
                player.addTag('chatTarget');
                removeTag(player, 'chatTarget');
                tarCounter++;
            });
        })
    }
    if (numbers.length) {
        system.run(() => {
            chatNumberControl(sender, numbers);
        })
    }
    return updatedMessage;
}
function getNeccesaryItemTags(player) {
    const equipment = player.getComponent('equippable');
    const equipmentSlots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand, EquipmentSlot.Mainhand];

    equipmentSlots.forEach(slot => {
        const item = equipment.getEquipment(slot);
        const durabilityComponent = item?.getComponent('durability');
        const itemData = {
            nameTag: item?.nameTag ?? null,
            typeId: item?.typeId?.replace('minecraft:', '') ?? 'air',
            amount: item?.amount ?? 0,
            durability: durabilityComponent?.damage ?? 0,
            maxDurability: durabilityComponent?.maxDurability ?? 0,
            currentDurability: (durabilityComponent?.maxDurability ?? 0) - (durabilityComponent?.damage ?? 0),
        };
        if (itemData.typeId) player.addTag(`equipmentSlot${slot}:${itemData.typeId}`);
        if (itemData.nameTag) player.addTag(`equipmentSlot${slot}NameTag:${itemData.nameTag}`);
        const objectives = [
            { name: `durability${slot}`, value: itemData.durability },
            { name: `maxDurability${slot}`, value: itemData.maxDurability },
            { name: `currentDurability${slot}`, value: itemData.currentDurability },
            { name: `amount${slot}`, value: itemData.amount },
        ];
        objectives.forEach(({ name, value }) => {
            const objective = world.scoreboard.getObjective(name) || world.scoreboard.addObjective(name, name);
            objective.setScore(player, value);
        });
        const playerTags = player.getTags();
        if (playerTags.filter(tag => tag.startsWith(`equipmentSlot${slot}:`)).length > 1) {
            removeTag(player, `equipmentSlot${slot}:`);
        };
        const nameTagTag = playerTags.find(tag => tag.startsWith(`equipmentSlot${slot}NameTag:`));
        if (nameTagTag !== `equipmentSlot${slot}NameTag:${itemData.nameTag || ''}`) {
            if (!itemData.nameTag || nameTagTag) {
                removeTag(player, `equipmentSlot${slot}NameTag:`);
            }
        }
    });
}

function removeTag(player, starts) {
    const tags = player.getTags().filter(tag => tag.startsWith(starts));
    if (!tags.length) return;
    system.runTimeout(() => {
        for (const tag of tags) {
            player.removeTag(tag);
        }
    }, 1);
}

const getScore = (p, o) => world.scoreboard.getObjective(o)?.getScore(p) ?? 0;

function applyTagIfTrue(player, propertyName) {
    if (player[propertyName]) {
        player.addTag(propertyName);
    } else {
        player.removeTag(propertyName);
    }
};
function setDimensionTag(player, actualDimension) {
    const dimensionTags = player.getTags().filter(tag => tag.startsWith('dimension:'));
    for (const tag of dimensionTags) {
        if (tag.split(':')[1] !== actualDimension) {
            player.removeTag(tag);
        }
    }
    player.addTag('dimension:' + actualDimension);
}

function getBlockFromViewDirection(player, blockView, location) {
    const viewTags = player.getTags().filter(tag => tag.startsWith('blockFromViewDirection:'));
    for (const tag of viewTags) {
        if (tag.split(':')[1] !== blockView) {
            player.removeTag(tag);
        }
    }
    player.addTag('blockFromViewDirection:' + blockView);
    const viewX = world.scoreboard.getObjective('viewX');
    const viewY = world.scoreboard.getObjective('viewY');
    const viewZ = world.scoreboard.getObjective('viewZ');
    if (location) {
        viewX.setScore(player, location.x);
        viewY.setScore(player, location.y);
        viewZ.setScore(player, location.z);
    } else {
        viewX.removeParticipant(player);
        viewY.removeParticipant(player);
        viewZ.removeParticipant(player);
    }
};

function updateObjectiveScore(objective, objectiveName, player, scoreValue) {
    let obj = objective.getObjective(objectiveName);
    if (!obj) {
        objective.addObjective(objectiveName);
        obj = objective.getObjective(objectiveName);
    }
    obj.setScore(player, scoreValue);
};

function effectControl(players) {
    const objective = world.scoreboard;
    players.forEach(player => {
        const currentEffects = player.getEffects();
        const currentEffectTypes = currentEffects.map(effect => effect.typeId);
        const currentEffectTags = player.getTags().filter(tag => tag.startsWith('hasEffect:'));
        currentEffectTags.forEach(tag => {
            const effectType = tag.split(':')[1];
            if (!currentEffectTypes.includes(effectType)) {
                player.removeTag(tag);
            }
        });
        if (currentEffects.length === 0 && player.hasTag('hasEffect')) {
            player.removeTag('hasEffect');
        }
        if (currentEffects.length > 0) {
            player.addTag('hasEffect');
            currentEffects.forEach(effect => {
                const effectType = effect.typeId;
                player.addTag(`hasEffect:${effectType}`);
                updateObjectiveScore(objective, `${effectType}:duration`, player, effect.duration == -1 ? effect.duration : effect.duration / 20);
                updateObjectiveScore(objective, `${effectType}:amplifier`, player, effect.amplifier);
            });
        }
    });
    const objectives = objective.getObjectives().filter(obj => obj.id.includes(':duration') || obj.id.includes(':amplifier'));
    objectives.forEach(object => {
        const playersWithEffect = players.some(player => {
            const effects = player.getEffects();
            return effects.some(effect => object.id === `${effect.typeId}:duration` || object.id === `${effect.typeId}:amplifier`);
        });

        if (!playersWithEffect) {
            objective.removeObjective(object);
        }
    });
};

function enchantmentControl(players) {
    const objective = world.scoreboard;
    players.forEach(player => {
        const selectedItem = player.getComponent('inventory')?.container?.getItem(player.selectedSlotIndex);
        const enchantments = selectedItem?.getComponent('enchantable')?.getEnchantments() || [];
        const currentEnchantTags = player.getTags().filter(tag => tag.startsWith('hasEnchantment:'));
        currentEnchantTags.forEach(tag => {
            const enchantmentType = tag.split(':')[1];
            const hasEnchantment = enchantments.some(enchant => enchant.type.id === enchantmentType);
            if (!hasEnchantment) {
                player.removeTag(tag);
            }
        });
        if (enchantments.length === 0 && player.hasTag('hasEnchantment')) {
            player.removeTag('hasEnchantment');
        }
        if (enchantments.length > 0) {
            player.addTag('hasEnchantment');
            enchantments.forEach(enchant => {
                const enchantmentType = enchant.type.id;
                const enchantmentLevel = enchant.level;
                player.addTag(`hasEnchantment:${enchantmentType}`);
                updateObjectiveScore(objective, `${enchantmentType}:level`, player, enchantmentLevel);
            });
        }
    });//console.warn
    const objectives = objective.getObjectives().filter(obj => obj.id.includes(':level'));
    objectives.forEach(object => {
        const playersWithEnchantment = players.some(player => {
            const selectedItem = player.getComponent('inventory')?.container?.getItem(player.selectedSlotIndex);
            const enchantments = selectedItem?.getComponent('enchantable')?.getEnchantments() || [];
            return enchantments.some(enchant => object.id === `${enchant.type.id}:level`);
        });

        if (!playersWithEnchantment) {
            objective.removeObjective(object);
        }
    });
};
function getEntitiesFromViewDirection(player) {
    const entitiesInView = player.getEntitiesFromViewDirection({ maxDistance: 20 });
    const entityTags = player.getTags().filter(tag => tag.startsWith('entityFromViewDirection:'));
    const entityNameTags = player.getTags().filter(tag => tag.startsWith('entityFromViewDirectionNameTag:'));
    for (const tag of entityTags) {
        const entityId = tag.split(':')[1];
        if (!entitiesInView.some(ent => ent.entity.typeId == entityId)) {
            player.removeTag(tag);
        }
    }
    for (const tag of entityNameTags) {
        const entityName = tag.split(':')[1];
        if (!entitiesInView.some(ent => ent.entity?.nameTag == entityName)) {
            player.removeTag(tag);
        }
    }
    for (const entityInView of entitiesInView) {
        const entity = entityInView.entity;
        if (!entityTags.includes('entityFromViewDirection:' + entity.typeId.replace('minecraft:', ''))) {
            player.addTag('entityFromViewDirection:' + entity.typeId.replace('minecraft:', ''));
        }
        if (entity?.nameTag && !entityNameTags.includes('entityFromViewDirectionNameTag:' + entity?.nameTag)) {
            player.addTag('entityFromViewDirectionNameTag:' + entity.nameTag);
        }
    }
};

//EVENTS

//ENTITIES 
world.afterEvents.entityHitEntity.subscribe(ev => {
    ev.damagingEntity.addTag('damagingEntity');
    ev.damagingEntity.addTag('damagingEntity:' + ev.hitEntity.typeId.replace('minecraft:', ''));
    ev.hitEntity.addTag('hitEntity');
    ev.hitEntity.addTag('hitEntity:' + ev.damagingEntity.typeId.replace('minecraft:', ''));
    removeTag(ev.damagingEntity, 'damagingEntity');
    removeTag(ev.hitEntity, 'hitEntity');
    const knockbackObjectives = ['knockbackX', 'knockbackY'];
    const [x, y] = knockbackObjectives.map(knockbackObjective => {
        const oj = world.scoreboard.getObjective(knockbackObjective);
        try { return oj?.getScore(ev.damagingEntity) } catch (error) { return null }
    })
    if (x != null || y != null) {
        const { x: xView, z: zView } = ev.damagingEntity.getViewDirection();
        ev.hitEntity.applyKnockback({ x: xView * x ?? 0, z: zView * x ?? 0 }, (y ?? 0) / 10);
    }
});
world.afterEvents.entityHurt.subscribe(ev => {
    if (ev.hurtEntity.typeId == 'bcd:ent') return;
    ev.hurtEntity.addTag('hurtEntity');
    ev.hurtEntity.addTag('hurtEntity:' + ev.damageSource.cause);
    removeTag(ev.hurtEntity, 'hurtEntity');
    const receivedDamage = world.scoreboard.getObjective('damageTaken');
    receivedDamage.setScore(ev.hurtEntity, ev.damage);
    system.runTimeout(() => {
        receivedDamage.removeParticipant(ev.hurtEntity);
    }, 1)
    //if (ev.damageSource.damagingEntity?.typeId == 'minecraft:player') {
    const ent = ev.damageSource.damagingEntity;
    if (!ent?.isValid) return;
    const damageScore = world.scoreboard.getObjective('damageDealt');

    damageScore.setScore(ent, ev.damage);
    system.runTimeout(() => {
        damageScore.removeParticipant(ent);
    }, 1)
    //}
});
world.afterEvents.entityDie.subscribe(ev => {
    if (ev?.damageSource?.damagingEntity) {
        ev?.damageSource?.damagingEntity?.addTag('murderEntity');
        system.runTimeout(() => {
            ev.damageSource.damagingEntity.removeTag('murderEntity');
        }, 1)
    }
    if (ev.deadEntity.typeId !== 'minecraft:player') return;
    ev.deadEntity.addTag('deadEntity');
    system.runTimeout(() => {
        ev.deadEntity.removeTag('deadEntity');
    }, 1)
});
world.afterEvents.projectileHitEntity.subscribe(ev => {
    const projectileSource = ev.source;
    if (!projectileSource) return;
    const projectileHitEntity = ev.getEntityHit()?.entity;
    projectileSource?.addTag('projectileSourceHitEntity');
    projectileSource?.addTag(`projectileSourceHitEntityProjectileId:${ev.projectile.typeId.replace('minecraft:', '')}`);
    projectileHitEntity && projectileSource?.addTag(`projectileSourceHitEntityEntityId:${projectileHitEntity?.typeId}`);
    removeTag(projectileSource, 'projectileSourceHitEntity');
    projectileHitEntity && projectileHitEntity?.addTag('projectileHitEntity');
    projectileHitEntity && projectileHitEntity?.addTag(`projectileHitEntityProjectileId:${ev.projectile.typeId.replace('minecraft:', '')}`);
    removeTag(projectileHitEntity, 'projectileHitEntity');
});
world.afterEvents.projectileHitBlock.subscribe(ev => {
    const projectileHitBlock = ev.getBlockHit().block;
    const projectileSource = ev.source;
    if (!projectileSource) return;
    projectileSource?.addTag('projectileSourceHitBlock');
    projectileSource?.addTag(`projectileSourceHitBlockProjectileId:${ev.projectile.typeId.replace('minecraft:', '')}`);
    projectileHitBlock && projectileSource.addTag(`projectileSourceHitBlockBlockId:${projectileHitBlock.typeId.replace('minecraft:', '')}`);
    removeTag(projectileSource, 'projectileSourceHitBlock');
});
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
    system.run(() => {
        ev.player.addTag('interactWithEntity');
        ev.target && ev.player.addTag('interactWithEntity:' + ev.target.typeId.replace('minecraft:', ''));
        removeTag(ev.player, 'interactWithEntity');
    });
});
//BLOCKS
world.beforeEvents.playerInteractWithBlock.subscribe(ev => handleBlockEvent(ev.player, ev.block.typeId.replace('minecraft:', ''), 'blockInteract', ev.block.location, ev.block.dimension));
world.beforeEvents.playerBreakBlock.subscribe(ev => handleBlockEvent(ev.player, ev.block.typeId.replace('minecraft:', ''), 'blockBreak', ev.block.location, ev.block.dimension));
world.beforeEvents.playerPlaceBlock.subscribe(ev => handleBlockEvent(ev.player, ev.permutationToPlace.type.id.replace('minecraft:', ''), 'blockPlace', ev.block.location, ev.block.dimension));
world.afterEvents.entityHitBlock.subscribe(ev => handleBlockEvent(ev.damagingEntity, ev.hitBlockPermutation.type.id.replace('minecraft:', ''), 'hitBlock', ev.hitBlock.location, ev.hitBlock.dimension));

world.beforeEvents.chatSend.subscribe(ev => checkDisable(ev, 'chat'));
world.beforeEvents.playerBreakBlock.subscribe(ev => checkDisable(ev, 'break', 'disable_break_block', ev.block.typeId, { dimension: ev.dimension, location: ev.block.location }));
world.beforeEvents.playerPlaceBlock.subscribe(ev => checkDisable(ev, 'place', 'disable_place_block', ev.permutationToPlace.type.id, { dimension: ev.dimension, location: ev.block.location }));
world.beforeEvents.playerInteractWithBlock.subscribe(ev => checkDisable(ev, 'blockInteract', 'disable_interact_with_block', ev.block.typeId, { dimension: ev.block.dimension, location: ev.block.location }));
world.beforeEvents.playerInteractWithEntity.subscribe(ev => checkDisable(ev, 'entityInteract', 'disable_interact_with_entity', ev.target.typeId));
world.beforeEvents.entityHurt.subscribe(ev => checkDisable(ev, 'entityHurt', 'disable_hurt_with_entity', ev.hurtEntity.typeId))
world.beforeEvents.entityItemPickup.subscribe(ev => checkDisable(ev, 'itemPickup', 'disable_item_pickup', ev.item.getComponent('item').itemStack.typeId))


//dropitem





world.afterEvents.entityItemDrop.subscribe((event) => {
    const player = event.source;
    const itemStack = event.itemStack;

    if (!player || !itemStack) return;

    const itemId = itemStack.typeId.replace("minecraft:", "");

    system.run(() => {
        player.addTag(`dropItem:${itemId}`);
    });
});


//ITEMS
world.afterEvents.itemUse.subscribe(ev => {
    ev.source.addTag('itemUse:' + ev.itemStack.typeId.replace('minecraft:', ''));
    ev.itemStack.nameTag && ev.source.addTag('itemUseNameTag:' + ev.itemStack.nameTag.replace(/\n/g, '<br>'));
    ev.source.addTag('itemUse');
    removeTag(ev.source, 'itemUse')
});
world.afterEvents.itemCompleteUse.subscribe(ev => {
    const item = ev.itemStack;
    ev.source.addTag('itemCompleteConsume');
    ev.source.addTag(`itemCompleteConsume:${item.typeId.replace('minecraft:', '')}`);
    item?.nameTag && ev.source.addTag(`itemCompleteConsumeNameTag:${item.nameTag.replace(/\n/g, '<br>')}`);
    removeTag(ev.source, 'itemCompleteConsume');
});
world.afterEvents.itemStopUse.subscribe(ev => {
    const item = ev.itemStack;
    ev.source.addTag('itemStopConsume');
    ev.source.addTag(`itemStopConsume:${item?.typeId?.replace('minecraft:', '')}`);
    item?.nameTag && ev.source.addTag(`itemStopConsumeNameTag:${item.nameTag.replace(/\n/g, '<br>')}`);
    removeTag(ev.source, 'itemStopConsume');
});
world.afterEvents.itemStartUse.subscribe(ev => {
    const item = ev.itemStack;
    ev.source.addTag('itemStartConsume');
    ev.source.addTag(`itemStartConsume:${item.typeId.replace('minecraft:', '')}`);
    item?.nameTag && ev.source.addTag(`itemStartConsumeNameTag:${item.nameTag.replace(/\n/g, '<br>')}`);
    removeTag(ev.source, 'itemStartConsume');
});
//damageDealt
//OTHERS
system.runInterval(() => {
    const worldscores = world.scoreboard.getObjective('world');
    const entities = world.getDimension('minecraft:overworld').getEntities();
    const players = entities.filter(plr => plr.typeId === 'minecraft:player');
    const items = entities.filter(item => item.typeId === 'minecraft:item');
    const mobs = entities.filter(mob => mob.typeId !== 'minecraft:player' && mob.typeId !== 'minecraft:item');
    const timeOfDay = world.getTimeOfDay();
    const day = world.getDay();
    const moon = world.getMoonPhase();
    worldscores.setScore('day', day)
    worldscores.setScore('timeOfDay', timeOfDay)
    worldscores.setScore('allEntities', entities.length);
    worldscores.setScore('players', players.length);
    worldscores.setScore('items', items.length);
    worldscores.setScore('mobs', mobs.length)
    worldscores.setScore('moonPhase', moon);
}, 5);
world.afterEvents.weatherChange.subscribe(ev => {
    const weather = world.scoreboard.getObjective('world');
    const weatherScores = { Clear: 0, Rain: 1, Thunder: 2 };
    weather.setScore('weatherState', weatherScores[ev.newWeather] ?? 0);
});

world.beforeEvents.chatSend.subscribe(ev => {
    const updatedMessage = chatSelectorsAndNumbers(ev.sender, ev.message);
    system.run(() => {
        ev.sender.addTag(`chatSend:${updatedMessage}`);
        ev.sender.addTag('chatSend')
        ev.sender.addTag('chatSend:' + ev.message.slice(0, 50));
        removeTag(ev.sender, 'chatSend')
    })
    const disabled_score = world.scoreboard.getObjective('disable_message');
    const message_list = disabled_score.getParticipants();
    for (const m of message_list) {
        if (ev.message === m.displayName || m.displayName === 'all' || updatedMessage === m.displayName) {
            ev.cancel = true;
        }
    }
});
//PLAYER
world.afterEvents.playerDimensionChange.subscribe(ev => {
    ev.player.addTag('dimensionChange');
    ev.player.addTag(`dimensionChangeTo:${ev.toDimension.id.replace('minecraft:', '')}`);
    ev.player.addTag(`dimensionChangeFrom:${ev.fromDimension.id.replace('minecraft:', '')}`);
    removeTag(ev.player, 'dimensionChange');
});
world.afterEvents.playerGameModeChange.subscribe(ev => {
    ev.player.addTag('gamemodeChange');
    ev.player.addTag(`gamemodeChangeTo:${ev.toGameMode}`);
    ev.player.addTag(`gamemodeChangeFrom:${ev.fromGameMode}`);
    removeTag(ev.player, 'gamemodeChange');
});


system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const hunger = world.scoreboard.getObjective('hunger');
        const airSupply = world.scoreboard.getObjective('airSupply');
        const level = world.scoreboard.getObjective('level');
        const earnedAtCurrentLevel = world.scoreboard.getObjective('xpEarnedCurrentLevel');
        const totalNeededToNextLevel = world.scoreboard.getObjective('totalXpNeededToNextLevel');
        const neededToNextLevel = world.scoreboard.getObjective('xpNeededToNextLevel');
        hunger.setScore(player, player.getComponent('minecraft:player.hunger').currentValue)
        airSupply.setScore(player, player.getComponent("minecraft:breathable").airSupply);
        level.setScore(player, player.level);
        earnedAtCurrentLevel.setScore(player, player.xpEarnedAtCurrentLevel);
        totalNeededToNextLevel.setScore(player, player.totalXpNeededForNextLevel);
        neededToNextLevel.setScore(player, getScore(player, 'totalXpNeededToNextLevel') - getScore(player, 'xpEarnedCurrentLevel'));
        setDimensionTag(player, player.dimension.id.replace('minecraft:', ''));
        const lastLevel = player.getDynamicProperty('lastLevel') ?? 0;
        if (lastLevel != player.level && lastLevel < player.level) {
            player.setDynamicProperty('lastLevel', player.level);
            player.addTag('levelUp');
            removeTag(player, 'levelUp');
        } else if (lastLevel > player.level) {
            player.setDynamicProperty('lastLevel', player.level);
        }
    }
}, 5);

system.runInterval(() => {
    const entities = dimensions.flatMap(dimensionId => {
        const dimension = world.getDimension(dimensionId);
        const dimensionsEntities = dimension.getEntities({ tags: ['BCD'], excludeTypes: ['item'] });
        return dimensionsEntities;
    });
    entities.forEach(entity => {
        const tpX = getTpScore(entity, 'tpX');
        const tpY = getTpScore(entity, 'tpY');
        const tpZ = getTpScore(entity, 'tpZ');
        if (!isNaN(tpX) && !isNaN(tpY) && !isNaN(tpZ)) {
            let dimension = entity.dimension;
            const tDimension = entity.getTags().find(tag => tag.startsWith('tpDimension:'));
            if (tDimension && dimensions.includes(tDimension.slice(12))) {
                dimension = world.getDimension(tDimension.replace('tpDimension:', ''));
                entity.removeTag(tDimension);
            } else if (tDimension) {
                entity.sendMessage('§cError: The established dimension does not exist!');
                entity.removeTag(tDimension);
            }
            entity.teleport({ x: tpX, y: tpY, z: tpZ }, { dimension: dimension });
            removeScore(entity, 'tpX');
            removeScore(entity, 'tpY');
            removeScore(entity, 'tpZ');
        }
    })
    const players = world.getAllPlayers()
    for (const player of players) {
        const current = player.getComponent('minecraft:health').currentValue
        const health = world.scoreboard.getObjective('health');
        const spawnX = world.scoreboard.getObjective('spawnX');
        const spawnY = world.scoreboard.getObjective('spawnY');
        const spawnZ = world.scoreboard.getObjective('spawnZ');
        const x = world.scoreboard.getObjective('x');
        const y = world.scoreboard.getObjective('y');
        const z = world.scoreboard.getObjective('z');
        const selectedSlot = world.scoreboard.getObjective('selectedSlot');
        const speedScore = world.scoreboard.getObjective('velocity');
        const velocity = player.getVelocity();
        const xSpeed = velocity.x;
        const zSpeed = velocity.z;
        const speed = parseInt((Math.sqrt(xSpeed ** 2 + zSpeed ** 2) * 20).toFixed(0));

        const playerTags = player.getTags();

        selectedSlot.setScore(player, player.selectedSlotIndex);
        x.setScore(player, Math.floor(player.location.x));
        y.setScore(player, Math.floor(player.location.y));
        z.setScore(player, Math.floor(player.location.z));

        const spawnCords = player.getSpawnPoint();
        const currentDimension = spawnCords?.dimension?.id?.replace('minecraft:', '') ?? 'overworld';
        playerTags
            .filter(tag => tag.startsWith('spawnDimension:') && tag !== `spawnDimension:${currentDimension}`)
            .forEach(tag => player.removeTag(tag));

        if (!player.hasTag(`spawnDimension:${currentDimension}`)) {
            player.addTag(`spawnDimension:${currentDimension}`);
        }
        const playerOS = player.clientSystemInfo.platformType;
        playerTags
            .filter(tag => tag.startsWith('os:') && tag !== `os:${playerOS}`)
            .forEach(tag => player.removeTag(tag));

        if (!player.hasTag(`os:${playerOS}`)) {
            player.addTag(`os:${playerOS}`);
        }
        Object.values(InputButton).forEach(button => {
            const state = player.inputInfo.getButtonState(button);
            player.getTags().filter(tag => tag.startsWith(`input${button}`)).forEach(tag => player.removeTag(tag));
            player.addTag(`input${button}:${state}`);
        });
        const permissionLevel = player.playerPermissionLevel;
        ['isVisitor', 'isMember', 'isOp', 'isCustomPermissionLevel'].forEach((tag, index) => {
            (permissionLevel === index ? player.addTag(tag) : player.removeTag(tag));
        });
        spawnCords?.x ? spawnX.setScore(player, spawnCords.x) : spawnX.hasParticipant(player) ? spawnX.removeParticipant(player) : null;
        spawnCords?.y ? spawnY.setScore(player, spawnCords.y) : spawnY.hasParticipant(player) ? spawnY.removeParticipant(player) : null;
        spawnCords?.z ? spawnZ.setScore(player, spawnCords.z) : spawnZ.hasParticipant(player) ? spawnZ.removeParticipant(player) : null;

        speedScore.setScore(player, speed);
        health.setScore(player, current);

        const tags = [
            'isFalling', 'isClimbing', 'isFlying', 'isGliding', 'isInWater',
            'isJumping', 'isOnGround', 'isSneaking', 'isSprinting', 'isSwimming',
            'isSleeping', 'isEmoting', 'isCrawling'
        ];
        tags.forEach(tag => applyTagIfTrue(player, tag));

        const isMoving = player.getVelocity().x ** 2 + player.getVelocity().y ** 2 + player.getVelocity().z ** 2 >= 0.000009;
        isMoving ? player.addTag('isMoving') : player.removeTag('isMoving')
        getNeccesaryItemTags(player);

        const isRiding = player.getComponent('riding');
        rideableFunction(isRiding, player)
        let blockFromViewDirection = 'air'
        let blockInView;
        if (player?.getBlockFromViewDirection({ maxDistance: 20 })) {
            const blockFromViewDirectionId = player.getBlockFromViewDirection({ maxDistance: 20 }).block
            blockFromViewDirection = blockFromViewDirectionId.typeId.replace('minecraft:', '');
            const locationBlock = blockFromViewDirectionId.location;
            blockInView = locationBlock;
        }//level
        const tpX = getTpScore(player, 'tpX');
        const tpY = getTpScore(player, 'tpY');
        const tpZ = getTpScore(player, 'tpZ');
        if (!isNaN(tpX) && !isNaN(tpY) && !isNaN(tpZ)) {
            let dimension = player.dimension;
            const tDimension = playerTags.find(tag => tag.startsWith('tpDimension:'));
            if (tDimension && dimensions.includes(tDimension.slice(12))) {
                dimension = world.getDimension(tDimension.replace('tpDimension:', ''));
                player.removeTag(tDimension);
            } else if (tDimension) {
                player.sendMessage('§cError: The established dimension does not exist!');
                player.removeTag(tDimension);
            }
            player.teleport({ x: tpX, y: tpY, z: tpZ }, { dimension: dimension });
            removeScore(player, 'tpX');
            removeScore(player, 'tpY');
            removeScore(player, 'tpZ');
        }
        const knX = getTpScore(player, 'applyKBX');
        const knZ = getTpScore(player, 'applyKBZ');
        const knsV = getTpScore(player, 'applyKBV');
        if (!isNaN(knX) && !isNaN(knZ) && !isNaN(knsV)) {
            player.applyKnockback({ x: knX, z: knZ }, knsV / 10)
            removeScore(player, 'applyKBX');
            removeScore(player, 'applyKBZ');
            removeScore(player, 'applyKBV');
        }
        getBlockFromViewDirection(player, blockFromViewDirection, blockInView);
        getEntitiesFromViewDirection(player);

    }
    effectControl(players);
    enchantmentControl(players);
}, 1);
world.afterEvents.playerSpawn.subscribe(ev => {
    world.scoreboard.getObjective('playerUUID')?.setScore(ev.player, parseInt(ev.player.id.slice(0, -4)));
    ev.player.addTag('playerSpawn');
    removeTag(ev.player, 'playerSpawn');
    if (ev.initialSpawn) {
        ev.player.addTag('playerInitialSpawn');
        removeTag(ev.player, 'playerInitialSpawn');
    }
});
const swingCache = new Map();
world.afterEvents.playerSwingStart.subscribe(ev => {
    const player = ev.player;
    const source = ev.swingSource;
    const tick = system.currentTick;
    let data = swingCache.get(player.id);
    if (!data) {
        data = {};
        swingCache.set(player.id, data);
    }
    data[source] = tick + 1;
    player.addTag("playerSwing");
    player.addTag(`playerSwing:${source}`);
});

system.runInterval(() => {
    const tick = system.currentTick;
    for (const [playerId, sources] of swingCache) {
        const player = world.getAllPlayers().find(p => p.id === playerId);
        if (!player) {
            swingCache.delete(playerId);
            continue;
        }
        for (const source in sources) {
            if (sources[source] <= tick) {
                player.removeTag(`playerSwing:${source}`);
                delete sources[source];
            }
        }
        if (Object.keys(sources).length === 0) {
            player.removeTag("playerSwing");
            swingCache.delete(playerId);
        }
    }
});


const lastTick = {};
world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    if (ev.itemStack?.typeId === 'bcd:id_stick' && !lastTick[ev.player.name]) {
        ev.player.sendMessage('§5' + ev.block?.typeId)
        ev.cancel = true;
        lastTick[ev.player.name] = true;
        system.runTimeout(() => { lastTick[ev.player.name] = false }, 6)
    }
})
world.beforeEvents.playerInteractWithEntity.subscribe(ev => {
    if (ev.itemStack?.typeId === 'bcd:id_stick') {
        ev.player.sendMessage('§3' + ev.target?.typeId)
        ev.cancel = true;
    }
});