--=====================================================================================--
-- SCRIPT NAME:      MPV Join Alerts
-- DESCRIPTION:      Broadcasts a custom welcome message when a "Most Valued Player" joins the server.
--                   - Each MVP can have their own unique message.
--                   - Non-MVP players get a random general welcome message.
--                   - Identification supports both IP addresses and hashes.
--
-- AUTHOR:           Chalwk (Jericho Crosby)
-- COMPATIBILITY:    Halo PC/CE | SAPP 1.12.0.0
--
-- Copyright (c) 2019-2025 Jericho Crosby <jericho.crosby227@gmail.com>
-- LICENSE:          MIT License
--                   https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================--

-- CONFIG:

local MVP_MESSAGES = {

    -- [IP Address] = "Custom message",
    -- [Hash]       = "Custom message",
    -- [Exact Name] = "Custom message",

    ['127.0.0.1']                        = "YO! MVP $name has joined the server!",
    ['xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'] = "$name, a brother from another mother has joined!",
    ['AnotherPlayerName']                = "Welcome, $name! Glad you could join us!"
}

local GENERAL_MESSAGES = {
    "Welcome to the server, $name!",
    "Hello $name, glad to have you!",
    "Hey $name, enjoy your stay!"
}

local SERVER_PREFIX = "**SAPP**"

-- CONFIG ENDS

api_version = "1.12.0.0"

local function sendMessage(template, name)
    execute_command('msg_prefix ""')
    say_all(template:gsub("$name", name))
    execute_command('msg_prefix "' .. SERVER_PREFIX .. '"')
end

local function getPlayerInfo(id)
    local ip   = get_var(id, "$ip"):match("(%d+%.%d+%.%d+%.%d+)")
    local hash = get_var(id, "hash")
    local name = get_var(id, "$name")
    return ip, hash, name
end

local function resolveWelcomeMessage(ip, hash, name)
    return MVP_MESSAGES[hash]
        or MVP_MESSAGES[ip]
        or MVP_MESSAGES[name]
        or GENERAL_MESSAGES[rand(1, #GENERAL_MESSAGES + 1)]
end

function OnJoin(id)
    local ip, hash, name = getPlayerInfo(id)
    local message = resolveWelcomeMessage(ip, hash, name)
    sendMessage(message, name)
end

function OnScriptLoad()
    register_callback(cb.EVENT_JOIN, "OnJoin")
end

function OnScriptUnload() end
