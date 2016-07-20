import * as builder from './builder';
import * as provisioner from "./provisioner";


const buildCommandUsage = "build <path to app> [--name <docker registry name>] [-o <output directory>]";

const provisionCommandUsage = "provision <name of job> <docker registry name> <marathon url>";

const provisionGitCommandUsage = "provision-git <name of job> <HTTP git URL> <marathon url>";

export const usage =
`usage: startjs <command> [<args>]

Available commands are:
  ${buildCommandUsage}
  ${provisionCommandUsage}
  ${provisionGitCommandUsage}
`;

function parseOutputPath(projectPath: string, options: any): string
{
    return options['o']
        ? options['o']
        : projectPath;
}

function parseAndBuild(options: any, callback: builder.ErrorCallback): void
{
    if (options._.length !== 2) {
        return callback(`invalid use of 'build' command. Usage: ${buildCommandUsage}`);
    }

    const projectPath = options._[1];
    const outputPath = parseOutputPath(projectPath, options);

    builder.writeDockerFile(projectPath, outputPath, callback);

    console.log(`Dockerfile written to '${outputPath}'`);

    const registryName = options['name'];
    if (registryName) {
        console.log(`Building Docker image and pushing it to '${registryName}' on DockerHub...`);

        builder.buildAndPush(
            projectPath,
            registryName,
            (err) => {
                if (err) callback(err);

                console.log(`Docker image built and pushed to '${registryName}'`);
                callback();
            });
    } else {
        return callback();
    }
}

function parseAndProvision(options: any, callback: builder.ErrorCallback): void
{
    if (options._.length !== 4) {
        return callback(`invalid use of 'provision' command. Usage: ${provisionCommandUsage}`);
    }

    const jobName = options._[1];
    const registryName = options._[2];
    const marathonUrl = `${options._[3]}/v2/apps`;

    console.log(`Provisioning Docker image '${registryName}' at '${marathonUrl}'`);
    provisioner.provision(
        jobName,
        registryName,
        marathonUrl,
        (err) => {
            if (err) callback(err);

            console.log('Successfully provisioned image on Marathon cluster');
            callback();
        });
}

function parseAndProvisionFromGit(options: any,
                                  callback: builder.ErrorCallback): void
{
    if (options._.length !== 4) {
        return callback(`invalid use of 'provision-git' command. Usage: ${provisionCommandUsage}`);
    }

    const jobName = options._[1];
    const gitHttpUrl = options._[2];
    const marathonUrl = `${options._[3]}/v2/apps`;

    console.log(`Provisioning Docker image from git repository '${gitHttpUrl}' in Marathon cluster at '${marathonUrl}'`);
    provisioner.provisionGit(
        jobName,
        gitHttpUrl,
        marathonUrl,
        (err) => {
            if (err) callback(err);

            console.log('Successfully provisioned image on Marathon cluster');
            callback();
        });
}

export function cli(argv: any, callback: builder.ErrorCallback) {
    if (argv._.length < 1) {
        return callback("we require a command to run");
    }

    const command = argv._[0];
    if (command === "build") {
        parseAndBuild(argv, callback);
    } else if (command === "provision") {
        parseAndProvision(argv, callback);
    } else if (command === "provision-git") {
        parseAndProvisionFromGit(argv, callback);
    } else {
        callback(`unknown command ${command}`);
    }
};
