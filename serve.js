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
        //if(!req.body.base64image && !req.files){
        //    console.log('No i/p');
        //    res.status(404).send( 'No input found');
        //}
        //else if(!req.files) {
            if(!req.files) {
            console.log('No txt file');
            res.status(400).end( 'No txt file uploaded');
        }
        //else if(!req.body.base64image){
        //    console.log('No image');
        //    res.status(400).end( 'No image uploaded!');
        //}
         else {
            //Use the name of the input field (i.e. "txtFile") to retrieve the uploaded files
            let txtFile = req.files.txtFile;
            let img = req.files.base64image;
            console.log(1);
            //var matches = req.body.base64image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
            //response = {};
            // 
            //if (matches.length !== 3) {
            //return new Error('Invalid input string');
            //}
            //response.type = matches[1];
            //response.data = new Buffer(matches[2], 'base64');
            //let decodedImg = response;
            //let imageBuffer = decodedImg.data;
            //console.log(imageBuffer)
            //let type = decodedImg.type;
            //let extension = mime.extension(type);
            //let fileName = 'image'+Date.now()+'.'+extension;
            //try {
            //fs.writeFileSync("./images/" + fileName, imageBuffer, 'utf8');
            //} catch (e) {
            //next(e);
            //}
            //console.log(req.body);
            //console.log(req.body.base64image);
            //let b64 = req.body.base64image.split(" ").join("");
            //console.log(b64);
            //let imageBuffer = new Buffer(b64, 'base64');
//
            //let fileName = 'image'+Date.now()+'.jpeg';
            //try {
            //fs.writeFileSync('./images/' + fileName, imageBuffer, 'utf8');
            //} catch (e) {
            //next(e);
            //}
            console.log(img.name);
            img.mv('./images/' + img.name);
            
            let path="";
            temp = req.files.txtFile.data.toString('utf-8');
            console.log(temp);
            console.log(3);
            try {
                await fs.writeFileSync(__dirname+'/uploads/'+txtFile.name, temp);
                path = __dirname+"/uploads/"+txtFile.name;
              } catch (err) {
                console.log(err);
              }
              console.log(4);
            const childPython = spawn('python', ['./conv.py',path]);
            childPython.stdout.on('data', (data)=>{
                console.log('stdout ::'+data);
            });
            
            childPython.stderr.on('err', (data)=>{
                console.log('stderr Chpython : '+data);
            });
            childPython.stdout.on('close', (code)=>{
                console.log(`ChildPython process exited with code : ${code}`);
            });
            
            //Use the mv() method to place the file in upload directory (i.e. "uploads")
            txtFile.mv(__dirname+'/uploads/' + txtFile.name);
            
            let TEST_CONFIG_JSON = "config.json";
            const childPythen = spawn('python', ['./main.py',img.name,TEST_CONFIG_JSON]);
            
            childPythen.stdout.on('data', (data)=>{
                console.log('stdout :: '+data);
            });
            childPythen.stderr.on('error', (data)=>{
                console.log('stderr chPythen:: '+data);
            });
            childPythen.stdout.on('close', (code)=>{
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
            await delay(5000);
            fs.readFile(__dirname+"/signal_strength.png", function (err, data) {
                if (err) throw err;
                fs.writeFile(__dirname+'/Heatmaps/image'+Date.now()+'.jpeg', data, function (err) {
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
const port = process.env.PORT || 3010;
app.listen(port, () => 
  console.log(`App is listening on port ${port}.`)
);