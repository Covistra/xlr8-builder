module.exports = function({ proc, logger }) {
    return async function(args) {
        logger.debug("Producing build status report");
        const { gitDeployKeysSecret } = await proc.select('gitDeployKeysSecret').type('secret').wait();
        let pubKey = Buffer.from(gitDeployKeysSecret.data.pub, "base64").toString('utf8');
        console.log();
        console.log("--> DEPLOY KEY (Add this to all builder compatible Git repositories)");
        console.log();
        console.log(pubKey);
        console.log();
    }

}