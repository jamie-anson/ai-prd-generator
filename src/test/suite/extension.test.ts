import * as vscode from 'vscode';
import { disposeAllCommands } from '../../commands/commandRegistry';
import * as path from 'path';
import Mocha = require('mocha');
import { glob } from 'glob';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'bdd',
    color: true,
    timeout: 30000 // Increased timeout for slower CI environments
  });

  // Add a global afterEach hook to clean up command registrations
  mocha.suite.afterEach(disposeAllCommands);

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot, ignore: 'suite/extension.test.js' })
      .then(files => {
        // Add files to the test suite
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        try {
          // Run the mocha test
          mocha.run((failures: number) => {
            if (failures > 0) {
              e(new Error(`${failures} tests failed.`));
            } else {
              c();
            }
          });
        } catch (err) {
          console.error(err);
          e(err);
        }
      })
      .catch(err => {
        console.error(err);
        return e(err);
      });
  });
}
