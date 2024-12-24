const http = require("http");
const fs = require("fs");
const qs = require("querystring");
const server = http.createServer((req, res) => {
    let { method } = req;

    if (method == "GET") {
    
        if (req.url === "/") {
            console.log("inside / route and Get rquest");
            fs.readFile("User.json", "utf8", (err, data) => {
                if (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.end("Server Error");
                } else {
                    console.log(data);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(data);
                }
            });
           
        } else if (req.url == "/allstudent") {
            fs.readFile("allstudent.html", "utf8", (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end("Server Error");
                } else {
                    console.log("sending allstudent.html file");
                    res.end(data);
                }
            });
        } else if (req.url === "/register") {
            fs.readFile("register.html", "utf8", (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end("Server Error");
                } else {
                    console.log("sending register.html file");
                    res.end(data);
                }
            });
        } else{
           
            console.log(req.url);  
            res.writeHead(404);
            res.end("Not Found");
        }
    }




      
    else {
        if (req.url === "/register") {
            console.log("inside /register route and post request");
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
               
            });
            req.on("end", () => {
                let readdata = fs.readFileSync("User.json", "utf-8"); 
                console.log(readdata);

                if (!readdata) {  
                    fs.writeFileSync("User.json", JSON.stringify([]));
                }
                else {      
                    let jsonData = JSON.parse(readdata);
                    let users = [...jsonData];
                    console.log(users);

                    let convertedbody = qs.decode(body);
                    users.push(convertedbody);
                    console.log(convertedbody);
                    fs.writeFile("User.json", JSON.stringify(users), (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("userdata inserted succefuly");
                        }
                    });

                }

                res.writeHead(200, { "Content-Type": "text/html" });
               
                fs.readFile("submission.html", "utf8", (err, data) => {
                    if (err) {
                        res.writeHead(500);
                        res.end("Server Error");
                    } else {
                        console.log("sending register.html file");
                        res.end(data);
                    }
            });
            });
        }
        else {
            res.writeHead(404);
            res.end("Not Found in post request");
        }

    }
});

server.listen(3000,() => {
    console.log("Server listening on port 3000");
});
