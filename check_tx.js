const fs = require('fs');
const path = require('path');

async function checkTx() {
  const dbs = {
    'Root DB': path.resolve(__dirname, 'sentinel.db'),
    'Sentinal App DB': path.resolve(__dirname, 'sentinal/sentinel.db')
  };
  
  let totalReal = 0;
  let totalMock = 0;

  for (const [dbName, dbPath] of Object.entries(dbs)) {
    console.log(`\n==================================================`);
    console.log(`Checking Database: ${dbName}`);
    console.log(`Path: ${dbPath}`);
    console.log(`==================================================`);
    
    if (!fs.existsSync(dbPath)) {
      console.log(`⚠️ Database file does not exist at this path.`);
      continue;
    }
    
    let db;
    try {
      db = require('better-sqlite3')(dbPath);
    } catch (err) {
      console.log(`❌ Could not load better-sqlite3 or open database: ${err.message}`);
      continue;
    }
    
    // Check if audit_log table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='audit_log'").get();
    if (!tableCheck) {
      console.log(`❌ Table 'audit_log' does not exist in this database.`);
      continue;
    }
    
    const rows = db.prepare('SELECT DISTINCT tx_hash, agent, action, detail, cost, timestamp FROM audit_log WHERE tx_hash IS NOT NULL AND tx_hash != ""').all();
    
    if (rows.length === 0) {
      console.log('ℹ️ No transaction hashes recorded in audit logs.');
      continue;
    }
    
    console.log(`🔍 Found ${rows.length} transaction hashes. Checking on-chain validation...`);
    
    for (const row of rows) {
      const txHash = row.tx_hash;
      let isReal = false;
      let chainName = '';
      
      // 1. Check Base Sepolia
      try {
        const res = await fetch('https://sepolia.base.org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionByHash',
            params: [txHash]
          })
        });
        const json = await res.json();
        if (json.result) {
          isReal = true;
          chainName = 'Base Sepolia';
        }
      } catch (e) {}
      
      // 2. Check Base Mainnet
      if (!isReal) {
        try {
          const res = await fetch('https://mainnet.base.org', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'eth_getTransactionByHash',
              params: [txHash]
            })
          });
          const json = await res.json();
          if (json.result) {
            isReal = true;
            chainName = 'Base Mainnet';
          }
        } catch (e) {}
      }
      
      if (isReal) {
        totalReal++;
        const scanUrl = chainName === 'Base Sepolia'
          ? `https://sepolia.basescan.org/tx/${txHash}`
          : `https://basescan.org/tx/${txHash}`;
        
        console.log(`\n✅ [REAL TRANSACTION PROOF] (${chainName})`);
        console.log(`   Timestamp: ${row.timestamp}`);
        console.log(`   Agent:     ${row.agent}`);
        console.log(`   Action:    ${row.action}`);
        console.log(`   Detail:    ${row.detail}`);
        console.log(`   Cost:      $${row.cost} USDC`);
        console.log(`   Hash:      ${txHash}`);
        console.log(`   BaseScan:  ${scanUrl}`);
      } else {
        totalMock++;
        console.log(`\n❌ [MOCK TRANSACTION] (Not found on-chain)`);
        console.log(`   Timestamp: ${row.timestamp}`);
        console.log(`   Agent:     ${row.agent}`);
        console.log(`   Action:    ${row.action}`);
        console.log(`   Detail:    ${row.detail}`);
        console.log(`   Hash:      ${txHash}`);
      }
    }
    
    db.close();
  }

  console.log(`\n==================================================`);
  console.log(`Verification Summary:`);
  console.log(`- Real On-chain Transactions found: ${totalReal}`);
  console.log(`- Simulated Mock Transactions found: ${totalMock}`);
  console.log(`==================================================`);
}

checkTx().catch(console.error);
