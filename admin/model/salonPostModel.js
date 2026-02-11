'user strict';
var sql = require('../../config');
var async = require('async');

var salonPostModel = function (task) {};

// Get all salon posts with user and salon details
salonPostModel.getAllPostsold = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query(
            `SELECT sp.*, 
                    user.first_name AS user_first_name, 
                    user.last_name AS user_last_name, 
                    user.profile_image AS user_profile_image, 
                    salon.first_name AS salon_first_name, 
                    salon.last_name AS salon_last_name, 
                    salon.salon_name AS salon_name
             FROM salon_posts sp
             LEFT JOIN app_users user ON sp.user_id = user.id
             LEFT JOIN app_users salon ON sp.user_salon_id = salon.id
             WHERE sp.deleted_at IS NULL 
             ORDER BY sp.created_at DESC`,
            function (err, res) {
                if (err) {
                    result(err, null);
                } else {
                    result(null, res);
                }
            }
        );
    });
};
salonPostModel.getAllRewardTeamplate = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }

        // 1) Fetch main posts with your existing JOIN query
        const postQuery = `
            SELECT * from reward_template WHERE deleted_at IS NULL `;

        conn.query(postQuery, function (err, posts) {
            if (err) return result(err, null);
            if (posts.length === 0) return result(null, []);

           
                return result(null, posts);
            
        });
    });
};
salonPostModel.getAllPosts = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }

        // 1) Fetch main posts with your existing JOIN query
        const postQuery = `
            SELECT sp.*, 
                   user.first_name AS user_first_name, 
                   user.last_name AS user_last_name, 
                   user.profile_image AS user_profile_image, 
                   salon.first_name AS salon_first_name, 
                   salon.last_name AS salon_last_name, 
                   salon.salon_name AS salon_name
            FROM salon_posts sp
            LEFT JOIN app_users user ON sp.user_id = user.id
            LEFT JOIN app_users salon ON sp.user_salon_id = salon.id
            WHERE sp.deleted_at IS NULL 
            ORDER BY sp.created_at DESC
        `;

        conn.query(postQuery, function (err, posts) {
            if (err) return result(err, null);
            if (posts.length === 0) return result(null, []);

            const postIds = posts.map(p => p.id);

            // 2) Fetch other_multi_posts for all posts
            const multiQuery = `
                SELECT *
                FROM other_multi_posts
                WHERE salon_post_id IN (?)
            `;

            conn.query(multiQuery, [postIds], function (err2, multi) {
                if (err2) return result(err2, null);

                // 3) Group multi-posts by post ID
                const grouped = {};
                multi.forEach(item => {
                    if (!grouped[item.salon_post_id]) grouped[item.salon_post_id] = [];
                    grouped[item.salon_post_id].push(item);
                });

                // 4) Attach other_multi_Post to each post
                const finalData = posts.map(p => ({
                    ...p,
                    other_multi_Post: grouped[p.id] || []
                }));

                return result(null, finalData);
            });
        });
    });
};

// Soft delete a salon post
salonPostModel.deletePost = function (req, postId, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query(
            `UPDATE salon_posts SET deleted_at = NOW() WHERE id = ?`,
            [postId],
            function (err, res) {
                if (err) {
                    result(err, null);
                } else {
                    result(null, res);
                }
            }
        );
    });
};

  salonPostModel.deleteReward = function (req, postId, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query(
            `UPDATE reward_template SET deleted_at = NOW() WHERE id = ?`,
            [postId],
            function (err, res) {
                if (err) {
                    result(err, null);
                } else {
                    result(null, res);
                }
            }
        );
    });
};

// Get all flagged salon posts with user and salon details
salonPostModel.getFlaggedPosts = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query(
            `SELECT fp.id AS flag_id, 
                    flagger.first_name AS flagged_by_first_name, 
                    flagger.last_name AS flagged_by_last_name, 
                    owner.first_name AS post_owner_first_name, 
                    owner.last_name AS post_owner_last_name, 
                    salon.first_name AS salon_first_name, 
                    salon.last_name AS salon_last_name, 
                    salon.salon_name AS salon_name, 
                    sp.before_image, 
                    sp.id As post_id,
                    sp.after_image, 
                    sp.rating, 
                    sp.review
             FROM flag_post fp
             JOIN salon_posts sp ON fp.flag_id = sp.id
             JOIN app_users flagger ON fp.user_id = flagger.id
             JOIN app_users owner ON sp.user_id = owner.id
             JOIN app_users salon ON sp.user_salon_id = salon.id
             WHERE sp.deleted_at IS NULL
             ORDER BY fp.id DESC`,
            function (err, res) {
                if (err) {
                    result(err, null);
                } else {
                    result(null, res);
                }
            }
        );
    });
};


module.exports = salonPostModel;