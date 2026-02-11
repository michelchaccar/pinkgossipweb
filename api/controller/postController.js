'use strict';
var express = require('express');
var app = express();
const config = require('../../config');
const async = require('async');
const post = require('../model/postModel');
const user = require('../model/userModel');


exports.like_store = async function (req, res, next) {
    var postLikeArray = {
        user_id: req.body.user_id,
        salon_post_id: req.body.post_id,
        like: req.body.like,
        created_at: new Date(),
        updated_at: new Date()
    };

    if (req.body.like == 0) {
        await post.deleteLikePost(req, postLikeArray);
        const likeCount = await user.like_get(req , req.body.post_id);
        return res.json({ success: true,like_count :likeCount.length , message: 'Unlike' });
    } else if (req.body.like == 1) {
        post.like_store(req, postLikeArray, async function (err, response) {
            if (err) {
                res.json({ success: false, message: 'Something went wrong' });
            } else {
                var notificationArray = {
                    from_user_id: req.body.user_id,
                    to_user_id: req.body.to_user_id,			
                    salon_post_id: req.body.post_id,			
                    text: 'like on your post.',
                    text_fr: "comme sur ton post.",
                    type: 'like',
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await post.notification_store(req, notificationArray);
                const likeCount = await user.like_get(req , req.body.post_id);
                res.json({ success: true, like_count :likeCount.length , message: 'Like' });
            }
        });
    } else {
        return res.status(422).json({ success: false, message: 'Unexpected value for like' });
    }
}

exports.report_post = async function (req, res, next) {
    var falgArray = {
        user_id: req.body.user_id,
        flag_id: req.body.post_id,
        created_at: new Date()
    };
        post.flag_store(req, falgArray, async function (err, response) {
            if (err) {
                res.json({ success: false, message: 'Something went wrong' });
            } else {
                // var notificationArray = {
                //     from_user_id: req.body.app_user_id,
                //     to_user_id: req.body.to_user_id,	
                //     salon_post_id: req.body.salon_post_id,			
                //     text: 'comment on your post.',
                //     text_fr: "commente ton message.",
                //     type: 'like',
                //     created_at: new Date(),
                //     updated_at: new Date()
                // };
                // await post.notification_store(req, notificationArray);   
                res.json({ success: true, message: 'Post reported.' });
            }
        });

}

exports.comment_store = async function (req, res, next) {
    var postCommentArray = {
        app_user_id: req.body.app_user_id,
        salon_post_id: req.body.salon_post_id,
        comment	: req.body.comment,
        created_at: new Date(),
        updated_at: new Date()
    };
        post.comment_store(req, postCommentArray, async function (err, response) {
            if (err) {
                res.json({ success: false, message: 'Something went wrong' });
            } else {
                var notificationArray = {
                    from_user_id: req.body.app_user_id,
                    to_user_id: req.body.to_user_id,	
                    salon_post_id: req.body.salon_post_id,			
                    text: 'comment on your post.',
                    text_fr: "commente ton message.",
                    type: 'like',
                    created_at: new Date(),
                    updated_at: new Date()
                };
                await post.notification_store(req, notificationArray);   
                res.json({ success: true, message: 'Thank you for comment' });
            }
        });

}

exports.postDelete = async function (req, res) {

    var post_id = req.params.post_id;

    await post.deletePost(req, post_id);
    return res.json({ success: true, message: 'Post deleted successfully' });

}
