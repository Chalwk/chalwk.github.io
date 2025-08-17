--[[
--=====================================================================================================--
Script Name: April Fools - Word Shuffler, for SAPP (PC & CE)
Description: Chat messages will randomly be shuffled.

Copyright (c) 2022-2024, Jericho Crosby <jericho.crosby227@gmail.com>
Notice: You can use this script subject to the following conditions:
https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================================--
]]--

-- 1 in X chance of a message being shuffled:
-- For example, when shuffle_chance = 10, there's a 1 in 10 chance for a message to be shuffled.
-- Adjust this value based on the desired frequency of shuffled messages in your April Fools' prank.
local shuffle_chance = 3

local msg_prefix = '**SAPP**'
api_version = '1.12.0.0'

-- Event handler for script load
function OnScriptLoad()
    register_callback(cb['EVENT_CHAT'], 'OnChat')
end

-- Function to get a random seed
local function get_random_seed()
    return math.random(os.time())
end

-- Function to shuffle a string
local function shuffle_string(s)
    local shuffled_letters = {}
    for letter in s:gmatch '.[\128-\191]*' do
        table.insert(shuffled_letters, { letter = letter, rnd = get_random_seed() })
    end
    table.sort(shuffled_letters, function(a, b)
        return a.rnd < b.rnd
    end)
    for i = 1, #shuffled_letters do
        shuffled_letters[i] = shuffled_letters[i].letter
    end
    return table.concat(shuffled_letters)
end

-- Event handler for chat messages
function OnChat(playerId, message, messageType)
    if math.random() <= (1 / shuffle_chance) then
        local new_message = shuffle_string(message)
        local player_name = get_var(playerId, '$name')

        -- Temporarily remove the message prefix.
        execute_command('msg_prefix ""')

        -- Handle different message types.
        if messageType == 0 then
            say_all(player_name .. ': ' .. new_message)
        elseif messageType == 1 or messageType == 2 then
            say_all('[' .. player_name .. ']: ' .. new_message)
        end

        -- Restore the original message prefix.
        execute_command('msg_prefix "' .. msg_prefix .. '"')

        return false -- Indicate that the message has been handled.
    end
    return true
end

-- Event handler for script unload
function OnScriptUnload()
    -- N/A
end