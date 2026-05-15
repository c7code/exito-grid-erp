const axios = require('axios');
require('dotenv').config();

const API_URL = 'https://exito-grid-erp-production.up.railway.app';

(async () => {
  console.log('Testando login da Taina na API de produção...');
  console.log('URL:', API_URL);
  
  try {
    const resp = await axios.post(`${API_URL}/auth/login`, {
      email: 'tainabia.gomes@gmail.com',
      password: 'taina123', // substitua pela senha real se diferente
    });
    console.log('\n✅ Login OK!');
    console.log('Role:', resp.data.user.role);
    console.log('Permissions:', resp.data.user.permissions);
    console.log('Token (primeiros 20 chars):', resp.data.access_token?.substring(0, 20));
  } catch (err) {
    console.log('\n❌ Login FALHOU!');
    console.log('Status:', err?.response?.status);
    console.log('Message:', err?.response?.data?.message || err.message);
    
    if (err?.response?.status === 401) {
      console.log('\n⚠️ Senha incorreta ou credenciais inválidas');
    }
  }
})();
