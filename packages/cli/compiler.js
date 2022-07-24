import asc from "assemblyscript/cli/asc";

export const compiler = (inputFile, outputFile) => {
  asc.ready.then(() => {
    asc.main(
      [inputFile, "--binaryFile", outputFile, "--exportRuntime", "--optimize"],
      {
        stdout: process.stdout,
        stderr: process.stderr,
      },
      function (err) {
        if (err) throw err;
      }
    );
  });
};
