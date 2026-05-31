const Database = require("better-sqlite3");
const fs = require("fs");

const db = new Database("./data/titans.db");
const titans = JSON.parse(fs.readFileSync("./data/titans.json", "utf-8"));

db.exec(`
    CREATE TABLE IF NOT EXISTS titans (                            
        id INTEGER PRIMARY KEY AUTOINCREMENT,                        
        name TEXT NOT NULL,                                          
        size INTEGER NOT NULL,                                     
        type TEXT NOT NULL,                                          
        ability TEXT NOT NULL                                        
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS logs (                            
        id INTEGER PRIMARY KEY AUTOINCREMENT,                        
        action TEXT NOT NULL,                                          
        titan_id INTEGER,
        details TEXT,                                
        status TEXT NOT NULL,                                          
        created_at TEXT NOT NULL                                        
    )
`);

const insert = db.prepare(`
    INSERT INTO titans (id, name, size, type, ability)
    VALUES (@id, @name, @size, @type, @ability)
`);

for (const titan of titans) {
  insert.run(titan);
}

console.log("セットアップ完了！");
