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
        if(!req.files.avatar) {
            
            res.status(201).send({
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded files
            let avatar = req.files.avatar;
            //let img = req.files.floor;


            var matches = req.body.base64image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            response = {};
             
            if (matches.length !== 3) {
            return new Error('Invalid input string');
            }
            console.log(Date.now());
            response.type = matches[1];
            response.data = new Buffer(matches[2], 'base64');
            let decodedImg = response;
            let imageBuffer = decodedImg.data;
            let type = decodedImg.type;
            let extension = mime.extension(type);
            let fileName = 'image'+Date.now()+'.'+extension;
            try {
            fs.writeFileSync("./images/" + fileName, imageBuffer, 'utf8');
            } catch (e) {
            next(e);
            }
        
            

            //let buff = avatar.data;
            //buff.toString('utf-8')
            let val=true;
            let path="";
            //console.log(typeof(req.files.avatar));
            temp = req.files.avatar.data.toString('utf-8')
            //console.log(temp)
            //console.log(avatar.name);
            try {
                await fs.writeFileSync(__dirname+'/uploads/'+avatar.name, temp)
                path = __dirname+"/uploads/"+avatar.name;
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
                console.log('ChildPython process exited with code : '+code);
            });

            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            avatar.mv(__dirname+'/uploads/' + avatar.name);
            
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
            
            
            /*var fileName = './signal_strength.png';
            /*res.sendFile(fileName, options, function(err){
            if (err) {
                next(err);
            } else {
                console.log('Sent:', fileName);
            }
        });
        */
            await delay(7000);
            fs.readFile(__dirname+"/signal_strength.png", function (err, data) {
                if (err) throw err;
                fs.writeFile(__dirname+'/Heatmaps/image'+Date.now()+'.png', data, function (err) {
                    if (err) throw err;
                    console.log('It\'s saved!');
                });
            });
        
            res.sendFile(__dirname+"/signal_strength.png")
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