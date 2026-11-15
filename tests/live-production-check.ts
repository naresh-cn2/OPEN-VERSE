const endpoints = [
  'https://open-verse-website.vercel.app/api/download/windows',
  'https://open-verse-website.vercel.app/api/download/windows-zip',
  'https://open-verse-website.vercel.app/api/download/android',
  'https://open-verse-website.vercel.app/api/download/android-zip',
  'https://open-verse-website.vercel.app/api/download/mac',
  'https://open-verse-website.vercel.app/api/download/linux-deb',
  'https://open-verse-website.vercel.app/api/download/linux-rpm',
  'https://open-verse-website.vercel.app/api/releases/latest',
  'https://open-verse-website.vercel.app/open-verse-mobile.apk'
];

async function testAll() {
  console.log('Testing live production endpoints on https://open-verse-website.vercel.app:\n');
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      const len = res.headers.get('content-length');
      const type = res.headers.get('content-type');
      const mb = len ? (parseInt(len, 10) / (1024 * 1024)).toFixed(2) + ' MB' : 'unknown';
      console.log(`[HTTP ${res.status}] ${url}`);
      console.log(`   -> Target: ${res.url}`);
      console.log(`   -> Type: ${type} | Size: ${mb}\n`);
    } catch (e: any) {
      console.error(`[FAIL] ${url}: ${e.message}\n`);
    }
  }
}

testAll();
