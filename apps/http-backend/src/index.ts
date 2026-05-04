import express = require("express");
import cors from 'cors';
const app = express()
app.use(cors())
app.use(express.json())
app.get("/problems" , (req, res) => {
    // get all the problems
})
app.post("/submission" , (req, res) => {
    // get the submitted code, language, problem code\
    //return a submission id which will be used to get the status 
})
app.get("/submisionStatus", (req,res)=> {
    // get the status of the submission
})
app.listen(3000)