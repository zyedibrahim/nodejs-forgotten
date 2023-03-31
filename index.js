import express from "express"; // "type": "module"
const app = express();
import shortid from "shortid";
import nodemailer from "nodemailer"
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt"
import {auth} from './middleware/./auth.js'
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import Jwt from 'jsonwebtoken';
import cors from "cors"
app.use(cors());
// import {client} from 'mongodb'

app.use(express.json())

// const MONGO_URL = "mongodb://127.0.0.1";
const MONGO_URL = process.env.MONGO_URL;

const client = new MongoClient(MONGO_URL); // dial
// Top level await
await client.connect(); // call
console.log("Mongo is connected !!!  ");


const PORT = process.env.PORT




// password encrypted 
async function generateHashedPassword(password){

  const No_of_rounds = 10;
  const salt = await bcrypt.genSalt(No_of_rounds);
  const hashedpassword = await bcrypt.hash(password,salt)
  console.log(salt);
  console.log(hashedpassword);
  return hashedpassword;
}


app.delete("/users", async function (request, response) {
  const getusername = await client
  .db('userdata')
  .collection('userdetails')
  .deleteMany({})

response.send(getusername)


});
app.get("/", async function (request, response) {
  response.send("🙋‍♂️, 🌏 🎊✨🤩");
});

//  create user
app.post("/users/signup",  async function  (request, response) {
  
const {username,password,email} = request.body;

const hashedpassword = await generateHashedPassword(password)


const getusername = await client
.db('userdata')
.collection('userdetails')
.findOne({username:username})


const getemail = await client
.db('userdata')
.collection('userdetails')
.findOne({email:email})


if(getusername){

  response.send({"message": "user name already exists"})
}
else if(password.length < 8 ){
response.send({"message": "password must be at least 8 characters"})
}
else if(getemail){
response.send({"message": "This email already exists"})
}

else{
  const result = {
    username:username,
    password:hashedpassword,
    email:email
  } 
  const data = await client
.db('userdata')
.collection('userdetails')
.insertOne(result)

response.status(200).send({"message":"succefully created",data} )



// const secret = process.env.secretekey
// const token= Jwt.sign({_id:data.insertedId},secret,{
//   expiresIn:"5m"

// })
// const activationslinks = `http://localhost:5173/users/activation?id=${data.insertedId}&token=${token}`
// console.log(activationslinks) 


//   // create reusable transporter object using the default SMTP transport
//   let transporter = nodemailer.createTransport({
  
//     service:"gmail",
//      auth: {
//        user: "syed0333800@gmail.com", // generated ethereal user
//        pass: process.env.GPASS, // generated ethereal password
//      },
//    });
 
//  var mailoption ={
//    from: 'Unknow Co LTD PVT', // sender address
//    to: email, // list of receivers
//    subject: "Activation Link✔", // Subject line
//    text: activationslinks,
//  }
 
 
//    // send mail with defined transport object
//    transporter.sendMail(mailoption, function (err,info){
//  if(err){
//    console.log(err);
//  }
//  else{
//    console.log("email sent",info.response);
//  }
 
 
 
//    })






}



});

//  activations
// app.post("/users/activation",auth, async function (request, response) {



// const {id,token} =request.query

// try{
//   const activate = await client
//   .db('userdata')
//   .collection('userdetails')
//   .updateOne({_id: new ObjectId(id)} ,{$set:{Verified:"true"}} )
  
//   // .updateOne({ _id: new ObjectId(id) }, { $set: {password:encryptpassword,random:""} });
  
//   response.status(200).send({"message":"succcessfully Activated",activate })
//   console.log(activate);
// }  
// catch(err){
//   response.status(401).send({"message":"Something Went Wrong"})

// }





// });


// get all user
app.get("/users",async function  (request, response) {
  
const data = await client
.db('userdata')
.collection('userdetails')
.find({})
.toArray()

response.send(data)
console.log(data);

});

// login
app.post("/users/login",    async function  (request, response) {
  
  const {username,password} = request.body;

const userfromdb = await client
.db('userdata')
.collection('userdetails')
.findOne({username:username})


if(!userfromdb ){

  response.send({"message": "invalid userdata"})
}
// else if(userfromdb.Verified !== "true" ){

//   response.status(401).send({"message": "Account not Activated Activate Link Sent on Register Email "})
// }

else{
  

  const storedpassword = userfromdb.password
  console.log(storedpassword);
const isppasswordcheck = await bcrypt.compare(password,storedpassword)

 

  if(isppasswordcheck === true){
    const token = Jwt.sign({id:userfromdb._id},process.env.secretekey )
    response.send({"message": "login success",token:token})
  }
  else{
    response.send({"message": "invalid userdata"})
    
  }

}

  
  });



// create link to send email

app.post("/users/forgot-password", async function  (request, response) {
  
  const {email} = request.body;

const olduser = await client
.db('userdata')
.collection('userdetails')
.findOne({email:email})

 

try{
if(!olduser){

return response.status(401).send({"message": "email not found"})
}

// program to generate random strings

// declare all characters
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateString(length) {
    let result = '';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result+=characters.charAt(Math.floor(Math.random()*charactersLength));
    }

    return result;
}

const randomstring=generateString(5)


const randomstringsend = await client
.db('userdata')
.collection('userdetails')
.updateOne({email:email},{$set:{random:randomstring}})



const secret = process.env.secretekey+olduser.password
console.log("random :", randomstring);
const token= Jwt.sign({email:olduser.email,id:olduser._id},secret,{
  expiresIn:"5m"

})
const links = `http://localhost:5173/users/reset-password?id=${olduser._id}&token=${token}&random=${randomstring}`
// console.log(links) 


  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
  
   service:"gmail",
    auth: {
      user: "syed0333800@gmail.com", // generated ethereal user
      pass: process.env.GPASS, // generated ethereal password
    },
  });

var mailoption ={
  from: 'syed0333800@gmail.com', // sender address
  to: email, // list of receivers
  subject: "reset password✔", // Subject line
  text: links,
}


  // send mail with defined transport object
  transporter.sendMail(mailoption, function (err,info){
if(err){
  console.log(err);
}
else{
  console.log("email sent",info.response);
}



  })
  response.send(randomstringsend)
  
}
  catch(err){

  }


  
  });


 







app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));