const express = require("express");
const app = express();
const cors = require("cors");
const { spawn } = require("child_process");
const os = require("os");
const cluster = require("cluster");
const amqp = require("amqplib");

app.use(cors());
app.use(express.json());
var errorOccurred = false;
const testExecutionQueue = "messagining_queu";
async function startRcpServerAsWorker() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  channel.prefetch(1);
  channel.assertQueue(testExecutionQueue);
  channel.consume(testExecutionQueue, async (msg) => {
    const code = JSON.parse(msg.content.toString()).codeToRun;
    const testResult = await excecuteCode(code);
    channel.sendToQueue(
      msg.properties.replyTo,
      Buffer.from(JSON.stringify(testResult)),
      {
        correlationId: msg.properties.correlationId.toString(),
      }
    );
    channel.ack(msg);
  });
}

const randomFunc = async (codeData) => {
  const argsArray = [29329, 2, 3, 4];
  const code = codeData;
  const convertedFunction = eval(`(${code})`);
  try {
    const result = convertedFunction(...argsArray);
    let executionResult = result
      .toString()
      .replace(/\x1B\[[0-9;]*[mG]/g, "")
      .replace(/[\r\n]/g, "");
    return executionResult;
  } catch (err) {
    let executionResult = { error: err.toString() };
    console.log(executionResult);
    return executionResult;
  }
};

function runDockerContainer(codeData) {
  return new Promise((resolve, reject) => {
    const maxCpus = 1;
    const dockerRun = spawn("docker", [
      "run",
      "--rm",
      `--cpus=${maxCpus}`,
      "hello-world-image",
    ]);

    let executionTimeout = false;

    const timeout = setTimeout(() => {
      dockerRun.kill();
      executionTimeout = true;
    }, 4000);

    dockerRun.stdout.on("data", (data) => {
      if (!executionTimeout) {
        clearTimeout(timeout);
        if (!errorOccurred) {
          resolve(randomFunc(codeData));
        }
      }
    });

    dockerRun.stderr.on("data", (data) => {
      console.error(`Docker container stderr: ${data}`);
    });

    dockerRun.on("close", () => {
      if (!errorOccurred) {
        resolve(randomFunc(codeData));
      }
    });
  });
}

async function excecuteCode(code) {
  const codeData = code;
  const dockerfile = `
  FROM node:latest
  WORKDIR /code
  COPY package*.json ./
  COPY . .
  CMD node -e "${code}"
`;

  function buildDockerImage() {
    const dockerBuild = spawn("docker", [
      "build",
      "-t",
      "hello-world-image",
      "-",
    ]);

    dockerBuild.stdin.write(dockerfile);
    dockerBuild.stdin.end();
    dockerBuild.stdout.on("data", (data) => {
      console.log(`Docker build stdout: ${data}`);
    });

    dockerBuild.stderr.on("data", (data) => {
      console.error(`Docker build stderr: ${data}`);
    });

    return new Promise((resolve, reject) => {
      dockerBuild.on("close", async (code) => {
        console.log(`Docker build process exited with code ${code}`);
        if (code === 0) {
          try {
            const result = await runDockerContainer(codeData);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error("Docker build failed"));
        }
      });
    });
  }

  return await buildDockerImage();
}

const publishMessageToCodeExecutionQueue = async (codeToRun) => {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();
  const responseQueue = await channel.assertQueue("", { exclusive: true });
  const responseQueueName = responseQueue.queue;
  const correlationId = Math.floor(Math.random(1, 10) * 1928).toString();
  channel.consume(
    responseQueueName,
    (msg) => {
      if (msg.properties.correlationId === correlationId) {
        const result = JSON.parse(msg.content.toString());
        channel.close();
        connection.close();
      }
    },
    {
      noAck: true,
    }
  );
  channel.sendToQueue(
    testExecutionQueue,
    Buffer.from(JSON.stringify({ codeToRun })),
    {
      correlationId,
      replyTo: responseQueueName,
    }
  );
};

app.post("/excode", async (req, res) => {
  let { code } = req.body;
  code = code.replace(/\n/g, "");
  publishMessageToCodeExecutionQueue(code);
});

let cpuThreads = os.cpus().length;
let cpuNum = 1;

if (cpuThreads >= 4) cpuNum = 4;

if (cluster.isMaster) {
  for (let i = 0; i < cpuNum; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} exited`);
    console.log("restarting a fork");
    console.log(errorOccurred);
    if (errorOccurred) {
      console.log("Error occurred in worker, not restarting a new fork.");
      return;
    }
    cluster.fork();
  });
} else {
  startRcpServerAsWorker();
  app.listen(5400, () => {
    console.log(`server ${process.pid} is listening on port 5400`);
  });
}
