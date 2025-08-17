--[[
--=====================================================================================================--
Script Name: Random Grenades, for SAPP (PC & CE)
Description: Generates a random number of grenades when a player spawns,
             based on defined minimum and maximum values.

             Allows manual configuration for specific maps.

Copyright (c) 2016-2025, Jericho Crosby
License: https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================================--
]]--

api_version = "1.12.0.0"

-- Configuration --
local MIN_FRAGS, MAX_FRAGS = 1, 4
local MIN_PLASMAS, MAX_PLASMAS = 1, 4

local random_grenades = {
    FRAGS = true, -- If false, uses manual configuration
    PLASMAS = true   -- If false, uses manual configuration
}

-- Manual Configuration --
local manual_grenades = {
    ['beavercreek'] = { frags = 3, plasmas = 1 },
    ['bloodgulch'] = { frags = 4, plasmas = 2 },
    ['boardingaction'] = { frags = 1, plasmas = 3 },
    ['carousel'] = { frags = 3, plasmas = 3 },
    ['dangercanyon'] = { frags = 4, plasmas = 4 },
    ['deathisland'] = { frags = 1, plasmas = 1 },
    ['gephyrophobia'] = { frags = 3, plasmas = 3 },
    ['icefields'] = { frags = 1, plasmas = 1 },
    ['infinity'] = { frags = 2, plasmas = 4 },
    ['sidewinder'] = { frags = 3, plasmas = 2 },
    ['timberland'] = { frags = 2, plasmas = 4 },
    ['hangemhigh'] = { frags = 3, plasmas = 3 },
    ['ratrace'] = { frags = 3, plasmas = 2 },
    ['damnation'] = { frags = 1, plasmas = 3 },
    ['putput'] = { frags = 4, plasmas = 1 },
    ['prisoner'] = { frags = 2, plasmas = 1 },
    ['wizard'] = { frags = 1, plasmas = 2 }
}

-- Configuration End --

local map

function OnScriptLoad()
    register_callback(cb['EVENT_SPAWN'], "OnPlayerSpawn")
    register_callback(cb['EVENT_GAME_START'], "OnStart")
end

function OnStart()
    if get_var(0, "$gt") ~= "n/a" then
        map = get_var(0, "$map")
    end
end

local function getGrenades(type)
    if random_grenades[type] then
        return math.random(_G["MIN_" .. type], _G["MAX_" .. type])
    end
    return manual_grenades[type:lower()][map] or 0
end

function OnPlayerSpawn(PlayerIndex)
    local dyn = get_dynamic_player(PlayerIndex)
    if dyn == 0 then
        return
    end

    local frags, plasmas = getGrenades("FRAGS"), getGrenades("PLASMAS")

    write_word(dyn + 0x31E, frags)
    write_word(dyn + 0x31F, plasmas)
end

function OnScriptUnload()

end
