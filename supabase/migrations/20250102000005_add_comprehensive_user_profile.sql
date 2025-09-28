-- Add comprehensive user profile fields to users table
-- Using metadata JSONB column for flexible profile data

-- Create a structured profile view for easier access
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  email,
  first_name,
  last_name,
  full_name,
  avatar_url,
  user_type,
  is_active,
  -- Basic co-parenting info
  metadata->>'co_parent_name' as co_parent_name,
  metadata->>'relationship_status' as relationship_status,
  metadata->>'separation_date' as separation_date,
  
  -- Children information
  metadata->'children' as children_info,
  metadata->>'child_count' as child_count,
  
  -- Extended family members
  metadata->'family_members' as family_members,
  metadata->'step_parents' as step_parents,
  metadata->'grandparents' as grandparents,
  metadata->'siblings' as siblings,
  
  -- Custody & arrangements
  metadata->'custody_arrangement' as custody_arrangement,
  metadata->>'primary_residence' as primary_residence,
  metadata->'holiday_schedule' as holiday_schedule,
  metadata->'exchange_details' as exchange_details,
  
  -- Professional support team
  metadata->'professionals' as professionals,
  metadata->>'attorney_name' as attorney_name,
  metadata->>'mediator_name' as mediator_name,
  metadata->>'therapist_name' as therapist_name,
  metadata->>'child_therapist_name' as child_therapist_name,
  
  -- Communication preferences
  metadata->'communication_preferences' as communication_preferences,
  metadata->>'preferred_contact_method' as preferred_contact_method,
  metadata->>'emergency_contact' as emergency_contact,
  
  -- Co-parenting goals & challenges
  metadata->'goals' as goals,
  metadata->'conflict_areas' as conflict_areas,
  metadata->'strengths' as strengths,
  
  -- Financial
  metadata->'financial_arrangements' as financial_arrangements,
  metadata->>'child_support_status' as child_support_status,
  
  -- Important dates
  metadata->'important_dates' as important_dates,
  metadata->'milestones' as milestones,
  
  -- Health & medical
  metadata->'medical_info' as medical_info,
  metadata->'allergies' as allergies,
  metadata->'medications' as medications,
  
  -- Additional context
  metadata->>'parenting_philosophy' as parenting_philosophy,
  metadata->>'cultural_considerations' as cultural_considerations,
  metadata->>'special_needs' as special_needs,
  metadata->>'notes' as notes,
  
  created_at,
  updated_at,
  last_sign_in_at
FROM users;

-- Create a function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  profile_data JSONB
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    metadata = metadata || profile_data,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- Example of comprehensive profile structure:
COMMENT ON VIEW user_profiles IS '
Comprehensive user profile view. Example metadata structure:
{
  "co_parent_name": "Jane Doe",
  "relationship_status": "divorced",
  "separation_date": "2023-06-15",
  "children": [
    {
      "name": "Emma",
      "age": 8,
      "birthday": "2015-03-20",
      "grade": "3rd",
      "school": "Lincoln Elementary",
      "interests": ["soccer", "art"],
      "medical_needs": "asthma"
    },
    {
      "name": "Liam",
      "age": 5,
      "birthday": "2018-07-10",
      "grade": "Kindergarten",
      "school": "Lincoln Elementary",
      "interests": ["dinosaurs", "legos"]
    }
  ],
  "custody_arrangement": {
    "type": "joint",
    "schedule": "week on/week off",
    "exchange_day": "Sunday",
    "exchange_time": "6:00 PM",
    "exchange_location": "School parking lot"
  },
  "holiday_schedule": {
    "alternating": ["Christmas", "Thanksgiving"],
    "mother": ["Mother''s Day", "Her Birthday"],
    "father": ["Father''s Day", "His Birthday"],
    "shared": ["Children''s Birthdays"]
  },
  "professionals": {
    "attorney": {
      "name": "John Smith",
      "firm": "Smith & Associates",
      "phone": "555-0100",
      "email": "jsmith@law.com"
    },
    "mediator": {
      "name": "Dr. Sarah Johnson",
      "phone": "555-0200"
    },
    "therapist": {
      "name": "Dr. Michael Brown",
      "practice": "Family Wellness Center",
      "phone": "555-0300"
    }
  },
  "communication_preferences": {
    "preferred_method": "email",
    "response_time": "within 24 hours",
    "emergency_only_phone": true,
    "use_parenting_app": "OurFamilyWizard"
  },
  "goals": [
    "Consistent bedtimes across homes",
    "Unified approach to discipline",
    "Support children''s emotional wellbeing"
  ],
  "conflict_areas": [
    "Screen time limits",
    "Extracurricular activities",
    "Holiday planning"
  ],
  "financial_arrangements": {
    "child_support": {
      "amount": 1500,
      "frequency": "monthly",
      "payment_method": "direct deposit"
    },
    "shared_expenses": ["medical", "school", "activities"],
    "expense_split": "50/50"
  },
  "medical_info": {
    "insurance_provider": "Blue Cross",
    "policy_holder": "mother",
    "pediatrician": "Dr. Emily White",
    "pediatrician_phone": "555-0400"
  }
}';

-- Add RLS policy for profile updates
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);