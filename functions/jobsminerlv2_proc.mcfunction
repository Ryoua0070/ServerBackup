scoreboard players add @s MinerCount 1

# 석탄 (최종 +1)
# 추가 없음

# 구리 (최종 +2)
execute if entity @s[tag=blockBreak:copper_ore] run scoreboard players add @s MinerCount 1
execute if entity @s[tag=blockBreak:deepslate_copper_ore] run scoreboard players add @s MinerCount 1

# 철 (최종 +2)
execute if entity @s[tag=blockBreak:iron_ore] run scoreboard players add @s MinerCount 1
execute if entity @s[tag=blockBreak:deepslate_iron_ore] run scoreboard players add @s MinerCount 1

# 금 (최종 +5)
execute if entity @s[tag=blockBreak:gold_ore] run scoreboard players add @s MinerCount 4
execute if entity @s[tag=blockBreak:deepslate_gold_ore] run scoreboard players add @s MinerCount 4
execute if entity @s[tag=blockBreak:nether_gold_ore] run scoreboard players add @s MinerCount 4

# 레드스톤 (최종 +3)
execute if entity @s[tag=blockBreak:redstone_ore] run scoreboard players add @s MinerCount 2
execute if entity @s[tag=blockBreak:deepslate_redstone_ore] run scoreboard players add @s MinerCount 2

# 청금석 (최종 +2)
execute if entity @s[tag=blockBreak:lapis_ore] run scoreboard players add @s MinerCount 1
execute if entity @s[tag=blockBreak:deepslate_lapis_ore] run scoreboard players add @s MinerCount 1

# 다이아몬드 (최종 +10)
execute if entity @s[tag=blockBreak:diamond_ore] run scoreboard players add @s MinerCount 9
execute if entity @s[tag=blockBreak:deepslate_diamond_ore] run scoreboard players add @s MinerCount 9

# 에메랄드 (최종 +10)
execute if entity @s[tag=blockBreak:emerald_ore] run scoreboard players add @s MinerCount 9
execute if entity @s[tag=blockBreak:deepslate_emerald_ore] run scoreboard players add @s MinerCount 9

# 네더 석영 (최종 +2)
execute if entity @s[tag=blockBreak:nether_quartz_ore] run scoreboard players add @s MinerCount 1

# 고대 잔해 (최종 +20)
execute if entity @s[tag=blockBreak:ancient_debris] run scoreboard players add @s MinerCount 19
execute if score @s MinerCount matches 100.. run tag @s add MinerFever
execute if score @s MinerCount matches 100.. run scoreboard players set @s MinerFeverTimer 300

execute if score @s MinerCount matches 100.. run effect @s haste 15 2 true
execute if score @s MinerCount matches 100.. run playsound random.levelup @s

execute if score @s MinerCount matches 100.. at @s run particle minecraft:totem_particle ~ ~1 ~
execute if score @s MinerCount matches 100.. at @s run particle minecraft:totem_particle ~0.5 ~1 ~
execute if score @s MinerCount matches 100.. at @s run particle minecraft:totem_particle ~-0.5 ~1 ~

execute if score @s MinerCount matches 100.. run tellraw @s {"rawtext":[{"text":"§6광부의 집중력이 극한에 도달했습니다! §b피버타임 발동! §e(15초)"}]}

execute if score @s MinerCount matches 100.. run scoreboard players set @s MinerCount 0