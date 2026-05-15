const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
require('dotenv').config();

(async () => {
  const ds = new DataSource({ type: 'postgres', url: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await ds.initialize();
  
  const users = await ds.query(`SELECT id, name, email, role, password, "isActive", status FROM users WHERE name ILIKE '%taina%'`);
  
  if (users.length === 0) {
    console.log('❌ User Taina não encontrado');
    await ds.destroy();
    return;
  }
  
  const user = users[0];
  console.log('User:', user.name);
  console.log('Email:', user.email);
  console.log('Role:', user.role);
  console.log('Status:', user.status);
  console.log('isActive:', user.isActive);
  console.log('Has password:', !!user.password);
  console.log('Password starts with $2:', user.password?.startsWith('$2'));
  console.log('Password length:', user.password?.length);
  
  // Não temos a senha dela para testar bcrypt.compare aqui
  // Mas podemos verificar se o hash é válido
  if (user.password && !user.password.startsWith('$2')) {
    console.log('\n⚠️ PROBLEMA: A senha NÃO está hasheada! É texto plano.');
    console.log('Vou hashear e atualizar...');
    const hashed = await bcrypt.hash(user.password, 10);
    await ds.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, user.id]);
    console.log('✅ Senha hasheada e atualizada!');
  } else if (!user.password) {
    console.log('\n⚠️ PROBLEMA: Sem senha definida!');
  } else {
    console.log('\n✅ Senha está hasheada corretamente');
  }
  
  await ds.destroy();
})();
