const port = process.env.PORT || 3000;
process.on("uncaughtException", err => {
  console.log(err.name, err.message);
  console.log("Exiting........");
  process.exit(1);
});
const app = require("./app");

const server = app.listen(port, err => {
  if (err) console.log(err);

  console.log("Server is UP", port);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.error(err);
  console.log("Exiting........");
  server.close(() => {
    process.exit(1);
  });
});

//for heroku...as its give SIGTERM signal...
process.on("SIGTERM", () => {
  console.log("Exiting........ as SIGTERM recieved");
  server.close(() => {
    console.log("server closed as from SIGTERM");
  });
});
