# Claude Code supplies JSON on stdin. Forward only lifecycle metadata to local Wipi.
try {
    $data = [Console]::In.ReadToEnd() | ConvertFrom-Json
    if ($data.agent_id) { exit 0 }
    $settingsPath = Join-Path $env:APPDATA 'wipi\settings.json'
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
    if (-not $settings.token) { exit 0 }
    $payload = @{
        session_id = [string]$data.session_id
        prompt_id = [string]$data.prompt_id
        cwd = [string]$data.cwd
        hook_event_name = [string]$data.hook_event_name
        tool_name = [string]$data.tool_name
    } | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri 'http://127.0.0.1:47823/claude-hook' -Method Post -ContentType 'application/json' -Headers @{ 'X-Wipi-Token' = [string]$settings.token } -Body $payload -TimeoutSec 1 | Out-Null
} catch {
    # Wipi can be closed; never interrupt Claude Code because of a notification.
}
exit 0
