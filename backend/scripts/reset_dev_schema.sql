-- Dev only: drops all tables in public so the next app startup can recreate them
-- via SQLAlchemy Base.metadata.create_all(). ALL DATA IS LOST.
--
-- Docker Compose uses POSTGRES_USER=pingbox, so there is no "postgres" role.
-- From repo root (postgres container running):
--   docker compose exec postgres psql -U pingbox -d pingbox -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public; GRANT ALL ON SCHEMA public TO pingbox;"

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO pingbox;
