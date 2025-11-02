# Local PostgreSQL Setup

The app expects a PostgreSQL database reachable through the `DATABASE_URL` in `.env.local`. The tables are created automatically on first connection, so you only need to provision the database and user.

## 1. Install PostgreSQL

Pick the command that matches your platform (requires sudo/root access):

```bash
# Debian/Ubuntu
sudo apt-get update && sudo apt-get install postgresql postgresql-contrib

# Arch
sudo pacman -Syu postgresql

# Fedora
sudo dnf install postgresql-server postgresql-contrib

# macOS with Homebrew
brew install postgresql@16
brew services start postgresql@16
```

If you are prompted to initialise the data directory manually (e.g. Arch), run:

```bash
sudo -iu postgres initdb --locale=en_US.UTF-8 -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
```

## 2. Start the PostgreSQL service

Ensure PostgreSQL is running:

```bash
# systemd-based distros
sudo systemctl enable --now postgresql

# macOS (if not using brew services)
pg_ctl -D /usr/local/var/postgres start
```

You can confirm the server is reachable:

```bash
sudo -iu postgres psql -c "\l"
```

## 3. Create the database role and database

Run the following as the `postgres` superuser (depending on your install you may need to prefix with `sudo -iu postgres`):

```bash
psql <<'SQL'
CREATE ROLE drive_user WITH LOGIN PASSWORD 'drive_password';
ALTER ROLE drive_user SET client_encoding TO 'utf8';
ALTER ROLE drive_user SET timezone TO 'UTC';
CREATE DATABASE drive_db OWNER drive_user;
GRANT ALL PRIVILEGES ON DATABASE drive_db TO drive_user;
SQL
```

If you prefer different credentials, update `.env.local` accordingly.

## 4. Environment variables

`.env.local` is already configured with the default connection string:

```env
DATABASE_URL=postgresql://drive_user:drive_password@localhost:5432/drive_db
```

If you named things differently, adjust the URL.

## 5. Run the app

Start the Next.js dev server:

```bash
npm install
npm run dev
```

The first request that touches the database will automatically create the required tables via `src/lib/db.js`.

If you previously tried the Docker setup, remove the `data/postgres` directory that may have been created:

```bash
sudo rm -rf data/postgres
```

That directory is not required for the native install.
