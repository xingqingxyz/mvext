import changeCase = require("change-case");
import vscode from "vscode";

const allWordCases = [
  "capitalCase",
  "camelCase",
  "constantCase",
  "pascalCase",
  "paramCase",
  "snakeCase",
  "sentenceCase",
  "dotCase",
  "pathCase",
  "headerCase",
  "noCase",
] as const;
type WordCase = (typeof allWordCases)[Extract<
  keyof typeof allWordCases,
  number
>];
export const registers = allWordCases.map((wc) => ({
  command: `my-extension.transformTo${
    wc[0].toUpperCase() + wc.substring(1)
  }Case`,
  callback: () => runCommandById(wc),
}));
function runCommandById(id: WordCase) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const { document, selections } = editor;
  editor.edit((editBuilder) => {
    for (const selectionIt of selections) {
      const range = selectionIt.isEmpty
        ? document.getWordRangeAtPosition(selectionIt.active)
        : selectionIt;
      if (!range) {
        return;
      }
      editBuilder.replace(range, dispatch(document.getText(range), id));
    }
  });
}
function dispatch(sequence: string, id: WordCase) {
  return changeCase[id](sequence);
}
