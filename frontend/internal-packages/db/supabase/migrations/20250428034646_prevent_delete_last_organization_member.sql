-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION prevent_delete_last_organization_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the last member in the organization
  IF (SELECT COUNT(*) FROM organization_members WHERE organization_id = OLD.organization_id) <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last member of an organization';
  END IF;

  -- If not the last member, allow the deletion
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that calls the function before deletion
CREATE TRIGGER check_last_organization_member
BEFORE DELETE ON organization_members
FOR EACH ROW
EXECUTE FUNCTION prevent_delete_last_organization_member();

-- Add a comment to explain the purpose of the trigger
COMMENT ON TRIGGER check_last_organization_member ON organization_members
IS 'Prevents deletion of the last member of an organization to ensure organizations always have at least one member';
