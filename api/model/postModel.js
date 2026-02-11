'user strict';
var sql = require('../../config');
var async = require('async');

var postModel = function (task) {

};


postModel.deleteLikePost = function (req, postLikeArray) {
    return new Promise((resolve, reject) => {
        req.getConnection(function (error, conn) {
            if (error) {
                reject(error);
            } else {
                conn.query("DELETE FROM like_posts WHERE user_id = ? AND salon_post_id = ?", [postLikeArray.user_id, postLikeArray.salon_post_id], function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }
        });
    });
  };

postModel.like_store = function (req, postLikeArray, result) {
    req.getConnection(function (error, conn) {
        conn.query("SELECT * FROM like_posts WHERE user_id = ? AND salon_post_id = ?", [postLikeArray.user_id, postLikeArray.salon_post_id], function (err, rows) {
          if (err) {
            result(err, null);
          } else {
            if (rows.length > 0) {
              result(null, rows);
            } else {
              conn.query("INSERT INTO like_posts SET ?", [postLikeArray], function (err, res) {
                if (err) {
                  result(err, null);
                } else {
                  result(null, res);
                }
              });
            }
          }
        });
    });
}


postModel.comment_store = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
      var sql = conn.query("INSERT INTO comment_posts SET ?", [addArray], function (err, res) {
          if (err) {
              result(err, null);
          } else {
              result(null, res);
          }
      });
  });
};

postModel.flag_store = function (req, addArray, result) {
    req.getConnection(function (error, conn) {
        var sql = conn.query("INSERT INTO flag_post SET ?", [addArray], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
  };

postModel.deletePost = function (req, postId) {
  return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
          if (error) {
              reject(error);
          } else {
            conn.query(`
            DELETE posts, comments, likes, other_posts
            FROM salon_posts AS posts
            LEFT JOIN comment_posts AS comments ON posts.id = comments.salon_post_id
            LEFT JOIN like_posts AS likes ON posts.id = likes.salon_post_id
            LEFT JOIN other_multi_posts AS other_posts ON posts.id = other_posts.salon_post_id
            WHERE posts.id = ?
        `, [postId], function (err, result) {
                  if (err) {
                      reject(err);
                  } else {
                      resolve(result);
                  }
              });
          }
      });
  });
};


postModel.notification_store = async function (req, notificationArray) {
  return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
          if (error) {
              return reject(error);
          }

          var sql = conn.query("INSERT INTO notifications SET ?", [notificationArray], function (err, res) {
              if (err) {
                  return reject(err);
              } else {
                  resolve(res);
              }
          });
      });
  });
};


module.exports = postModel;