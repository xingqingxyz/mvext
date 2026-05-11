import {
  commands,
  MarkdownString,
  StatusBarAlignment,
  Uri,
  window,
  workspace,
  type ExtensionContext,
} from 'vscode'

let clockTimer: ReturnType<typeof setTimeout> | undefined
const alarmsMap = new Map<string, ReturnType<typeof setTimeout>>()
const statusBarItem = window.createStatusBarItem(
  'clock',
  StatusBarAlignment.Right,
  -1,
)

function updateClock() {
  const date = new Date()
  statusBarItem.text = date.getHours() + ':' + date.getMinutes()
  statusBarItem.tooltip =
    new MarkdownString(`[$(toggle) Toggle Clock](command:mvext.toggleClock)

**Alarms:**

[$(add) Add](command:mvext.addAlarm)

${alarmsMap
  .keys()
  .map(
    (alarm) =>
      `*${alarm}* [$(remove) Remove](command:mvext.removeAlarm?${
        Uri.parse(JSON.stringify([alarm]))
          .toString()
          .split('///', 2)[1]
      })`,
  )
  .toArray()
  .join('\n\n')}
`)
  statusBarItem.show()
}

export async function addAlarm() {
  const alarm = await window.showInputBox({
    placeHolder: 'alarm time e.g. 12:00 / +1:00 / +0:0:3',
    title: 'Add Alarm',
  })
  if (!alarm) {
    return
  }
  if (!/^\+?\d\d?:\d\d?(:\d\d?)?$/.test(alarm)) {
    throw 'invalid alarm format'
  }
  const [hours, minutes, seconds] = alarm.split(':').map(parseInt)
  let durationMs
  if (alarm.startsWith('+')) {
    durationMs =
      (hours * 3600 + minutes * 60 + (Number.isNaN(seconds) ? 0 : seconds)) *
      1000
  } else if (hours > 23 || minutes > 59 || seconds > 59) {
    throw 'invalid alarm time'
  } else {
    const date = new Date()
    const alarmUTC = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
      seconds,
      date.getUTCMilliseconds(),
    )
    durationMs = alarmUTC - Date.now()
    if (durationMs < 0) {
      durationMs =
        alarmUTC -
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          0,
          0,
          0,
          date.getUTCMilliseconds(),
        ) -
        durationMs
    }
  }
  alarmsMap.set(
    alarm,
    setTimeout(
      () => window.showInformationMessage(`Alarm for ${alarm} elapsed`),
      durationMs,
    ),
  )
}

export function removeAlarm(alarm: string) {
  clearTimeout(alarmsMap.get(alarm))
}

export function toggleClock(value = clockTimer === undefined) {
  if (value) {
    clockTimer = setInterval(updateClock, 60000)
  } else {
    clearInterval(clockTimer)
    clockTimer = undefined
  }
}

export function registerClock(context: ExtensionContext) {
  context.subscriptions.push(
    statusBarItem,
    workspace.onDidChangeConfiguration(
      (e) => e.affectsConfiguration('mvext.clock.enabled') && toggleClock(),
    ),
    commands.registerCommand(
      'mvext.toggleClock',
      (value = clockTimer === undefined) => {
        toggleClock(value)
        workspace.getConfiguration('mvext').update('clock.enabled', value)
      },
    ),
    commands.registerCommand('mvext.addAlarm', addAlarm),
    commands.registerCommand('mvext.removeAlarm', removeAlarm),
    {
      dispose() {
        clearInterval(clockTimer)
        alarmsMap.values().forEach(clearTimeout)
      },
    },
  )
}
