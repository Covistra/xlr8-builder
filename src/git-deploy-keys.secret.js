const RSA = require('node-rsa');
const fs = require('fs-extra');

module.exports = async function({ proc, key, logger }) {

    let deployKeys = await proc.cluster.getSecret(proc.cluster.makeObjectKey(key));
    if (!deployKeys) {
        logger.info("Generating keypair for git repository access. Will need to be installed as deploy key in all repos");
        const rsaKey = new RSA({ b: 2048 });
        const keyPair = rsaKey.generateKeyPair();

        let pubKey = Buffer.from(keyPair.exportKey('public'), 'utf8').toString('base64');
        let privKey = Buffer.from(keyPair.exportKey('private'), 'utf8').toString('base64');

        deployKeys = await proc.cluster.createSecret(proc.cluster.makeObjectKey(key), { pub: pubKey, priv: privKey });
    } else {
        logger.debug("Secret already exists. Reusing it");
    }

    // Saving keys in our working dir to be used by git command later
    await fs.writeFile("deploy.pub", Buffer.from(deployKeys.data.pub, "base64").toString('utf8'), 'utf8');
    await fs.writeFile("deploy", Buffer.from(deployKeys.data.priv, "base64").toString('utf8'), 'utf8');

    return deployKeys;
}