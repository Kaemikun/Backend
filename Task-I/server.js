express = require('express');
fs = require('fs');
app = express();
app.use('/',(req,res,next)=>{
    
    let now = new Date();
let hours = now.getHours();
let minutes = now.getMinutes();
let seconds = now.getSeconds();
let url = req.url;
let method = req.method;
let ip = req.ip;
let proto = req.protocol;
let host = req.get('host');

    fs.appendFile('test.txt',`Login generated at Current Time: ${hours}:${minutes}:${seconds} \nrequest method: ${method}, request url: ${url}, request ip: ${ip} \n HTTP Protocol: ${proto}  HostName: ${host} \n`,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            res.send("File Created Successfully");
        }
    })
})

app.listen(3000,()=>{
    console.log("Server is running at port 3000");
})