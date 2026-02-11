'user strict';
var sql = require('../../config');
var async = require('async');

var userModel = function (task) {

};



userModel.getAppUserData = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("SELECT * FROM app_users WHERE deleted_at IS NULL AND user_type = 1 ORDER BY id DESC", function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};
userModel.getAppUserById = function (req,id, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("SELECT * FROM app_users WHERE id = ?", [id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};
userModel.insertUserData = function (req,data, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("INSERT INTO app_users SET ?", data, function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};
userModel.weekData = function (req, data, result) {
    req.getConnection(function (error, conn) {
        if (error) return result(error, null);

        const query = `
            INSERT INTO salon_open_days 
            (app_user_id, day, open, start_time,end_time, created_at, updated_at)
            VALUES (?, ?, ?,?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                open = VALUES(open),
                start_time = VALUES(start_time),
                end_time = VALUES(end_time),
                updated_at = VALUES(updated_at)
        `;

        const values = [
            data.app_user_id,
            data.day,
            data.open,
            data.start_time,
            data.end_time,
            data.created_at,
            data.updated_at,
        ];

        conn.query(query, values, function (err, res) {
            if (err) result(err, null);
            else result(null, res);
        });
    });
};


userModel.updateUserData = function (req,id, data, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("UPDATE app_users SET ? WHERE id = ?", [data, id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};

userModel.deleteAppUserData = function (req,id,  result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("UPDATE app_users SET deleted_at = Now() WHERE id = ?", [ id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};

userModel.suspendAppUser = function (req, id, suspendStatus, result) {
    req.getConnection(function (error, conn) {
        if (error) return result(error, null);
        conn.query("UPDATE app_users SET suspend = ? WHERE id = ?", [suspendStatus, id], result);
    });
};

//getSalonData deleteSalonData updateSalonData insertSalonData getsalonById

// userModel.getSalonData = function (req, result) {
//     req.getConnection(function (error, conn) {
//         if (error) {
//             return result(error, null);
//         }
//         conn.query("SELECT * FROM app_users WHERE deleted_at IS NULL AND user_type = 2 ORDER BY id DESC", function (err, res) {
//             if (err) {
//                 result(err, null);
//             } else {
//                 result(null, res);
//             }
//         });
//     });
// };
userModel.getEnthusiasts = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) return result(error, null);

        let sql = `
            SELECT id, user_name, first_name, last_name, profile_image
            FROM app_users
            WHERE deleted_at IS NULL AND user_type = 1 AND user_name IS NOT NULL AND user_name != ''
            
        `;

        conn.query(sql, function (err, res) {
            if (err) result(err, null);
            else result(null, res);
        });
    });
};


userModel.getSalonUsers = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) return result(error, null);

        let sql = `
            SELECT 
                au.*, 
                IFNULL(AVG(sp.rating), 0) AS avg_rating,
                COUNT(sp.id) AS total_reviews
            FROM app_users au
            LEFT JOIN salon_posts sp 
                ON sp.user_salon_id = au.id
                AND sp.deleted_at IS NULL
            WHERE au.deleted_at IS NULL 
                AND au.user_type = 2 AND au.salon_name IS NOT NUll
                AND au.salon_name IS NOT NULL
                AND au.salon_name != '' AND au.latitude IS NOT NUll  AND au.latitude != '0.0' AND au.latitude != ''
            GROUP BY au.id
        `;
//AND au.salon_name IS NOT NUll AND au.salon_name != '' AND au.latitude IS NOT NUll  AND au.latitude != '0.0' AND au.latitude != ''
        conn.query(sql, function (err, res) {
            if (err) result(err, null);
            else result(null, res);
        });
    });
};
userModel.searchSalonOld = function (keyword, req, result) {

    let search = `%${keyword}%`;

    let sql = `
        SELECT 
            au.*, 
            IFNULL(AVG(sp.rating), 0) AS avg_rating,
            COUNT(sp.id) AS total_reviews
        FROM app_users au
        LEFT JOIN salon_posts sp 
            ON sp.user_salon_id = au.id 
            AND sp.deleted_at IS NULL
        WHERE au.deleted_at IS NULL AND au.salon_name != '' AND au.latitude IS NOT NUll  AND au.latitude != '0.0' AND au.latitude != ''
            AND au.user_type = 2
            AND (
                au.salon_name LIKE ? OR
                au.first_name LIKE ? OR
                au.last_name LIKE ?
            )
        GROUP BY au.id
    `;

    req.getConnection(function(err, conn) {
        if (err) return result(err, null);

        conn.query(sql, [search, search, search], function(err, rows) {
            if (err) return result(err, null);
            return result(null, rows);
        });
    });
};
userModel.searchSalon = function (keyword, req, result) {
    let search = `%${keyword}%`;

    const sql = `
        SELECT 
            au.*, 
            IFNULL(AVG(sp.rating), 0) AS avg_rating,
            COUNT(sp.id) AS total_reviews,
            au.user_type
        FROM app_users au
        LEFT JOIN salon_posts sp 
            ON sp.user_salon_id = au.id 
            AND sp.deleted_at IS NULL
        WHERE au.deleted_at IS NULL 
            AND (
                au.salon_name LIKE ? OR
                au.first_name LIKE ? OR
                au.last_name LIKE ?
            )
        GROUP BY au.id
    `;

    req.getConnection((err, conn) => {
        if (err) return result(err);

        conn.query(sql, [search, search, search], (err, rows) => {
            if (err) return result(err);

            // Enthusiasts (user_type = 1) — no extra filters
            const enthusiasts = rows.filter(u => u.user_type == 1);

            // Salons (user_type = 2) — apply extra filters
            const salons = rows.filter(u => 
                u.user_type == 2 &&
                u.salon_name !== '' &&
                u.latitude !== null &&
                u.latitude !== '0.0' &&
                u.latitude !== ''
            );

            return result(null, { enthusiasts, salons });
        });
    });
};


userModel.getSalonData = function (req, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }

        let sql = `
            SELECT 
                au.*, 
                IFNULL(AVG(sp.rating), 0) AS avg_rating,
                COUNT(sp.id) AS total_reviews
            FROM app_users au
            LEFT JOIN salon_posts sp 
                ON sp.user_salon_id = au.id 
                AND sp.post_type = 'SalonReview'
                AND sp.deleted_at IS NULL
            WHERE au.deleted_at IS NULL 
                AND au.user_type = 2 AND au.salon_name IS NOT NUll AND au.salon_name != '' AND au.latitude IS NOT NUll  AND au.latitude != '0.0' AND au.latitude != ''  
            GROUP BY au.id`;

        conn.query(sql, function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};


userModel.getSalonByIdOld = function (req, id, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("SELECT * FROM app_users WHERE id = ?", [id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};
userModel.getSalonById = function (req, id, result) {
    req.getConnection(function (error, conn) {
        if (error) return result(error, null);

        const userQuery = "SELECT * FROM app_users WHERE id = ?";
        const daysQuery = "SELECT * FROM salon_open_days WHERE app_user_id = ? AND deleted_at IS NULL";

        conn.query(userQuery, [id], function (err, userRes) {
            if (err) return result(err, null);

            conn.query(daysQuery, [id], function (err2, daysRes) {
                if (err2) return result(err2, null);

                result(null, {
                    user: userRes[0] || {},
                    open_days: daysRes || []
                });
            });
        });
    });
};

userModel.insertSalonData = function (req, data, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("INSERT INTO app_users SET ?", data, function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};

userModel.updateSalonData = function (req, id, data, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("UPDATE app_users SET ? WHERE id = ?", [data, id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};

userModel.deleteSalonData = function (req, id, result) {
    req.getConnection(function (error, conn) {
        if (error) {
            return result(error, null);
        }
        conn.query("UPDATE app_users SET deleted_at = Now() WHERE id = ?", [ id], function (err, res) {
            if (err) {
                result(err, null);
            } else {
                result(null, res);
            }
        });
    });
};


module.exports = userModel;