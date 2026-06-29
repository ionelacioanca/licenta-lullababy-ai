#!/usr/bin/env node

/**
 * Simulează fluxul Raspberry Pi pentru plâns:
 * 1) baby-crying
 * 2) crying-reason-identified pentru motivul hunger
 *
 * Usage:
 *   node backend/scripts/simulate-crying-events.js
 *
 * Optional env overrides:
 *   BACKEND_BASE_URL=http://localhost:5000
 *   CRYING_ENDPOINT=/api/notifications/crying-reason-identified
 *   BABY_ID=69201ec6cf5d9d47925a7ab9
 *   DEVICE_ID=lullababypi_01
 *   DELAY_MS=2500
 */

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:5000';
const CRYING_ENDPOINT = process.env.CRYING_ENDPOINT || '/api/notifications/crying-reason-identified';
const BABY_CRYING_ENDPOINT = process.env.BABY_CRYING_ENDPOINT || '/api/notifications/baby-crying';
const BABY_ID = process.env.BABY_ID || '69201ec6cf5d9d47925a7ab9';
const DEVICE_ID = process.env.DEVICE_ID || 'lullababypi_01';
const DELAY_MS = Number(process.env.DELAY_MS || 2500);
const CRYING_TYPE = process.env.CRYING_TYPE || 'hunger';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sendCryingEvent(cryingType) {
  const url = `${BACKEND_BASE_URL}${CRYING_ENDPOINT}`;
  const payload = {
    babyId: BABY_ID,
    device_id: DEVICE_ID,
    cryingType,
    timestamp: new Date().toISOString(),
  };

  console.log(`\n→ Trimit eveniment: ${cryingType}`);
  console.log(`  URL: ${url}`);
  console.log(`  Payload: ${JSON.stringify(payload)}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (response.ok) {
    console.log(`✓ ${cryingType} trimis cu succes (${response.status})`);
  } else {
    console.log(`✗ ${cryingType} a eșuat (${response.status})`);
  }

  console.log(`  Response: ${responseText}`);
}

async function sendBabyCryingEvent() {
  const url = `${BACKEND_BASE_URL}${BABY_CRYING_ENDPOINT}`;
  const payload = {
    babyId: BABY_ID,
    device_id: DEVICE_ID,
    timestamp: new Date().toISOString(),
  };

  console.log('\n→ Trimit eveniment: baby-crying');
  console.log(`  URL: ${url}`);
  console.log(`  Payload: ${JSON.stringify(payload)}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (response.ok) {
    console.log(`✓ baby-crying trimis cu succes (${response.status})`);
  } else {
    console.log(`✗ baby-crying a eșuat (${response.status})`);
  }

  console.log(`  Response: ${responseText}`);
}

async function main() {
  console.log('=== LullaBaby AI | Crying Events Simulator ===');
  console.log(`Backend: ${BACKEND_BASE_URL}`);
  console.log(`Baby crying endpoint: ${BABY_CRYING_ENDPOINT}`);
  console.log(`Endpoint: ${CRYING_ENDPOINT}`);
  console.log(`Baby ID: ${BABY_ID}`);
  console.log(`Device ID: ${DEVICE_ID}`);
  console.log(`Crying type: ${CRYING_TYPE}`);
  console.log(`Delay between events: ${DELAY_MS} ms`);

  await sendBabyCryingEvent();

  console.log(`Aștept ${DELAY_MS} ms până la motivul de plâns...`);
  await sleep(DELAY_MS);

  await sendCryingEvent(CRYING_TYPE);

  console.log('\n=== Simulare finalizată ===');
}

main().catch((error) => {
  console.error('\nEroare la simulare:', error);
  process.exit(1);
});
