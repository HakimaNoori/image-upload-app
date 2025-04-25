import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();
const PORT = 3000;
const DATA_FILE = "./data.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const uploadPath = path.join(__dirname, "./public/uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  let images = [];
  if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    images = JSON.parse(data);
  }
  res.render("index", { images }); // ارسال images به قالب
});

app.get("/upload", (req, res) => {
  res.render("upload");
});

app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.send("please upload an image");

  const imageInfo = {
    name: req.file.filename,
    date: new Date().toISOString(),
  };

  let data = [];
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    }
  }
  data.push(imageInfo);
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.redirect("/");
});

app.post("/delete/:name", (req, res) => {
  const filename = req.params.name;
  const filePath = path.join(__dirname, "./public/uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err) console.log(err);
  });

  if (fs.existsSync(DATA_FILE)) {
    let data = JSON.parse(fs.readFileSync(DATA_FILE));
    data = data.filter((img) => img.name !== filename);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  }

  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
