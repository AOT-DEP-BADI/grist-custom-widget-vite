export interface ProjectConfig {
    projectName: string;
    projectVersion: string;
    projectDirectory: string;
    projectPackageJsonPath: string;
    dockerComposeUrl:string;
    dockerComposeFilePath: string;
    dockerContainerName: string;
}
