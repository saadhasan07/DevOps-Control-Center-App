import http from "node:http";

const port = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "devops-control-center-backend" }));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      message: "DevOps Control Center backend scaffold is running.",
      availableEndpoints: ["/health"],
    }),
  );
});

server.listen(port, () => {
  console.log(`DevOps Control Center backend listening on ${port}`);
});
