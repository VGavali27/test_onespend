const login = await fetch('http://localhost:3015/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'superadmin@kgv.com', password: 'Admin@123' })
});
const data = await login.json();
const token = data?.data?.token;
console.log('Token:', token ? 'got token' : 'no token');

const all = await fetch('http://localhost:3015/api/v1/procurement?scope=all', {
  headers: { Authorization: `Bearer ${token}` }
});
const allData = await all.json();
console.log('All scope - success:', allData.success, 'total:', allData.meta?.total);

const mine = await fetch('http://localhost:3015/api/v1/procurement?scope=mine', {
  headers: { Authorization: `Bearer ${token}` }
});
const mineData = await mine.json();
console.log('Mine scope - success:', mineData.success, 'total:', mineData.meta?.total);

const submitted = await fetch('http://localhost:3015/api/v1/procurement?scope=submitted', {
  headers: { Authorization: `Bearer ${token}` }
});
const submittedData = await submitted.json();
console.log('Submitted scope - success:', submittedData.success, 'total:', submittedData.meta?.total);
