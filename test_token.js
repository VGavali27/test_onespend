const fetch = require('node-fetch');
(async () => {
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
  console.log('All:', JSON.stringify(allData).slice(0, 300));
  
  const mine = await fetch('http://localhost:3015/api/v1/procurement?scope=mine', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const mineData = await mine.json();
  console.log('Mine:', JSON.stringify(mineData).slice(0, 300));
})();
