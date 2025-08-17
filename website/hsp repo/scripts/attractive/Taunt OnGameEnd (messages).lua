--[[
--=====================================================================================================--
Script Name: Taunt OnGameEnd (messages), for SAPP (PC & CE)
Implementing API version: 1.11.0.0
Description: This script will display taunting messages to the player when the game ends.

Copyright (c) 2016-2018, Jericho Crosby <jericho.crosby227@gmail.com>
Notice: You can use this script subject to the following conditions:
https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================================--
]]--

api_version = "1.12.0.0"

function OnScriptUnload()
end

function OnScriptLoad()
    register_callback(cb['EVENT_GAME_END'], "OnGameEnd")
end

function OnGameEnd(PlayerIndex)
    local kills = tonumber(get_var(PlayerIndex, "$kills"))
    if kills == 0 then
        say(PlayerIndex, "You have no kills... noob alert!")
    elseif kills == 1 then
        say(PlayerIndex, "One kill? You must be new at this...")
    elseif kills == 2 then
        say(PlayerIndex, "Eh, two kills... not bad. But you still suck!")
    elseif kills == 3 then
        say(PlayerIndex, "Relax sonny! 3 kills, and you be like... mad bro?")
    elseif kills == 4 then
        say(PlayerIndex, "Dun dun dun... them 4 kills though!")
    elseif kills > 4 then
        say(PlayerIndex, "Well, you've got more than 4 kills... #AchievingTheImpossible")
    end
end