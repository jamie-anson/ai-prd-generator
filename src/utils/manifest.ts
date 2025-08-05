import * as vscode from 'vscode';
import { getPrdOutputPath } from './configManager';

/**
 * Creates or updates an AI manifest file in the workspace to track generated artifacts.
 * @param context The extension context.
 * @param newArtifact The artifact metadata to add to the manifest.
 */
export async function updateAiManifest(context: vscode.ExtensionContext, newArtifact: any) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return; }

    const workspaceUri = workspaceFolders[0].uri;
    const prdOutputDir = getPrdOutputPath(workspaceUri);
    if (!prdOutputDir) {
        console.error('Could not determine PRD output path for manifest.json');
        return;
    }
    const manifestFile = vscode.Uri.joinPath(prdOutputDir, 'manifest.json');

    let manifest: { artifacts: any[] } = { artifacts: [] };

    try {
        await vscode.workspace.fs.createDirectory(prdOutputDir);
        const fileContent = await vscode.workspace.fs.readFile(manifestFile);
        manifest = JSON.parse(Buffer.from(fileContent).toString('utf-8'));
    } catch (error) {
        // Manifest doesn't exist or is invalid, start with a fresh one.
    }

    manifest.artifacts.push({
        agent: 'ai-prd-generator',
        timestamp: new Date().toISOString(),
        ...newArtifact
    });

    await vscode.workspace.fs.writeFile(manifestFile, Buffer.from(JSON.stringify(manifest, null, 4)));
}
