import vscode from "vscode";
import { registers } from "./api";
export function activate(context: vscode.ExtensionContext) {
  console.log("My Extension activated.");
  registers.forEach((register) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(register.command, register.callback)
    )
  );
}
export function deactivate() {
  console.log("My Extension deactivated.");
}
