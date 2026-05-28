/**
 * Parse un user-agent en (OS, navigateur, appareil) lisibles.
 */
export function parseUA(ua = '') {
  const u = ua.toLowerCase();
  let os = 'Inconnu', browser = 'Inconnu', device = 'Ordinateur';
  if (u.includes('windows nt 11'))      os = 'Windows 11';
  else if (u.includes('windows nt 10')) os = u.includes('windows nt 10.0; win64') ? 'Windows 10/11' : 'Windows 10';
  else if (u.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (u.includes('windows nt 6.1')) os = 'Windows 7';
  else if (u.includes('windows'))        os = 'Windows';
  else if (u.includes('mac os x'))       os = 'macOS';
  else if (u.includes('android'))      { os = 'Android'; device = 'Mobile'; }
  else if (u.includes('iphone'))       { os = 'iOS'; device = 'iPhone'; }
  else if (u.includes('ipad'))         { os = 'iPadOS'; device = 'iPad'; }
  else if (u.includes('linux'))          os = 'Linux';

  if      (u.includes('edg/'))      browser = 'Microsoft Edge';
  else if (u.includes('opr/'))      browser = 'Opera';
  else if (u.includes('chrome/'))   browser = 'Chrome';
  else if (u.includes('firefox/'))  browser = 'Firefox';
  else if (u.includes('safari/'))   browser = 'Safari';

  return { os, browser, device };
}
