import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { VM } from 'vm2';

interface TransformTask {
  name: string;
  description?: string;
  transform: string | Function; // JavaScript function as string or function object
}

type Context = {
	readonly startLine: number;
	readonly startCharacter: number;
	readonly endLine: number;
	readonly endCharacter: number;
  readonly fileName: string;
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Custom Text Transformer extension is now active');

  const selectAndTransformDisposable = vscode.commands.registerCommand('custom-text-transformer.selectAndTransform', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return;
      }

      let s = 0;
			let i = 0;
      const selection = editor.selection;
      const context = {
				get startLine() { return selection.start.line; },
				get startCharacter() { return selection.start.character; },
				get endLine() { return selection.end.line; },
				get endCharacter() { return selection.end.character; },
        get fileName() { return editor.document.fileName; }
			};
      const selectedText = editor.document.getText(selection);
      
      if (!selectedText || selectedText.trim() === '') {
        vscode.window.showWarningMessage('Please select some text to transform.');
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a workspace.');
        return;
      }

      // Get script path from workspace settings
      const config = vscode.workspace.getConfiguration('custom-text-transformer');
      const scriptPath = config.get<string>('executor');

      if (!scriptPath) {
        vscode.window.showErrorMessage('Executor path not configured. Please set "custom-text-transformer.executor" in workspace settings.');
        return;
      }

      // Resolve the script path (handle both relative and absolute paths)
      const resolvedScriptPath = path.isAbsolute(scriptPath) 
        ? scriptPath 
        : path.join(workspaceFolder.uri.fsPath, scriptPath);

      // Check if script file exists
      if (!fs.existsSync(resolvedScriptPath)) {
        vscode.window.showErrorMessage(`Script file not found: ${resolvedScriptPath}`);
        return;
      }

      // Parse the script file to extract transformation tasks
      const tasks = await parseTransformTasks(resolvedScriptPath);

      if (tasks.length === 0) {
        vscode.window.showWarningMessage('No transformation tasks found in the script file.');
        return;
      }

      // Show task selection to user
      const selectedTask = await showTaskPicker(tasks);
      if (!selectedTask) {
        return; // User cancelled
      }

      // Execute the selected transformation
      const transformedText = await executeTransformation(selectedTask, selectedText, context);

      // Replace the selected text with transformed text
      await editor.edit(editBuilder => {
        editBuilder.replace(selection, transformedText);
      });

      vscode.window.showInformationMessage(`Text transformed using "${selectedTask.name}"`);

    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(selectAndTransformDisposable);
}

async function parseTransformTasks(scriptPath: string): Promise<TransformTask[]> {
  const content = fs.readFileSync(scriptPath, 'utf8');
  const ext = path.extname(scriptPath).toLowerCase();

  if (ext === '.js') {
    // JavaScript module format
    try {
      // Create a secure VM to execute the script
      const vm = new VM({
        timeout: 1000,
        sandbox: {}
      });

      // Execute the script and get the exported tasks
      const result = vm.run(content + '\n; typeof module !== "undefined" && module.exports ? module.exports : this;');
      
      if (result && result.tasks && Array.isArray(result.tasks)) {
        return result.tasks.filter((task: any) => {
          const hasName = task.name;
          const hasTransform = task.transform && (typeof task.transform === 'string' || typeof task.transform === 'function');
          console.log(`Task ${task.name}: hasName=${hasName}, hasTransform=${hasTransform}, transformType=${typeof task.transform}`);
          return hasName && hasTransform;
        });
      }
    } catch (error) {
      throw new Error(`Error parsing JavaScript file: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    throw new Error(`Transform file must be a javascript file`);
  }

  return [];
}

async function showTaskPicker(tasks: TransformTask[]): Promise<TransformTask | undefined> {
  const items = tasks.map(task => ({
    label: task.name,
    description: task.description || 'Text transformation task',
    task: task
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a transformation task',
    matchOnDescription: true
  });

  return selected?.task;
}

async function executeTransformation(task: TransformTask, inputText: string, context: Context): Promise<string> {
  try {
    console.log(`Executing transformation for task: ${task.name}, transform type: ${typeof task.transform}`);
    
    // Handle different types of transform
    if (typeof task.transform === 'function') {
      // If transform is already a function, call it directly
      const result = task.transform(inputText, context);
      if (typeof result !== 'string') {
        throw new Error('Transform function must return a string');
      }
      return result;
    } else {
      throw new Error(`Transform must be a function, got: ${typeof task.transform}. Value: ${JSON.stringify(task.transform)}`);
    }
  } catch (error) {
    throw new Error(`Transformation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function deactivate() {}