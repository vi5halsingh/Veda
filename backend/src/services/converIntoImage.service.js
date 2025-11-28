const { GoogleGenAI } = require("@google/genai");

const fs = require("fs");

async function convertIntoImage(ImageUrl){
    const base64Image = fs.readFileSync(ImageUrl , {encoding: "base64"})
    return base64Image;
}
 module.exports = {convertIntoImage}