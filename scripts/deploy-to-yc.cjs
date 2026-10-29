const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SA_KEY_PATH = 'D:/dev/shabbash/authorized_key.json';
const BUCKET = 'designer-quest';
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const IGNORED_FILES = new Set([
  'anzhelika-start-original.mp4',
  'server.js',
  'preview_banners.html',
  'preview_mihalych.html'
]);

function getJwt(keyFile) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: keyFile.service_account_id,
    aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
    iat: now,
    exp: now + 3600
  };
  const header = { alg: 'PS256', typ: 'JWT', kid: keyFile.id };
  const b64 = s => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const input = b64(JSON.stringify(header)) + '.' + b64(JSON.stringify(payload));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(input);
  signer.end();
  const sig = signer.sign({
    key: keyFile.private_key,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  });
  return input + '.' + b64(sig);
}

function requestWithRetry(url, options, body = null, maxTries = 8) {
  return new Promise(async (resolve, reject) => {
    for (let i = 1; i <= maxTries; i++) {
      try {
        const res = await new Promise((resResolve, resReject) => {
          const req = https.request(url, { ...options, timeout: 5000 }, response => {
            let data = '';
            response.on('data', c => data += c);
            response.on('end', () => {
              if (response.statusCode >= 200 && response.statusCode < 300) {
                resResolve({ status: response.statusCode, data });
              } else {
                resReject(new Error(`HTTP ${response.statusCode}: ${data}`));
              }
            });
          });
          req.on('timeout', () => { req.destroy(); resReject(new Error('timeout')); });
          req.on('error', resReject);
          if (body) req.write(body);
          req.end();
        });
        return resolve(res);
      } catch (err) {
        if (i === maxTries) return reject(err);
      }
    }
  });
}

async function getIamToken() {
  const keyFile = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf8'));
  const jwt = getJwt(keyFile);
  const res = await requestWithRetry('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ jwt }));
  return JSON.parse(res.data).iamToken;
}

async function s3Request(token, method, reqPath, headers = {}, body = null) {
  return requestWithRetry(`https://storage.yandexcloud.net${reqPath}`, {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      ...headers
    }
  }, body);
}

async function configureWebsite(token) {
  console.log(`Configuring static website hosting for ${BUCKET}...`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<WebsiteConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <IndexDocument>
        <Suffix>index.html</Suffix>
    </IndexDocument>
    <ErrorDocument>
        <Key>index.html</Key>
    </ErrorDocument>
</WebsiteConfiguration>`;

  await s3Request(token, 'PUT', `/${BUCKET}?website`, {
    'Content-Type': 'application/xml',
    'Content-Length': Buffer.byteLength(xml)
  }, xml);
  console.log('Website configuration applied successfully!');
}

async function configureCors(token) {
  console.log(`Configuring CORS for ${BUCKET}...`);
  const corsXml = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>`;

  await s3Request(token, 'PUT', `/${BUCKET}?cors`, {
    'Content-Type': 'application/xml',
    'Content-Length': Buffer.byteLength(corsXml)
  }, corsXml);
  console.log('CORS configuration applied successfully!');
}

function getUploadFiles() {
  const fileList = [];

  // Root files
  fileList.push(path.join(ROOT_DIR, 'index.html'));

  // Video files
  const rootItems = fs.readdirSync(ROOT_DIR);
  for (const item of rootItems) {
    if (item.endsWith('.mp4') && !IGNORED_FILES.has(item)) {
      fileList.push(path.join(ROOT_DIR, item));
    }
  }

  // Directories to scan recursively
  const dirs = ['styles', 'js', 'levels', 'sounds', 'images'];
  for (const dirName of dirs) {
    const dirPath = path.join(ROOT_DIR, dirName);
    if (!fs.existsSync(dirPath)) continue;

    function walk(currDir) {
      for (const item of fs.readdirSync(currDir)) {
        const full = path.join(currDir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (stat.isFile()) {
          if (!item.endsWith('.md')) {
            fileList.push(full);
          }
        }
      }
    }
    walk(dirPath);
  }

  return fileList;
}

async function uploadFile(token, filePath) {
  const relPath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const fileContent = fs.readFileSync(filePath);

  const encodedPath = '/' + BUCKET + '/' + relPath.split('/').map(encodeURIComponent).join('/');

  const cacheControl = (ext === '.html' || ext === '.js' || ext === '.css')
    ? 'no-cache, no-store, must-revalidate'
    : (ext === '.mp4' || ext === '.mp3' || ext === '.woff2' || ext === '.png' || ext === '.jpg' || ext === '.webp')
      ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400';

  await s3Request(token, 'PUT', encodedPath, {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'x-amz-acl': 'public-read',
    'Content-Length': fileContent.length
  }, fileContent);

  const sizeKb = (fileContent.length / 1024).toFixed(1);
  console.log(`Uploaded: ${relPath} (${contentType}, ${sizeKb} KB)`);
}

async function main() {
  try {
    console.log('Obtaining IAM token...');
    const token = await getIamToken();
    console.log('IAM token obtained.');

    await configureWebsite(token);
    await configureCors(token);

    const files = getUploadFiles();
    console.log(`\nFound ${files.length} files to upload to s3://${BUCKET}/`);

    let completed = 0;
    const concurrency = 3;
    let idx = 0;

    async function worker() {
      while (idx < files.length) {
        const file = files[idx++];
        try {
          await uploadFile(token, file);
          completed++;
        } catch (e) {
          console.error(`Failed ${file}:`, e.message);
        }
      }
    }

    const workers = [];
    for (let i = 0; i < concurrency; i++) workers.push(worker());
    await Promise.all(workers);

    console.log(`\n🎉 Successfully deployed ${completed}/${files.length} files!`);
    console.log(`🌐 Live URL (HTTPS with SSL): https://${BUCKET}.website.yandexcloud.net`);
    console.log(`📱 Telegram Mini App URL:   https://${BUCKET}.website.yandexcloud.net`);
  } catch (err) {
    console.error('Error during deployment:', err.message);
    process.exit(1);
  }
}

main();
