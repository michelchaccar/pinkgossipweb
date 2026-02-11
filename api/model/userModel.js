'user strict';
var sql = require('../../config');
var async = require('async');

var userModel = function (task) {

};

userModel.checkFollowed = function (req, loginUserId, SelectUserId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        conn.query('SELECT COUNT(*) AS count FROM user_followers WHERE following_id = ? AND follower_id = ? AND deleted_at IS NULL', [loginUserId, SelectUserId], function (err, result) {
          if (err) {
            reject(err);
          } else {  
            const is_followed = result[0].count > 0 ? 1 : 0;
            resolve(is_followed);
          }
        });
      }
    });
  });
};

userModel.get_follows = function (req, salonId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      }

      var sql = 'SELECT ' +
        '(SELECT COUNT(*) FROM user_followers WHERE following_id = ?) AS following_count, ' +
        '(SELECT COUNT(*) FROM user_followers WHERE follower_id = ?) AS follower_count;';

      conn.query(sql, [salonId, salonId], function (err, res) {
        if (err) {
          reject(error);
        } else {
          resolve(res[0]);
        }
      });
    });
  });
};


//block_user
userModel.user_block = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
    var sql = conn.query("INSERT block_user SET ? ", [addArray], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}

userModel.user_unblock = function (req, blockArray, result) {
  req.getConnection(function (error, conn) {
    conn.query("DELETE FROM block_user WHERE user_id = ? AND block_user_id = ?", [blockArray.user_id, blockArray.block_user_id], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
};

//following
userModel.user_following = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
    var sql = conn.query("INSERT user_followers SET ? ", [addArray], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}

userModel.user_redeem = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
    var sql = conn.query("INSERT redeem_reward SET ? ", [addArray], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
}

userModel.user_unfollowing = function (req, unfollowArray, result) {
  req.getConnection(function (error, conn) {
    conn.query("DELETE FROM user_followers WHERE following_id = ? AND follower_id = ?", [unfollowArray.following_id, unfollowArray.follower_id], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
};



userModel.user_data = function (req, result) {
  req.getConnection(function (error, conn) {
    // conn.query("SELECT id, first_name, last_name, salon_name, profile_image FROM app_users WHERE deleted_at IS NULL AND user_type = ?;", [req.params.type], function (err, res) {
    conn.query(
      "SELECT au.id, au.first_name, au.last_name, au.user_name,au.salon_name, au.profile_image, " +
      "(SELECT COUNT(*) FROM user_followers WHERE follower_id = au.id) AS follower_count " +
      "FROM app_users AS au " +
      "WHERE au.deleted_at IS NULL AND au.user_type = ?;",
      [req.params.type],
      function (err, res) {
        if (err) {
          console.log(err);
          result(err, null);
        } else {
          result(null, res);
        }
      });
  });
}


userModel.followsData = function (req, profileUId, select_type, result) {
  req.getConnection(function (error, conn) {
    if (error) {
      console.log(error);
      result(error, null);
      return;
    }

    let query;
    let queryParams;

    if (select_type === 'following') {
      query = "SELECT app_users.* FROM user_followers LEFT JOIN app_users ON user_followers.follower_id = app_users.id WHERE user_followers.following_id = ?";
      queryParams = [profileUId];
    } else if (select_type === 'follower') {
      query = "SELECT app_users.* FROM user_followers LEFT JOIN app_users ON user_followers.following_id = app_users.id WHERE user_followers.follower_id = ?";
      queryParams = [profileUId];
    }else if(select_type === 'all'){
      query = "SELECT * FROM `app_users` WHERE `deleted_at` IS NULL";
    } else {
      // Handle invalid select_type
      result("Invalid select_type", null);
      return;
    }
    conn.query(query, queryParams, function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    });
  });
};

userModel.post_list = function (req, userId) {
  var offset = parseInt(req.query.offset) || 0;

  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        console.error("Database Connection Error:", error);
        return reject(error);
      }

      var sql = `
        SELECT 
          salon_posts.*, 
          IFNULL(like_posts.like, 0) AS \`like\`, 
          app_users.first_name, 
          app_users.last_name, 
          app_users.user_name, 
          app_users.profile_image, 
          app_users.user_type, 
          salon_users.salon_name, 
          (SELECT COUNT(*) FROM salon_posts WHERE salon_posts.deleted_at IS NULL) AS showing_post_count  
        FROM salon_posts 
        LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? 
        LEFT JOIN app_users ON salon_posts.user_id = app_users.id 
        LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  
        WHERE salon_posts.deleted_at IS NULL And salon_posts.post_type != 'RewardPost'
        AND salon_posts.user_id NOT IN (
          SELECT block_user_id FROM block_user WHERE user_id = ? 
          UNION 
          SELECT user_id FROM block_user WHERE block_user_id = ?
        )
        ORDER BY salon_posts.id DESC 
        LIMIT 10 OFFSET ?;
      `;

      conn.query(sql, [userId, userId, userId, offset], function (err, res) {
        if (err) {
          console.error("SQL Error:", err.sqlMessage); // 🔴 Log SQL error
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};


userModel.reward_post_list = function (req, userId) {
  var offset = parseInt(req.query.offset) || 0;

  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        console.error("Database Connection Error:", error);
        return reject(error);
      }

      var sql = `
        SELECT 
          salon_posts.*, 
          app_users.first_name, 
          app_users.last_name, 
          app_users.user_name, 
          app_users.profile_image, 
          app_users.user_type, 
          salon_users.salon_name FROM salon_posts
          LEFT JOIN app_users ON salon_posts.user_id = app_users.id 
        LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  
        WHERE salon_posts.deleted_at IS NULL And salon_posts.post_type = 'RewardPost' ORDER BY salon_posts.id DESC 
        LIMIT 10 OFFSET ?;
      `;

      conn.query(sql, [ offset], function (err, res) {
        if (err) {
          console.error("SQL Error:", err.sqlMessage); // 🔴 Log SQL error
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};

userModel.my_redeem_post_list = function (req, userId) {
  var offset = parseInt(req.query.offset) || 0;

  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        console.error("Database Connection Error:", error);
        return reject(error);
      }

      var sql = `
        SELECT 
          salon_posts.*, 
          app_users.first_name, 
          app_users.last_name, 
          app_users.user_name, 
          app_users.profile_image, 
          app_users.user_type, 
          salon_users.salon_name FROM salon_posts
          LEFT JOIN app_users ON salon_posts.user_id = app_users.id 
        LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  
        WHERE salon_posts.deleted_at IS NULL And salon_posts.post_type = 'RewardPost'
        AND salon_posts.id  IN (
          SELECT reward_id FROM redeem_reward WHERE user_id = ? 
        )
        ORDER BY salon_posts.id DESC 
        LIMIT 10 OFFSET ?;
      `;

      conn.query(sql, [userId, offset], function (err, res) {
        if (err) {
          console.error("SQL Error:", err.sqlMessage); // 🔴 Log SQL error
          return reject(err);
        }
        resolve(res);
      });
    });
  });
};


userModel.post_list1 = function (req, userId) {
  var offset = parseInt(req.query.offset) || 0; // Assuming a default offset of 0 if not provided
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      // var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS`like`, app_users.first_name, app_users.last_name, app_users.profile_image, app_users.salon_name, COALESCE(COUNT(salon_posts.rating), 0) AS rating_count, COALESCE(AVG(salon_posts.rating), 0) AS average_rating FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? LEFT JOIN app_users ON salon_posts.user_salon_id = app_users.id WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id != ? GROUP BY salon_posts.id ORDER BY salon_posts.id DESC;';
      var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS `like`, app_users.first_name, app_users.last_name, app_users.user_name, app_users.profile_image, app_users.user_type,salon_users.salon_name, (SELECT COUNT(*) FROM salon_posts WHERE salon_posts.deleted_at IS NULL) AS showing_post_count  FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? LEFT JOIN app_users ON salon_posts.user_id = app_users.id LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  WHERE salon_posts.deleted_at IS NULL ORDER BY salon_posts.id DESC LIMIT 10 OFFSET ?;';
      // var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS `like`, app_users.first_name, app_users.last_name , app_users.profile_image FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? LEFT JOIN app_users ON salon_posts.user_id = app_users.id WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id != ? ORDER BY salon_posts.id DESC;';
      // var sql = 'SELECT salon_posts.*, IFNULL(like_posts.like, 0) AS `like` FROM salon_posts LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id != ? ORDER BY salon_posts.id DESC;';
      // var sql = 'SELECT * FROM `salon_posts` WHERE deleted_at IS NULL AND user_id != ? ORDER BY id DESC;';
      conn.query(sql, [userId, offset], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


// userModel.post_list = function (req, userId) {
//   var offset = parseInt(req.query.offset) || 0; // Assuming a default offset of 0 if not provided
//   return new Promise((resolve, reject) => {
//     req.getConnection(function (error, conn) {
//       var sql = `
//         SELECT salon_posts.*, 
//         IFNULL(like_posts.like, 0) AS \`like\`, 
//         app_users.first_name, 
//         app_users.last_name, 
//         app_users.profile_image,
//         salon_users.salon_name,
//         (SELECT COUNT(*) FROM salon_posts WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id != ?) AS countall
//         FROM salon_posts 
//         LEFT JOIN like_posts ON salon_posts.id = like_posts.salon_post_id AND like_posts.user_id = ? 
//         LEFT JOIN app_users ON salon_posts.user_id = app_users.id 
//         LEFT JOIN app_users AS salon_users ON salon_posts.user_salon_id = salon_users.id  
//         WHERE salon_posts.deleted_at IS NULL AND salon_posts.user_id != ? 
//         ORDER BY salon_posts.id DESC LIMIT 10 OFFSET ?;
//       `;

//       conn.query(sql, [userId, userId, userId, offset], function (err, res) {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(res);
//         }
//       });
//     });
//   });
// };


userModel.profile_data = function (req, userId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        var sql = 'SELECT * from app_users WHERE deleted_at IS NULL AND id = ?;';
        conn.query(sql, [userId], function (err, res) {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }
    });
  });
};


userModel.get_user_block_list = function (req, userId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        var sql = `
        SELECT block_user.*, app_users.profile_image , app_users.first_name, app_users.last_name 
        FROM block_user 
        LEFT JOIN app_users ON block_user.block_user_id = app_users.id 
        WHERE block_user.user_id = ?;
    `;
    
        conn.query(sql, [userId], function (err, res) {
          if (err) {
            reject(err);
          } else {
            console.log(res);
            resolve(res);
          }
        });
      }
    });
  });
};

userModel.get_user_notification = function (req, userId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        var sql = `
        SELECT notifications.*, app_users.profile_image , app_users.first_name, app_users.last_name 
        FROM notifications 
        LEFT JOIN app_users ON notifications.from_user_id = app_users.id 
        WHERE notifications.to_user_id = ? 
        AND notifications.deleted_at IS NULL order by id Desc;
    `;
    
        conn.query(sql, [userId], function (err, res) {
          if (err) {
            reject(err);
          } else {
            console.log(res);
            resolve(res);
          }
        });
      }
    });
  });
};
userModel.deleteAccount = function (req, id, result) {
  req.getConnection(function (error, conn) {
    var sql = conn.query("UPDATE app_users SET deleted_at = Now()  WHERE id = ?", [id], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    })
  })

}

userModel.profile_update = function (req, addArray, id, result) {
  req.getConnection(function (error, conn) {
    var sql = conn.query("UPDATE app_users SET ? WHERE id = ?", [addArray, id], function (err, res) {
      if (err) {
        result(err, null);
      } else {
        result(null, res);
      }
    })
  })

}



userModel.average_get = function (req, salonId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      conn.query("SELECT COALESCE(COUNT(salon_posts.rating), 0) AS rating_count, COALESCE(AVG(salon_posts.rating), 0) AS average_rating FROM salon_posts WHERE deleted_at IS NULL AND user_salon_id = ? ;", [salonId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res[0]);
        }
      });
    });
  });
};




userModel.comment_get = function (req, postId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      conn.query("SELECT comment_posts.*, app_users.first_name, app_users.last_name, app_users.profile_image, app_users.user_type FROM comment_posts JOIN app_users ON comment_posts.app_user_id = app_users.id WHERE comment_posts.deleted_at IS NULL AND comment_posts.salon_post_id = ? ORDER BY comment_posts.id DESC ;", [postId], function (err, res) {
        // conn.query("SELECT * FROM comment_posts WHERE deleted_at IS NULL AND salon_post_id = ? ;", [postId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


userModel.like_get = function (req, postId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      conn.query("SELECT like_posts.*, app_users.first_name , app_users.last_name FROM like_posts JOIN app_users ON like_posts.user_id = app_users.id WHERE like_posts.deleted_at IS NULL AND like_posts.salon_post_id = ?;", [postId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


userModel.other_multi_post_get = function (req, postId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      conn.query("SELECT * FROM other_multi_posts WHERE salon_post_id = ?;", [postId], function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};


// userModel.insert_salon_open_days = function (req, appUserId, openWeekdays) {
//   return new Promise((resolve, reject) => {
//     req.getConnection(function (error, conn) {
//       if (error) {
//         return reject(error);
//       }

//       let deleteQuery = "DELETE FROM salon_open_days WHERE app_user_id = ?";
//       conn.query(deleteQuery, [appUserId], function (err, result) {
//         if (err) {
//           return reject(err);
//         }

//         let insertQuery  = "INSERT INTO salon_open_days (app_user_id, open, start_time, end_time, created_at, updated_at) VALUES ?";
       
//         console.log('appUserId:',appUserId);
//         console.log('insertQuery:',insertQuery);
//         console.log('values:',values);
//         return;
//         conn.query(insertQuery, [values], function (err, result) {
//           if (err) {
//             return reject(err);
//           } else {
//             return resolve(result);
//           }
//         });
//       });
//     });
//   });
// };



userModel.insert_salon_open_days = function (req, appUserId, openWeekdays) {

  // Check if openWeekdays is a string and parse it if necessary
  if (typeof openWeekdays === 'string') {
      try {
          openWeekdays = JSON.parse(openWeekdays);
      } catch (error) {
          console.error('Error parsing openWeekdays:', error.message);
          return Promise.reject(new Error('Failed to parse openWeekdays'));
      }
  } 
  if (
    !Array.isArray(openWeekdays)) {
    console.error('openWeekdays is not an array:', openWeekdays);
    return Promise.reject(new Error('openWeekdays should be an array'));
}

  // Proceed with your logic
  // console.log('Parsed openWeekdays:', openWeekdays);
  
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        return reject(error);
      }

      // Check if openWeekdays is an array
      if (!Array.isArray(openWeekdays)) {
        return reject(new Error('openWeekdays should be an array'));
      }

      // First, delete any existing records for the given appUserId
      let deleteQuery = "DELETE FROM salon_open_days WHERE app_user_id = ?";
      conn.query(deleteQuery, [appUserId], function (err, result) {
        if (err) {
          return reject(err);
        }
        if (openWeekdays.length !== 0) {
        // Prepare the values for bulk insertion
        let values = openWeekdays.map(weekday => [
          appUserId,
          weekday.day,
          weekday.openTime,
          weekday.closeTime,
          new Date(),  // created_at
          new Date()   // updated_at
        ]);

        // Insert new records
        let insertQuery = "INSERT INTO salon_open_days (app_user_id, open, start_time, end_time, created_at, updated_at) VALUES ?";

        conn.query(insertQuery, [values], function (err, result) {
          if (err) {
            return reject(err);
          } else {
            return resolve(result);
          }
        });
      } else {
        return resolve('No weekdays to insert');
      }
      });
    });
  });
};


userModel.get_notification = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      conn.query("SELECT * FROM `notifications` WHERE `is_push` = 0", function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};

userModel.notification_update = function (req, addArray, id) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        return reject(error); // Reject the Promise if there's a connection error
      }
      conn.query("UPDATE notifications SET ? WHERE id = ?", [addArray, id], function (err, res) {
        if (err) {
          return reject(err); // Reject the Promise on query error
        }
        resolve(res); // Resolve the Promise with the result
      });
    });
  });
};



userModel.story_add = function (req, addArray, result) {
  req.getConnection(function (error, conn) {
      if (error) {
          return result(error, null);
      }

      // Insert the story data into the 'stories' table
      conn.query("INSERT INTO story_table SET ?", [addArray], function (err, res) {
          if (err) {
              return result(err, null);
          }

          // Retrieve the inserted story details
          conn.query("SELECT * FROM story_table WHERE id = ?", [res.insertId], function (err, story) {
              if (err) {
                  return result(err, null);
              }
              result(null, story[0]);
          });
      });
  });
};

userModel.getStoryFromId = function (req, userId) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      // const sql = "SELECT * FROM story_table WHERE user_id = ? AND deleted_at IS NULL;";
      const sql = `
        SELECT s.*, u.first_name, u.last_name, u.salon_name, u.firebase_id, u.profile_image
        FROM story_table s
        JOIN app_users u ON s.user_id = u.id
        WHERE s.user_id = ? AND s.deleted_at IS NULL;
      `;
      conn.query(sql, userId, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  });
};

userModel.getStoriesByUserIds = function (req, followerIds, result) {
  req.getConnection(function (error, conn) {
      if (error) {
          return result(error, null);
      }

      // Fetch stories where user_id is in the followerIds array
      const sql = ` SELECT s.*, u.first_name, u.last_name, u.salon_name, u.firebase_id, u.profile_image FROM story_table AS s JOIN app_users AS u ON s.user_id = u.id WHERE s.user_id IN (?) AND s.deleted_at IS NULL; `;
      // const sql = "SELECT * FROM story_table WHERE user_id IN (?) AND deleted_at IS NULL;";
      conn.query(sql, [followerIds], function (err, stories) {
          if (err) {
              return result(err, null);
          }

          result(null, stories);
      });
  });
};


userModel.getStoriesOlderThan24Hours = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        // Adjusting the SQL query to fetch stories older than 24 hours
        const sql = 'SELECT * FROM story_table WHERE created_at < NOW() - INTERVAL 24 HOUR;';      
        conn.query(sql, function (err, result) {
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


userModel.deleteStoryById = function (storyId, req) {
  return new Promise((resolve, reject) => {
    req.getConnection(function (error, conn) {
      if (error) {
        reject(error);
      } else {
        // SQL query to delete a story by its ID
        const sql = 'DELETE FROM story_table WHERE id = ?';
        
        conn.query(sql, [storyId], function (err, result) {
          if (err) {
            reject(err);
          } else {
            // Check if any rows were affected
            if (result.affectedRows > 0) {
              resolve(true); // Return true if a story was deleted
            } else {
              resolve(false); // Return false if no story was deleted (ID not found)
            }
          }
        });
      }
    });
  });
};


userModel.point_store = async function (req, pointArray) {
  return new Promise((resolve, reject) => {
      req.getConnection(function (error, conn) {
          if (error) {
              return reject(error);
          }

          var sql = conn.query("INSERT INTO point_table SET ?", [pointArray], function (err, res) {
              if (err) {
                  return reject(err);
              } else {
                  resolve(res);
              }
          });
      });
  });
};

userModel.getUsersCreatedBefore2Hours = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `
        SELECT id, user_type
        FROM app_users
        WHERE deleted_at IS NULL
        AND created_at <= NOW() - INTERVAL 2 HOUR
        AND created_at >= NOW() - INTERVAL 1 DAY;
      `;

      conn.query(sql, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
};

userModel.checkNotificationExists = function (req, userId, type) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) return reject(err);

      conn.query(
        "SELECT COUNT(*) AS count FROM notifications WHERE to_user_id = ? AND type = ? AND deleted_at IS NULL",
        [userId, type],
        (error, result) => {
          if (error) return reject(error);
          resolve(result[0].count > 0 ? 1 : 0);
        }
      );
    });
  });
};
userModel.insertNotification = function (req, data) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) return reject(err);

      conn.query("INSERT INTO notifications SET ?", [data], (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
};

userModel.sendDailyAutoNotifications = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection(async (err, conn) => {
      if (err) return reject(err);

      // Get all active users
      const sql = `SELECT id, user_type, DATE(created_at) AS created FROM app_users WHERE deleted IS NULL AND created_at >= CURDATE() - INTERVAL 6 DAY;`;

      conn.query(sql, async (error, users) => {
        if (error) return reject(error);

        for (let user of users) {
          let userId = user.id;
          let type = user.user_type;

          // Calculate day difference
          let diffSql = `SELECT DATEDIFF(CURDATE(), DATE(created_at)) AS days FROM app_users WHERE id = ?`;
          let diff = await new Promise((res, rej) => {
            conn.query(diffSql, [userId], (e, r) => e ? rej(e) : res(r[0].days));
          });

          // -------- TYPE 1 USERS (NORMAL USERS) --------
          if (type == 1 && diff === 1) {
            let already = await checkIfSent(conn, userId, 'weekly_perk');
            if (!already) {
              let msg = {
                from_user_id: userId,
                to_user_id: userId,
                text: "Gossipers who post weekly unlock surprise perks! Don’t let your glam go unseen.",
                text_fr: "Les bavardes qui publient chaque semaine débloquent des avantages surprises ! Ne laissez pas votre glamour passer inaperçu.",
                type: "weekly_perk",
                created_at: new Date(),
                updated_at: new Date()
              };
              await insertNotificationModel(conn, msg);
            }
          }

          // -------- TYPE 2 USERS (SALONS) --------
          if (type == 2) {

            // After 2 days -> QR code visibility message
            if (diff === 2) {
              let already = await checkIfSent(conn, userId, 'qr_boost');
              if (!already) {
                let msg = {
                  from_user_id: userId,
                  to_user_id: userId,
                  text: "Salons that use their QR code get 3× more visibility! Let your clients become your marketers.",
                  text_fr: "Les salons qui utilisent leur QR code obtiennent 3× plus de visibilité ! Laissez vos clients devenir vos ambassadeurs.",
                  type: "qr_boost",
                  created_at: new Date(),
                  updated_at: new Date()
                };
                await insertNotificationModel(conn, msg);
              }
            }

            // After 5 days -> No review message
            if (diff === 5) {
              let already = await checkIfSent(conn, userId, 'no_reviews');
              if (!already) {
                let msg = {
                  from_user_id: userId,
                  to_user_id: userId,
                  text: "You haven’t collected any reviews yet. Let’s change that! Ask today’s clients to scan your code & share their glam.",
                  text_fr: "Vous n’avez encore recueilli aucun avis. Changeons cela ! Demandez à vos clients d’aujourd’hui de scanner votre code et de partager leur look glamour.",
                  type: "no_reviews",
                  created_at: new Date(),
                  updated_at: new Date()
                };
                await insertNotificationModel(conn, msg);
              }
            }

          }

        }

        resolve({ success: true });
      });
    });
  });
};

function checkIfSent(conn, userId, type) {
  return new Promise((resolve, reject) => {
    conn.query(
      "SELECT COUNT(*) AS c FROM notifications WHERE to_user_id = ? AND type = ? AND deleted_at IS NULL",
      [userId, type],
      (err, res) => err ? reject(err) : resolve(res[0].c > 0)
    );
  });
}

function insertNotificationModel(conn, data) {
  return new Promise((resolve, reject) => {
    conn.query("INSERT INTO notifications SET ?", data, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

userModel.getAllUsers = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `
        SELECT id, user_type
        FROM app_users
        WHERE deleted IS NULL
      `;

      conn.query(sql, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
};

userModel.getAllBusinessUsers = function (req) {
  return new Promise((resolve, reject) => {
    req.getConnection((err, conn) => {
      if (err) return reject(err);

      const sql = `
        SELECT id
        FROM app_users
        WHERE deleted IS NULL
        AND user_type = 2
      `;

      conn.query(sql, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  });
};


module.exports = userModel;