@echo off
setlocal EnableExtensions

pushd "%~dp0" >nul

set "SELF=%~f0"
set "PSFILE=%TEMP%\build-spritesheet-%RANDOM%-%RANDOM%.ps1"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-Content -LiteralPath $env:SELF -Raw -Encoding UTF8; $tok = [char]58 + [char]58 + 'PS' + [char]58 + [char]58; $i = $c.LastIndexOf($tok); if ($i -lt 0) { Write-Error 'PS payload marker not found'; exit 1 }; $s = $c.Substring($i + $tok.Length).TrimStart(); Set-Content -LiteralPath $env:PSFILE -Value $s -Encoding UTF8"

if not exist "%PSFILE%" (
    echo [error] Failed to extract embedded PowerShell payload.
    popd >nul
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PSFILE%" %*
set "RC=%ERRORLEVEL%"

del "%PSFILE%" 2>nul
popd >nul
exit /b %RC%

::PS::
param(
    [string]$SpritesFile = "js/sprites.js",
    [string]$OutputFile  = "spritesheet.png",
    [int]   $Scale       = 4,
    [int]   $Padding     = 0,
    [int]   $Columns     = 0,
    [string]$Background  = "transparent",
    [switch]$Label,
    [switch]$NoGenerated
)

$ErrorActionPreference = "Stop"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$candidates = New-Object System.Collections.ArrayList
[void]$candidates.Add($SpritesFile)
if ($SpritesFile -notmatch '[\\/]') {
    [void]$candidates.Add("js/$SpritesFile")
    [void]$candidates.Add("../$SpritesFile")
    [void]$candidates.Add("scripts/$SpritesFile")
}
$resolved = $null
foreach ($cand in $candidates) {
    if (Test-Path -LiteralPath $cand -PathType Leaf) { $resolved = $cand; break }
}
if (-not $resolved) {
    Write-Error ("sprites.js not found. Looked for: " + ($candidates -join ', '))
    exit 1
}
$spritesPath = (Resolve-Path -LiteralPath $resolved).Path
Write-Host "Reading: $spritesPath"
$src = Get-Content -LiteralPath $spritesPath -Raw -Encoding UTF8

$palMatch = [regex]::Match($src, '(?s)const\s+PALETTE\s*=\s*\{(.*?)\}\s*;')
if (-not $palMatch.Success) { Write-Error "PALETTE object not found."; exit 1 }

$palBody = $palMatch.Groups[1].Value
$palette = @{}

foreach ($m in [regex]::Matches($palBody, "([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'(#[0-9A-Fa-f]{3,8})'")) {
    $palette[$m.Groups[1].Value] = $m.Groups[2].Value
}

foreach ($m in [regex]::Matches($palBody, "'(.)'\s*:\s*'(#[0-9A-Fa-f]{3,8})'")) {
    $palette[$m.Groups[1].Value] = $m.Groups[2].Value
}

if ($palette.Count -eq 0) { Write-Error "No palette entries parsed."; exit 1 }
Write-Host "Palette entries: $($palette.Count)"

$spriteRegex = [regex]'(?s)([A-Za-z_][A-Za-z0-9_]*)\s*:\s*sprite\(\s*\[(.*?)\]\s*\)'
$sprites = New-Object System.Collections.ArrayList

foreach ($sm in $spriteRegex.Matches($src)) {
    $name = $sm.Groups[1].Value
    if ($name -eq 'function' -or $name -eq 'sprite') { continue }

    $rows = @([regex]::Matches($sm.Groups[2].Value, "'([^']*)'") |
              ForEach-Object { $_.Groups[1].Value })
    if ($rows.Count -eq 0) { continue }

    $w = $rows[0].Length
    $bad = $false
    foreach ($r in $rows) { if ($r.Length -ne $w) { $bad = $true; break } }
    if ($bad) { Write-Warning "Sprite '$name' has inconsistent row widths - skipping."; continue }

    [void]$sprites.Add([pscustomobject]@{
        Name   = $name
        Rows   = $rows
        Width  = $w
        Height = $rows.Count
    })
}

$handDrawnCount = $sprites.Count
if ($handDrawnCount -eq 0) { Write-Error "No hand-authored sprites parsed from $SpritesFile"; exit 1 }
Write-Host "Hand-authored sprites: $handDrawnCount"

if (-not $NoGenerated) {
    $roomTintsMatch = [regex]::Match($src, '(?s)const\s+ROOM_TINTS\s*=\s*\{(.*?)\}\s*;')
    $tintNamesMatch = [regex]::Match($src, '(?s)const\s+TINT_NAMES\s*=\s*\{(.*?)\}\s*;')
    $specklesMatch  = [regex]::Match($src, '(?s)const\s+FLOOR_SPECKLES\s*=\s*\[(.*?)\]\s*;')

    if (-not ($roomTintsMatch.Success -and $tintNamesMatch.Success -and $specklesMatch.Success)) {
        Write-Warning "Could not parse ROOM_TINTS / TINT_NAMES / FLOOR_SPECKLES - skipping generated floor sprites."
    }
    else {
        $tintNames = @{}
        foreach ($m in [regex]::Matches($tintNamesMatch.Groups[1].Value, "([A-Za-z_][A-Za-z0-9_]*)\s*:\s*'([^']+)'")) {
            $tintNames[$m.Groups[1].Value] = $m.Groups[2].Value
        }

        $roomTints = @{}
        $roomTintOrder = New-Object System.Collections.ArrayList
        foreach ($line in ($roomTintsMatch.Groups[1].Value -split "`n")) {
            $m = [regex]::Match($line, "([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\]")
            if ($m.Success) {
                $key = $m.Groups[1].Value
                $roomTints[$key] = @($m.Groups[2].Value, $m.Groups[3].Value, $m.Groups[4].Value)
                [void]$roomTintOrder.Add($key)
            }
        }

        $specklesBody = $specklesMatch.Groups[1].Value
        $speckleEntries = New-Object System.Collections.ArrayList
        $depth = 0; $start = -1
        for ($i = 0; $i -lt $specklesBody.Length; $i++) {
            $ch = $specklesBody[$i]
            if ($ch -eq '[') {
                if ($depth -eq 0) { $start = $i }
                $depth++
            }
            elseif ($ch -eq ']') {
                $depth--
                if ($depth -eq 0 -and $start -ge 0) {
                    [void]$speckleEntries.Add($specklesBody.Substring($start, $i - $start + 1))
                    $start = -1
                }
            }
        }

        $speckleLayouts = New-Object System.Collections.ArrayList
        foreach ($entry in $speckleEntries) {
            $triples = New-Object System.Collections.ArrayList
            foreach ($tm in [regex]::Matches($entry, "\[\s*(\d+)\s*,\s*(\d+)\s*,\s*'([LD])'\s*\]")) {
                [void]$triples.Add(@([int]$tm.Groups[1].Value, [int]$tm.Groups[2].Value, $tm.Groups[3].Value))
            }
            [void]$speckleLayouts.Add($triples)
        }

        while ($speckleLayouts.Count -lt 3) { [void]$speckleLayouts.Add((New-Object System.Collections.ArrayList)) }

        $suffixes = @('A', 'B', 'C')
        $generatedCount = 0

        foreach ($type in $roomTintOrder) {
            if (-not $tintNames.ContainsKey($type)) { continue }
            $displayName = $tintNames[$type]
            $tintTriple  = $roomTints[$type]
            $baseCh      = $tintTriple[0]
            $lightCh     = $tintTriple[1]
            $darkCh      = $tintTriple[2]

            for ($vi = 0; $vi -lt 3; $vi++) {
                $specks = $speckleLayouts[$vi]
                $rows = @()
                for ($y = 0; $y -lt 16; $y++) {
                    $rowChars = New-Object System.Text.StringBuilder
                    for ($x = 0; $x -lt 16; $x++) {
                        $ch = $baseCh
                        foreach ($sp in $specks) {
                            if ($sp[0] -eq $x -and $sp[1] -eq $y) {
                                $ch = if ($sp[2] -eq 'L') { $lightCh } else { $darkCh }
                                break
                            }
                        }
                        [void]$rowChars.Append($ch)
                    }
                    $rows += $rowChars.ToString()
                }
                $spriteName = "floor${displayName}$($suffixes[$vi])"
                [void]$sprites.Add([pscustomobject]@{
                    Name   = $spriteName
                    Rows   = $rows
                    Width  = 16
                    Height = 16
                })
                $generatedCount++
            }
        }
        Write-Host "Generated floor sprites: $generatedCount"
    }
}
else {
    Write-Host "Generated floor sprites: skipped (-NoGenerated)"
}

$count = $sprites.Count
Write-Host ""
Write-Host "Total sprites: $count"

$cellW = ($sprites | Measure-Object -Property Width  -Maximum).Maximum
$cellH = ($sprites | Measure-Object -Property Height -Maximum).Maximum

$cols = if ($Columns -gt 0) { $Columns } else { [int][math]::Ceiling([math]::Sqrt($count)) }
$rows = [int][math]::Ceiling($count / $cols)

$s      = [math]::Max(1, $Scale)
$pad    = [math]::Max(0, $Padding)
$labelH = if ($Label) { [math]::Max(12, [int]($s * 3)) } else { 0 }

$cellWpx = $cellW * $s
$cellHpx = $cellH * $s

$sheetW = $cols * $cellWpx + [math]::Max(0, $cols - 1) * $pad
$sheetH = $rows * ($cellHpx + $labelH) + [math]::Max(0, $rows - 1) * $pad

Write-Host ""
Write-Host "Sheet: ${sheetW}x${sheetH}px  ($cols cols x $rows rows, cell ${cellW}x${cellH}, scale x$s, pad $pad)"

Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap($sheetW, $sheetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::None
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

if ($Background -eq 'transparent' -or $Background -eq 'none' -or [string]::IsNullOrWhiteSpace($Background)) {
    $g.Clear([System.Drawing.Color]::Transparent)
} else {
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml($Background))
}

$brushCache = @{}
$fontSize   = [math]::Max(6, [int]($s * 2))

$index = 0
foreach ($sp in $sprites) {
    $c = $index % $cols
    $r = [int][math]::Floor($index / $cols)

    $baseX = $c * ($cellWpx + $pad)
    $baseY = $r * ($cellHpx + $labelH + $pad)

    $offX = $baseX + [int](($cellW - $sp.Width)  * $s / 2)
    $offY = $baseY + [int](($cellH - $sp.Height) * $s / 2)

    for ($y = 0; $y -lt $sp.Height; $y++) {
        $rowStr = $sp.Rows[$y]
        $x = 0
        while ($x -lt $sp.Width) {
            $ch    = $rowStr[$x]
            $chStr = [string]$ch
            if ($chStr -eq '.' -or -not $palette.ContainsKey($chStr)) { $x++; continue }

            $run = 1
            while (($x + $run) -lt $sp.Width -and $rowStr[$x + $run] -eq $ch) { $run++ }

            $hex = $palette[$chStr]
            if (-not $brushCache.ContainsKey($hex)) {
                $brushCache[$hex] = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex))
            }
            $g.FillRectangle($brushCache[$hex],
                ($offX + $x * $s),
                ($offY + $y * $s),
                ($run * $s),
                $s)
            $x += $run
        }
    }

    if ($Label) {
        $font = New-Object System.Drawing.Font("Consolas", $fontSize)
        $lb   = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(230,255,255,255))
        $g.DrawString($sp.Name, $font, $lb, $baseX, ($baseY + $cellHpx + 1))
        $font.Dispose(); $lb.Dispose()
    }

    $index++
}

if ([System.IO.Path]::IsPathRooted($OutputFile)) {
    $outPath = $OutputFile
} else {
    $outPath = Join-Path (Get-Location).Path $OutputFile
}
$outDir = [System.IO.Path]::GetDirectoryName($outPath)
if ($outDir -and -not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

foreach ($b in $brushCache.Values) { $b.Dispose() }
$g.Dispose()
$bmp.Dispose()

$sw.Stop()
Write-Host ""
Write-Host "Saved: $outPath" -ForegroundColor Green
Write-Host ("Done in {0:N2}s" -f $sw.Elapsed.TotalSeconds)