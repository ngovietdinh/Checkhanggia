// Kiem thu chiu tai cho Verify Service (muc 6.2 SRS).
// Chay: k6 run k6-scan-test.js
// Truoc khi chay: sua VALID_CODES ben duoi thanh danh sach {publicId, secretCode}
// da sinh that (goi POST /api/v1/codegen/generate truoc), va sua BASE_URL.
//
// Luu y: vi moi ma chi xac thuc "VALID" duoc 1 lan (sau do la DUPLICATE), kich
// ban steady-load thuc te can mot tap ma du lon (khong the tai su dung 1 ma cho
// hang nghin request lien tuc) - script nay mac dinh chay theo kich ban goi lai
// nhieu lan len cung 1 danh sach nho de do latency dang DUPLICATE (van di qua
// toan bo code path chinh: rate-limit + cache + hash compare + atomic UPDATE),
// khong phai de danh gia ty le VALID thuc te trong production.

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:3000';

const VALID_CODES = [
  // { publicId: 'XXXXXXXXXXXXXXXX', secretCode: 'YYYYYYYYYYYY' },
];

export const options = {
  scenarios: {
    steady_load: {
      executor: 'constant-arrival-rate',
      rate: 5000,
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: 500,
      maxVUs: 2000,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<300'],
    http_req_failed: ['rate<0.001'],
  },
};

export default function () {
  if (VALID_CODES.length === 0) {
    throw new Error('Vui long dien VALID_CODES truoc khi chay k6 script nay');
  }
  const item = VALID_CODES[Math.floor(Math.random() * VALID_CODES.length)];

  const res = http.post(
    `${BASE_URL}/api/v1/verify/scan`,
    JSON.stringify({
      publicId: item.publicId,
      secretCode: item.secretCode,
      deviceFingerprint: `k6-vu-${__VU}`,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(0.01);
}
