const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

const run = async () => {
    try {
        const hashedPassword = await bcrypt.hash('14102005', 10);
        db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
            ['Shrinidhi Alva', 'ug24908', hashedPassword, 'student'], 
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        console.log('User already exists, updating password...');
                        db.run(`UPDATE users SET password = ? WHERE email = ?`, [hashedPassword, 'ug24908']);
                    } else {
                        console.error('Error inserting user:', err);
                    }
                } else {
                    console.log('Successfully added user ug24908');
                }
            }
        );
    } catch (e) {
        console.error(e);
    }
};

run();
