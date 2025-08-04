# Phase 7: Packaging & Publishing

*Vibe: Let the world see!*

**Goal:** Prepare your extension for distribution on the VS Code Marketplace.

**Steps:**

1. **Create a Publisher:**
    * Create an organization in Azure DevOps.
    * Generate a Personal Access Token (PAT) with Marketplace permissions.

2. **Install `vsce`:**
    * Run `npm install -g vsce`.

3. **Login with `vsce`:**
    * Run `vsce login <publisher-name>` and provide your PAT.

4. **Update `package.json`:**
    * Add the `publisher` field.
    * Add a `repository` field pointing to your Git repo.
    * Add an `icon` field pointing to a 128x128 `icon.png` file.

5. **Create Documentation:**
    * Write a comprehensive `README.md`.
    * Maintain a `CHANGELOG.md`.

6. **Package & Publish:**
    * Run `vsce package` to create the `.vsix` file.
    * Run `vsce publish` to upload to the Marketplace.
