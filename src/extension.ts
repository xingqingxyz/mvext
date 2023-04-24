// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "my-extension" is now active!')

  let disposable = vscode.commands.registerCommand(
    'my-extension.invokePowerShellCommand',
    async () => {
      const cmd = await vscode.window.showInputBox({
        prompt: 'Please input a powershell expression to invoke in pwsh.',
      })

      if (!cmd) return
      lastInvokedCommand = cmd

      let { activeTerminal } = vscode.window
      if (!activeTerminal)
        activeTerminal = vscode.window.createTerminal({
          color: 'red',
          shellArgs: ['ls', '&&', 'pwd'],
        })

      activeTerminal.show(true)
      activeTerminal.sendText(cmd)
    }
  )
  context.subscriptions.push(disposable)
}

let lastInvokedCommand: string

// This method is called when your extension is deactivated
export function deactivate() {
  console.log(
    'My Extension deactivated, lastInvokedCommand: ' + lastInvokedCommand
  )
}
