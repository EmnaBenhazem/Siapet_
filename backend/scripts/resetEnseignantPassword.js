require('dotenv').config();
const { User } = require('../models');

async function resetPassword() {
  try {
    const user = await User.findOne({ where: { email: 'ahmed.trabelsi@isetrades.tn' } });
    if (!user) { console.log('User not found'); process.exit(1); }

    const newPassword = 'Enseignant2024';
    user.mot_de_passe = newPassword;
    await user.save();

    const bcrypt = require('bcrypt');
    const ok = await bcrypt.compare(newPassword, user.mot_de_passe);
    console.log('Password updated and verified:', ok);
    console.log('Email:        ahmed.trabelsi@isetrades.tn');
    console.log('New password: ' + newPassword);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetPassword();
