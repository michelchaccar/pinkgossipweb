'use strict';

const express = require('express');
const app = express.Router();
const QRCode = require("qrcode");
const sharp = require("sharp");
const path = require("path");

var encryption = require('../../common/encrypt');
var indexC = require('../controller/indexController');
var webauthC = require('../controller/webauthController');

app.route('/websignup').get(webauthC.signUp);
app.route('/login').get(webauthC.login);
app.route('/logout').post(webauthC.logout);
app.route('/signupsubmit').post(webauthC.insert);
app.route('/').get(indexC.home);
app.route('/salons').get(indexC.salons);
app.route('/salon').get(indexC.salon);
app.route('/search').get(indexC.search);
app.route('/home').get(indexC.home);
app.route('/message').get(indexC.message);
app.route('/notification').get(indexC.notification);
app.route('/profile/:id').get(indexC.showProfile);
app.route('/search-salons').get(indexC.searchSalons);

app.post('/set-session', (req, res) => {
    const user = req.body;

    req.session.user = {
        id: user.id,
        user_name: user.user_name,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_image: user.profile_image,
        firebase_id: user.firebase_id
    };

    res.json({ success: true });
});



app.get("/qr/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const profileUrl = `https://pinkgossipapp.com/profile/${userId}`;

    // 1. Generate QR code buffer
    const qrBuffer = await QRCode.toBuffer(profileUrl, {
      type: "png",
      width: 600,
      margin: 2,
      color: {
        dark: "#EC1F95",
        light: "#FFFFFF"
      }
    });

    // 2. Correct logo path
    const logoPath = path.join(__dirname, "../../public/assets/img/logo3x.png");

    const logoBuffer = await sharp(logoPath)
      .resize({ width: 400 })
      .toBuffer();

    // 3. Combine QR + logo
    const finalImage = await sharp({
      create: {
        width: 600,
        height: 760, // QR (300) + space for logo
        channels: 4,
        background: "#FFFFFF"
      }
    })
      .composite([
        { input: qrBuffer, top: 0, left: 0 },
        { input: logoBuffer, top: 605, left: 100 }
      ])
      .png()
      .toBuffer();

    res.setHeader("Content-Type", "image/png");
    res.end(finalImage);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating QR");
  }
});

module.exports = app;
