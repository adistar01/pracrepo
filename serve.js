const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const { spawn } = require('child_process');
const fs = require('fs')
const mime = require('mime')

const app = express();
//const router = express.Router();

function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
    },
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));
//app.use(express.static('images'));

app.get('/', (req, res) => {
    res.sendFile(__dirname+"/index.html");
  })

app.get('/acc', (req, res, next) => {
    res.sendFile(__dirname+"/access.html");
  });


function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  } 


// upoad single file
app.post('/generate-heatmap', async(req, res) => {
    try {
        if(!req.body.base64image && !req.files){
            res.status(404).send( 'No input found');
        }
        else if(!req.files) {
            res.status(400).end( 'No txt file uploaded');
        }
        else if(!req.body.base64image){
            res.status(400).end( 'No image uploaded!');
        } else {
            //Use the name of the input field (i.e. "txtFile") to retrieve the uploaded files
            let txtFile = req.files.txtFile;
            var imageAsBase64 = req.body.base64image;
            var fileName = 'image'+Date.now()+'.png';
            try {
            fs.writeFileSync("./images/" + fileName, imageAsBase64, 'utf8');
            } catch (e) {
            next(e);
            }
            let val=true;
            let path="";
            temp = req.files.txtFile.data.toString('utf-8');
            try {
                await fs.writeFileSync(__dirname+'/uploads/'+txtFile.name, temp)
                path = __dirname+"/uploads/"+txtFile.name;
              } catch (err) {
                console.log(err);
              }
            const childPython = spawn('python', ['./conv.py',path]);
            childPython.stdout.on('data', (data)=>{
                console.log('stdout ::'+data);
            });
            
            childPython.stderr.on('err', (data)=>{
                console.log('stderr Chpython : '+data);
            });



            childPython.stdout.on('close', (code)=>{
                console.log('ChildPython process exited with code : ${code} ');
            });

            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            txtFile.mv(__dirname+'/uploads/' + txtFile.name);
            
            let TEST_CONFIG_JSON = "config.json";

            const childPythen = spawn('python', ['main.py',fileName,TEST_CONFIG_JSON]);
            
            childPythen.stdout.on('data', (data)=>{
                console.log('stdout :: '+data);
            });
            childPythen.stderr.on('error', (data)=>{
                console.log('stderr chPythen:: '+data);
            });
            childPythen.stdout.on('close', (code)=>{
                console.log();
                console.log('ChildPythen process exited with code : '+code);
            });
        
            await delay(7000);
            fs.readFile(__dirname+"/signal_strength.png", function (err, data) {
                if (err) throw err;
                fs.writeFile(__dirname+'/Heatmaps/image'+Date.now()+'.png', data, function (err) {
                    if (err) throw err;
                    console.log('It\'s saved!');
                });
            });

            var imageAsBase64 = fs.readFileSync('./signal_strength.png', 'base64');
            res.end(imageAsBase64);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/get_heatmap',(req,res)=>{
    res.sendFile(__dirname+"/signal_strength.png");
})

//make uploads directory static
app.use(express.static('uploads'));
app.use(express.static('images'));





//start app 
const port = process.env.PORT || 3002;

app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);