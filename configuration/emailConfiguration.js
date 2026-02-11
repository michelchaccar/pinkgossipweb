const nodemailer = require('nodemailer');
//const { SESClient, SendRawEmailCommand } = require('@aws-sdk/client-ses');
var encryption = require('../common/encrypt');
const fs = require('fs').promises;
const ejs = require('ejs');

// AWS SES client (uses EC2 IAM Role automatically)
// const ses = new SESClient({
//   region: 'us-east-1' // change if needed
// });

// Nodemailer transporter using SES v3
/*const transporter = nodemailer.createTransport({
  SES: {
    ses,
    aws: { SendRawEmailCommand }
  }
});
*/
const { SESClient } = require('@aws-sdk/client-ses');

const ses = new SESClient({ region: 'us-east-1' });


const transporter = nodemailer.createTransport({
  SES: { ses, aws: require('@aws-sdk/client-ses') }
});

exports.sendEmail = async (to, temp_path, type, subject) => {
  try {
    const encryptedEmail = encryption.encrypt(to);
    const encodedEmail = encodeURIComponent(encryptedEmail);

    let pageRenderValue = '';
    if (type === 'api') {
      pageRenderValue = `${base_url}api/reset-password?email=${encodedEmail}`;
    }

    const templateHtml = await fs.readFile(temp_path, 'utf-8');
    const renderedTemplate = ejs.render(templateHtml, { pageRenderValue });

    const mailOptions = {
      from: 'inscriptions@pinkgossip.ca',
      to,
      subject,
      html: renderedTemplate
    };

    const info = await transporter.sendMail(mailOptions);
      console.log('------------------------');
                console.log(info);
    return true;
  } catch (error) {
    console.error('SES email error:', error);
    return false;
  }
};
