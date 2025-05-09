const uniqid = require("uniqid");
const { resolve } = require("path");
const { existsSync, mkdirSync } = require("fs");

class UploadFile {
  constructor(file, dir, validExts, user) {
    this.file = file;
    this.dir = dir; // ejemplo: 'topics'
    this.validExts = validExts;
    this.user = user;
    this.ext = null;
    this.filename = null;
  }

  getPath() {
  // Asegúrate de incluir "src/uploads" como base
  const path = resolve(__dirname, "../../src/uploads", this.dir);
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
  return path;
}

  getName() {
    if (!this.filename) {
      const ext = this.getExt();
      const unique = uniqid(this.user + "-");
      const filename = `${unique}.${ext}`;
      this.filename = filename;
    }
    return this.filename;
  }

  validExt() {
    const ext = this.getExt();
    return this.validExts.includes(ext);
  }

  getExt() {
    if (!this.ext) {
      const arrFile = this.file.name.split(".");
      this.ext = arrFile[arrFile.length - 1].toLowerCase();
    }
    return this.ext;
  }

  saveFile(callback) {
    // Validar extensión (aunque no se detiene si es inválida)
    this.validExt();

    const filePath = this.getPath();
    const fileName = this.getName();

    this.file.mv(`${filePath}/${fileName}`, callback);
  }
}

module.exports = UploadFile;
