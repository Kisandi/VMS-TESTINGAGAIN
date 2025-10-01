const bcrypt = require('bcrypt');


const storedHash = '$2b$10$P0rLzZsZu6Zx1YcEfWyWkeKAVIV3UQeFb9CkEf3KvowB.BVWrH69W';
const testPasswords = ['Mi@123@005', '123456', 'Password@123', 'Mi@005', 'Mi123', 'Mi123@005', 'Mi@1232005']; // try variations


testPasswords.forEach(pw => {
    bcrypt.compare(pw, storedHash).then(match => {
        if (match) {
            console.log(`✅ Match found! Password is: ${pw}`);
        } else {
            console.log(`❌ ${pw} does not match`);
        }
    });
});