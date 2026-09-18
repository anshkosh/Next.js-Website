CREATE OR REPLACE FUNCTION startup_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER startup_search_update
  BEFORE INSERT OR UPDATE OF name, tagline, description
  ON "Startup"
  FOR EACH ROW
  EXECUTE FUNCTION startup_search_vector_trigger();
