const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const { Document, Packer, Paragraph, TextRun } = require('docx');
const env = require('dotenv').config()
const Report = require('/IS/public/pages/report_schema');
const Report2 = require('/IS/public/pages/nestedForm_schema');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('/IS/public/pages/User.js');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const uri = process.env.URI
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
let collection;
const multer = require('multer');
const ImageModule = require('docxtemplater-image-module');

const store = MongoStore.create({
  mongoUrl: uri,
  collectionName: 'sessions' // Specify the collection name
});

function imageReplacer(tagValue) {
  return fs.readFileSync(path.resolve(__dirname, 'public/uploads', tagValue));
}


app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/IS/public/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(session({ 
  secret: process.env.SECRET_KEY,
  cookie: { secure: false }, 
  resave: false,
  store: store,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


const sessionTracker = new Map();

// Middleware to track sessions
app.use((req, res, next) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    const sessionId = req.sessionID;
    // Retrieve the user from the database using the ID stored in the session
    User.findById(req.session.passport.user)
      .then(user => {
        if (user) {
          sessionTracker.set(sessionId, user.username); // Store the username
        } else {
          sessionTracker.delete(sessionId); // Remove session if user not found
        }
        next();
      })
      .catch(err => {
        console.error('Error retrieving user:', err);
        next();
      });
  } else {
    next();
  }
});

// API to get active sessions
app.get('/sessions', (req, res) => {
  res.json([...sessionTracker.entries()].map(([id, username]) => ({
    id,
    username
  })));
});

function ensureAuthenticated(req, res, next) {
  console.log('User:', req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/IS/public/uploads/'); // Specify the folder to save uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append a timestamp to avoid file name conflicts
  }
});

const upload = multer({ storage: storage });

// Middleware to handle file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('File received:', req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const caseId = req.body.caseId; // Extract caseId from the request body
    console.log(req.body.caseId)

    const filePath = req.file.filename; // Use filename instead of full path

    const updatedReport = await Report.findOneAndUpdate(
      { caseId: caseId },
      { $push: { files: filePath } },
      { new: true } // Return the updated document
    );

    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'File uploaded and saved successfully', file: filePath });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});


app.get('/edit/:id', async (req, res) => {
  const caseId = req.params.id;

  try {
    const caseData = await Report.findOne({ caseId: caseId });
    res.json(caseData); // Send case data, including file paths
  } catch (error) {
    res.status(500).send('Error fetching case data');
  }
});

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username }).exec();
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // Assuming `verifyPassword` returns a promise
      const isMatch = await user.verifyPassword(password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id).exec();
    if (user) {
      // Attach the entire user object to req.user, including username
      done(null, { id: user.id, username: user.username });
    } else {
      done(new Error('User not found'), null);
    }
  } catch (err) {
    done(err, null);
  }
});




function formatDate(date) {
  if (!date) return null;
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(date).toLocaleDateString('en-US', options);
}


mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));



app.use(express.static(path.join(__dirname, 'public')));

// app.get('/records/:id', async (req, res) => {
//   const report = await Report.findById(req.params.id);
//   const formattedDate = formatDate(report.updatedAt); // Format the date here
//   res.json({ ...report.toObject(), updatedAt: formattedDate });
// });

app.get('/records/:caseId', async (req, res) => {
  const caseId = req.params.caseId;

  // Validate the caseId if it's expected to be a number or a specific format
  if (isNaN(caseId)) {
      return res.status(400).json({ error: 'Invalid caseId format' });
  }

  try {
      const record = await Report.findOne({ caseId: caseId });
      if (!record) {
          return res.status(404).json({ error: 'Record not found' });
      }

      // Format the dates
      const formattedUpdatedAt = formatDate(record.updatedAt);
      const formattedFollow = formatFollowDate(record.follow);

      res.json({
        ...record.toObject(),
        updatedAt: formattedUpdatedAt,
        follow: formattedFollow
      });
  } catch (error) {
      console.error('Error fetching record:', error);
      res.status(500).json({ error: 'Server error' });
  }
});


app.delete('/records/:id', async (req, res) => {
  try {
    const result = await Report.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send('Record not found');
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});
app.delete('/nest/records/:id', async (req, res) => {
  try {
    const result = await Report2.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).send('Record not found');
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.put('/records/:id/toggle-active', async (req, res) => {
  try {
    const record = await Report.findById(req.params.id);
    if (!record) {
      return res.status(404).send('Record not found');
    }

    // Toggle the isActive field
    record.isActive = !record.isActive;
    await record.save();

    res.json({ success: true, isActive: record.isActive });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/generate-docx', (req, res) => {
  const { Title, TTPSHere, recommendationsHere, iocsHere, imgs, SourceHere, SourceIpHere, DestIP, DescriptionHere, UserHere, CreatedAtHere } = req.body;

  const content = fs.readFileSync(path.resolve(__dirname, 'Templete.docx'), 'binary');
  const zip = new PizZip(content);

  // Initialize an object to store image data
  const images = {};
  imgs.forEach((imgPath, index) => {
      try {
          const resolvedPath = path.isAbsolute(imgPath) ? imgPath : path.resolve(__dirname, imgPath);
          const imgData = fs.readFileSync(resolvedPath);
          images[`image${index + 1}`] = imgData;
          console.log(`Loaded image${index + 1}: ${resolvedPath}`);
      } catch (err) {
          console.error(`Error loading image: ${imgPath}`, err);
      }
  });

  // Define image options for Docxtemplater
  const imageOptions = {
      centered: true,
      getImage: function(tagValue) {
          console.log(`Retrieving image for tag: ${tagValue}`);
          return images[tagValue];
      },
      getSize: function(img, tagValue) {
          return [150, 150];  // Adjust size if needed
      }
  };

  const imageModule = new ImageModule(imageOptions);

  const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
  });

  const renderData = {
      Title,
      SourceHere,
      UserHere,
      CreatedAtHere,
      DescriptionHere,
      DestIP,
      SourceIpHere,
      iocsHere,
      TTPSHere,
      recommendationsHere,
      imgs,
  };

  // Map image paths to placeholders

  try {
      doc.render(renderData);
  } catch (err) {
      console.error('Error rendering the document:', err);
      return res.status(500).send(`Error generating document: ${err.message}`);
  }

  const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
  });

  res.setHeader('Content-Disposition', 'attachment; filename=output.docx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.send(buf);
});






store.on('error', function(error) {
  console.error('Session store error:', error);
});

app.get('/records', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;  // Default to page 1
  const limit = parseInt(req.query.limit, 10) || 10;  // Default to 10 records per page

  try {
    const records = await Report.find({})
      .sort({ caseId: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalRecords = await Report.countDocuments();

    // Format the date for each record
    const formattedRecords = records.map(record => ({
      ...record.toObject(),
      updatedAt: formatDate(record.updatedAt) // Ensure record has `createdAt`
    }));

    res.json({
      records: formattedRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Debugging sessionTracker
app.get('/debug-sessions', (req, res) => {
  console.log([...sessionTracker.entries()]); // Log the session tracker to check its contents
  res.send('Check server logs for session tracker contents');
});


app.get('/api/records/:id', async (req, res) => {
  try {
      const caseId = req.params.id;
      const record = await Report.findOne({ caseId: parseInt(caseId, 10) });
      if (!record) {
          return res.status(404).json({ error: 'Record not found' });
      }
      res.json(record); // Send the record data including file path
  } catch (error) {
      console.error('Error fetching record:', error);
      res.status(500).json({ error: 'Failed to fetch record' });
  }
});

app.get('/nest/api/records/:id', async (req, res) => {
  try {
      const caseId = req.params.id;
      const record = await Report2.findOne({ reportId: parseInt(caseId, 10) });
      if (!record) {
          return res.status(404).json({ error: 'Record not found' });
      }
      res.json(record); // Send the record data including file path
  } catch (error) {
      console.error('Error fetching record:', error);
      res.status(500).json({ error: 'Failed to fetch record' });
  }
});


app.get('/nest/records/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const records = await Report2.find({ caseId })
      .sort({ reportId: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalRecords = await Report2.countDocuments({ caseId });

    res.json({
      records,
      currentPage: page,
      totalPages: Math.ceil(totalRecords / limit),
    });
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).send('Server Error');
  }
});



app.put('/api/records/:id', upload.array('file'), async (req, res) => {
  try {
      const caseId = req.params.id;
      const record = await Report.findOne({ caseId: parseInt(caseId, 10) });
      console.log(`Searching for report with caseId: ${caseId}`); // Debugging log

      if (!record) {
          console.log(`No record found for caseId: ${caseId}`); // Additional log if not found
          return res.status(404).json({ error: 'Record not found' });
      }

      // Ensure arrays are properly assigned
      record.title = req.body.title;
      record.description = req.body.description;
      record.alertPolicy = JSON.parse(req.body.alertPolicy || '[]'); // Parse JSON arrays
      record.toolsUsed = JSON.parse(req.body.toolsUsed || '[]'); // Parse JSON arrays
      record.analysis = req.body.analysis;
      record.sourceIntel = req.body.sourceIntel;
      record.reportNum = req.body.reportNum;
      record.letterNum = req.body.letterNum;
      record.iocType = JSON.parse(req.body.iocType || '[]'); // Parse JSON arrays
      record.iocs = JSON.parse(req.body.ioc || '[]'); // Parse JSON arrays
      record.recommendations = req.body.recommendations;
      record.destinationIPs = JSON.parse(req.body.destinationIPs || '[]'); // Parse JSON arrays
      record.sourceIPs = JSON.parse(req.body.sourceIPs || '[]'); // Parse JSON arrays
      record.ttps = JSON.parse(req.body.ttps || '[]'); // Parse JSON arrays
      record.isActive = req.body.isActive === 'true'; // Convert to boolean


      // Handle multiple files
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => `/IS/public/uploads/${file.filename}`);
        record.files = filePaths; // Store array of file paths
    }

      // Save the updated record back to the database
      await record.save();
      console.log(req.body);
      res.json(record); // Send the updated record back to the client
  } catch (error) {
      console.error('Error updating record:', error);
      res.status(500).json({ error: 'Failed to update record' });
  }
});

app.put('/nest/api/records/:id', upload.array('file'), async (req, res) => {
  try {
      const caseId = req.params.id;
      const record = await Report2.findOne({ reportId: parseInt(caseId, 10) });
      console.log(`Searching for report with caseId: ${caseId}`); // Debugging log

      if (!record) {
          console.log(`No record found for caseId: ${caseId}`); // Additional log if not found
          return res.status(404).json({ error: 'Record not found' });
      }

      // Ensure arrays are properly assigned
      record.alertPolicy = JSON.parse(req.body.alertPolicy || '[]'); // Parse JSON arrays
      record.toolsUsed = JSON.parse(req.body.toolsUsed || '[]'); // Parse JSON arrays
      record.analysis = req.body.analysis;
      record.sourceIntel = req.body.sourceIntel;
      record.reportNum = req.body.reportNum;
      record.letterNum = req.body.letterNum;
      record.iocType = JSON.parse(req.body.iocType || '[]'); // Parse JSON arrays
      record.iocs = JSON.parse(req.body.ioc || '[]'); // Parse JSON arrays
      record.recommendations = req.body.recommendations;
      record.destinationIPs = JSON.parse(req.body.destinationIPs || '[]'); // Parse JSON arrays
      record.sourceIPs = JSON.parse(req.body.sourceIPs || '[]'); // Parse JSON arrays
      record.ttps = JSON.parse(req.body.ttps || '[]'); // Parse JSON arrays
      record.isActive = req.body.isActive === 'true'; // Convert to boolean


      // Handle multiple files
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => `/IS/public/uploads/${file.filename}`);
        record.files = filePaths; // Store array of file paths
    }

      // Save the updated record back to the database
      await record.save();
      console.log(req.body);
      res.json(record); // Send the updated record back to the client
  } catch (error) {
      console.error('Error updating record:', error);
      res.status(500).json({ error: 'Failed to update record' });
  }
});

app.get('/view', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'view.html'));
})

app.get('/viewReport', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'viewReport.html'));
})

app.get('/edit', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'edit.html'));
})
app.get('/editReport', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'editReport.html'));
})


app.get('/success_edit', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'success_edit.html'));
})

app.get('/', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html',));
})

app.get('/form', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'form.html'));
})
app.get('/users', async (req, res) => {
  try {
      const users = await User.find({}, 'username'); // Fetch users and only return the username field
      res.json(users);
  } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/form', async (req, res) => {
  try {
      console.log('Received Form Data:', req.body);
      console.log('User:', req.session.name);
      const formData = req.body;
      const report = new Report({
          caseId: formData.caseId,  // Ensure caseId is a string
          title: formData.title,  // Ensure title is a string
          description: formData.description,  // Ensure description is a string
          toolsUsed: formData.toolsUsed,  // Split or default to an empty array
          alertPolicy: formData.alertPolicy,  // Split or default to an empty array
          sourceIntel: formData.sourceIntel,  // Ensure sourceIntel is a string
          reportNum: formData.reportNum,  // Ensure reportNum is a string
          letterNum: formData.letterNum,  // Ensure letterNum is a string
          User: formData.User,
          analysis: formData.analysis,  // Ensure analysis is a string
          destinationIPs: formData.destinationIPs,  // Split or default to an empty array
          sourceIPs: formData.sourceIPs,  // Split or default to an empty array
          iocType: formData.iocType,
          iocs: formData.iocs,  // Split or default to an empty array
          recommendations: formData.recommendations,  // Ensure recommendations is a string
          isActive: formData.inlineRadioOptions === 'True',
          ttps: formData.ttps,  // Split or default to an empty array
          fileType: formData.fileType, // Ensure fileType is a string
          //file: formData.file  // Convert file to Buffer if present
          follow: formData.follow, 
          User: req.user.username,

        

      });
      if (req.files && req.files.length > 0) {
        const filePaths = req.files.map(file => `/IS/public/uploads/${file.filename}`);
        report.files = filePaths; // Store array of file paths
    }

      await report.save();

      res.status(200).sendFile(path.join(__dirname, "public/pages/success.html"));
  } catch (error) {
      console.error('Error saving form data:', error);
      res.status(500).json({ message: 'Error saving form data', error });
  }
});

app.get('/reportsForm/:id', async (req, res) => {
  
  const caseId = req.params.id;

  try {
    const caseData = await Report.findOne({ caseId: caseId });
    res.json(caseData); // Send case data, including file paths
  } catch (error) {
    res.status(500).send('Error fetching case data');
  }
});

app.get('/reportsForm', async (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages','reportsForm.html'));
})

app.post('/reportsForm/:id', async (req, res) => {
  try {
      console.log('Received Form Data:', req.body);
      const caseId = req.params.id; 
      const formData = req.body;
      const report = new Report2({
          caseId: caseId,  // Ensure caseId is a string
          title: formData.title,  // Ensure title is a string
          description: formData.description,  // Ensure description is a string
          toolsUsed: formData.toolsUsed,  // Split or default to an empty array
          alertPolicy: formData.alertPolicy,  // Split or default to an empty array
          sourceIntel: formData.sourceIntel,  // Ensure sourceIntel is a string
          reportNum: formData.reportNum,  // Ensure reportNum is a string
          letterNum: formData.letterNum,  // Ensure letterNum is a string
          User: formData.User,
          analysis: formData.analysis,  // Ensure analysis is a string
          destinationIPs: formData.destinationIPs,  // Split or default to an empty array
          sourceIPs: formData.sourceIPs,  // Split or default to an empty array
          iocType: formData.iocType,
          iocs: formData.iocs,  // Split or default to an empty array
          recommendations: formData.recommendations,  // Ensure recommendations is a string
          isActive: formData.inlineRadioOptions === 'True',
          ttps: formData.ttps,  // Split or default to an empty array
          fileType: formData.fileType, // Ensure fileType is a string
          //file: formData.file  // Convert file to Buffer if present
          User: req.user.username,
      });

      await report.save();

      res.status(200).sendFile(path.join(__dirname, "public/pages/success.html"));
  } catch (error) {
      console.error('Error saving form data:', error);
      res.status(500).json({ message: 'Error saving form data', error });
  }
});

app.get('/Dashboard', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'Dashboard.html'));
})

app.get('/View', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'View.html'));
})
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/pages', 'Login.html'));
})
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
      const newUser = new User({ username, password });
      await newUser.save();
      res.redirect('/dashboard'); // Redirect to a different page after successful registration
  } catch (err) {
      console.error('Error registering user:', err);
      res.redirect('/register'); // Redirect back to the registration page on failure
  }
});

// Login route
app.post('/login', (req, res, next) => {

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Authentication Error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication Failed:', info.message);
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login Error:', err);
        return next(err);
      }
      console.log('Authentication Successful, redirecting to /');
      return res.redirect('/');
    });
  })(req, res, next);
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.listen(8085, () => {
    console.log(`Server is running on http://localhost:8085`);
  });