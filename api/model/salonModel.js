'user strict';
var sql = require('../../config');
var async = require('async');

var salonModel = function (task) {

};

salonModel.salon_data = function (req, loginUserId, result) {
  req.getConnection(function (error, conn) {
    conn.query("SELECT app_users.*, COALESCE(COUNT(salon_posts.rating), 0) AS rating_count, COALESCE(AVG(salon_posts.rating), 0) AS average_rating FROM app_users LEFT JOIN salon_posts ON app_users.id = salon_posts.user_salon_id WHERE app_users.deleted_at IS NULL AND app_users.user_type = 2 AND app_users.id != ? AND app_users.salon_name IS NOT NUll AND app_users.salon_name != '' AND app_users.latitude IS NOT NUll  AND app_users.latitude != '0.0' AND app_users.latitude != ''  GROUP BY app_users.id;", [loginUserId], function (err, res) {
      // conn.query("SELECT * FROM app_users WHERE deleted_at IS NULL AND user_type = 2;", function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}

salonModel.reward_template_data = function (req, result) {
  req.getConnection(function (error, conn) {
    conn.query("SELECT * from reward_template where deleted_at IS NULL ",  function (err, res) {
      // conn.query("SELECT * FROM app_users WHERE deleted_at IS NULL AND user_type = 2;", function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}


salonModel.all_salon = function (req,  result) {
  req.getConnection(function (error, conn) {
    conn.query("SELECT app_users.first_name,app_users.last_name,app_users.email,app_users.salon_name,app_users.bio,CONCAT('http://pinkgossipapp.com/img/', app_users.profile_image) AS profile_image,app_users.site_name,app_users.address, COALESCE(COUNT(salon_posts.rating), 0) AS rating_count, COALESCE(AVG(salon_posts.rating), 0) AS average_rating FROM app_users LEFT JOIN salon_posts ON app_users.id = salon_posts.user_salon_id WHERE app_users.deleted_at IS NULL AND app_users.user_type = 2  AND app_users.salon_name IS NOT NUll AND app_users.salon_name != '' AND app_users.latitude IS NOT NUll  AND app_users.latitude != '0.0' AND app_users.latitude != ''   GROUP BY app_users.id;",  function (err, res) {
      // conn.query("SELECT * FROM app_users WHERE deleted_at IS NULL AND user_type = 2;", function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}




salonModel.salon_details = function (req, salonId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      var sql = 'SELECT app_users.*, COALESCE(COUNT(salon_posts.rating), 0) AS rating_count, COALESCE(AVG(salon_posts.rating), 0) AS average_rating FROM app_users LEFT JOIN salon_posts ON app_users.id = salon_posts.user_salon_id WHERE app_users.deleted_at IS NULL AND app_users.id = ? GROUP BY app_users.id; ';      
      conn.query(sql, [salonId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};
salonModel.salon_details_username = function (req, userName) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      var sql = 'SELECT app_users.id,app_users.user_type from app_users WHERE app_users.deleted_at IS NULL AND app_users.id = ? ';      
      conn.query(sql, [userName], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


salonModel.get_total_point = function (req, userId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        return reject(error);
      }

      // Update SQL to sum the points for the user
      var sql = 'SELECT SUM(point) AS total_points FROM point_table WHERE user_id = ?';

      conn.query(sql, [userId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          // Resolve with the total points or 0 if no rows are found
          const totalPoints = res[0]?.total_points || 0;
          resolve(totalPoints);
        }
      });
    });
  });
};


salonModel.get_salon_open_days = function (req, salonId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      var sql = 'SELECT * FROM salon_open_days WHERE app_user_id = ?  AND deleted_at IS NULL';      
      conn.query(sql, [salonId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


//before first post notification 
salonModel.store = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
    var sq = conn.query("INSERT INTO salon_posts SET ?", [addArray], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        conn.query("SELECT * FROM salon_posts WHERE id = ?", [res.insertId], function (err, post) {
          if (err) {
            result(err, null);
          } else {
            result(null, post[0]);
          }
        });
      }
    });
  });
};

salonModel.store2511 = function (req, addArray, result) {
  req.getConnection(async function (error, conn) {
    if (error) return result(error, null);

    conn.query("INSERT INTO salon_posts SET ?", [addArray], async function (err, res) {
      if (err) return result(err, null);

      try {
        const postId = res.insertId;

        // 🔹 Count total posts of this user
        const [countRows] = await conn.promise().query(
          "SELECT COUNT(*) AS total FROM salon_posts WHERE user_id = ? AND deleted IS NULL",
          [addArray.user_id]
        );

        // 🔥 FIRST POST → send notification
        if (countRows[0].total === 1) {
          const notification = {
            from_user_id: addArray.user_id,
            to_user_id: addArray.user_id,
            text: "Yasss! Your look is live! Keep the glam streak — 2 more posts = next reward",
            text_fr: "Yasss ! Votre look est en ligne ! Continuez la série glam — encore 2 publications = prochaine récompense",
            type: "first_post",
            created_at: new Date(),
            updated_at: new Date()
          };

          await conn.promise().query("INSERT INTO notifications SET ?", notification);
        }

        // Return newly created post
        conn.query("SELECT * FROM salon_posts WHERE id = ?", [postId], function (err, post) {
          if (err) return result(err, null);
          return result(null, post[0]);
        });

      } catch (err2) {
        console.log("Error in first post logic:", err2);
        return result(err2, null);
      }
    });
  });
};



salonModel.other_post_store = function (req, addArray) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      var sq = conn.query("INSERT INTO other_multi_posts SET ?", [addArray], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};





salonModel.salon_posts = function (req, salonId, userType) {
  var offset = parseInt(req.query.offset) || 0; // Assuming a default offset of 0 if not provided
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
     if(userType == '1'){
        var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS `like`, app_users.first_name, app_users.last_name, app_users.profile_image,salon_users.salon_name, (SELECT COUNT(*) FROM salon_posts WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id = ?) AS showing_post_count FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? LEFT JOIN app_users ON salon_posts.user_id = app_users.id LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id = ? ORDER BY salon_posts.id DESC LIMIT 10 OFFSET ?;';
      }else if(userType == '2'){
        var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS `like`, app_users.first_name, app_users.last_name, app_users.profile_image,salon_users.salon_name, (SELECT COUNT(*) FROM salon_posts WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_salon_id = ?) AS showing_post_count FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? LEFT JOIN app_users ON salon_posts.user_id = app_users.id LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_salon_id = ? ORDER BY salon_posts.id DESC LIMIT 10 OFFSET ?;';
      }
      conn.query(sql, [salonId, salonId, salonId, offset], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


salonModel.get_tag_posts = function (req, UserId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        return reject(error);
      }
      // var sql = ` SELECT * FROM salon_posts WHERE FIND_IN_SET(?, user_tags)`;
      // Query to fetch tagged posts with additional data
      var sql = `
      SELECT 
        salon_posts.*, 
        IFNULL(like_posts.like, 0) AS \`like\`, 
        app_users.user_name, 
        app_users.first_name, 
        app_users.last_name, 
        app_users.profile_image,
        app_users.user_type,
        salon_users.salon_name
      FROM salon_posts 
      LEFT JOIN like_posts 
        ON salon_posts.id = like_posts.salon_post_id 
        AND like_posts.user_id = ? 
      LEFT JOIN app_users 
        ON salon_posts.user_id = app_users.id 
      LEFT JOIN app_users AS salon_users 
        ON salon_posts.user_salon_id = salon_users.id 
      WHERE salon_posts.deleted_at IS NULL 
      AND FIND_IN_SET(?, user_tags)
      ORDER BY salon_posts.id;
  `;
  

      // Execute the query with UserId as a parameter for FIND_IN_SET and user_id for joins
      conn.query(sql, [UserId, UserId, UserId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};



salonModel.search_salon = function (req, salon_name) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      var sql = 'SELECT * FROM `app_users` WHERE deleted_at IS NULL AND salon_name LIKE ?';
      conn.query(sql, ['%' + salon_name + '%'], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};



module.exports = salonModel;