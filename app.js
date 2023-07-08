const mysql = require('mysql'); // 导入mysql包
const path = require('path');
require('base64-stream');
const fs = require('fs');
const http = require('http');
const formidable = require('formidable');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');


const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'root',
  password: 'root',
  port: '3306',
  database: 'reji',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dialect: 'mysql' // 添加方言配置
});
const app = express();
const session = require('express-session'); // 导入session包
// 设置 body-parser 以解析 JSON 数据
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(__dirname + '/public'));

const moment = require('moment');
const port = 3000;
const corsOptions = {
  origin: '*',
  methods: 'GET,PUT,POST,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
};

app.use(cors(corsOptions));
// 导入 multer 包，用于处理文件上传
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 将文件保存到 'data/uploads' 目录
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    // 使用原始文件名和当前时间戳作为文件名
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage: storage });
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Set up Express Session
app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // 设置为 true 如果您使用 HTTPS
  })
);
//地表数据
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// POST /report 路由
app.post('/report', upload.none(), (req, res) => {
  const { username, reason, landmarkid } = req.body;

  const sql = `INSERT INTO report (username, reason, landmarkid) VALUES (?, ?, ?)`;
  
  const values = [username, reason, landmarkid]; 

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving the report to the database');
    } else {
      console.log('Report saved to the database:', result.insertId);
      
      // 查询 landmarks 表获取被举报人的用户名
      const sql2 = `SELECT username FROM landmarks WHERE landmarkid = ?`;
      pool.query(sql2, [landmarkid], (err2, results2) => {
        if (err2) {
          console.error(err2);
          res.status(500).send('Error retrieving the reported user from the database');
        } else if (results2.length > 0) {
          const reportedUser = results2[0].username;

          // 更新或插入 reportcount 表的记录
          const sql3 = `INSERT INTO reportcount (username, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1`;
          pool.query(sql3, [reportedUser], (err3) => {
            if (err3) {
              console.error(err3);
              res.status(500).send('Error updating the report count in the database');
            } else {
              res.status(200).send('Report submitted successfully');
            }
          });
        } else {
          res.status(404).send('Reported user not found');
        }
      });
    }
  });
});
//举报评论
app.post('/commentreport', upload.none(), (req, res) => {
  const { username, reason, commentid } = req.body;

  const sql = `INSERT INTO commentreport (username, reason, commentid) VALUES (?, ?, ?)`;
  
  const values = [username, reason, commentid]; 

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error saving the comment report to the database');
    } else {
      console.log('Comment report saved to the database:', result.insertId);
      
      // 查询 comments 表获取被举报人的用户名
      const sql2 = `SELECT username FROM comments WHERE commentid = ?`;
      pool.query(sql2, [commentid], (err2, results2) => {
        if (err2) {
          console.error(err2);
          res.status(500).send('Error retrieving the reported user from the database');
        } else if (results2.length > 0) {
          const reportedUser = results2[0].username;

          // 更新或插入 reportcount 表的记录
          const sql3 = `INSERT INTO reportcount (username, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = count + 1`;
          pool.query(sql3, [reportedUser], (err3) => {
            if (err3) {
              console.error(err3);
              res.status(500).send('Error updating the report count in the database');
            } else {
              res.status(200).send('Comment report submitted successfully');
            }
            });
            } else {
            res.status(404).send('Reported user not found');
            }
            });
            }
            });
            });


// Middleware to parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Route to set user session data (just for testing)
app.get('/set-user-data', (req, res) => {
  req.session.username = {
    username: 'JohnDoe',
    email: 'john@gmail.com',
  };
  res.send('User data set in session');
});

// Route to display user profile
app.get('/profile', (req, res) => {
  if (!req.session.username) {
    return res.status(403).send('Please log in to view this page');
  }

  res.render('profile', { user: req.session.username });
});

app.get('/landmarks', (req, res) => {
  const mediaId = req.query.id;
  
  const query = `SELECT media FROM landmarks WHERE landmarkid = ?`;

  pool.query(query, [mediaId], (err, result) => {
    if (err) {
      console.error('Error fetching media from database:', err);
      res.status(500).send('Error fetching media from database');
      return;
    }

    if (!result.length) {
      res.status(404).send('Media not found');
      return;
    }

    const mediaData = result[0].media;

    if (!mediaData) {
      res.status(404).send('Media not found');
      return;
    }

    // 设置正确的响应头部
    res.set({
      'Content-Type': 'image/jpeg',
      'Content-Disposition': 'inline'
    });

    res.status(200).send(mediaData);
  });
});

app.post('/add-landmark', upload.single('media'), (req, res) => {
  console.log('Request body:', req.body);
  const { title, content, username, time, landmarkid, latitude, longitude, base64Image } = req.body;

  // 如果存在base64Image，将其转换为Buffer对象
  const mediaBuffer = base64Image ? Buffer.from(base64Image.split(',')[1], 'base64') : null;

  // 将地标信息存储在数据库中
  pool.query('INSERT INTO landmarks SET ?', { title, content, username, time, landmarkid, latitude, longitude, media: mediaBuffer }, (err, result) => {
    if (err) {
      console.log('[INSERT ERROR] - ', err.message);
      res.status(500).send('Error adding landmark to database');
      return;
    }
    console.log('Landmark added to database');
    res.status(200).send('Landmark added successfully');
  });
});

//获取评论并且加载到地图
function getCommentsForLandmark(landmarkId, callback) {
  pool.query('SELECT * FROM comments WHERE landmarkid = ? ORDER BY time DESC', [landmarkId], (err, results) => {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      callback(err, null);
    } else {
      callback(null, results);
    }
  });
}
app.get('/get-landmark', (req, res) => {
  pool.query('SELECT title, content, username, time, landmarkid, latitude, longitude, media AS mediaBuffer FROM landmarks ORDER BY landmarkid DESC', async (err, landmarks) => {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      res.status(500).send('Error retrieving landmarks from database');
      return;
    }
    const commentsForLandmarks = await Promise.all(
      landmarks.map(landmark => new Promise((resolve, reject) => {
        getCommentsForLandmark(landmark.landmarkid, (err, comments) => {
          if (err) {
            reject(err);
          } else {
            // Convert mediaBuffer to Base64 string
            const base64Image = landmark.mediaBuffer ? `data:image/jpeg;base64,${landmark.mediaBuffer.toString('base64')}` : null;

            // Do not include the media path in the response, include the landmark ID and base64Image instead
            resolve({ ...landmark, comments, landmarkId: landmark.landmarkid, base64Image });
          }
        });
      }))
    );

    res.status(200).json({ landmarks: commentsForLandmarks, maxLandmarkId: landmarks[0]?.landmarkid || 0 });
  });
});

app.get('/get-titles', (req, res) => {
  pool.query('SELECT title, latitude, longitude FROM landmarks', (err, results) => {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      res.status(500).send('Error retrieving titles from database');
      return;
    }

    res.status(200).json({ titles: results });
  });
});
app.delete('/delete-landmark/:landmarkId', async (req, res) => {
  const landmarkId = req.params.landmarkId;

  // 确保传入了 landmarkId
  if (!landmarkId) {
    res.status(400).send('Missing landmarkId');
    return;
  }

  try {
    // 删除 landmarks 表中对应的记录
    pool.query('DELETE FROM landmarks WHERE landmarkid = ?', [landmarkId]);

    // 删除 comments 表中对应的记录
    pool.query('DELETE FROM comments WHERE landmarkid = ?', [landmarkId]);

    // 删除 report 表中对应的记录
    pool.query('DELETE FROM report WHERE landmarkid = ?', [landmarkId]);

    res.status(200).send('Landmark deleted successfully');
  } catch (error) {
    console.error('Error deleting landmark:', error);
    res.status(500).send('Error deleting landmark');
  }
});
app.get('/update_user_info', function (req, res) {
  const { username, email, password } = req.query;

  // 检查新用户名是否已被其他用户使用
  pool.query('SELECT * FROM user WHERE username = ? AND email != ?', [username, email], function (err, result) {
    if (err) {
      console.log('[SELECT ERROR] - ', err.message);
      res.send('error');
      return;
    }

    if (result.length > 0) {
      // 用户名已被使用
      res.send('username_taken');
    } else {
      // 更新用户信息
      pool.query('UPDATE user SET username = ?, password = ? WHERE email = ?', [username, password, email], function (err, result) {
        if (err) {
          console.log('[UPDATE ERROR] - ', err.message);
          res.send('error');
          return;
        }

        // 更新成功
        res.send('success');
      });
    }
  });
});
app.get('/login', function (req, res) {
  const response = {
    "email": req.query.email,
    "password": req.query.password,
  };
  const selectSQL = "select email,password,username from user where email = '" + req.query.email + "' and password = '" + req.query.password + "'";
  const addSqlParams = [req.query.email, req.query.password];
  pool.query(selectSQL, function (err, result) {
    if (err) {
      console.log('[login ERROR] - ', err.message);
      return;
    }
    if (result === '') {
      console.log("账户或者密码错误!");
      res.send('<script>alert("------Email or Password Wrong!------");history.back();</script>');
    } else {
      console.log("Login successful！");
      req.session.username = result[0].username;
      req.session.email = result[0].email; // 将电子邮件设置为会话变量
      req.session.password = result[0].password; // 将密码设置为会话变量
      res.send('<script>window.location.href="loginhome";</script>');
    }
  });
  console.log(response);
});
app.get('/logout', function (req, res) {
  // 销毁 session
  req.session.destroy(function (err) {
    if (err) {
      console.log('[SESSION DESTROY ERROR] - ', err.message);
      res.status(500).send('Error occurred while logging out');
    } else {
      res.status(200).send('Logged out');
    }
  });
});
app.get('/login.html', function (req, res) {
  res.sendFile(__dirname + "/login.html");
});

const addSql = 'INSERT INTO user(email,password,username) VALUES(?,?,?)';
app.get('/process_get', function (req, res) {
  const addSqlParams = [req.query.email, req.query.password, req.query.username];
  const checkSql = "SELECT COUNT(*) AS count FROM user WHERE username = ? OR email = ?";
  pool.query(checkSql, [req.query.username, req.query.email], function (checkErr, checkResult) {
    if (checkErr) {
      console.log('[SELECT ERROR] - ', checkErr.message);
      res.send('<script>alert("------An error occurred while checking the existing user------");history.back();</script>');
      return;
    }

    if (checkResult[0].count > 0) {
      res.send('<script>alert("------Username or email already exists. Please choose a different one.------");history.back();</script>');
      return;
    }

    // If no existing username or email found, proceed with the registration
    pool.query(addSql, addSqlParams, function (err, result) {
      if (err) {
        console.log('[INSERT ERROR] - ', err.message);
        res.send('<script>alert("------Register fail------");history.back();</script>');
        return;
      }
      console.log("successful!");
      req.session.username = req.query.username;
      req.session.email = req.query.email;
      req.session.password = req.query.password; // 将密码设置为会话变量

      // Additional response for successful registration
      res.send('<script>alert("------Register successfully! Welcome!------"); window.location.href = "/loginhome";</script>');
    });
  });
});


pool.query('SELECT 1', (err, result) => {
  if (err) {
    console.log('Error connecting to database:', err);
  } else {
    console.log('---------Successfully connected to database---------');
  }
});

app.post('/add-comments', (req, res) => {
  
  if (!req.session.username) {
    res.status(403).send('User not logged in');
    return;
  }

  const username = req.session.username;
  
  const { content, time, landmarkid } = req.body;
  console.log('Received request:', req.body);
  const insertSql = 'INSERT INTO comments( username, content, time, landmarkid) VALUES(?, ?, ?, ?)';
  const insertSqlParams = [ username, content, time, landmarkid];

  pool.query(insertSql, insertSqlParams, (err, result) => {
    if (err) {
      console.error('Insert error:', err);
      res.status(500).send('Error adding comment to database');
      return;
    }

    console.log('Comment added to database');
    res.status(200).send('Comment added');
  });
});
app.get("/Userindex", function(req, res) {
  res.render("loginhome");
});
app.get('/loginhome', function (req, res) {
  if (!req.session.username) {
    res.redirect('loginhome.html');
  } else {
    res.render('loginhome', { user: { username: req.session.username, email: req.session.email, password: req.session.password } });
  }
});
// 上传图片并保存到数据库
app.post('/', upload.single('image'), async function (req, res) {
  if (!req.file) {
    res.status(400).send('请求错误，请上传文件');
    return;
  }

  const newPath = req.file.path;

  // 将文件读取为Base64字符串
  const fileBuffer = await fs.promises.readFile(newPath);
  const base64Image = fileBuffer.toString('base64');

  // 将Base64字符串保存到数据库
  pool.query(
    'INSERT INTO test (image) VALUES (?)',
    [base64Image],
    function (error, results, fields) {
      if (error) throw error;

      console.log('文件已保存到数据库');
      res.send('上传完成!');

      // 删除本地临时文件
      fs.unlink(newPath, (err) => {
        if (err) throw err;
        console.log('临时文件已删除');
      });
    }
  );
});


// 从数据库获取图片
app.get('/', function (req, res) {
  pool.query(
    'SELECT image FROM test ORDER BY id DESC',
    function (error, results, fields) {
      if (error) throw error;

      if (results.length > 0) {
        const images = results.map(result => {
          return {
            image: `data:image/jpeg;base64,${result.image}`
          };
        });
        res.json(images);
      } else {
        res.status(404).send('图片未找到');
      }
    }
  );
});
app.use(express.static(__dirname + '/public'));
// Contact Us 页面内容发送到数据库
app.post('/contact', (req, res) => {
  const {name, email, phone, message} = req.body;
  const query = `INSERT INTO contact (username, email, phone, message) VALUES (?, ?, ?, ?)`;

  pool.query(query, [name, email, phone, message], (err, result) => {
    if (err) {
      console.log(err);
      res.json({ success: false, message: 'An error occurred' });
    } else {
      res.json({ success: true, message: 'Message sent successfully' });
    }
  });
});


// //邮箱验证
// // 创建一个SMTP传输对象
// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: 'geohazardsystem@gmail.com',
//     pass: '123456789Qaz'
//   }
// });

// // 处理用户注册请求
// app.post('/register', (req, res) => {
//   // 生成验证链接，可以使用随机生成的token或者使用用户的唯一标识符作为参数
//   const verificationToken = generateVerificationToken();

//   // 发送验证邮件
//   const mailOptions = {
//     from: 'geohazardsystem@gmail.com',
//     to: req.body.email,
//     subject: 'Email Verification',
//     text: `Click the following link to verify your email: http://your_website.com/verify?token=${verificationToken}`
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log('Error sending verification email:', error);
//       res.status(500).send('Failed to send verification email');
//     } else {
//       console.log('Verification email sent:', info.response);
//       res.status(200).send('Verification email sent');
//     }
//   });
// });
// // Function to generate a random verification token
// function generateVerificationToken() {
//   const length = 32; // Length of the generated token
//   const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Characters pool for the token
//   let token = '';

//   for (let i = 0; i < length; i++) {
//     const randomIndex = Math.floor(Math.random() * characters.length);
//     token += characters[randomIndex];
//   }

//   return token;
// }

// // 处理邮箱验证请求
// app.get('/verify', (req, res) => {
//   // 验证成功，完成用户注册流程
//   // ...

//   res.send('Email verified successfully');
// });

app.listen(3000, function () {
    console.log(`Server listening at http://127.0.0.1:${port}`);
});