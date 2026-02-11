'use strict';
var express = require('express');
var app = express();
const User = require('../model/userModel');
const admin = require('firebase-admin');
var serviceAccount = require("../../serviceAccountKey.json");
const { GoogleAuth } = require('google-auth-library');
const moment = require('moment');

// Initialize Firebase Admin SDK if not initialized already
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

exports.sendPush = async function (req, res) {      
    try {
        const notifications = await User.get_notification(req); // Assuming this method fetches all pending notifications

        for (const notification of notifications) {
            try {
                const fromUserData = await User.profile_data(req, notification.from_user_id);
                const toUserData = await User.profile_data(req, notification.to_user_id);

                const title = getNotificationTitle(notification.type);

                let message = '';
                if (notification.type == 'submit_review_after_30_min' || notification.type == 'submit_review_after_45_min') {
                    message = `${notification.text}`;  // Use backticks for string interpolation
                } else {
                    message = `${fromUserData[0].first_name} ${fromUserData[0].last_name}: ${notification.text}`;
                }                

                if (!toUserData[0].fcm_token) {
                    console.warn(`No FCM token found for user ${notification.to_user_id}`);
                    continue;
                }

                const notificationArray = {
                    fcm_token: toUserData[0].fcm_token,
                    title: title,
                    message: message,
                };
                const now = moment(); // Current time
                const createdAt = moment(notification.created_at); 

                const diffMinutes = now.diff(createdAt, 'minutes');

                if (notification.type == 'submit_review_after_30_min' || notification.type == 'submit_review_after_45_min') {
                if ((notification.type == 'submit_review_after_30_min' && diffMinutes >= 30) ||
                    (notification.type == 'submit_review_after_45_min' && diffMinutes >= 45)) {
                         await sendOfferNotification(req, notificationArray, notification.id);
                    }else{
                        console.log(`Skipping notification ${notification.id}, time condition not met for type ${notification.type}.`);
                    }
                }else{
                    await sendOfferNotification(req, notificationArray, notification.id);
                }
            } catch (err) {
                console.error(`Error processing notification ${notification.id}:`, err);
            }
        }

        res.status(200).send('Notifications processed');
    } catch (error) {
        console.error('Error in sendPush function:', error);
        res.status(500).send('Internal Server Error');
    }
};

function getNotificationTitle(type) {
    switch (type) {
        case 'follow': return 'Follows';
        case 'like': return 'Like';
        case 'comment': return 'Comment';
        case 'submit_review_after_30_min': return 'Review';
        case 'submit_review_after_45_min': return 'Final Review';
        default: return 'Notification';
    }
}

async function sendOfferNotification(req, notificationArray, notificationId) {
    const deviceToken = notificationArray.fcm_token;
    const payload = {
        token: deviceToken,
        notification: {
            title: notificationArray.title,
            body: notificationArray.message,
        },
    };

    try {
        // Send notification using FCM v1 API
        const response = await admin.messaging().send(payload);

        // Update notification status in your database
        const notificationUpdate = {
            is_push: 1,
            updated_at: new Date(),
        };

        await User.notification_update(req, notificationUpdate, notificationId);

        return { success: true, response };
    } catch (error) {
        console.error('Error sending notification:', error);
        return { error: error };
    }
}



// async function sendOfferNotification(req, notificationArray, notificationId) {

//     const projectId = 'pinkgossip-936f9'; // Firebase project ID
//     const token = notificationArray.fcm_token; // Device token

//     const auth = new GoogleAuth({
//         credentials: serviceAccount,
//         scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
//     });

//     const client = await auth.getClient();

//     const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

//     const messagePayload = {
//         message: {
//             token: token,
//             notification: {
//                 title: notificationArray.title,
//                 body: notificationArray.message,
//             },
//             apns: {
//                 payload: {
//                     aps: {
//                         sound: 'default',
//                     }
//                 }
//             },
//         }
//     };

//     try {

//         const response = await client.request({ url: url, method: 'POST', data: messagePayload });

//         const notificationUpdate = {
//             is_push: 1,
//             updated_at: new Date(),
//         };

//         await User.notification_update(req, notificationUpdate, notificationId);

//         return { message: 'Notification sent', response: response.data };

//     } catch (error) {
//         console.error('Error sending notification:', error);
//         throw error;
//     }
// }


exports.removeStory = async function (req, res) {
    try {
        const storyData = await User.getStoriesOlderThan24Hours(req);


        if (storyData.length === 0) {
            return res.status(404).json({ message: 'No stories found to delete.' });
        }

      // Inside your removeStory function
        const deletePromises = storyData.map(async (story) => {
            return await User.deleteStoryById(story.id, req); // Pass req to the delete method
        });


        await Promise.all(deletePromises);

        res.status(200).json({ message: 'All stories removed successfully.' });
    } catch (error) {
        console.error('Error retrieving or deleting stories:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.sendHourlyUserCreatedNotification = async function (req, res) {
    try {
        const users = await User.getUsersCreatedBefore2Hours(req);

        if (users.length === 0) {
            return res.status(200).send("No users found older than 2 hours");
        }

        for (const user of users) {

            let text_en = "";
            let text_fr = "";
            let type = "";

            if (user.user_type == 1) {

                type = "user_hourly_signup_msg";

                text_en = "Ready to earn your first 200 points? Scan a salon QR code or share your glam look.";
                text_fr = "Prêt à gagner vos premiers 200 points ? Scannez le QR code d’un salon ou partagez votre look glam.";

            } else if (user.user_type == 2) {

                type = "business_hourly_qr_msg";

                text_en = "Your personalized QR Code is on its way! For now use your digital QR code and start collecting reviews & content.";
                text_fr = "Votre QR code personnalisé est en route ! En attendant, utilisez votre QR code digital et commencez à collecter des avis et du contenu.";
            }

            if (!type) continue; // skip if user type is not valid

            // avoid duplicate notifications
            const exists = await User.checkNotificationExists(req, user.id, type);
            if (exists == 1) {
                console.log(`Notification already exists for user ${user.id}`);
                continue;
            }

            // build final notification object
            const notificationArray = {
                from_user_id: user.id,
                to_user_id: user.id,
                text: text_en,
                text_fr: text_fr,
                type: type,
                created_at: new Date(),
                updated_at: new Date()
            };

            await User.insertNotification(req, notificationArray);

            console.log(`Inserted hourly notification for user ${user.id}`);
        }

        res.status(200).send("Hourly user-created notifications inserted successfully");

    } catch (error) {
        console.error("Error in hourly notification function:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.runDailyAutoMessages = async (req, res) => {
  try {
    let response = await User.sendDailyAutoNotifications(req);
    return res.json({ status: true, response });
  } catch (err) {
    return res.json({ status: false, error: err });
  }
};

exports.sendWeeklyNotifications = async function (req, res) {
    try {
        const users = await User.getAllUsers(req); // fetch all active users

        for (const user of users) {
            let notification = null;

            // USER TYPE 2 (Business)
            if (user.user_type == 2) {
                notification = {
                    from_user_id: user.id,
                    to_user_id: user.id,
                    text: "This week, 42 salons got featured on Pink Gossip! Post offers or encourage clients to tag your salon to boost your ranking.",
                    text_fr: "Cette semaine, 42 salons ont été mis en avant sur Pink Gossip ! Publiez des offres ou encouragez vos clients à taguer votre salon pour booster votre classement.",
                    type: "weekly_business_feature",
                    created_at: new Date(),
                    updated_at: new Date()
                };
            }

            // USER TYPE 1 (Normal users)
            else if (user.user_type == 1) {
                notification = {
                    from_user_id: user.id,
                    to_user_id: user.id,
                    text: "Top Gossipers of the week are shining! See who’s trending and claim your spot!",
                    text_fr: "Les meilleurs Gossipers de la semaine brillent ! Découvrez qui fait le buzz et prenez votre place !",
                    type: "weekly_user_trending",
                    created_at: new Date(),
                    updated_at: new Date()
                };
            }

            // Insert notification
            if (notification) {
                await User.notification_store(req, notification);
            }
        }

        res.status(200).send("Weekly notifications sent to all users.");
    } catch (error) {
        console.error("Error sending weekly notifications:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.sendMonthlyNotifications = async function (req, res) {
    try {
        const users = await User.getAllBusinessUsers(req); // only user_type = 2

        for (const user of users) {
            const notification = {
                from_user_id: user.id,
                to_user_id: user.id,
                text: "You’ve earned the Pink Gossip Star badge! Keep growing your reputation to unlock exclusive perks.",
                text_fr: "Vous avez obtenu le badge Pink Gossip Star ! Continuez à développer votre réputation pour débloquer des avantages exclusifs.",
                type: "monthly_business_badge",
                created_at: new Date(),
                updated_at: new Date()
            };

            await User.notification_store(req, notification);
        }

        res.status(200).send("Monthly notifications sent to business users.");
    } catch (error) {
        console.error("Error sending monthly notifications:", error);
        res.status(500).send("Internal Server Error");
    }
};
exports.sendEvery10DaysNotifications = async function (req, res) {
    try {
        const users = await User.getAllBusinessUsers(req); // only user_type = 2

        for (const user of users) {
            const notification = {
                from_user_id: user.id,
                to_user_id: user.id,
                text: "Top salons get more bookings. Update your services or post a new look to stay on top.",
                text_fr: "Les meilleurs salons obtiennent plus de réservations. Mettez à jour vos services ou publiez un nouveau look pour rester au top.",
                type: "business_10_days",
                created_at: new Date(),
                updated_at: new Date()
            };

            await User.notification_store(req, notification);
        }

        res.status(200).send("10-day notifications sent to business users.");
    } catch (error) {
        console.error("Error sending 10-day notifications:", error);
        res.status(500).send("Internal Server Error");
    }
};


