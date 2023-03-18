import Jwt from 'jsonwebtoken'

 export const auth = (request,response,next) =>{

    try{
        const token = request.header("x-auth-token")
        console.log(token);
        Jwt.verify(token,process.env.secretekey)
        next();
    }
    catch(err){
        response.status(401).send({"message":`${err.message} Something Went Wrong`})
    }

}