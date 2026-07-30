// Mock API service — replace with real API calls when backend is ready
// import axios from 'axios';
// const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' });

const MOCK_USERS = [
  { email: 'superadmin@kingsgroup.com', password: 'Admin@123', role: 'SUPER_ADMIN', first_name: 'Super', last_name: 'Admin' },
  { email: 'cfo@kingsgroup.com', password: 'Admin@123', role: 'CFO', first_name: 'Michael', last_name: 'Chen' },
  { email: 'hod@kingsgroup.com', password: 'Admin@123', role: 'HOD', first_name: 'Rajesh', last_name: 'Joshi' },
  { email: 'employee@kingsgroup.com', password: 'Admin@123', role: 'EMPLOYEE', first_name: 'Amit', last_name: 'Kumar' },
];

export const mockLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.email === email && u.password === password);
      if (user) {
        resolve({
          data: {
            success: true,
            message: 'Login successful',
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: { email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
            },
          },
        });
      } else {
        reject({ response: { data: { message: 'Invalid email or password' } } });
      }
    }, 800);
  });
};
