// Local ClamD smoke test: no application upload, no objects stored.
import net from "node:net";
function scan(bytes) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: Number(process.env.CLAMAV_PORT || 3310) });
    let response = "", settled = false;
    const finish = (error, verdict) => {
      if (settled) return;
      settled = true; socket.destroy(); error ? reject(error) : resolve(verdict);
    };
    socket.setTimeout(15000, () => finish(new Error("Scanner timeout")));
    socket.on("error", () => finish(new Error("Scanner unavailable")));
    socket.on("end", () => { if (!settled) finish(new Error("Missing scanner verdict")); });
    socket.on("connect", () => {
      const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length);
      socket.write("zINSTREAM\0"); socket.write(length); socket.write(bytes); socket.write(Buffer.alloc(4));
    });
    socket.on("data", chunk => {
      response += chunk.toString();
      if (response.length > 4096) finish(new Error("Invalid scanner response"));
      else if (response.includes("\0") || response.includes("\n")) finish(null, response.split(/[\0\n]/)[0].trim());
    });
  });
}
try {
  if (await scan(Buffer.from("Anshkosh harmless scanner check")) !== "stream: OK") throw new Error("Clean fixture rejected");
  // Official harmless EICAR signature, assembled at runtime and never written to disk.
  const eicar = ["X5O!P%@AP[4", "\\PZX54(P^)7CC)7}$", "EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"].join("");
  if (!(await scan(Buffer.from(eicar))).endsWith(" FOUND")) throw new Error("EICAR test was not detected");
  console.log("Scanner passed: clean input accepted; harmless EICAR input detected. Nothing stored.");
} catch (error) { console.error(error.message); process.exitCode = 1; }
