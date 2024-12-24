const http = require("http");
const fs = require("fs");
const qs = require("querystring");
const server = http.createServer((req, res) => {
    let { method } = req;

    if (method == "GET") {
        //get request handling
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
            //   res.end("welcome to home route");
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
            //error handlings
            console.log(req.url);  
            res.writeHead(404);
            res.end("Not Found");
        }
    }




        // post method handling and // Store the user data in a file 
    else {
        if (req.url === "/register") {
            console.log("inside /register route and post request");
            let body = "";
            req.on("data", (chunk) => {
                body += chunk.toString();
                //  console.log(chunk);
            });
            req.on("end", () => {
                let readdata = fs.readFileSync("User.json", "utf-8"); //data stored in string type
                console.log(readdata);

                if (!readdata) {  // if file is empty add an empty array
                    fs.writeFileSync("User.json", JSON.stringify([]));
                }
                else {      //if file have already some data
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
                res.end("Registration successful!");
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
