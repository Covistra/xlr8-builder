/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2019 Covistra Technologies Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation 
 * files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, 
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished 
 * to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const Git = require('simple-git/promise');
const tmp = require('tmp');
const fs = require('fs-extra');
const Path = require('path');

tmp.setGracefulCleanup();

module.exports = function ({ proc, key, helpers, logger }) {

    // Use action helper to create a new action. Helpers to reference actions in other services
    // are also available
    return helpers.action(key, async function ({ gitEvent }) {

        const GIT_SSH_COMMAND = "ssh -i /opt/service/deploy -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no";

        try {
            logger.debug("Checking if this is a project configured for automatic build");
            let cloneDir = tmp.dirSync();
            logger.debug("Cloning repo %s in %s", gitEvent.repository.ssh_url, cloneDir.name)
            let git = Git(cloneDir.name).env({ ...process.env, GIT_SSH_COMMAND });
            await git.clone(gitEvent.repository.ssh_url, cloneDir.name, ["--depth", "1"]);
            logger.debug("Clone was successful");
            await git.reset(["--hard", gitEvent.commits[0].id]);
            logger.debug("Reset was successful");
            let exists = await fs.exists(Path.join(cloneDir.name, "xlr8.yaml"));
            if (exists) {
                logger.debug("Found build spec");
                let buildSpec = await proc.readYamlFile(Path.join(cloneDir.name, "xlr8.yaml"));
                logger.debug("build spec is", buildSpec);
                buildSpec.build = buildSpec.build || {
                    builder: 'xlr8/service-builder:latest',
                    branch: 'master'
                };

                let buildWorker = proc.cluster.createWorker({
                    name: `xlr8-build-worker`,
                    image: buildSpec.build.builder
                });

                return buildWorker.launch([
                    '--ref', gitEvent.commits[0].id,
                    '--repoUrl', gitEvent.repository.ssh_url,
                    "--registryUrl", config.registryUrl,
                    "--k8s", "cluster",
                    "--namespace", config.namespace
                ], { resolvedAt: 'launch' });
            } else {
                logger.debug("Skipping build for project %s", buildSpec)
            }
        } catch (err) {
            logger.error("Unable to execute buildProject action", err);
        }
    });
}