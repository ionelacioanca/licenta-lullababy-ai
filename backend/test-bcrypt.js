import bcrypt from 'bcryptjs';

async function test() {
  const password = 'password123';
  
  console.log('Testing bcrypt with password:', password);
  console.log();
  
  // Create a new hash
  const salt = await bcrypt.genSalt(10);
  const hash1 = await bcrypt.hash(password, salt);
  
  console.log('Generated hash:', hash1);
  console.log('Hash length:', hash1.length);
  console.log();
  
  // Test if it matches
  const matches1 = await bcrypt.compare(password, hash1);
  console.log('Does password match new hash?', matches1);
  console.log();
  
  // Test against the stored hash
  const storedHash = '$2b$10$kUOm0SCVb5nMFgaNSgYjHuiaaoLj5TUJzcxUAKR5jPfElCWhKrplu';
  const matches2 = await bcrypt.compare(password, storedHash);
  console.log('Does password match stored hash?', matches2);
}

test();
