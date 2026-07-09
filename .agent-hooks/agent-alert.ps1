# 作業通知 hook（Windows 用 PowerShell 版。macOS / Linux 用は agent-alert.sh）
# Claude Code / Codex / Cursor の hook から呼ばれ、作業完了・質問/承認待ちを
# Windows 標準 Toast（duration="long"、通知音 Notification.Looping.Call10）と
# .agent-hooks/alerts.log への記録で知らせる。
# 呼び出し例:
#   powershell.exe -NoProfile -STA -File agent-alert.ps1 -Source "Claude Code" -Event Stop
param(
    [string]$Source = "AI",
    [string]$Event = "",
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Rest
)

$ErrorActionPreference = "Continue"
$logPath = Join-Path $PSScriptRoot "alerts.log"

# --- hook 入力（stdin の JSON。無ければ引数中の JSON）---
$raw = ""
try {
    if ([Console]::IsInputRedirected) {
        $reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), (New-Object System.Text.UTF8Encoding($false)))
        $raw = $reader.ReadToEnd()
    }
} catch {}
if ([string]::IsNullOrWhiteSpace($raw) -and $Rest) {
    foreach ($a in $Rest) {
        if ($a -and $a.TrimStart().StartsWith("{")) { $raw = $a; break }
    }
}

$payload = $null
if (-not [string]::IsNullOrWhiteSpace($raw)) {
    try { $payload = $raw | ConvertFrom-Json } catch {}
}

# --- イベント名（引数優先。無ければ payload から推定）---
$eventName = $Event
if ([string]::IsNullOrWhiteSpace($eventName) -and $payload) {
    foreach ($k in @("hook_event_name", "type", "event")) {
        $p = $payload.PSObject.Properties[$k]
        if ($p -and $p.Value) { $eventName = [string]$p.Value; break }
    }
}
if ([string]::IsNullOrWhiteSpace($eventName)) { $eventName = "Unknown" }

# --- 通知本文に使うメッセージ ---
$msg = ""
if ($payload) {
    if ($payload.PSObject.Properties["message"] -and $payload.message) {
        $msg = [string]$payload.message
    } elseif ($payload.PSObject.Properties["last-assistant-message"] -and $payload."last-assistant-message") {
        $msg = [string]$payload."last-assistant-message"
    } elseif ($payload.PSObject.Properties["transcript_path"] -and $payload.transcript_path -and (Test-Path -LiteralPath $payload.transcript_path)) {
        # Claude Code の Stop: transcript(JSONL) 末尾から最後のアシスタント発言を拾う
        try {
            $lines = Get-Content -LiteralPath $payload.transcript_path -Encoding UTF8 -Tail 100
            for ($i = $lines.Count - 1; $i -ge 0; $i--) {
                try {
                    $e = $lines[$i] | ConvertFrom-Json
                    if ($e.type -eq "assistant" -and $e.message -and $e.message.content) {
                        $texts = @($e.message.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text })
                        if ($texts.Count -gt 0) { $msg = ($texts -join " "); break }
                    }
                } catch {}
            }
        } catch {}
    }
}

# --- 分類: 作業完了 or 質問・承認待ち ---
$questionWords = @("確認してください", "どうしますか", "承認", "許可", "please confirm", "do you want")
$looksQuestion = $false
if (-not [string]::IsNullOrWhiteSpace($msg)) {
    $t = $msg.Trim()
    if ($t -match "[?？]\s*$") { $looksQuestion = $true }
    if (-not $looksQuestion) {
        foreach ($w in $questionWords) {
            if ($t.IndexOf($w, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { $looksQuestion = $true; break }
        }
    }
}

$isStop = $eventName -match "^(Stop|SubagentStop|stop|subagentStop)$"
$isPrompt = $eventName -match "^(Notification|PermissionRequest|permission_prompt|elicitation_dialog)$"

if ($isPrompt) { $kind = "質問・承認待ち" }
elseif ($looksQuestion) { $kind = "質問・確認待ち" }
else { $kind = "作業完了" }

# --- ログ記録 ---
$excerpt = ""
if ($msg) {
    $excerpt = ($msg -replace "\s+", " ").Trim()
    if ($excerpt.Length -gt 200) { $excerpt = $excerpt.Substring(0, 200) + "..." }
}
$stamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
try { Add-Content -LiteralPath $logPath -Encoding UTF8 -Value "$stamp`t$Source`t$eventName`t$kind`t$excerpt" } catch {}

# --- Toast 通知（同期発火。detached 起動はしない）---
$title = "$Source - $kind"
$body = if ($excerpt) { $excerpt } else { "イベント: $eventName" }
try {
    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
    $tEsc = [System.Security.SecurityElement]::Escape($title)
    $bEsc = [System.Security.SecurityElement]::Escape($body)
    $xml = '<toast duration="long"><visual><binding template="ToastGeneric"><text>' + $tEsc + '</text><text>' + $bEsc + '</text></binding></visual><audio src="ms-winsoundevent:Notification.Looping.Call10" /></toast>'
    $doc = [Windows.Data.Xml.Dom.XmlDocument]::new()
    $doc.LoadXml($xml)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
    $appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
    Start-Sleep -Milliseconds 400
} catch {
    # Toast 失敗時は音だけフォールバック
    try {
        [System.Media.SystemSounds]::Exclamation.Play()
        Start-Sleep -Milliseconds 600
    } catch {}
    try { Add-Content -LiteralPath $logPath -Encoding UTF8 -Value "$stamp`t$Source`ttoast-error`t$($_.Exception.Message)" } catch {}
}

# --- Stop / SubagentStop は通常処理を妨げない JSON を返す ---
if ($isStop) { Write-Output '{"continue":true}' }
exit 0
