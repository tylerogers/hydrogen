// import type {Env} from 'types';
// import {MiniOxygen} from './mini-oxygen/core';
// import path from 'path';
import {HelpfulError} from '../../utilities';
import Command from '../../core/Command';

export class Preview extends Command {
  static description =
    'Preview a hydrogen worker build in a worker environment.';

  static examples = [`$ shopify hydrogen preview`];

  static flags = {
    ...Command.flags,
  };

  static args = [];

  async run(): Promise<void> {
    const hasWorkerBuild = await this.fs.hasFile('dist/worker/worker.js');

    if (!hasWorkerBuild) {
      throw new HelpfulError({
        title: 'worker.js not found',
        content: 'A worker build is required for this command.',
        suggestion: () =>
          `Run \`yarn run build\` to generate a worker build and try again.`,
      });
    }

    const files = await this.fs.glob('dist/client');

    console.log(files);
    // const mf = new MiniOxygen({
    //   buildCommand: 'yarn build',
    //   globals: {Oxygen: {}},
    //   scriptPath: path.resolve(root, 'dist/worker/worker.js'),
    //   sitePath: path.resolve(root, 'dist/client'),
    // });

    // const app = await mf.createServer({assets: files});

    // app.listen(port, () => {
    //   ui.say(
    //     `\nStarted miniOxygen server. Listening at http://localhost:${port}\n`
    //   );
    // });
  }
}
