const fs = require('fs');
const path = require('path');

const userPaths = [
  path.join(process.env.APPDATA || '', 'nightwatch-wellness-buddy', 'pet_config.json'),
  path.join(__dirname, '..', 'pet_config.json')
];

userPaths.forEach(p => {
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (data.settings) {
        data.settings.summonPosition = null;
        data.settings.pauseUntil = null;
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        console.log('[OK] Reset coordinates in ' + p);
      }
    } catch (e) {
      console.error(e);
    }
  }
});
console.log('Position reset complete. Windows will anchor to the bottom right.');
