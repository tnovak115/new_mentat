# Expo Go App

Mobile Expo version of the Corporate Travel Optimizer MVP.

## Run the backend

In one terminal:

```powershell
cd ..\backend
.venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --reload --port 8000
```

If you have not set up the backend yet, install dependencies and seed first:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed.seed_data
uvicorn app.main:app --host 0.0.0.0 --reload --port 8000
```

## Run in Expo Go

In a second terminal:

```powershell
cd ..\expo-app
npm install
npm run start
```

Scan the QR code with Expo Go.

For a physical phone, create `.env` in this folder and use your computer's LAN IP:

```text
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:8000
```

Your phone and computer must be on the same Wi-Fi network. Android emulator can usually use the default `http://10.0.2.2:8000`.
