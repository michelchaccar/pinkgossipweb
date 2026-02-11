'use strict';
var salonPostModel = require('../model/salonPostModel');

var salonPostController = {};

// Get all posts and render to the view
salonPostController.listPosts = function (req, res) {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    salonPostModel.getAllPosts(req, function (err, posts) {
        if (err) {
            console.error("Error fetching salon posts:", err);
            return res.redirect('/admin/dashboard');
        }
        res.render('salon_post/index', { posts: posts, title: "Manage Post" });
    });
};
salonPostController.reward = async function (req, res) {
    if (req.session.admin) {
        global.admin = req.session.admin;

        salonPostModel.getAllRewardTeamplate(req, function (err, posts) {
        if (err) {
            console.error("Error fetching salon posts:", err);
            posts = [];
            res.render('salon_post/index_reward', { posts: posts, title: "Manage Reward Template" });
        }
      //  posts = [];
        res.render('salon_post/index_reward', { posts: posts, title: "Manage Reward Template" });
    });
    } else {
        res.redirect('/admin/login');
    }
};
// Soft delete a salon post
salonPostController.deletePost = function (req, res) {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    const postId = req.params.id;
    if (!postId) {
        return res.redirect('/admin/salon-posts');
    }

    salonPostModel.deletePost(req, postId, function (err, result) {
        if (err) {
            console.error("Error deleting salon post:", err);
        }
        if(req.query.p == 2)
            {
                res.redirect('/admin/salon-posts/flagged');
            }
            else
            {
                res.redirect('/admin/salon-posts');
            }
        //res.redirect('/admin/salon-posts');
    });
};
// Soft delete a salon post
salonPostController.deleteReward = function (req, res) {
    if (!req.session.admin) {
        return res.redirect('/admin/login');
    }

    const postId = req.params.id;
    if (!postId) {
        return res.redirect('/admin/reward');
    }

    salonPostModel.deleteReward(req, postId, function (err, result) {
        if (err) {
            console.error("Error deleting reward template:", err);
        }
        
                res.redirect('/admin/reward');
            
        //res.redirect('/admin/salon-posts');
    });
};
// flagpost post
salonPostController.listFlaggedPosts = function (req, res) {
    if (!req.session.admin) return res.redirect('/admin/login');

    salonPostModel.getFlaggedPosts(req, function (err, flaggedPosts) {
        if (err) {
            console.error("Error fetching flagged posts:", err);
            return res.redirect('/admin/dashboard');
        }
        res.render('salon_post/flagged_posts', {  flaggedPosts: flaggedPosts.length > 0 ? flaggedPosts : [], title: "Flagged Posts" });
    });
    
};


module.exports = salonPostController;
