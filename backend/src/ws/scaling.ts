import cluster from "cluster";
import os from "os";

const cpus = os.cpus().length;

if (cluster.isPrimary) {
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
} else {
  console.log(`Worker ${process.pid}`);
}
