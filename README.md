# Offline Payment System API

> A robust, secure backend for processing offline-first digital payments with cryptographic verification and ledger-based settlements.

##  System Overview & Process Flow

This API manages a secure, offline-capable payment system. To function correctly, data must be set up in a specific order. The typical user journey follows five distinct steps:

1.  **User Registration:** Registering the identity of the person (`User`).
2.  **Bank Setup:** Linking a bank account to that user (`BankAccount`).
3.  **Wallet Creation (Onboarding):** Creating the digital wallet linked to the bank account and device (`Wallet`).
4.  **Top-Up (Online):** Loading real funds from the bank account into the wallet (`Load Funds`).
5.  **Transaction (Offline/Online):** Making payments to other wallets (`Transaction`).

---

##  API Endpoints Reference

### 1. Create User
**Endpoint:** `POST /api/users`

Registers a new user in the system. This is the root entity required before anything else.

-   **Logic:** Validates that the `user_id` and `email` are unique.
-   **Role:** Establishes the identity owner for accounts and wallets.

### 2. Create Bank Account
**Endpoint:** `POST /api/bank/accounts`

Creates a mock bank account for a user with an initial balance.

-   **Logic:** Links an `account_id` to a `user_id`. Sets an opening balance (e.g., salary deposit) so the user has money to load later.
-   **Prerequisite:** The User must exist (Step 1).

### 3. Create Wallet (Onboarding)
**Endpoint:** `POST /api/wallets`

Creates a new digital wallet, links it to a bank account, and binds it to a specific device.

-   **Logic:** Checks if the user and bank account exist. If valid, creates a unique `wallet_id` with a `0` balance.
-   **Prerequisite:** User and Bank Account must exist.

### 4. Load Funds (Top-Up)
**Endpoint:** `POST /api/wallets/load-funds`

Transfers real money from the linked Bank Account to the Wallet Balance.

-   **Logic:**
    1.  Checks `BankAccount` for sufficient funds.
    2.  **Debits** the Bank Account.
    3.  **Credits** the Wallet Balance.
-   **Prerequisite:** The wallet must exist.

### 5. Submit Transaction (Payment)
**Endpoint:** `POST /api/wallets/transaction`

Processes a batch of offline transactions. It validates the cryptographic chain (hashes) and updates the wallet balances.

-   **Logic:**
    -   **Validation:** Checks signature, sequence (`counter`), and chain integrity (`prev_hash`).
    -   **Ledger:** Saves transaction as `SETTLED`.
    -   **Settlement:** Debits Sender, Credits Receiver.

---

## 🚀 Quick Start: Testing Guide

Follow this sequence **exactly** to test the full lifecycle of a transaction.

### Step 1: Reset & Preparation
Before starting, ensure your database is clean or use unique IDs for this run.

### Step 2: Create Users (Sender & Receiver)
**Route:** `POST /api/users`

**Payload (Sender):**
```json
{
    "user_id": "U1001",
    "name": "Roronoa Zoro",
    "email": "zoro@swordsman.com",
    "phone": "+919999999999"
}
```
Payload (Receiver):

JSON
```json
{
    "user_id": "U1002",
    "name": "Monkey D Luffy",
    "email": "luffy@pirateking.com",
    "phone": "+918888888888"
}
```
Expected Response: 201 Created

Step 3: Create Bank Accounts
``` Route: POST /api/bank/accounts ```

Payload (Sender - Starting with 50k):

JSON
```json
{
    "account_id": "ACC9001",
    "user_id": "U1001",
    "account_number": "900000009001",
    "ifsc": "SBIN0001234",
    "initial_balance": 50000.00
}
```
Payload (Receiver):

JSON
```json
{
    "account_id": "ACC9002",
    "user_id": "U1002",
    "account_number": "900000009002",
    "ifsc": "SBIN0001234",
    "initial_balance": 50000.00
}
```
Expected Response: 201 Created

Step 4: Create Wallets
``` Route: POST /api/wallets ```

Payload (Sender):

JSON
```json
{
    "user_id": "U1001",
    "account_id": "ACC9001",
    "public_key": "PK_ZORO_001",
    "device_id": "DEV-ZORO-SWORD"
}
```
Expected Response: 201 Created - Returns "wallet_id": "WALLET101".

Payload (Receiver):

JSON
```json
{
    "user_id": "U1002",
    "account_id": "ACC9002",
    "public_key": "PK_LUFFY_001",
    "device_id": "DEV-LUFFY-HAT"
}
```
Expected Response: 201 Created - Returns "wallet_id": "WALLET102".

Step 5: Load Funds (Top-Up Sender)
We must add money to WALLET101 before spending.

```Route: POST /api/wallets/load-funds ```

Payload:

JSON
```json
{
    "wallet_id": "WALLET101",
    "amount": 1000.00
}
```
Expected Response: 200 OK

Verification: WALLET101 Balance is 1000.00. Bank Account ACC9001 Balance is 49000.00.

Step 6: Submit Payment (The Final Test)
Send 100.00 from WALLET101 to WALLET102.

```Route: POST /api/wallets/transaction ```

Payload:

JSON
```json
{
  "transactions": [
    {
      "tx_id": "TXN-TEST-001",
      "ts_string": "2025-12-16T10:00:00.000Z",
      "from_wallet": "WALLET101",
      "to_wallet": "WALLET102",
      "amount": 100.00,
      "currency": "INR",
      "device_id": "DEV-ZORO-SWORD",
      "counter": 1,
      "prev_hash": "GENESIS_HASH_OR_LAST_KNOWN_HASH",
      "tx_hash": "MOCK_HASH_CALCULATED_ON_CLIENT",
      "signature": "MOCK_SIGNATURE_VALIDATED_ON_SERVER"
    }
  ]
}
```
Expected Response: 200 OK

JSON
```json
{
    "message": "Processed 1 transactions. 1 successful.",
    "results": [
        {
            "tx_id": "TXN-TEST-001",
            "status": "SETTLED",
            "message": "Transaction accepted, recorded, and settled successfully."
        }
    ]
}
```
Final Verification:

WALLET101 Balance: 900.00

WALLET102 Balance: 100.00