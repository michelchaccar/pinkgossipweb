
const nodemailer = require('nodemailer');
var encryption = require('../common/encrypt');
const fs = require('fs').promises; // Import the fs module
const ejs = require('ejs');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'info@pinkgossip.ca',
        pass: 'dltzrulszocrtcfv' 
      }
    });


exports.sendEmail = async (to, temp_path, type, subject) => {
  try {

    var encryptedEmail = encryption.encrypt(to);
    const encodedEmail = encodeURIComponent(encryptedEmail);
    var pageRenderValue = '';

    if(type == 'api'){
      pageRenderValue = `${base_url}api/reset-password?email=${encodedEmail}`;
    }

    const renderedTemplate = ejs.render(await fs.readFile(temp_path, 'utf-8'), { pageRenderValue });

    const mailOptions = {
      from: 'info@pinkgossip.ca',
      to: to,
      subject: subject,
      html: renderedTemplate,
    };
      const info = await transporter.sendMail(mailOptions);
       return true;
  } catch (error) {
    console.log('error:',error);
     return false;
  }
};
