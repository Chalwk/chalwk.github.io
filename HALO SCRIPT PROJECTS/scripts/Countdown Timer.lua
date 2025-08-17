--=====================================================================================================--
-- SCRIPT NAME: Countdown Timer, for SAPP (PC & CE)
-- Description: This script is intended for use by other developers. It provides a simple way to display a countdown
--              timer in the following format: "Game will begin in: %02d seconds".
--              This script is not intended to be used as a standalone script.
--
-- Copyright (c) 2016-2024, Jericho Crosby <jericho.crosby227@gmail.com>
-- Notice: You can use this script subject to the following conditions:
--         https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================================--
api_version = "1.12.0.0"
-- Timer configuration
local delay = 5
-- Countdown duration in seconds
local output_msg = "Game will begin in: %02d seconds"
local timer

-- Register necessary callbacks
function OnScriptLoad()
    register_callback(cb['EVENT_TICK'], 'OnTick')
    register_callback(cb['EVENT_GAME_END'], 'OnEnd')
    register_callback(cb['EVENT_GAME_START'], 'OnStart')
    -- Initialize timer on script load
    OnStart()
end

-- Creates a new timer instance
local function newTimer()
    return {
        start_time = os.time(),
        end_time = os.time() + delay
    }
end

-- Initializes timer when the game starts
function OnStart()
    timer = (get_var(0, '$gt') ~= 'n/a') and newTimer() or nil
end

-- Resets timer when the game ends
function OnEnd()
    timer = nil
end

-- Formats remaining time in "HH:MM:SS" format
local function timeRemaining(seconds)
    return string.format(output_msg, seconds % 60)
end

-- Utility function to send chat messages to players
local function Say(player_index, msg)
    -- Send 25 spaces to clear previous chat
    for _ = 1, 25 do
        rprint(player_index, ' ')
    end
    -- Send countdown message to player
    rprint(player_index, msg)
end

-- Updates countdown timer every tick and displays remaining time to players
function OnTick()
    if (timer) then
        if timer.start_time >= timer.end_time then
            timer = nil
            -- DO SOMETHING HERE when the timer reaches 0
        else
            -- Display countdown timer to players
            for i = 1, 16 do
                if player_present(i) then
                    Say(i, timeRemaining(timer.end_time - os.time()))
                end
            end
        end
    end
end