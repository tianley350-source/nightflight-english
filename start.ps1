param([int]$Port = 4173)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$env:PORT = "$Port"
Write-Host "Nightflight: http://localhost:$Port"
node server.mjs
