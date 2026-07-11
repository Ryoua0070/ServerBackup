execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:coal_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_coal_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:iron_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_iron_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:copper_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_copper_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:gold_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_gold_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:redstone_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_redstone_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:lapis_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_lapis_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:diamond_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_diamond_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:emerald_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate_emerald_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:nether_gold_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:nether_quartz_ore,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:stone,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:granite,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:diorite,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:andesite,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:deepslate,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:tuff,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:calcite,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:blackstone,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:basalt,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc
execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:smooth_basalt,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

execute as @a[scores={MinerLv=2..},tag=!MinerFever,tag=blockBreak:ancient_debris,tag=!hasEnchantment:silk_touch] run function jobsminerlv2_proc

scoreboard players remove @a[tag=MinerFever] MinerFeverTimer 1

execute as @a[tag=MinerFever,scores={MinerFeverTimer=..0}] run tellraw @s {"rawtext":[{"text":"§7광부의 집중력이 가라앉았습니다."}]}

execute as @a[tag=MinerFever,scores={MinerFeverTimer=..0}] run tag @s remove MinerFever

execute if score @s MinerFeverTimer matches 1.. run scoreboard players set @s MinerCount 100



