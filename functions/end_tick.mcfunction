execute in the_end if entity @e[type=ender_dragon] run scoreboard players set DragonTimer ERM 0

execute in the_end unless entity @e[type=ender_dragon] run scoreboard players add DragonTimer ERM 1

execute in the_end unless entity @e[type=ender_dragon] if score DragonTimer ERM matches 1400 run summon ender_dragon ~ ~30 ~

effect @e[type=ender_dragon] resistance infinite 2 

execute if score DragonTimer ERM matches 1400 run scoreboard players set DragonTimer ERM 0