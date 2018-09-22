const path = require("path");
const solc = require("solc");
const fs = require("fs-extra"); // Has extra file system functions, improved version

// Get path of the build folder

const buildPath = path.resolve(__dirname, "build");

// Delete the build folder and its content
fs.removeSync(buildPath);

// Get sol files path
const campaignPath = path.resolve(__dirname, "./contracts", "./Campaign.sol");

// Read the sol file
const source = fs.readFileSync(campaignPath, "utf8");

// Compile the sol file
const output = solc.compile(source, 1).contracts;

// Create build folder
fs.ensureDirSync(buildPath);

console.log(output);

for (let contract in output) {
  fs.outputJsonSync(
    path.resolve(buildPath, contract.replace(":", "") + ".json"),
    output[contract]
  );
}
