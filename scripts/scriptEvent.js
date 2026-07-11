import { ItemStack, ItemLockMode, EnchantmentType, system, world } from "@minecraft/server";

function fL(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

system.afterEvents.scriptEventReceive.subscribe(ev => {
    if (ev.id.startsWith('inventory')) {
        switch (ev.id.split(':')[1]) {
            case 'swapitems':
                swamp(ev);
                break;
            case 'replaceitem':
                replaceAdd(ev);
                break;
            case 'additem':
                replaceAdd(ev);
                break;
            case 'edititem':
                editItem(ev);
                break;
            case 'spawnitem':
                spawnItem(ev);
                break;
        }
    }
    else if (ev.id == 'entity:editentity') {
        editentity(ev)
    } else if (ev.id.startsWith('bcd')) {
        const data = ev.message;

    }
});


function editentity(ev) {
    const entity = ev.sourceEntity;
    if (!entity) {
        console.error("Error: No se encontró la entidad que envió el evento.");
        return;
    }
    const messageData = ev.message;
    if (!messageData) {
        console.error("Error: No se recibió ningún mensaje.");
        return;
    }
    let customNBT = {};
    const jsonStartIndex = messageData.indexOf("{");
    if (jsonStartIndex !== -1) {
        const jsonString = messageData.slice(jsonStartIndex);
        try {
            customNBT = JSON.parse(jsonString);
        } catch (error) {
            console.warn("Advertencia: No se pudo analizar el NBT personalizado:", error);
        }
    };
    if (customNBT.nameTag) {
        entity.nameTag = customNBT.nameTag;
    }
    if (Number.isFinite(customNBT.health)) {
        const healthComponent = entity.getComponent('health');
        healthComponent.setCurrentValue(Math.min(customNBT.health, healthComponent.defaultValue));

    }
    if (Number.isFinite(customNBT.hunger)) {
        const hungerComponent = entity.getComponent('minecraft:player.hunger');
        if (hungerComponent) hungerComponent.setCurrentValue(Math.min(customNBT.hunger, hungerComponent.defaultValue))
    }
    if (customNBT.despawn) {
        entity.remove();
    }
}


function editItem(ev) {
    const player = ev.sourceEntity;
    if (!player) {
        console.error("Error: No se encontró el jugador que envió el evento.");
        return;
    }
    const messageData = ev.message;
    if (!messageData) {
        console.error("Error: No se recibió ningún mensaje.");
        return;
    }
    const args = messageData.split(" ");
    if (args.length < 2) {
        console.error("Error: El mensaje debe contener slot y datos a modificar.");
        return;
    }
    const slotType = args[0];
    let newItem;
    if (slotType.startsWith('slot.armor') || slotType.startsWith('slot.weapon')) {
        const equipSlot = slotType.split(".")[2];
        const equippable = player.getComponent('equippable');
        if (!equippable || !['head', 'chest', 'legs', 'feet', 'mainhand', 'offhand'].includes(equipSlot)) {
            console.error(`Error: El slot de equipamiento '${slotType}' no es válido.`);
            return;
        }
        newItem = equippable.getEquipment(fL(equipSlot)) ?? null;
    }
    else if (slotType.startsWith('slot.inventory')) {
        const inventory = player.getComponent('minecraft:inventory')?.container;
        const slotIndex = parseInt(slotType.split(".")[2]);
        if (!inventory || isNaN(slotIndex)) {
            console.error(`Error: El slot de inventario '${slotType}' no es válido.`);
            return;
        }
        newItem = inventory.getItem(slotIndex) ?? null;
    }
    if (!newItem) return console.warn('Error: No hay item para editar en ese slot');
    let customNBT = {};
    const jsonStartIndex = messageData.indexOf("{");
    if (jsonStartIndex !== -1) {
        const jsonString = messageData.slice(jsonStartIndex);
        try {
            customNBT = JSON.parse(jsonString);
        } catch (error) {
            console.warn("Advertencia: No se pudo analizar el NBT personalizado:", error);
        }
    };
    if (customNBT.amount && customNBT.amount > 0) {
        newItem.amount = customNBT.amount
    }
    if (customNBT.canPlaceOn) {
        newItem.setCanPlaceOn(customNBT.canPlaceOn);
    }
    if (customNBT.canDestroy) {
        newItem.setCanDestroy(customNBT.canDestroy);
    }
    if (customNBT.nameTag) {
        newItem.nameTag = customNBT.nameTag;
    }
    if (customNBT.lockMode) {
        newItem.lockMode = ItemLockMode[customNBT.lockMode] ?? 'none'
    }
    if (customNBT.keepOnDeath && typeof (customNBT.keepOnDeath) === "boolean") {
        newItem.keepOnDeath = customNBT.keepOnDeath;
    }
    if (customNBT.lore) {
        newItem.setLore(customNBT.lore);
    }
    const itemComponent = newItem.getComponent('minecraft:enchantable');
    if (customNBT.enchantments && Array.isArray(customNBT.enchantments) && itemComponent) {
        customNBT.enchantments.forEach(enchantment => {
            if (!enchantment.type || !enchantment.level) {
                console.error("Error: Encantamiento inválido. Falta el tipo o el nivel.");
                return;
            }
            if (isNaN(enchantment.level) || enchantment.level < 1) {
                console.error(`Error: Nivel de encantamiento inválido: "${enchantment.level}". Debe ser un número entero positivo.`);
                return;
            }
            itemComponent.addEnchantment({ type: new EnchantmentType(enchantment.type), level: enchantment.level });
        });
    }
    if (customNBT.removeEnchantments && Array.isArray(customNBT.removeEnchantments) && itemComponent) {
        customNBT.removeEnchantments.forEach(enchantment => {
            itemComponent.removeEnchantment(enchantment);
        });
    }
    if (slotType.startsWith('slot.armor') || slotType.startsWith('slot.weapon')) {
        const equipSlot = slotType.split(".")[2];
        const equippable = player.getComponent('equippable');
        if (!equippable || !['head', 'chest', 'legs', 'feet', 'mainhand', 'offhand'].includes(equipSlot)) {
            console.error(`Error: El slot de equipamiento '${slotType}' no es válido.`);
            return;
        }
        equippable.setEquipment(fL(equipSlot), newItem);
    }
    else if (slotType.startsWith('slot.inventory')) {
        const inventory = player.getComponent('minecraft:inventory')?.container;
        const slotIndex = parseInt(slotType.split(".")[2]);
        if (!inventory || isNaN(slotIndex)) {
            console.error(`Error: El slot de inventario '${slotType}' no es válido.`);
            return;
        }
        inventory.setItem(slotIndex, newItem);
    }
}

function swamp(ev) {
    const player = ev.sourceEntity;
    if (!player) {
        console.error("Error: No se encontró el jugador que envió el evento.");
        return;
    }
    const messageData = ev.message;
    if (!messageData) {
        console.error("Error: No se recibió ningún mensaje.");
        return;
    }
    const args = messageData.split(" ");
    if (args.length !== 2) {
        console.error("Error: El mensaje debe contener exactamente dos ranuras.");
        return;
    }
    const sourceSlotType = args[0];
    const targetSlotType = args[1];
    const inventory = player.getComponent('minecraft:inventory')?.container;
    const equippable = player.getComponent('equippable');
    if (!inventory || !equippable) {
        console.error("Error: El jugador no tiene los componentes necesarios.");
        return;
    }
    function getSlotIndex(slotType) {
        const slotParts = slotType.split(".");
        if (slotParts.length !== 3) {
            console.warn(`Error: Slot '${slotType}' no tiene el formato correcto.`);
            return null;
        }
        const index = parseInt(slotParts[2]);
        if (slotParts[1] == 'inventory' && isNaN(index) || index < 0 || index >= inventory.size) {
            console.warn(`Error: Índice de ranura '${slotType}' no válido. Debe ser un número entero positivo no mayor a ${inventory.size - 1}.`);
            return null;
        }
        return index;
    }
    function swapItems(sourceType, targetType) {
        const sourceSlotIndex = getSlotIndex(sourceType);
        const targetSlotIndex = getSlotIndex(targetType);
        if (sourceSlotIndex === null || targetSlotIndex === null) {
            return;
        }
        if ((sourceType.startsWith("slot.armor") || sourceType.startsWith("slot.weapon")) && targetType.startsWith("slot.inventory")) {
            const equipSlot = sourceType.split(".")[2];
            const equipItem = equippable.getEquipment(fL(equipSlot));
            const invItem = inventory.getItem(targetSlotIndex);
            equippable.setEquipment(fL(equipSlot), invItem ?? null);
            inventory.setItem(targetSlotIndex, equipItem ?? null);
        }
        else if (sourceType.startsWith("slot.inventory") && (targetType.startsWith("slot.armor") || targetType.startsWith("slot.weapon"))) {
            const itemFromInventory = inventory.getItem(sourceSlotIndex);
            const equipSlot = targetType.split(".")[2];
            const equipItem = equippable.getEquipment(fL(equipSlot));
            inventory.setItem(sourceSlotIndex, equipItem ?? null);
            equippable.setEquipment(fL(equipSlot), itemFromInventory ?? null);
        }
        else if (sourceType.startsWith("slot.inventory") && targetType.startsWith("slot.inventory")) {
            const itemFromInventory = inventory.getItem(sourceSlotIndex);
            const itemFromTarget = inventory.getItem(targetSlotIndex)
            inventory.setItem(sourceSlotIndex, itemFromTarget ?? null);
            inventory.setItem(targetSlotIndex, itemFromInventory ?? null);
        }
        else if ((sourceType.startsWith("slot.armor") || sourceType.startsWith("slot.weapon")) && (targetType.startsWith("slot.weapon") || targetType.startsWith("slot.armor"))) {
            const equipSlotSource = sourceType.split(".")[2];
            const equipItemSource = equippable.getEquipment(fL(equipSlotSource));
            const equipSlotTarget = targetType.split(".")[2];
            const equipItemTarget = equippable.getEquipment(fL(equipSlotTarget));
            equippable.setEquipment(fL(equipSlotSource), equipItemTarget ?? null);
            equippable.setEquipment(fL(equipSlotTarget), equipItemSource ?? null);
        }
        else {
            console.error(`Error: Combinación de ranuras no válida: ${sourceType} -> ${targetType}`);
        }
    }
    swapItems(sourceSlotType, targetSlotType);
}

function spawnItem(ev) {
    const player = ev.sourceEntity ?? ev.sourceBlock;
    if (!player) {
        console.error("Error: No se encontró el jugador que envió el evento.");
        return;
    }
    const messageData = ev.message;
    if (!messageData) {
        console.error("Error: No se recibió ningún mensaje.");
        return;
    }
    const args = messageData.split(" ");
    if (args.length < 1) {
        console.error("Error: El mensaje debe contener al menos el item.");
        return;
    }
    const playerPos = player.location;

    const location = {
        x: args[0] === "~" ? playerPos.x : args[0].startsWith("~") ? playerPos.x + parseFloat(args[0].slice(1) || "0") : parseFloat(args[0]),
        y: args[1] === "~" ? playerPos.y : args[1].startsWith("~") ? playerPos.y + parseFloat(args[1].slice(1) || "0") : parseFloat(args[1]),
        z: args[2] === "~" ? playerPos.z : args[2].startsWith("~") ? playerPos.z + parseFloat(args[2].slice(1) || "0") : parseFloat(args[2])
    };

    const itemName = args[3];
    const amount = parseInt(args[4]);
    let customNBT = {};
    let dimension = "overworld";
    const jsonStartIndex = messageData.indexOf("{");
    if (jsonStartIndex !== -1) {
        const jsonString = messageData.slice(jsonStartIndex);
        try {
            customNBT = JSON.parse(jsonString);
        } catch (error) {
            console.warn("Advertencia: No se pudo analizar el NBT personalizado:", error);
        }
    }
    const itemType = itemName;
    const newItem = new ItemStack(itemType, amount);
    if (customNBT.nameTag) {
        newItem.nameTag = customNBT.nameTag;
    }
    if (customNBT.canPlaceOn) {
        newItem.setCanPlaceOn(customNBT.canPlaceOn);
    }
    if (customNBT.canDestroy) {
        newItem.setCanDestroy(customNBT.canDestroy);
    }
    if (customNBT.lockMode) {
        newItem.lockMode = ItemLockMode[customNBT.lockMode] ?? 'none'
    }
    if (customNBT.keepOnDeath && typeof (customNBT.keepOnDeath) === "boolean") {
        newItem.keepOnDeath = customNBT.keepOnDeath;
    }
    if (customNBT.lore) {
        newItem.setLore(customNBT.lore)
    }
    if (customNBT.dimension) {
        dimension = customNBT.dimension;
    }
    const itemComponent = newItem.getComponent('minecraft:enchantable');
    if (customNBT.enchantments && Array.isArray(customNBT.enchantments) && itemComponent) {
        customNBT.enchantments.forEach(enchantment => {
            if (!enchantment.type || !enchantment.level) {
                console.error("Error: Encantamiento inválido. Falta el tipo o el nivel.");
                return;
            }
            if (isNaN(enchantment.level) || enchantment.level < 1) {
                console.error(`Error: Nivel de encantamiento inválido: "${enchantment.level}". Debe ser un número entero positivo.`);
                return;
            }
            itemComponent.addEnchantment({ type: new EnchantmentType(enchantment.type), level: enchantment.level });
        });
    }
    try {
        world.getDimension(dimension).spawnItem(newItem, location);
    } catch (error) {
        console.error("Error: " + error);
    }
}

function replaceAdd(ev) {
    const player = ev.sourceEntity;
    if (!player) {
        console.error("Error: No se encontró el jugador que envió el evento.");
        return;
    }
    const addItem = ev.id === 'inventory:additem';
    const messageData = ev.message;
    if (!messageData) {
        console.error("Error: No se recibió ningún mensaje.");
        return;
    }
    const args = messageData.split(" ");
    if ((!addItem && args.length < 2) || (addItem && args.length < 1)) {
        console.error("Error: El mensaje debe contener al menos el slot y el item.");
        return;
    }
    const slotType = args[0];
    const itemName = !addItem ? args[1] : args[0];
    const amount = !addItem ? parseInt(args[2]) || 1 : parseInt(args[1]);
    let customNBT = {};
    const jsonStartIndex = messageData.indexOf("{");
    if (jsonStartIndex !== -1) {
        const jsonString = messageData.slice(jsonStartIndex);
        try {
            customNBT = JSON.parse(jsonString);
        } catch (error) {
            console.warn("Advertencia: No se pudo analizar el NBT personalizado:", error);
        }
    }
    const itemType = itemName;
    const newItem = new ItemStack(itemType, amount);
    if (customNBT.nameTag) {
        newItem.nameTag = customNBT.nameTag;
    }
    if (customNBT.lockMode) {
        newItem.lockMode = ItemLockMode[customNBT.lockMode] ?? 'none'
    }
    if (customNBT.keepOnDeath && typeof (customNBT.keepOnDeath) === "boolean") {
        newItem.keepOnDeath = customNBT.keepOnDeath;
    }
    if (customNBT.canPlaceOn) {
        newItem.setCanPlaceOn(customNBT.canPlaceOn);
    }
    if (customNBT.canDestroy) {
        console.warn(JSON.stringify(customNBT.canDestroy))
        newItem.setCanDestroy(customNBT.canDestroy);
    }
    if (customNBT.lore) {
        newItem.setLore(customNBT.lore)
    }
    const itemComponent = newItem.getComponent('minecraft:enchantable');
    if (customNBT.enchantments && Array.isArray(customNBT.enchantments) && itemComponent) {
        customNBT.enchantments.forEach(enchantment => {
            if (!enchantment.type || !enchantment.level) {
                console.error("Error: Encantamiento inválido. Falta el tipo o el nivel.");
                return;
            }
            if (isNaN(enchantment.level) || enchantment.level < 1) {
                console.error(`Error: Nivel de encantamiento inválido: "${enchantment.level}". Debe ser un número entero positivo.`);
                return;
            }
            itemComponent.addEnchantment({ type: new EnchantmentType(enchantment.type), level: enchantment.level });
        });
    }
    if (addItem) {
        const inventory = player.getComponent('minecraft:inventory')?.container;
        if (!inventory) {
            console.error(`Error: No se encontró inventario`);
            return;
        }
        inventory.addItem(newItem)
    }
    else if (slotType.startsWith("slot.inventory")) {
        const inventory = player.getComponent('minecraft:inventory')?.container;
        const slotIndex = parseInt(slotType.split(".")[2]);
        if (!inventory || isNaN(slotIndex)) {
            console.error(`Error: El slot de inventario '${slotType}' no es válido.`);
            return;
        }
        inventory.setItem(slotIndex, newItem);
    }
    else if (slotType.startsWith("slot.armor") || slotType.startsWith("slot.weapon")) {
        const equipSlot = slotType.split(".")[2];
        const equippable = player.getComponent('equippable');
        if (!equippable || !['head', 'chest', 'legs', 'feet', 'mainhand', 'offhand'].includes(equipSlot)) {
            console.error(`Error: El slot de equipamiento '${slotType}' no es válido.`);
            return;
        }
        equippable.setEquipment(fL(equipSlot), newItem);
    } else {
        console.error(`Error: Tipo de slot '${slotType}' no reconocido.`);
    }
}