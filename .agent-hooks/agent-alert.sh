#!/bin/sh
# 作業通知 hook(macOS / Linux 用 sh 版。Windows 用は agent-alert.ps1)
# Claude Code / Codex / Cursor の hook から呼ばれ、作業完了・質問/承認待ちを
# デスクトップ通知(macOS: 通知センター+サウンド / Linux: notify-send)と
# .agent-hooks/alerts.log への記録で知らせる。
# 呼び出し例:
#   sh agent-alert.sh --source "Claude Code" --event Stop
# Cursor は .cursor/hooks.json の stop から、Codex は .codex/hooks.json の Stop / PermissionRequest から呼ばれる。
# 動作確認: sh .agent-hooks/agent-alert.sh --source Cursor --event Stop; tail -1 .agent-hooks/alerts.log
# 入力: stdin の JSON(Claude Code hook)または引数中の JSON(Codex notify)。無くても動く。

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
LOG_PATH="$SCRIPT_DIR/alerts.log"

# --- 引数(-Source/-Event は ps1 版と同じ書式も受け付ける)---
SOURCE="AI"
EVENT=""
ARG_JSON=""
while [ $# -gt 0 ]; do
    case "$1" in
        --source|-Source) shift; SOURCE="${1:-AI}" ;;
        --event|-Event) shift; EVENT="${1:-}" ;;
        \{*) ARG_JSON="$1" ;;
    esac
    [ $# -gt 0 ] && shift
done

# --- Windows(Git Bash / MSYS)から呼ばれた場合は PowerShell 版へ委譲 ---
case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*)
        exec powershell.exe -NoProfile -STA -File "$SCRIPT_DIR/agent-alert.ps1" -Source "$SOURCE" -Event "$EVENT" "$ARG_JSON"
        ;;
esac

# --- hook 入力(stdin の JSON。無ければ引数中の JSON)---
RAW=""
if [ ! -t 0 ]; then
    RAW=$(cat 2>/dev/null)
fi
[ -n "$RAW" ] || RAW="$ARG_JSON"

TAB=$(printf '\t')
STAMP=$(date '+%Y-%m-%d %H:%M:%S')
EV="${EVENT:-Unknown}"
KIND="作業完了"
EXCERPT=""

if [ "$(uname -s 2>/dev/null)" = "Darwin" ]; then
    # macOS: JSON 解釈・分類・通知は osascript(JXA)で行い、結果(イベント名/種別/抜粋)を受け取る
    OUT=$(AGENT_ALERT_RAW="$RAW" AGENT_ALERT_SOURCE="$SOURCE" AGENT_ALERT_EVENT="$EVENT" \
        osascript -l JavaScript - <<'JXA' 2>/dev/null
ObjC.import('Foundation');
function env(k) {
    var v = $.NSProcessInfo.processInfo.environment.objectForKey(k);
    return v.isNil() ? '' : ObjC.unwrap(v);
}
var raw = env('AGENT_ALERT_RAW');
var source = env('AGENT_ALERT_SOURCE') || 'AI';
var eventName = env('AGENT_ALERT_EVENT');

var payload = null;
if (raw && raw.trim()) { try { payload = JSON.parse(raw); } catch (e) {} }

// イベント名(引数優先。無ければ payload から推定)
if (!eventName && payload) {
    var keys = ['hook_event_name', 'type', 'event'];
    for (var i = 0; i < keys.length; i++) {
        if (payload[keys[i]]) { eventName = String(payload[keys[i]]); break; }
    }
}
if (!eventName) eventName = 'Unknown';

// 通知本文に使うメッセージ
var msg = '';
if (payload) {
    if (payload.message) {
        msg = String(payload.message);
    } else if (payload.last_assistant_message) {
        msg = String(payload.last_assistant_message);
    } else if (payload['last-assistant-message']) {
        msg = String(payload['last-assistant-message']);
    } else if (payload.transcript_path) {
        // Claude Code の Stop: transcript(JSONL)末尾から最後のアシスタント発言を拾う
        var ns = $.NSString.stringWithContentsOfFileEncodingError(payload.transcript_path, $.NSUTF8StringEncoding, null);
        if (!ns.isNil()) {
            var lines = ObjC.unwrap(ns).split('\n');
            var start = Math.max(0, lines.length - 100);
            for (var j = lines.length - 1; j >= start; j--) {
                if (!lines[j]) continue;
                try {
                    var entry = JSON.parse(lines[j]);
                    if (entry.type === 'assistant' && entry.message && Array.isArray(entry.message.content)) {
                        var texts = [];
                        for (var k = 0; k < entry.message.content.length; k++) {
                            var c = entry.message.content[k];
                            if (c.type === 'text' && c.text) texts.push(c.text);
                        }
                        if (texts.length > 0) { msg = texts.join(' '); break; }
                    }
                } catch (err) {}
            }
        }
    }
}

// 分類: 作業完了 or 質問・承認待ち
var questionWords = ['確認してください', 'どうしますか', '承認', '許可', 'please confirm', 'do you want'];
var looksQuestion = false;
if (msg.trim()) {
    var t = msg.trim();
    if (/[?？]\s*$/.test(t)) looksQuestion = true;
    if (!looksQuestion) {
        var lower = t.toLowerCase();
        for (var q = 0; q < questionWords.length; q++) {
            if (lower.indexOf(questionWords[q].toLowerCase()) >= 0) { looksQuestion = true; break; }
        }
    }
}
var isPrompt = /^(Notification|PermissionRequest|permission_prompt|elicitation_dialog)$/.test(eventName);
var kind = isPrompt ? '質問・承認待ち' : (looksQuestion ? '質問・確認待ち' : '作業完了');

var excerpt = msg ? msg.replace(/\s+/g, ' ').trim() : '';
if (excerpt.length > 200) excerpt = excerpt.slice(0, 200) + '...';

// 通知センターへ表示(表示のみ。音は呼び出し元の sh が afplay で鳴らす。
// 「スクリプトエディタ」の通知許可が無いと表示されない=許可はシステム設定で行う)
var app = Application.currentApplication();
app.includeStandardAdditions = true;
var body = excerpt || ('イベント: ' + eventName);
try { app.displayNotification(body, { withTitle: source + ' - ' + kind }); } catch (e2) {}

// 最終行が osascript の標準出力になる: イベント名 \t 種別 \t 抜粋
eventName + '\t' + kind + '\t' + excerpt;
JXA
)
    if [ -n "$OUT" ]; then
        IFS="$TAB" read -r EV KIND EXCERPT <<EOF
$OUT
EOF
    fi
    # 音は通知許可が無くても聞こえるよう afplay で別途鳴らす(完了=1回 / 質問・承認待ち=3回)
    SOUND=/System/Library/Sounds/Glass.aiff
    if [ -f "$SOUND" ]; then
        case "$KIND" in
            作業完了) ( afplay "$SOUND" >/dev/null 2>&1 & ) ;;
            *) ( { afplay "$SOUND"; afplay "$SOUND"; afplay "$SOUND"; } >/dev/null 2>&1 & ) ;;
        esac
    fi
else
    # Linux ほか: イベント名から簡易分類し、notify-send があれば通知する
    if [ -z "$EVENT" ] && [ -n "$RAW" ]; then
        EV=$(printf '%s' "$RAW" | sed -n 's/.*"hook_event_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
        [ -n "$EV" ] || EV="Unknown"
    fi
    case "$EV" in
        Notification|PermissionRequest|permission_prompt|elicitation_dialog) KIND="質問・承認待ち" ;;
    esac
    if command -v notify-send >/dev/null 2>&1; then
        notify-send "$SOURCE - $KIND" "イベント: $EV" 2>/dev/null
    fi
fi

# --- ログ記録(ps1 版と同じ形式)---
printf '%s\t%s\t%s\t%s\t%s\n' "$STAMP" "$SOURCE" "$EV" "$KIND" "$EXCERPT" >> "$LOG_PATH" 2>/dev/null

# --- Stop / SubagentStop は通常処理を妨げない JSON を返す ---
case "$EV" in
    Stop|SubagentStop|stop|subagentStop) printf '{"continue":true}\n' ;;
esac
exit 0
