'use strict';

const express = require('express');
const app = express.Router();


  // call controller
  var authC = require('../controller/authController');
  var salonC = require('../controller/salonController');
  var userC = require('../controller/userController');
  var postC = require('../controller/postController');
  var cronC = require('../controller/cronController');


  // auth api

  app.route('/signup').post(authC.signUp);
  app.route('/login').post(authC.login);
  app.route('/social-account-exist/:social_id').get(authC.userExists);
  app.route('/forgot-password').post(authC.forgotPassword);
  app.route('/reset-password').get(authC.resetCreate); 
  app.route('/store-password').post(authC.passwordStore);
  app.route('/update-firebase-data/:u_id').post(authC.updateFbData);
  app.route('/check-user-name-exist').post(authC.userNameExists);



  app.route('/other-user-post/:id').get(userC.other_user_post);
  app.route('/other-user-reward-post/:id').get(userC.other_user_reward_post);
   app.route('/my-redeem-reward/:id').get(userC.my_redeem_reward);
  app.route('/post-like/').post(postC.like_store);
  app.route('/post-comment/').post(postC.comment_store);
  app.route('/report-post/').post(postC.report_post);
  app.route('/post-delete/:post_id').get(postC.postDelete);


  app.route('/user-following/').post(userC.follow_store);
  app.route('/redeem-store/').post(userC.redeem_store);
  
  app.route('/delete-account/').post(userC.deleteAccount);

  
  app.route('/user-unfollowing/').post(userC.unfollow);
  app.route('/user-block/').post(userC.block_store);
  app.route('/user-unblock/').post(userC.unblock);
  app.route('/blockdata/:id').get(userC.blockdata);


// salon api
app.route('/all-salon-list').post(salonC.all_salon);
app.route('/reward-template-list').get(salonC.reward_template_list);
  app.route('/salon-list').get(salonC.salon_list);
  app.route('/salon-search').post(salonC.salon_search);
  app.route('/salon-details/:id').get(salonC.salon_details);
  app.route('/salon-id/:user_name').get(salonC.get_salon_id);

  app.route('/salon-review-store').post(salonC.review_store);
  app.route('/salon-revard-store').post(salonC.reward_store);

  app.route('/user-list/:type/:u_id').get(userC.user_list);
  app.route('/user-follow-data/:id').get(userC.user_follow);


  app.route('/get-profile/:id').get(userC.getProfile);
  app.route('/update-profile-photo/:id').post(userC.updateImage);
  app.route('/update-profile/:id').post(userC.updateProfile);
  app.route('/update-email-visiable/:id').post(userC.updateEmailVisiable);

  app.route('/add-story/:id').post(userC.storyStore);
  app.route('/get-following-user-story/:id').get(userC.getFollowingUserStory);


  app.route('/get-notification/:id').get(userC.getUserNotification);

  app.route('/qr-code-generate/:u_id').get(userC.qrCodeGenerate);

  app.route('/send-notification-cron').get(cronC.sendPush);
  app.route('/remove-story-cron').get(cronC.removeStory);

 app.route('/check-2hours-user-notification').get(cronC.sendHourlyUserCreatedNotification);
 app.route('/send-weekly-notifications').get(cronC.sendWeeklyNotifications);
  app.route('/send-monthly-notifications').get(cronC.sendMonthlyNotifications);
  app.route('/send-every-10-days').get(cronC.sendEvery10DaysNotifications);
 app.route('/run-daily-auto-messages').get(cronC.runDailyAutoMessages);

  module.exports = app;
