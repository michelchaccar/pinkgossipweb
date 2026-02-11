'use strict';
var express = require('express');
var app = express();
const config = require('../../config');
const async = require('async');
const user = require('../model/userModel');
const post = require('../model/postModel');
const fs = require('fs');
const QRCode = require('qrcode');
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pinkgossip-936f9-default-rtdb.firebaseio.com"
  });



  exports.user_list = async function (req, res) {
    const user_id = req.params.u_id;

    try {
        // Assuming user.user_data is a synchronous call, it should be awaited if it's a promise.
        const data = await new Promise((resolve, reject) => {
            user.user_data(req, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });

        // Fetch stories for each user
        const allFollowData = await Promise.all(data.map(async (item) => {
            const storyData = await user.getStoryFromId(req, item.id);
            // Assign the fetched story data to the item
            item.storyData = storyData; // Complete the assignment
            return item; // Return the modified item
        }));

        // Send the response with all users and their stories
        res.json({ success: true, user_list: allFollowData });
    } catch (error) {
        console.error('Error fetching user list:', error);
        res.json({ success: false, message: 'Something went wrong' });
    }
};


exports.user_follow = async function (req, res) {
    const profile_user_id = req.params.id;
    const login_user_id = req.query.login_user_id;
    const select_type = req.query.follow_type;
    
    user.followsData(req, profile_user_id, select_type, async function (err, data) {
      if (err) {
        res.json({ success: false, message: 'Something went wrong' });
      } else {
        const allFollowData = await Promise.all(data.map(async (item) => {
          const is_followed = await user.checkFollowed(req, login_user_id, item.id);
          const storyData = await user.getStoryFromId(req, item.id);
          return { ...item, is_followed: is_followed ,storyData};
        }));

        res.json({ success: true, user_list: allFollowData });
      }
    });
  };
  exports.block_store = async function (req, res) {
    var blockArray = {
        user_id: req.body.user_id,
        block_user_id: req.body.block_user_id,
        created_at: new Date()
    };

    user.user_block(req, blockArray, async function (err, response) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            // var notificationArray = {
			// 	from_user_id: req.body.following_id,
			// 	to_user_id: req.body.follower_id,			
			// 	to_user_id: 0,			
			// 	text: 'followed you.',
			// 	text_fr: "t'a suivi.",
			// 	type: 'follow',
			// 	created_at: new Date(),
			// 	updated_at: new Date()
			// };
            // await post.notification_store(req, notificationArray);
            res.json({ success: true, message: 'Blocked successfully.' });
        }
    });
}
exports.deleteAccount = async function (req, res) {
   
        let user_id = req.body.user_id;
       

    await user.deleteAccount(req, user_id, function(err, result) {``
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true, message: 'Account deleted successfully.' });

        }
    });
};

exports.unblock = async function (req, res) {
    var blockArray = {
        user_id: req.body.user_id,
        block_user_id: req.body.block_user_id
    };

    await user.user_unblock(req, blockArray, function(err, result) {
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true, message: 'Unblock successfully.' });

        }
    });
};
exports.blockdata = async function (req, res) {
    const userId = req.params.id;
    try {

        const data = await user.get_user_block_list(req, userId);
        if (data.length > 0 && data[0].id > 0) {
            res.json({ success: true, notifications: data });
        } else {
            res.status(422).json({ success: false, message: 'Data not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error });
    }
};


exports.follow_store = async function (req, res) {
    var followArray = {
        following_id: req.body.following_id,
        follower_id: req.body.follower_id,
        status: req.body.status,
        created_at: new Date(),
        updated_at: new Date()
    };

    user.user_following(req, followArray, async function (err, response) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            var notificationArray = {
				from_user_id: req.body.following_id,
				to_user_id: req.body.follower_id,			
				to_user_id: 0,			
				text: 'followed you.',
				text_fr: "t'a suivi.",
				type: 'follow',
				created_at: new Date(),
				updated_at: new Date()
			};
            await post.notification_store(req, notificationArray);
            res.json({ success: true, message: 'Add new following' });
        }
    });
}

exports.unfollow = async function (req, res) {
    var unfollowArray = {
        following_id: req.body.following_id,
        follower_id: req.body.follower_id,
    };

    await user.user_unfollowing(req, unfollowArray, function(err, result) {
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true, message: 'Unfollowed successfully' });

        }
    });
};




// exports.other_user_post = async function (req, res) {
//     var user_id = req.params.id;
//     try {
//         const data = await user.post_list(req, user_id);
//         if (data.length > 0 && data[0].id > 0) {
//             const allData = await Promise.all(data.map(async (item) => {
//                 const salon_average = await user.average_get(req, item.user_salon_id);
//                 item.rating_count = salon_average.rating_count;
//                 item.average_rating = salon_average.average_rating;
//                 return item;
//             }));

//             res.json({ success: true, other_user_post: allData });
//         } else {
//             res.status(422).json({ success: false, message: 'post not found' });
//         }
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ success: false, message: 'Something went wrong' });
//     }
// }


exports.other_user_post = async function (req, res) {
    var user_id = req.params.id;
    try {
        const data = await user.post_list(req, user_id);
        var post_count = Array.isArray(data) && data.length > 0 ? data[0].showing_post_count : 0;
        if (data.length > 0 && data[0].id > 0) {
            const allData = await Promise.all(data.map(async (item) => {
                const storyData = await user.getStoryFromId(req, item.user_id);

                const salon_average = await user.average_get(req, item.user_salon_id);
                const comment = await user.comment_get(req , item.id);
                const likeCount = await user.like_get(req , item.id);
                const otherMultiPost = await user.other_multi_post_get(req , item.id);

                item.story = storyData;
                item.other_multi_Post = otherMultiPost;
                item.rating_count = salon_average.rating_count;
                item.average_rating = salon_average.average_rating;
                item.like_count = likeCount.length;
                item.comment_count = comment.length;
                item.comments = comment;

                const { showing_post_count, ...rest } = item;
                return rest;
            }));

            res.json({ success: true, post_count: post_count , other_user_post: allData });
        } else {
            res.status(422).json({ success: false, message: 'post not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

exports.redeem_store = async function (req, res) {
    var redeemArray = {
        user_id: req.body.user_id,
        reward_id: req.body.reward_id,
        redeem_point: req.body.redeem_point
    };

    user.user_redeem(req, redeemArray, async function (err, response) {
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Something went wrong' });
        } else {

            res.json({ success: true, message: 'Points redeemed successfully' });
        }
    });
}

exports.my_redeem_reward = async function (req, res) {
    var user_id = req.params.id;
    try {
        const data = await user.my_redeem_post_list(req, user_id);
        var post_count = Array.isArray(data) && data.length > 0 ? data[0].showing_post_count : 0;
        if (data.length > 0 && data[0].id > 0) {
            const allData = await Promise.all(data.map(async (item) => {
                const storyData = await user.getStoryFromId(req, item.user_id);

              const salon_average = await user.average_get(req, item.user_salon_id);
                const comment = await user.comment_get(req , item.id);
              const likeCount = await user.like_get(req , item.id);
                const otherMultiPost = await user.other_multi_post_get(req , item.id);

                item.story = storyData;
                item.other_multi_Post = otherMultiPost;
                item.rating_count = salon_average.rating_count;
                item.average_rating = salon_average.average_rating;
                item.like_count = likeCount.length;
                item.comment_count = comment.length;
                item.comments = comment;

                const { showing_post_count, ...rest } = item;
                return rest;
            }));

            res.json({ success: true, post_count: post_count , posts: allData });
        } else {
            res.status(422).json({ success: false, message: 'post not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }

}
exports.other_user_reward_post = async function (req, res) {
    var user_id = req.params.id;
    try {
        const data = await user.reward_post_list(req, user_id);
        var post_count = Array.isArray(data) && data.length > 0 ? data[0].showing_post_count : 0;
        if (data.length > 0 && data[0].id > 0) {
            const allData = await Promise.all(data.map(async (item) => {
                const storyData = await user.getStoryFromId(req, item.user_id);

                const salon_average = await user.average_get(req, item.user_salon_id);
                const comment = await user.comment_get(req , item.id);
                const likeCount = await user.like_get(req , item.id);
                const otherMultiPost = await user.other_multi_post_get(req , item.id);

                item.story = storyData;
                item.other_multi_Post = otherMultiPost;
                item.rating_count = salon_average.rating_count;
                item.average_rating = salon_average.average_rating;
                item.like_count = likeCount.length;
                item.comment_count = comment.length;
                item.comments = comment;

                const { showing_post_count, ...rest } = item;
                return rest;
            }));

            res.json({ success: true, post_count: post_count , other_user_post: allData });
        } else {
            res.status(422).json({ success: false, message: 'post not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

exports.getProfile = async function (req, res) {
    const userId = req.params.id;
    try {
        const data = await user.profile_data(req, userId);
        if (data.length > 0 && data[0].id > 0) {
            res.json({ success: true, user_profile: data[0] });
        } else {
            res.status(422).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error });
    }
};


exports.getUserNotification = async function (req, res) {
    const userId = req.params.id;
    try {

        const data = await user.get_user_notification(req, userId);
        if (data.length > 0 && data[0].id > 0) {
            res.json({ success: true, notifications: data });
        } else {
            res.status(422).json({ success: false, message: 'not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error });
    }
};


exports.updateImage = async function (req, res) {

    var upload = require('../../common/file_upload');
	const singleUpload = upload.single('profile_image');
	var imagepath = '';
	await singleUpload(req, res, async function (err) {
        var imageArray = {
            profile_image: req.file ? req.file.filename : req.body.old_image || null,
          };
          user.profile_update(req, imageArray, req.params.id, async function (err, response) {
            if (err) {
                res.json({success: false, message: 'Something went wrong' });
            } else {

            // const data = await user.profile_data(req, req.params.id);
            // const firebaseUid = data[0].firebase_id;
            // const db = admin.database();
            // const usersRef = db.ref('users');
            // const userRef = usersRef.child(firebaseUid);
            // userRef.update({
            //     photoUrl: req.file ? req.file.filename : req.body.old_image || null,
            // });
                res.json({success: true,  message: 'User profile image updated successfully'});
            }
    });
});

};

exports.updateEmailVisiable =async function (req, res) {
    var profileArray = {
        is_email_visibility : req.body.is_email_visibility,
        updated_at: new Date()
    };
    user.profile_update(req, profileArray, req.params.id, async function (err, response) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
           
            res.json({ success: true, message: 'Email Visibility updated successfully' });
        }
    });
}

exports.updateProfile = async function (req, res) {
    var profileArray = {
        user_name : req.body.user_name,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        salon_name : req.body.salon_name,
        bio : req.body.bio,
        site_name: req.body.site_name,
        // open_time: req.body.open_time,
        contact_no: req.body.contact_no,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        updated_at: new Date()
    };
    user.profile_update(req, profileArray, req.params.id, async function (err, response) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            if(req.body.user_type == 2){
                await user.insert_salon_open_days(req, req.params.id, req.body.open_weekdays);
            }

            const data = await user.profile_data(req, req.params.id);

            const firebaseUid = data[0].firebase_id;
            const db = admin.database();
            const usersRef = db.ref('users');
            const userRef = usersRef.child(firebaseUid);
            userRef.update({
                nickname: req.body.first_name + ' ' + req.body.last_name,
            });
            res.json({ success: true, message: 'User profile updated successfully' });
        }
    });
};



exports.storyStore = async function (req, res) {
    try {
        // File upload handler
        const upload = require('../../common/file_upload');
        const singleUpload = upload.single('story_data');

        await singleUpload(req, res, async function (err) {
            if (err) {
                return res.status(400).json({ success: false, message: 'File upload failed', error: err.message });
            }

            // Check if file exists
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            console.log('Uploaded file:', req.file); // Debugging line


            // Story data
            const storyArray = {
                user_id: req.params.id,
                story_data: req.file.filename,
                created_at: new Date()
            };

            // Insert story into the database
            user.story_add(req, storyArray, async function (err, response) {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Database insertion failed', error: err.message });
                }
                var pointArray = {
                    user_id: req.params.id,
                    point: 20,
                    type: 'story',
                    created_at: new Date(),
                };
                await user.point_store(req, pointArray);
                res.json({ success: true, message: 'Story posted successfully', data: response });
            });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
};



exports.getFollowingUserStory = async function (req, res) {
    const profile_user_id = req.params.id;  // The user whose following stories are being fetched
    // const select_type = 'following';  // Type of selection (following)
    const select_type = 'all';  // Type of selection (all)
  
    // Fetch the follower_ids for the given user
    user.followsData(req, profile_user_id, select_type, async function (err, data) {
      if (err) {
        return res.json({ success: false, message: 'Something went wrong' });
      }
      
    //   if (data.length === 0) {
    //     return res.json({ success: false, message: 'No followers found' });
    //   }


      // Extract the follower_ids from the result (assuming data contains 'follower_id')
      const followerIds = data.map(item => item.id);
      followerIds.push(profile_user_id);


      // Now, fetch all stories from the story table for the follower_ids
      user.getStoriesByUserIds(req, followerIds, function (err, stories) {
        if (err) {
          return res.json({ success: false, message: 'Could not fetch stories', error: err.message });
        }

        if (stories.length === 0) {
          return res.json({ success: true, message: 'No stories found for the following users' });
        }

        // Return the stories to the client
        res.json({ success: true, message: 'Stories fetched successfully', data: stories });
      });
    });
};



exports.qrCodeGenerate = async function (req, res) {
    const userId = req.params.u_id;
 try {
     const data = await user.profile_data(req, userId);
     let stringdata = JSON.stringify(data)
     if (data.length > 0 && data[0].id > 0) {
        QRCode.toDataURL(stringdata, function (err, url) {
            if(err) return console.log("error occurred")
            res.json({ success: true, qr_code: url });
        })
     } else {
         res.status(422).json({ success: false, message: 'User not found' });
     }
 } catch (error) {
     res.status(500).json({ success: false, message: 'Something went wrong' });
 }


 
 };