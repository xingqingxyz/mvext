import {
  TreeItem,
  window,
  type CancellationToken,
  type Event,
  type ProviderResult,
  type TreeDataProvider,
} from 'vscode'

class RunListTreeDataProvier implements TreeDataProvider<string> {
  onDidChangeTreeData?: Event<string | string[] | null | undefined> | undefined
  getTreeItem(element: string): TreeItem | Thenable<TreeItem> {
    // new TreeItem

    throw new Error('Method not implemented.')
  }
  getChildren(element?: string): ProviderResult<string[]> {
    throw new Error('Method not implemented.')
  }
  getParent?(element: string): ProviderResult<string> {
    throw new Error('Method not implemented.')
  }
  resolveTreeItem?(
    item: TreeItem,
    element: string,
    token: CancellationToken,
  ): ProviderResult<TreeItem> {
    throw new Error('Method not implemented.')
  }
}

function runList() {
  window.createTreeView('mvext.runList', {
    treeDataProvider: new RunListTreeDataProvier(),
  })
}
