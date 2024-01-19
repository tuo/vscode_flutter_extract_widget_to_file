import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import { QuickPickItem, ViewColumn } from 'vscode';
import { StateManager } from './cache';

interface WorkspaceRoot {
  rootPath: string;
  baseName: string;
  multi: boolean;
}


export async function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.extractFlutterWidgetToFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }


    const selectedText = getSelectedText(editor);
    if (!selectedText) {
      vscode.window.showErrorMessage('Please select a widget.');
      return;
    }
    const roots = workspaceRoots();
    if(roots.length > 1){
      vscode.window.showErrorMessage('only support one workspace.');
      return;
    }
    const rootPath = roots[0].rootPath;


  
    /*
      input would be:
      * MyWidget
      * MyWidget;
      * /MyWidget
      * components/MyWidget
      * /components/buttons/MyWidget
      * 
      * MyWidget;Song song,int index, String name,Void onTap
    */

      const state = new StateManager(context)
    
    // Add a new class name with the user input
    const inputString = await getNewClassName(state);
    if (!inputString) {
      return;
    }
    const parts = inputString.split(";").map(t=>t.trim()).filter(t => t);
    const pathString = parts[0];
    const fieldString = parts.length > 1 ? parts[1] : null;

    const pathElements = pathString.split("/")?.map(t=>t.trim()).filter(t => t);
    if(pathElements.length == 0){
      return;
    } 
    //how to remove last element from pathElements

    const className = pathElements.pop();  
    if(!className){
      return;
    }    
    // save this path to settings
    
    state.write(pathElements.join("/"));

    // Yeni sınıf dosyasını oluştur
    const fileName = generateSnakeFileNameFromCamelCase(className);
    const fullPath = path.join(rootPath, 'lib', path.join(...pathElements), fileName)
  

    // Create a new class text
    const newClassText = createNewClassText(className, selectedText, fieldString);


    // Replace the selected text with the new instance
    await replaceSelectedTextWithNewInstance(editor, className, fieldString);

    

    // Save and format the document
    await editor.document.save();
    await vscode.commands.executeCommand('editor.action.formatDocument');
 

    // If there is no main function, add the part expression to the beginning of the file
    const newFileContent = insertImportToCurrentOpenedFile(editor, rootPath, pathElements, fileName);
    
    // Update the current file and be sure that the file is not changed by another process
    try {
      await editor.document.save(); // Save the current file
    } catch (err) {
      console.error(err);
      return;
    }

    const currentFileStat = fs.statSync(editor.document.uri.fsPath);
    // console.log("editor.document.uri.fsPath", editor.document.uri.fsPath)
    const currentFileModificationTime = currentFileStat.mtimeMs;
    if (currentFileModificationTime > Date.now()) {
      vscode.window.showErrorMessage('The file has been changed. Please try again.');
      return;
    }

    // Update the current file
    try {
      fs.writeFileSync(editor.document.uri.fsPath, newFileContent);
    } catch (err) {
      console.error(err);
      return;
    }


    //createNewFile(editor, fileName, newClassText);
    createFileOrFolder(fullPath, newClassText);
    //TODO: open this file here
    await openFile(fullPath);

    vscode.window.showInformationMessage(`The new file has been created: ${fileName}`);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}


/// Get the selected text
function getSelectedText(editor: vscode.TextEditor) {
  return editor.document.getText(editor.selection);
}

/// Get a new class name from the user
async function getNewClassName(state: StateManager) {
  const previousValue = state.read()?.trim();
  return await vscode.window.showInputBox({
    // prompt: 'Enter "path/subpath/MyWidget" or "path/subpath/MyWidget;Song song,int index" to quickly extract a widget with properties.\nThis creates new directories while creating new file.\nProperties followed after ";" and seperate by ",", specify type and field name.',
    prompt: previousValue ?  'Enter "path/subpath/MyWidget" or "path/subpath/MyWidget;Song song,int index" to quickly extract a widget with properties relative to "lib".' : 'Enter the path and name of the new widget you want to create, followed by any properties. For example, "path/subpath/MyWidget" or "path/subpath/MyWidget;Song song,int index". This will create new directories and a new file relative to "lib" folder. Properties(type and name pair) should be listed after a semicolon (;), separated by commas (,).',
    value: previousValue ? `${previousValue + '/'}` : 'components/MyNewWidget',
  });
}


/// Create a new class text
// fieldString "Song? song,int index, String name,Void onTap"
function createNewClassText(newClassName: string, selectedText: string, fieldString: string | null) {
  //dyanmically create fields and constructor for it
  const fieldStringParts = fieldString?.split(",").map(t=>t.trim()).filter(t => t) ?? [];
  let fieldStringPartsRequired = '';
  let constructorString = `const ${newClassName}({super.key});`;

  if(fieldStringParts.length > 0){
    // final mark every field as required 
    fieldStringPartsRequired = fieldStringParts.map(t => `  final ${t};`).join("\n") + "\n\n";
    //loop ecah fields string and and split by " " and get the last element and add to constructor
    const fieldNames = fieldStringParts.map(t => t.split(" ").pop()).filter(t => t);
    
    constructorString = `const ${newClassName}({super.key${fieldNames.map(t=>`, required this.${t}`).join('')} });`;
  }

  return `import 'package:flutter/material.dart';\n\nclass ${newClassName} extends StatelessWidget {\n${fieldStringPartsRequired}  ${constructorString}\n\n  @override\n  Widget build(BuildContext context) {\n    return ${selectedText.trim()};\n  }\n}`;
}

/// Replace the selected text with the new instance
// fieldString "Song? song,int index, String name,Void onTap" would be MyWidget(song: null, index:null, name: null, onTap: null)
// else just MyWidget()

async function replaceSelectedTextWithNewInstance(editor: vscode.TextEditor, newClassName: string, fieldString: string | null) {
  const fieldStringParts = fieldString?.split(",").map(t=>t.trim()).filter(t => t) ?? [];
  let fields = '';
  if(fieldStringParts.length > 0){
    const fieldNames = fieldStringParts.map(t => t.split(" ").pop()).filter(t => t);
    fields = fieldNames.map(t=>`${t}: null,\n`).join('');
  }

  await editor.edit((editBuilder) => {
    editBuilder.replace(editor.selection, `${newClassName}(${fields})`);
  });
}

/// Generate a file name from the class name
function generateSnakeFileNameFromCamelCase(className: string) {
  let fileName = className;
  if (fileName.startsWith('_')) {
    fileName = fileName.slice(1);
  }
  const parts = fileName.split(/(?=[A-Z])/);
  parts[0] = parts[0].charAt(0).toLowerCase() + parts[0].slice(1);
  return `${parts.join('_').toLowerCase()}.dart`;
}


/*
  create file or folder path relative to lib folder

  MyWidget => in current folder => my_widget.dart
  components/MyWidget => in current folder => create sub folder 'components' and inside it, create file my_widget.dart

  /MyWidget => create my_widget.dart to lib/my_widget.dart
  /components/MyWidget => create my_widget.to under lib/components/my_widget.dart
  /components/buttons/MyWidget => create my_widget.to under lib/components/buttons/my_widget.dart

  it will remember the last used filepath + MyWidget

*/
/// Create a new file with the given file name and class text
function createNewFile(editor: vscode.TextEditor, fileName: string, newClassText: string) {
  const currentDirectory = path.dirname(editor.document.uri.fsPath);
  const newFilePath = path.join(currentDirectory, fileName);

  const currentFileName = path.basename(editor.document.uri.fsPath, '.dart');
  const partOfText = `part of "${currentFileName}.dart"; \n`;

  // console.log("editor.document.uri.fsPath ", editor.document.uri.fsPath, "currentDirectory", currentDirectory)

  try {
    fs.writeFileSync(newFilePath, `${partOfText}${newClassText}`);
  } catch (err) {
    console.error(err);
    return;
  }
}

function createFileOrFolder(absolutePath: string, newClassText: string): void {
  let directoryToFile = path.dirname(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    if (isFolderDescriptor(absolutePath)) {
      mkdirp.sync(absolutePath);
    } else {
      mkdirp.sync(directoryToFile);
      fs.appendFileSync(absolutePath, newClassText );
    }
  }
}

function isFolderDescriptor(filepath: string): boolean {
  return filepath.charAt(filepath.length - 1) === path.sep;
}


function workspaceRoots(): WorkspaceRoot[] {
  if (vscode.workspace.workspaceFolders) {
    const multi = vscode.workspace.workspaceFolders.length > 1;

    return vscode.workspace.workspaceFolders.map((folder) => {
      return {
        rootPath: folder.uri.fsPath,
        baseName: folder.name || path.basename(folder.uri.fsPath),
        multi
      };
    });
  } else if (vscode.workspace.rootPath) {
    return [{
      rootPath: vscode.workspace.rootPath,
      baseName: path.basename(vscode.workspace.rootPath),
      multi: false
    }];
  } else {
    return [];
  }
}


async function openFile(absolutePath: string): Promise<void> {
  if (false && isFolderDescriptor(absolutePath)) {
    const showInformationMessages = vscode.workspace
      .getConfiguration('advancedNewFile').get('showInformationMessages', true);

    if (showInformationMessages) {
      vscode.window.showInformationMessage(`Folder created: ${absolutePath}`);
    }
  } else {
    const textDocument = await vscode.workspace.openTextDocument(absolutePath);

    if (textDocument) {
    //   const shouldExpandBraces =
    // vscode.workspace.getConfiguration('advancedNewFile').get('expandBraces');

      if (false) {
        vscode.window.showTextDocument(textDocument, { preview: false });
      } else {
        vscode.window.showTextDocument(textDocument, ViewColumn.Active);
      }
    }
  }
}



//============== append import 'package:hello_world_app/pages/song_page.dart';
function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;
  while (l--) {
      if (predicate(array[l], l, array))
          return l;
  }
  return -1;
}


function appendImport(input: string, newImport:string) {
  const lines = input.split('\n');
 const importIndex = findLastIndex(lines, line => line.startsWith('import '));
//  console.log()
 const insertIndex = importIndex !== -1 ? importIndex + 1 : 0;
 lines.splice(insertIndex, 0, newImport);
 const newFileContent = lines.join('\n');
 return newFileContent;
}

/// Add a part expression to the current file
function createImportTextForCurrentClass(rootPath:string, basePathElementsRelativeToLib: string[], fileName: string) {
  //import 'package:hello_world_app/pages/song_page.dart';
  // 1. get pubspec.yaml 's name - packageName
  // 2. compose basedEleemtnPaths relative to lib plus fileName
  const packgeName = fs.readFileSync(path.join(rootPath, "pubspec.yaml")).toString().split("\n")[0].split(":")[1]?.trim() ?? '';
  const fullImportPath = path.join(packgeName, ...basePathElementsRelativeToLib, fileName)
  return `import "package:${fullImportPath}";\n\n`;
}



function insertImportToCurrentOpenedFile(editor: vscode.TextEditor, rootPath:string, basePathElementsRelativeToLib: string[], fileName: string) {

      // Add a part expression to the current file
      const currentFileContent = fs.readFileSync(editor.document.uri.fsPath).toString();
      const importTextForCurrentClass = createImportTextForCurrentClass(rootPath, basePathElementsRelativeToLib, fileName);


      const currentFileName = path.basename(editor.document.uri.fsPath, '.dart');
  
      // Update the current file
      const firstLine = editor.document.lineAt(0).text.trim();

      if (!firstLine.startsWith('void main()')) {
        return appendImport(currentFileContent, importTextForCurrentClass);
      }
        // Otherwise, add the part expression after the first curly brace
        const index = currentFileContent.indexOf('{');
        return `${currentFileContent.substring(0, index)}\n\n${createImportTextForCurrentClass}${currentFileContent.substring(index)}`;
  
}
