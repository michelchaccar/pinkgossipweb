'use strict';

const express = require('express');
const QRCode = require("qrcode");
const app = express.Router();
	
var encryption = require('../../common/encrypt');
  // call controller
var authC = require('../controller/authController');
var indexC = require('../controller/indexController');
var userC = require('../controller/userController');
var salonPostController = require('../controller/salonPostController');
  
var userModel = require('../model/userModel');
var auth = require('../model/authModel');
const upload = require('../../common/file_upload');  
  // Web Controller
  var webauthC = require('../controller/webauthController');

app.route('/profile/:id').get(userC.showProfile);

// Generate QR for a profile
app.get("/qr/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const profileUrl = `https://pinkgossipapp.com/profile/${userId}`;

    res.setHeader("Content-Type", "image/png");
    QRCode.toFileStream(res, profileUrl, {
      type: "png",
      width: 300,
      margin: 2
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating QR");
  }
});
const Validator = require('validatorjs'); 
// Web
app.route('/websignup').get(webauthC.signUp);
app.route('/signupsubmit').post(webauthC.insert);
app.post('/signupsubmit', upload.single('profile_image'), (req, res) => {
    
       // console.log(req.file);  // Log the uploaded file information
        console.log(req.body);  // Log other form data

        // Handle the file upload and form data together
        req.body.profile_image = req.file ? req.file.filename : null;  // Assign the file's filename or null if no file uploaded

       const validationRules = {
               first_name: 'required',
               last_name: 'required',
                category: 'required',
               email: 'required|email',
               password: 'required|min:6',
           };
           if(req.body.password != req.body.confirm_password)
           {
               return res.status(422).json({ errors: { email: ['Password and Confirm password does not match.'] } });
           }
        //    const emailExists =  auth.checkEmailExists(req, req.body.email);
        //    if (emailExists) {
        //        return res.status(422).json({ errors: { email: ['Email already exists'] } });
        //    }
       
           const validation = new Validator(req.body, validationRules);
      // const validation = true;
           if (1 == 0) {
            //   res.status(422).json({ errors: validation.errors.all() });
           } else {
               var encrypted_password = encryption.encrypt(req.body.password);
               
               var addArray = {
                   first_name: req.body.first_name,
                   last_name: req.body.last_name,
                   user_name: req.body.user_name,
                   user_type: 2,
                   salon_name: req.body.salon_name,
                   category:req.body.category,
                   email: req.body.email,
                   password: encrypted_password,
                   web_or_app_user: 'admin',
                   contact_no: req.body.contact_no,
                   address: req.body.address,
                   profile_image: req.body.profile_image,
                   site_name: req.body.site_name,
                   latitude: req.body.latitude,
                   longitude: req.body.longitude,
                   created_at: new Date(),
                   updated_at: new Date()
       
               };
       
               auth.user_insert(req, addArray, async function (err, response) {
                   if (err) {
                       console.log(err);
                       res.status(500).json({ message: 'something went wrong!' });
                   } else {
                       res.redirect('/websignup');
                     }
               });
           }
        
    
});





  // authC get
  app.route('/').get(authC.login);
  app.route('/login').get(authC.login);
  app.route('/register').get(authC.register);
  app.route('/forgot-password').get(authC.forgotPassword);
  app.route('/reset-password').get(authC.resetCreate);
  app.route('/logout').get(authC.logout);

   // authC post

  app.route('/login').post(authC.loginStore);
  app.route('/register').post(authC.insert);
  app.route('/reset-password').post(authC.resetPassword);
  app.route('/reset-store-password').post(authC.resetStore);
  

  app.route('/dashboard').get(indexC.dashboard);
  app.route('/user-add').get(userC.create);
  app.route('/appuser').get(userC.indexAppUser);
  app.route('/createappuser').get(userC.createAppUser); // Open Create Page
  //app.route('/saveappuser').post(userC.saveAppUser); // Handle Insert & Update
  app.route('/deleteappuser/:id').get(userC.deleteAppUser); 
  app.route('/editappuser/:id').get(userC.editAppUser);// Open Edit Page.
  app.route('/appuser/suspend/:id').get(userC.suspendAppUser);

  

  app.post('/saveappuser',upload.single('profile_image'), (req, res) => {
    if (req.session.admin) { // Log the uploaded file information
      //  console.log(req.body);  // Log other form data

        // Handle the file upload and form data together
        req.body.profile_image = req.file ? req.file.filename : null;  // Assign the file's filename or null if no file uploaded

        // Destructure necessary form data from req.body
        const { id, user_name, first_name, last_name, email, password, bio } = req.body;

        // Prepare the data to insert or update in the database
      

        // Insert or Update logic based on the presence of `id`
        if (id) {

            const userData = {
                user_name,
                first_name,
                last_name,
                email,
                bio,
                user_type: 1,
                updated_at: new Date(),
            };
            if(req.body.profile_image)
                {
                    userData.profile_image= req.body.profile_image;  // Set the profile_image from uploaded file or null
                }
            // If there's an ID, update the record
            userModel.updateUserData(req, id, userData, (err, result) => {
                if (err) {
                    console.error("Error updating user data:", err);
                    res.redirect('/admin/appuser');
                }
                res.redirect('/admin/appuser');
            });
        } else {
            var encrypted_password = encryption.encrypt(password);
            const userData = {
                user_name,
                first_name,
                last_name,
                email,
                bio,
                password: encrypted_password, // Hash password if provided
                user_type: 1,
                updated_at: new Date(),
            };
            if(req.body.profile_image)
                {
                    userData.profile_image= req.body.profile_image;  // Set the profile_image from uploaded file or null
                }
            // If no ID, insert a new record
            userData.created_at = new Date();  // Add created_at for insert
            userModel.insertUserData(req, userData, (err, result) => {
                if (err) {
                    console.error("Error inserting user data:", err);
                    res.redirect('/admin/appuser');
                }
                res.redirect('/admin/appuser');
            });
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Salon Management
app.route('/salon').get(userC.index);

app.route('/create-reward-template').get(userC.createRewardTemplate);
app.route('/createsalon').get(userC.createSalon);
app.route('/editsalon/:id').get(userC.editSalon);
app.route('/deletesalon/:id').get(userC.deleteSalon);
app.post('/savesalon', upload.single('profile_image'), (req, res) => {
    if (req.session.admin) {
       // console.log(req.file);  // Log the uploaded file information
      //  console.log(req.body);  // Log other form data

        // Handle the file upload and form data together
        req.body.profile_image = req.file ? req.file.filename : null;  // Assign the file's filename or null if no file uploaded

        // Destructure necessary form data from req.body
        const { id, user_name, first_name, last_name, email, password, salon_name, bio, category, contact_no, site_name, address,latitude,longitude } = req.body;

        // Prepare the data to insert or update in the database
        
        // Insert or Update logic based on the presence of `id`
        if (id) {
            const userData = {
                user_name,
                first_name,
                last_name,
                email,// Hash password if provided
                salon_name,
                bio,
                category,
                contact_no,
                site_name,
                address,
                latitude,
                longitude,
                user_type: 2,
                updated_at: new Date(),
            };
            if(req.body.profile_image)
                {
                    userData.profile_image= req.body.profile_image;  // Set the profile_image from uploaded file or null
                }
            // If there's an ID, update the record
            userModel.updateUserData(req, id, userData, (err, result) => {
                if (err) {
                    console.error("Error updating user data:", err);
                    res.redirect('/admin/salon');
                }
                else
                {
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                    dayNames.forEach((day, index) => {
                        const dayNum = index + 1; // 1 to 7
                        const openKey = `day${dayNum}_is_open`;
                        const timeKey = `day${dayNum}_open_time`;
                        const endtimeKey = `day${dayNum}_end_time`;

                        const dayData = {
                            app_user_id: id,
                            day: day,
                            open: req.body[openKey] ? "On" : "Off", // 1 if checked, 0 if not
                            start_time: req.body[openKey] ? req.body[timeKey] : null,
                            end_time: req.body[openKey] ? req.body[endtimeKey] : null,
                            created_at: new Date(),
                            updated_at: new Date(),
                        };
                        console.log(dayData);
                        userModel.weekData(req, dayData, (err, result) => {
                            if (err) console.error(`Error saving data for ${day}:`, err);
                        });
                    });
                res.redirect('/admin/salon');
                }
            });
        } else {
            // If no ID, insert a new record
            var encrypted_password = encryption.encrypt(password);
            const userData = {
                user_name,
                first_name,
                last_name,
                email,
                password: encrypted_password, // Hash password if provided
                salon_name,
                bio,
                profile_image: req.body.profile_image,  // Set the profile_image from uploaded file or null
                category,
                contact_no,
                site_name,
                address,
                latitude,
                longitude,
                user_type: 2,
                updated_at: new Date(),
            };
    
            userData.created_at = new Date();  // Add created_at for insert
            
            userModel.insertUserData(req, userData, (err, result) => {
                if (err) {
                    console.error("Error inserting user data:", err);
                    res.redirect('/admin/salon');
                }
                else
                {
                    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

                    dayNames.forEach((day, index) => {
                        const dayNum = index + 1; // 1 to 7
                        const openKey = `day${dayNum}_is_open`;
                        const timeKey = `day${dayNum}_open_time`;
                        const endtimeKey = `day${dayNum}_end_time`;

                        const dayData = {
                            app_user_id: result.insertId,
                            day: day,
                            open: req.body[openKey] ? "On" : "Off", // 1 if checked, 0 if not
                            start_time: req.body[openKey] ? req.body[timeKey] : null,
                            end_time: req.body[openKey] ? req.body[endtimeKey] : null,
                            created_at: new Date(),
                            updated_at: new Date(),
                        };
console.log(dayData);
                        userModel.weekData(req, dayData, (err, result) => {
                            if (err) console.error(`Error saving data for ${day}:`, err);
                        });
                    });

                    res.redirect('/admin/salon');
                }
                //
            });
        }
    } else {
        res.redirect('/admin/login');
    }
});

//salon-posts Manegment
app.route('/salon-posts/flagged').get(salonPostController.listFlaggedPosts);
app.route('/reward').get(salonPostController.reward);
app.route('/salon-posts').get(salonPostController.listPosts);
app.route('/salon-posts/delete/:id').get(salonPostController.deletePost);
app.route('/salon-reward-template/delete/:id').get(salonPostController.deleteReward);



app.post('/savereward', upload.single('profile_image'), (req, res) => {
    if (req.session.admin) {
       // console.log(req.file);  // Log the uploaded file information
      //  console.log(req.body);  // Log other form data

        // Handle the file upload and form data together
        req.body.profile_image = req.file ? req.file.filename : null;  // Assign the file's filename or null if no file uploaded

        // Destructure necessary form data from req.body
        const { id, reward_type, reward_desc } = req.body;

        // Prepare the data to insert or update in the database
        
        // Insert or Update logic based on the presence of `id`
        if (id) {
           
        } else {
            // If no ID, insert a new record
            const userData = {
                reward_type,
                reward_desc,
                reward_image: req.body.profile_image,  // Set the profile_image from uploaded file or null
            };
    
            userData.created_at = new Date();  // Add created_at for insert
            
            userModel.insertRewardData(req, userData, (err, result) => {
                if (err) {
                    console.error("Error inserting user data:", err);
                    res.redirect('/admin/reward');
                }
                else
                {
                    res.redirect('/admin/reward');
                }
                //
            });
        }
    } else {
        res.redirect('/admin/login');
    }
});

  module.exports = app;
