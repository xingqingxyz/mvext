import { getExtConfig } from '@/config'
import {
  commands,
  MarkdownString,
  StatusBarAlignment,
  window,
  workspace,
  type ExtensionContext,
} from 'vscode'

const alarmsMap = new Map<string, ReturnType<typeof setTimeout>>()
const statusBarItem = window.createStatusBarItem(
  'clock',
  StatusBarAlignment.Right,
  -1,
)
statusBarItem.tooltip = new MarkdownString(
  `[$(add) Add](command:mvext.addAlarm)
[$(trash) Remove](command:mvext.removeAlarm)
[$(close) Disable](command:mvext.toggleClock)`,
  true,
)
statusBarItem.tooltip.isTrusted = true
let clockTimer: ReturnType<typeof setTimeout> | undefined

function updateClock(loop = false) {
  const now = Temporal.Now.zonedDateTimeISO()
  statusBarItem.text = now.toPlainTime().toString({ smallestUnit: 'minute' })
  if (loop) {
    clockTimer = setTimeout(
      updateClock,
      now
        .add({ minutes: 1 })
        .with({
          second: 0,
          millisecond: 0,
        })
        .since(now)
        .total('millisecond'),
      true,
    )
  }
}

export async function addAlarm() {
  const alarm = await window.showInputBox({
    placeHolder: 'alarm time e.g. 12:00 / +1:00 / +0:0:3',
    title: 'Add Alarm',
  })
  if (!alarm) {
    return
  }
  const matches = alarm.match(/^\+?(\d\d?):(\d\d?)(?::(\d\d?))?$/)
  if (!matches) {
    return window.showErrorMessage('invalid alarm format')
  }
  if (!matches[3]) {
    matches[3] = '0'
  }
  const [hour, minute, second] = matches.values().drop(1).map(Number)
  let durationMs
  if (alarm.startsWith('+')) {
    durationMs =
      (hour * 3600 + minute * 60 + (Number.isNaN(second) ? 0 : second)) * 1000
  } else if (hour > 23 || minute > 59 || second > 59) {
    return window.showErrorMessage('invalid alarm time')
  } else {
    const now = Temporal.Now.zonedDateTimeISO()
    let time = now.with({ hour, minute, second })
    let dur = time.since(now)
    if (dur.sign < 0) {
      time = time.add({ days: 1 })
      dur = time.since(now)
    }
    durationMs = dur.total('millisecond')
  }
  alarmsMap.set(
    alarm,
    setTimeout(() => {
      alarmsMap.delete(alarm)
      updateClock()
      return window.showInformationMessage(`Alarm for ${alarm} elapsed`)
    }, durationMs),
  )
  updateClock()
}

export async function removeAlarm() {
  await window
    .showQuickPick(alarmsMap.keys().toArray(), {
      canPickMany: true,
      title: 'Remove Alarm',
    })
    .then((items) => {
      if (items) {
        items.forEach((key) => {
          clearTimeout(alarmsMap.get(key))
          alarmsMap.delete(key)
        })
        updateClock()
      }
    })
}

export function toggleClock(value: boolean) {
  if (value) {
    updateClock(clockTimer === undefined)
    statusBarItem.show()
  } else {
    clearTimeout(clockTimer)
    clockTimer = undefined
    statusBarItem.hide()
  }
}

export function registerClock(context: ExtensionContext) {
  if (getExtConfig('clock.enabled')) {
    toggleClock(true)
  }
  context.subscriptions.push(
    statusBarItem,
    workspace.onDidChangeConfiguration(
      (e) =>
        e.affectsConfiguration('mvext.clock.enabled') &&
        toggleClock(getExtConfig('clock.enabled')),
    ),
    commands.registerCommand(
      'mvext.toggleClock',
      (value = clockTimer === undefined) => (
        toggleClock(value),
        workspace.getConfiguration('mvext').update('clock.enabled', value)
      ),
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
