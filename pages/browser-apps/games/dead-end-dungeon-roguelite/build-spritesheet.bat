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
    [string]$SpritesFile = "sprites.js",
    [string]$OutputFile  = "spritesheet.png",
    [int]   $Scale       = 4,
    [int]   $Padding     = 0,
    [int]   $Columns     = 0,
    [string]$Background  = "transparent",
    [switch]$Label
)

$ErrorActionPreference = "Stop"
$sw = [System.Diagnostics.Stopwatch]::StartNew()

# ---------------------------------------------------------------- locate file
if (-not (Test-Path -LiteralPath $SpritesFile)) {
    Write-Error "sprites.js not found at: $SpritesFile"
    exit 1
}
$spritesPath = (Resolve-Path -LiteralPath $SpritesFile).Path
Write-Host "Reading: $spritesPath"
$src = Get-Content -LiteralPath $spritesPath -Raw -Encoding UTF8

# ------------------------------------------------------------------- palette
$palMatch = [regex]::Match($src, '(?s)const\s+PALETTE\s*=\s*\{(.*?)\}\s*;')
if (-not $palMatch.Success) { Write-Error "PALETTE object not found."; exit 1 }

$palette = @{}
foreach ($line in ($palMatch.Groups[1].Value -split "`n")) {
    $m = [regex]::Match($line, "^\s*([A-Za-z0-9_]+)\s*:\s*'(#[0-9A-Fa-f]{3,8})'")
    if ($m.Success) { $palette[$m.Groups[1].Value] = $m.Groups[2].Value }
}
if ($palette.Count -eq 0) { Write-Error "No palette entries parsed."; exit 1 }
Write-Host "Palette entries: $($palette.Count)"

# ------------------------------------------------------------------- sprites
# Matches:  name: sprite([ 'row', 'row', ... ])
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

if ($sprites.Count -eq 0) { Write-Error "No sprites parsed from $SpritesFile"; exit 1 }

Write-Host "Sprites found: $($sprites.Count)"
foreach ($s in $sprites) {
    Write-Host ("  {0,-16} {1}x{2}" -f $s.Name, $s.Width, $s.Height)
}

# -------------------------------------------------------------------- layout
$cellW = ($sprites | Measure-Object -Property Width  -Maximum).Maximum
$cellH = ($sprites | Measure-Object -Property Height -Maximum).Maximum
$count = $sprites.Count

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

# -------------------------------------------------------------------- render
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

    # Center this sprite in its cell (only matters if sizes differ).
    $offX = $baseX + [int](($cellW - $sp.Width)  * $s / 2)
    $offY = $baseY + [int](($cellH - $sp.Height) * $s / 2)

    for ($y = 0; $y -lt $sp.Height; $y++) {
        $rowStr = $sp.Rows[$y]
        $x = 0
        while ($x -lt $sp.Width) {
            $ch    = $rowStr[$x]
            $chStr = [string]$ch
            if ($chStr -eq '.' -or -not $palette.ContainsKey($chStr)) { $x++; continue }

            # Merge identical horizontal runs into one fill (matches sprite()).
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

# ---------------------------------------------------------------------- save
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