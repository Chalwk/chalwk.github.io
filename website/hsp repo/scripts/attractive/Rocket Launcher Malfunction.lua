--[[
--=====================================================================================================--
Script Name: Rocket Launcher Malfunction, for SAPP (PC & CE)
Description: Your rocket launcher will spontaneously explode at random times, killing you and nearby players.

Copyright (c) 2020-2024, Jericho Crosby <jericho.crosby227@gmail.com>
Notice: You can use this script subject to the following conditions:
https://github.com/Chalwk/HALO-SCRIPT-PROJECTS/blob/master/LICENSE
--=====================================================================================================--
]]--

-------------------
-- Config starts --
-------------------
local projectiles = 10
local minExplosionTime = 5
local maxExplosionTime = 10
local EXPLOSION_MESSAGE = "%s's rocket launcher has blown up!"
local SERVER_PREFIX = '**SERVER**'
api_version = '1.12.0.0'
-----------------
-- Config ends --
-----------------

local players = {}
local rocketProjectileTag, rocketLauncherTag

function OnScriptLoad()
    register_callback(cb['EVENT_GAME_START'], 'onStart')
end

local function GetTag(class, name)
    local tag = lookup_tag(class, name)
    return tag and (read_dword(tag + 0xC) or nil)
end

local function getCurrentWeapon(dyn)

    local weapon = read_dword(dyn + 0x118)
    local object = get_object_memory(weapon)

    if (not object or object == 0) then
        return nil
    end

    return read_dword(object)
end

local function inVehicle(dyn)
    return read_dword(dyn + 0x11C) ~= 0xFFFFFFFF
end

local function resetTime(player)
    player.lastExplosionTime = os.clock()
    player.nextExplosionInterval = rand(minExplosionTime, maxExplosionTime + 1)
end

local function send(message, ...)
    execute_command('msg_prefix ""')
    say_all(string.format(message, ...))
    execute_command('msg_prefix "' .. SERVER_PREFIX .. '"')
end

local function spawnProjectiles(dyn)
    local x, y, z = read_vector3d(dyn + 0x5C)
    for _ = 1, projectiles do
        local payload = spawn_object('', '', x, y, z + 0.1, 0, rocketProjectileTag)
        local projectile = get_object_memory(payload)
        if payload and projectile ~= 0 then
            write_float(projectile + 0x70, -1)
        end
    end
end

local function updateExplosionInterval(currentWeapon, player)
    if currentWeapon == rocketLauncherTag then
        resetTime(player)
    else
        player.nextExplosionInterval = rand(minExplosionTime, maxExplosionTime + 1)
    end
end

function OnTick()
    for i, player in pairs(players) do
        local dyn = get_dynamic_player(i)

        if (player_present(i) and player_alive(i) and not inVehicle(dyn)) then

            local currentWeapon = getCurrentWeapon(dyn)
            if currentWeapon ~= player.currentWeapon then
                player.currentWeapon = currentWeapon
                updateExplosionInterval(currentWeapon, player)
            end

            if (os.clock() - player.lastExplosionTime >= player.nextExplosionInterval) and currentWeapon == rocketLauncherTag then
                spawnProjectiles(dyn)
                resetTime(player)
                send(EXPLOSION_MESSAGE, player.name)
            end
        end
    end
end

function onStart()
    rocketProjectileTag = GetTag('proj', 'weapons\\rocket launcher\\rocket')
    rocketLauncherTag = GetTag('weap', 'weapons\\rocket launcher\\rocket launcher')

    if rocketProjectileTag and rocketLauncherTag then
        register_callback(cb['EVENT_TICK'], 'OnTick')
        register_callback(cb['EVENT_JOIN'], 'onJoin')
        register_callback(cb['EVENT_LEAVE'], 'onQuit')
        register_callback(cb['EVENT_SPAWN'], 'onSpawn')
    else
        unregister_callback(cb['EVENT_TICK'])
        unregister_callback(cb['EVENT_JOIN'])
        unregister_callback(cb['EVENT_LEAVE'])
        unregister_callback(cb['EVENT_SPAWN'])
    end
end

function onJoin(id)
    players[id] = {
        name = get_var(id, '$name'),
        nextExplosionInterval = rand(minExplosionTime, maxExplosionTime + 1),
        currentWeapon = nil
    }
end

function onQuit(Ply)
    if players[Ply] then
        players[Ply] = nil
    end
end

function onSpawn(id)
    resetTime(players[id])
end

function OnScriptUnload()
    -- N/A
end