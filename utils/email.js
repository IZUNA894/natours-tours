const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.url = url;
    this.firstName = user.name.split(" ")[0];
    this.from = `Tony ${process.env.EMAIL_FROM}`;
  }
  newTransport() {
    //1. create transport
    if (process.env.ENVIRONMENT === "production") {
      //sendgrid service dont need transport
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_KEY
        }
      });
    } else {
      //else using a transporter

      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  }

  //sending actual mail
  async send(template, subject) {
    //1.render html
    var html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      subject,
      firstName: this.firstName,
      url: this.url
    });
    //2.define email options
    const mailOptions = {
      from: `Tony ${process.env.EMAIL_FROM}`,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html)
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("welcome", "welcome to tours family");
  }

  async sendResetUrl() {
    await this.send("passwordReset", "reset your password in next 10 mins");
  }
};
