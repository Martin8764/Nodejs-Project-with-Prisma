const ejs = require('ejs');
const session = require("express-session");
const express = require("express");
const bodyParser = require("body-parser");
const { PrismaClient } = require('@prisma/client')
const bcrypt = require("bcrypt");
const { json } = require('body-parser');
const multer = require("multer");

const prisma = new PrismaClient()

const app = express();
app.use(express.static("images"))
app.use(bodyParser.urlencoded({extended:true}));
app.set ('view engine', 'ejs');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
      cb(null, './images');
  },

  filename: function(req, file, cb) {
      cb(null, file.originalname);
  }
});

var upload = multer({storage: storage});

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized:true,
  cookie:{
      maxAge: 6000*6000,
  }

}));

app.get("/",  (req , res)=>{
    res.render("index");
})

app.get("/register", (req , res)=>{
    res.render("register");
})

app.post('/posted', upload.single("file"), (req, res)=>{
const pass=req.body.psw;
const birthday = req.body.bday;

    async function main(){
        const hashedPass = await bcrypt.hash(pass, 10);

        const createuser = await prisma.user.create({
            data:{

                    name:req.body.name,
                    username: req.body.uname,
                    birthday: new Date(birthday),
                    password:hashedPass,
                    image:req.file.filename, 
                    time: new Date()

                },
        });
  }
  
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

  res.redirect('/login'); 
})



app.get("/login", (req , res)=>{
    res.render("login")
})


app.post("/pages",(req, res)=>{

    const unames = req.body.uname;
    const password = req.body.psw;

    async function main(){ 
      req.session.regenerate(async(err)=>{
        console.log(req.body.uname)
        const user = await prisma.user.findUnique({
            where: {
              username : unames,
            },
          })

          const tempPassword= user.password;
          const bild = user.image
          const valid = await bcrypt.compare(password, tempPassword);
          if(valid === true)
          {
            req.session.user=user;
            req.session.save(function(err){
            req.session.image=user.image;
              console.log(req.session.user);
              if(err) return next(err)
              res.render("pages",{bild:bild});
            })
          }
          else{
            console.log("wrong password or username");
          }
      })   

    }
    main();
})

app.listen(2500);

app.get("/users", (req , res)=>{
  async function usersfunc(){

const user = await prisma.user.findMany({
  select: {
    name: true,
    username: true,
    birthday: true,
  },

})
app.locals.users = JSON.stringify(user);
res.locals.pic = req.session.user.image;
res.render("users");};
usersfunc();
})

app.get("/updater", (req, res)=>{
  res.render("update");
})

app.post("/update",(req, res)=>{

  const unames = req.body.uname;
  const password = req.body.psw;

  async function main(){ 
    req.session.regenerate(async(err)=>{
      console.log(req.body.uname)
      const user = await prisma.user.findUnique({
          where: {
            username : unames,
          },
        })

        const tempPassword= user.password;
        const bild = user.image
        const valid = await bcrypt.compare(password, tempPassword);
       
        if(valid === true)
        {
          const user = await prisma.user.update({
            where: {
            username: unames,
            }, 
            data:{
            password: await bcrypt.hash(req.body.newpsw, 10),
            },
          }
            )
            res.render("login");
        }
        else{
          console.log("wrong password or username");
        }
    })   

  }
  main();
})

app.get("/delete", (req, res)=>{
  res.render("delete");
})

app.post("/deleted",(req, res)=>{

  const unames = req.body.uname;
  const password = req.body.psw;

  async function main(){ 

      console.log(req.body.uname)
      const user = await prisma.user.findUnique({
          where: {
            username : unames,
          },
        })

        const tempPassword= user.password;
        const valid = await bcrypt.compare(password, tempPassword);
       
        if(valid === true)
        {
          const user = await prisma.user.delete({
            where: {
            username: unames,
            }, 
          }
            )
            res.render("login");
        }
        else{
          console.log("wrong password or username");
        }
  }
  main();
})