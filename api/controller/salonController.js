'use strict';
var express = require('express');
var app = express();
const config = require('../../config');
const async = require('async');
const salon = require('../model/salonModel');
const user = require('../model/userModel');
const post = require('../model/postModel');
// const extractFrame = require('ffmpeg-extract-frame');
// const path = require('path');


// Set ffprobe path

exports.all_salon = async function (req, res) {
if(req.body.secretkey=="ffctx-llmvp-dsasd-qwtre")
{
salon.all_salon(req,  function (err, data) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true,  salon_list: data });
        }
    })
} else 
{
    res.json({ success: false, message: 'Secret Key does not match.' });
}
    

}


exports.reward_template_list = async function (req, res) {

    salon.reward_template_data(req, function (err, data) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true, reward_template_list: data });
        }
    })

}
exports.salon_list = async function (req, res) {
    var login_user_id = req.query.user_id;
    const storyData = await user.getStoryFromId(req, login_user_id);

    salon.salon_data(req, login_user_id, function (err, data) {
        if (err) {
            res.json({ success: false, message: 'Something went wrong' });
        } else {
            res.json({ success: true, story:storyData, salon_list: data });
        }
    })

}

exports.get_salon_id = async function (req, res) {
    var user_name = req.params.user_name;
    try {
        const data = await salon.salon_details_username(req, user_name);
        if (data.length > 0 && data[0].id > 0) {
            

            res.json({ success: true, user_profile: data[0]});
        } else {
            res.status(422).json({ success: false, message: 'Salon not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}

exports.salon_details = async function (req, res) {
    var salon_id = req.params.id;
    var user_type = req.query.user_type;
    try {
        const data = await salon.salon_details(req, salon_id);
        const points = await salon.get_total_point(req, salon_id);
        const storyData = await user.getStoryFromId(req, salon_id);
        const salon_open_days = await salon.get_salon_open_days(req, salon_id);
        const follows_data = await user.get_follows(req, salon_id);
        const is_followed = await user.checkFollowed(req, req.query.user_id, salon_id);
        const post = await salon.salon_posts(req, salon_id, user_type);
        const tag_post = await salon.get_tag_posts(req, salon_id);

        const tagAllPostData = await Promise.all(tag_post.map(async (item) => {
            const salon_average = await user.average_get(req, item.user_salon_id);
            const comment = await user.comment_get(req, item.id);
            const likeCount = await user.like_get(req, item.id);
            const otherMultiPost = await user.other_multi_post_get(req, item.id);
        
            item.other_multi_Post = otherMultiPost;
            item.average_rating = salon_average.average_rating;
            item.like_count = likeCount.length;
            item.comment_count = comment.length;
            item.comments = comment;
        
            return item; // Returning the modified item
        }));
        
        var post_count = Array.isArray(post) && post.length > 0 ? post[0].showing_post_count : 0;
        var post_count_review = Array.isArray(post) ? post.filter(p => p.post_type === 'SalonReview').length : 0;
        if (data.length > 0 && data[0].id > 0) {
            data[0].follower_count = follows_data.follower_count;
            data[0].following_count  = follows_data.following_count;
            data[0].is_followed = is_followed;

            const allPostData = await Promise.all(post.map(async (item) => {

                const salon_average = await user.average_get(req, item.user_salon_id);
                const comment = await user.comment_get(req , item.id);
                const likeCount = await user.like_get(req , item.id);
                const otherMultiPost = await user.other_multi_post_get(req , item.id);

                item.other_multi_Post = otherMultiPost;
                item.rating_count = salon_average.rating_count;
                item.average_rating = salon_average.average_rating;
                item.like_count = likeCount.length;
                item.comment_count = comment.length;
                item.comments = comment;

                const { showing_post_count, ...rest } = item;

                return rest;
            }));

            res.json({ success: true, user_profile: data[0], story:storyData, points:points, salon_open_days:salon_open_days,posts: allPostData ,tag_posts: tagAllPostData , post_count: post_count, post_count_review: post_count_review});
        } else {
            res.status(422).json({ success: false, message: 'Salon not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
    }
}


exports.review_store = async function (req, res, next) {
    var point = 300;
    var revard_point = 0;
    var upload = require('../../common/file_upload');
    upload.fields([
        { name: 'before_image', maxCount: 1 },
        { name: 'after_image', maxCount: 1 },
        { name: 'other' },
    ])(req, res, async function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'File upload error!' });
        }

        let tagUsersArray;
        try {
            tagUsersArray = JSON.parse(req.body.tag_users); // Converts '[12, 23]' to [12, 23]
        } catch (parseError) {
            console.error('Error parsing tag_users:', parseError);
            return res.status(400).json({ message: 'Invalid tag_users format!' });
        }

        // Convert the array to a comma-separated string
        const tagUsersString = tagUsersArray.join(',');

        if(tagUsersString){
            point = 25;
        }

if(req.body.reward_point)
{
    revard_point = req.body.reward_point;
}
    //    return;
        var addArray = {
            user_salon_id: req.body.salon_id,
            user_id: req.body.user_id,
            before_image: req.files.before_image ? req.files.before_image[0].filename : '',
            after_image: req.files.after_image ? req.files.after_image[0].filename : '',
            reward_tag: req.body.reward_type,
            // other: req.files.other ? req.files.other[0].filename : '',
            rating: req.body.rating,
            review: req.body.review,
            revard_point: revard_point,
            post_type: req.body.post_type,
            user_tags: tagUsersString,  // Store as comma-separated string
            created_at: new Date(),
            updated_at: new Date()
        };

        //
        salon.store(req, addArray, async function (err, response) {
            if (err) {
                console.log('err:',err);
                res.json({ success: false, message: 'Something went wrong' });
            } else {
                // console.log(req.files.other);
                if (req.files.other) {
                    for (const otherFile of req.files.other) {
                        // console.log(otherFile.filename);
                        var otherFileArray = {
                            salon_post_id: response.id,
                            other_data: otherFile.filename,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        await salon.other_post_store(req, otherFileArray);
                    }
                }

                const notifications = [
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'reviewed your salon.', "a examiné votre salon.", 'like'),
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'Share a story of your transformation.', "Partagez une histoire de votre transformation.",'submit_review_after_30_min'),
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'Share your final transformation.', "a examiné votre salon.", 'submit_review_after_45_min'),
                ];

                for (const notification of notifications) {
                    await post.notification_store(req, notification);
                }
                if(req.body.post_type == "SalonReview")
                {
                    var pointArray = {
                        user_id: req.body.user_id,
                        point: point,
                        type: 'post',
                        created_at: new Date(),
                    };
                    await user.point_store(req, pointArray);
                }

                res.json({ success: true, response: response, message: 'Added successfully' });
            }
        });
    });

}

exports.reward_store = async function (req, res, next) {
    var point = 20;
    var revard_point = 0;
   console.log(req.body);
const tagUsersString = "";
if(req.body.reward_point)
{
    revard_point = req.body.reward_point;
}
    //    return;
        var addArray = {
            user_salon_id: req.body.salon_id,
            user_id: req.body.user_id,
            before_image:  '',
            after_image:  '',
             reward_tag: req.body.reward_type,
            // other: req.files.other ? req.files.other[0].filename : '',
            rating: req.body.rating,
            review: req.body.review,
            revard_point: revard_point,
            post_type: req.body.post_type,
            user_tags: tagUsersString,  // Store as comma-separated string
            created_at: new Date(),
            updated_at: new Date()
        };

        //
        salon.store(req, addArray, async function (err, response) {
            if (err) {
                console.log('err:',err);
                res.json({ success: false, message: 'Something went wrong' });
            } else {
                // console.log(req.files.other);
               
                      var otherFileArray = {
                            salon_post_id: response.id,
                            other_data: req.body.reward_image,
                            created_at: new Date(),
                            updated_at: new Date()
                      }
                            await salon.other_post_store(req, otherFileArray);
                      
                

                const notifications = [
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'reviewed your salon.', "a examiné votre salon.", 'like'),
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'Share a story of your transformation.', "Partagez une histoire de votre transformation.",'submit_review_after_30_min'),
                    createNotification(req.body.user_id, req.body.salon_id, req.body.salon_post_id, 'Share your final transformation.', "a examiné votre salon.", 'submit_review_after_45_min'),
                ];

                for (const notification of notifications) {
                    await post.notification_store(req, notification);
                }

                res.json({ success: true, response: response, message: 'Added successfully' });
            }
        });


}

const createNotification = (fromUserId, toUserId, salonPostId, text, textFr, type) => ({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    salon_post_id: salonPostId,
    text,
    text_fr: textFr,
    type,
    created_at: new Date(),
    updated_at: new Date(),
});

exports.salon_search = async function (req, res) {
    var salon_name = req.body.salon
    try {
        const data = await salon.search_salon(req, salon_name);
        if (data.length > 0) {
          res.status(200).json({ success: true, salon: data });
        } else {
          res.status(404).json({ success: false, message: 'Salon not found' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Something went wrong' });
      }

}