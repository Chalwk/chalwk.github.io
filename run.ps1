Write-Host "Cleaning site..."
bundle exec jekyll clean
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Starting Jekyll server on 127.0.0.1:4000 with live reload..."

# Launch the server in a new PowerShell window (equivalent to start cmd /k)
Start-Process pwsh -ArgumentList '-NoExit', '-Command', 'bundle exec jekyll serve --livereload --host 127.0.0.1 --baseurl=""'

Write-Host "Waiting for server to start..."
$port = 4000
$timeout = 30
$ready = $false

for ($i = 1; $i -le $timeout; $i++) {
    Start-Sleep -Seconds 1
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        $ready = $true
        break
    }
}

if (-not $ready) {
    Write-Host "WARNING: Server not responding after $timeout seconds. Opening browser anyway."
}

Start-Process "http://127.0.0.1:4000/"