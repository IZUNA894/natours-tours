const mongoose = require("mongoose");

const db = process.env.MONGODB_LINK;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("succsfully connected to mogo db"));
