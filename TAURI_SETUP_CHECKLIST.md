# TAURI + PRISMA SETUP - QUICK CHECKLIST

**Use this checklist to track progress through the setup process.**

---

## 📋 PREREQUISITES CHECK

```bash
# Run these commands and check versions
node --version    # Should be v18+
npm --version     # Should be v9+
rustc --version   # Should show version (if not, install Rust)
sqlite3 --version # Should show version
```

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] Rust installed (if not: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- [ ] SQLite3 installed

---

## 🔧 STEP 1: TAURI SETUP

### Create Directory Structure
```bash
mkdir -p src-tauri/src
```
- [ ] Created `src-tauri/src` directory

### Install Tauri CLI
```bash
npm install --save-dev @tauri-apps/cli@latest
```
- [ ] Tauri CLI installed

### Create Configuration Files
- [ ] Created `src-tauri/tauri.conf.json`
- [ ] Created `src-tauri/Cargo.toml`
- [ ] Created `src-tauri/build.rs`
- [ ] Created `src-tauri/src/main.rs`

---

## 🔌 STEP 2: INSTALL TAURI-PLUGIN-SQL

### Update Cargo.toml
- [ ] Added `tauri-plugin-sql` to dependencies

### Update main.rs
- [ ] Registered SQL plugin in Tauri builder

### Update tauri.conf.json
- [ ] Added protocol allowlist for assets

---

## 💾 STEP 3: PRISMA SETUP

### Install Prisma
```bash
npm install @prisma/client
npm install -D prisma
```
- [ ] @prisma/client installed
- [ ] prisma dev dependency installed

### Verify/Create Schema
- [ ] `prisma/schema.prisma` exists and is correct

### Create Environment File
```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
```
- [ ] `.env` file created with DATABASE_URL

### Generate & Push
```bash
npx prisma generate
npx prisma db push
```
- [ ] Prisma client generated
- [ ] Database created at `prisma/dev.db`

---

## 🧪 STEP 4: CREATE TEST FILES

### Create Database Modules
- [ ] Created `src/database/db-wrapper.ts`
- [ ] Created `src/database/crud-tests.ts`
- [ ] Created `src/database/run-tests.ts`

### Update package.json
- [ ] Added test scripts to package.json

---

## ✅ STEP 5: RUN TESTS

### Execute Tests
```bash
npm run db:test
```

### Verify Test Results
- [ ] Database connection test passed
- [ ] CREATE operations test passed
- [ ] READ operations test passed
- [ ] UPDATE operations test passed
- [ ] COMPLEX QUERIES test passed
- [ ] DELETE operations test passed
- [ ] No error messages in output

### Optional: Open Prisma Studio
```bash
npm run db:studio
```
- [ ] Prisma Studio opens and shows tables

---

## 🎉 SUCCESS CRITERIA

All of these should be true:

- [ ] All test output shows ✅ green checkmarks
- [ ] Final message says "ALL TESTS PASSED!"
- [ ] Database file exists at `prisma/dev.db`
- [ ] Can open database in Prisma Studio
- [ ] No error messages anywhere

---

## 📊 TEST OUTPUT EXAMPLE

Your output should look like this:

```
═══════════════════════════════════════════════════
🧪 TAURI + PRISMA DATABASE TEST SUITE
═══════════════════════════════════════════════════

📡 Test 1: Database Connection
✅ Database connection successful

📝 Test 2: CREATE Operations
✅ Created World: abc-123-xyz
✅ Created Location: def-456-uvw
✅ Created NPC: ghi-789-rst
✅ Created Memory: jkl-012-opq

[... more tests ...]

═══════════════════════════════════════════════════
✅ ALL TESTS PASSED!
═══════════════════════════════════════════════════
```

---

## 🚨 COMMON ISSUES & QUICK FIXES

### Error: "Cannot find module '@prisma/client'"
```bash
npm run db:generate
```

### Error: "Database file not found"
```bash
npm run db:push
```

### Error: "Rust not installed"
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Error: Tests fail but database exists
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database
rm prisma/dev.db
npm run db:push

# Run tests again
npm run db:test
```

---

## 📝 NOTES FOR CLAUDE CODE

**Execution Order:**
1. Run all prerequisite checks first
2. Execute steps in order (don't skip)
3. Verify each step before moving to next
4. Run full test suite at the end

**What to Report:**
- Any errors encountered
- Output of test suite
- Confirmation when all tests pass

**After Success:**
- Mark Phase 1, Task 1 as COMPLETE ✅
- Ready to proceed to Phase 1, Task 2 (Phaser integration)

---

**Estimated Time:** 30-60 minutes  
**Last Updated:** November 5, 2025
