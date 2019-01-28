const keygen = require('ssh-keygen');
const fs = require('fs-extra');

module.exports = async function ({ proc, key, logger }) {

    let deployKeys = await proc.cluster.getSecret(proc.cluster.makeObjectKey(key));
    if (!deployKeys) {
        logger.debug("Deploy key not found. Generating new ones");

        let keys = await Promise.fromCallback(cb => {
            return keygen({
                location: process.cwd() + '/deploy',
                read: true
            }, cb);
        });

        let pub = Buffer.from(keys.pubKey, 'utf8').toString('base64');
        let priv = Buffer.from(keys.key, 'utf8').toString('base64');

        logger.debug("Generated keys ", keys.pubKey);

        deployKeys = await proc.cluster.createSecret(proc.cluster.makeObjectKey(key), { pub, priv });
    } else {
        logger.debug("Secret already exists. Reusing it");
    }

    // Saving keys in our working dir to be used by git command later
    await fs.writeFile("deploy.pub", Buffer.from(deployKeys.data.pub, "base64").toString('utf8'), 'utf8');
    await fs.writeFile("deploy", Buffer.from(deployKeys.data.priv, "base64").toString('utf8'), 'utf8');

    return deployKeys;
}