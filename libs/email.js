var nodemailer = require("nodemailer");
var secretConfig = require("../secret-config");

async function sendEmail(subject, text, email) {
  if (!email) {
    console.error("Email delivery failed: recipient is empty.");
    return false;
  }

  var smtpPort = Number(secretConfig.SMTP_PORT);
  var transport = nodemailer.createTransport({
    host: secretConfig.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: secretConfig.SMTP_EMAIL,
      pass: secretConfig.SMTP_PASSWORD,
    },
  });

  var mailOptions = {
    from: secretConfig.SMTP_EMAIL,
    to: email,
    subject: subject,
    html: text,
  };

  try {
    var info = await transport.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return true;
  } catch (error) {
    console.error("Email delivery failed:", error);
    return false;
  } finally {
    transport.close();
  }
}

module.exports = {
  sendEmail,
  default: {
    sendEmail,
  },
};
