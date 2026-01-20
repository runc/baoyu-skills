import { readFile } from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import { URL } from 'node:url';

export type ImageDimensions = {
  width: number;
  height: number;
};

export async function getImageDimensions(filePath: string): Promise<ImageDimensions> {
  const buffer = await readFile(filePath);

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;

      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = (buffer[offset + 5]! << 8) | buffer[offset + 6]!;
        const width = (buffer[offset + 7]! << 8) | buffer[offset + 8]!;
        return { width, height };
      }

      const segmentLength = (buffer[offset + 2]! << 8) | buffer[offset + 3]!;
      offset += 2 + segmentLength;
    }
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    const width = (buffer[16]! << 24) | (buffer[17]! << 16) | (buffer[18]! << 8) | buffer[19]!;
    const height = (buffer[20]! << 24) | (buffer[21]! << 16) | (buffer[22]! << 8) | buffer[23]!;
    return { width, height };
  }

  throw new Error(`Unsupported image format: ${filePath}`);
}

export async function uploadImageToWuliArt(
  filePath: string,
  cookies: Record<string, string>,
): Promise<{ url: string; width: number; height: number }> {
  const buffer = await readFile(filePath);
  const dimensions = await getImageDimensions(filePath);

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/jpeg';

  const cookieString = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');

  if (!cookies.satoken) {
    throw new Error('No satoken cookie found. Please run --login first.');
  }

  const filename = path.basename(filePath);

  const getUrlRes = await fetch(`https://wuli.art/api/v1/image/getUploadUrl?filename=${encodeURIComponent(filename)}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en,en-US;q=0.9,en-GB;q=0.8,zh-CN;q=0.7,zh;q=0.6',
      'cookie': cookieString,
      'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'Referer': 'https://wuli.art/generate',
    },
  });

  if (!getUrlRes.ok) {
    const text = await getUrlRes.text();
    throw new Error(`Get upload URL failed: ${getUrlRes.status} ${getUrlRes.statusText}\nResponse: ${text.slice(0, 500)}`);
  }

  const urlData = (await getUrlRes.json()) as any;

  if (!urlData.success) {
    throw new Error(`Get upload URL error: ${urlData.msg || urlData.userMsg || 'Unknown error'}`);
  }

  const uploadUrl = urlData?.data?.uploadUrl;
  const objectName = urlData?.data?.objectName;

  if (!uploadUrl || !objectName) {
    throw new Error(`No upload URL or object name returned: ${JSON.stringify(urlData)}`);
  }

  await new Promise<void>((resolve, reject) => {
    const urlObj = new URL(uploadUrl);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length,
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          reject(new Error(`OSS upload failed: ${res.statusCode} ${res.statusMessage}\nResponse: ${data.slice(0, 500)}`));
        });
      } else {
        res.on('data', () => {});
        res.on('end', () => resolve());
      }
    });

    req.on('error', (err) => reject(err));
    req.write(buffer);
    req.end();
  });

  const imageUrl = `https://wuli-ai.oss-cn-zhangjiakou.aliyuncs.com/${objectName}`;

  return {
    url: imageUrl,
    width: dimensions.width,
    height: dimensions.height,
  };
}
