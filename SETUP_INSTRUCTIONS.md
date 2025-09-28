# BeAligned Lite - Setup Instructions

## ✅ Completed Setup

1. **Database tables are created** - All required tables exist in your Supabase database
2. **Environment files configured** - Both frontend and backend .env files are set up with your credentials
3. **Application code ready** - Full React frontend and Node.js backend implementation

## ⚠️ Required Manual Steps

### 1. Enable Row Level Security (RLS)

Go to your Supabase SQL Editor:
https://app.supabase.com/project/qujysevuyhqyitxqctxg/sql/new

Run this SQL to enable RLS and create all policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refinements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Messages policies
CREATE POLICY "Users can view messages from own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Refinements policies (admin only)
CREATE POLICY "Admins can view refinements" ON public.refinements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can create refinements" ON public.refinements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:3001

### 3. Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will run on http://localhost:3000

## 🎉 Ready to Use!

1. **Register a new account** at http://localhost:3000
2. **Start chatting** with your OpenAI Assistant
3. **Make yourself an admin** by running this SQL in Supabase:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

## 📋 Features Available

- ✅ User registration and authentication
- ✅ Chat with OpenAI Assistant
- ✅ Conversation history
- ✅ Admin dashboard (for admin users)
- ✅ Message refinements (admin feature)
- ✅ Mobile responsive design

## 🔑 Your Credentials

- **Supabase Project**: https://app.supabase.com/project/qujysevuyhqyitxqctxg
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **OpenAI Assistant ID**: asst_005JPwm8PCxy9gJh5B3O5Fo4