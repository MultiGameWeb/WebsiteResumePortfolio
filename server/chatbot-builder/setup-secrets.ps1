# BotCraft local secret setup.
# Run from a trusted Windows terminal. Secret inputs are hidden and never printed.
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$folder = $PSScriptRoot
$varsPath = Join-Path $folder ".dev.vars"
$ignorePath = Join-Path $folder ".gitignore"

if (Test-Path -LiteralPath $varsPath) {
    $answer = Read-Host ".dev.vars already exists. Replace it? Type YES to continue"
    if ($answer -cne "YES") {
        Write-Host "Cancelled. Existing .dev.vars was not changed."
        exit 0
    }
}

if (-not (Test-Path -LiteralPath $ignorePath)) {
    throw "Safety check failed: .gitignore is missing. No file was written."
}
$ignoreText = Get-Content -LiteralPath $ignorePath -Raw
if ($ignoreText -notmatch '(?m)^\s*\.dev\.vars\s*$') {
    throw "Safety check failed: .gitignore does not ignore .dev.vars. Add .dev.vars to .gitignore first."
}

function Read-HiddenKey([string]$name) {
    $secure = Read-Host "Paste $name (input is hidden)" -AsSecureString
    $ptr = [IntPtr]::Zero
    try {
        if ($secure.Length -lt 20) {
            throw "$name appears too short. Check the key and run the script again."
        }
        $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        if ($ptr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
        }
        if ($null -ne $secure) {
            $secure.Dispose()
        }
    }
}

$keyValues = [ordered]@{}
try {
    foreach ($name in @("GEMINI_KEY_1", "GEMINI_KEY_2", "GEMINI_KEY_3", "GEMINI_KEY_4", "GEMINI_KEY_5")) {
        $keyValues[$name] = Read-HiddenKey $name
    }

    $distinctCount = @($keyValues.Values | Sort-Object -Unique).Count
    if ($distinctCount -ne 5) {
        throw "The five entries are not unique. Nothing was written; run the script again with the correct keys."
    }

    # Current stable Gemini Flash model default as of October 2026.
    # Model IDs are configuration values and can be changed later in .dev.vars.
    $lines = @(
        "GEMINI_KEY_1=$($keyValues['GEMINI_KEY_1'])"
        "GEMINI_KEY_2=$($keyValues['GEMINI_KEY_2'])"
        "GEMINI_KEY_3=$($keyValues['GEMINI_KEY_3'])"
        "GEMINI_KEY_4=$($keyValues['GEMINI_KEY_4'])"
        "GEMINI_KEY_5=$($keyValues['GEMINI_KEY_5'])"
        "GEMINI_MODEL_INTERVIEW=gemini-3.8-flash"
        "GEMINI_MODEL_EXTRACT=gemini-3.8-flash"
        "GEMINI_MODEL_TEST=gemini-3.8-flash"
        "GEMINI_MODEL_CHAT=gemini-3.8-flash"
        "GEMINI_MODEL_VOICE=gemini-3.8-flash"
        "CB_ALLOWED_ORIGINS=https://multigameweb.github.io,http://localhost:8000,http://127.0.0.1:8000"
        "CB_ENABLE_ADMIN_TEST=false"
        "CB_OWNER_DAILY_LIMIT=200"
    )
    $encoding = New-Object System.Text.UTF8Encoding -ArgumentList $false
    [System.IO.File]::WriteAllText($varsPath, (($lines -join [Environment]::NewLine) + [Environment]::NewLine), $encoding)

    Write-Host ""
    Write-Host "Local BotCraft variables file created: server/chatbot-builder/.dev.vars"
    Write-Host "The five key values were not printed."
    Write-Host "The file is gitignored and must never be committed or shared."
    Write-Host "Model defaults: gemini-3.8-flash (can be changed in .dev.vars)."
    Write-Host "Note: this prepares local configuration only; it does not deploy the Worker."
}
finally {
    foreach ($name in @("GEMINI_KEY_1", "GEMINI_KEY_2", "GEMINI_KEY_3", "GEMINI_KEY_4", "GEMINI_KEY_5")) {
        $keyValues[$name] = $null
    }
    $keyValues.Clear()
    $keyValues = $null
}
