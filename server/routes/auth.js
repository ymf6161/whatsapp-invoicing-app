const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Signup endpoint
router.post('/signup', async (req, res) => {
  try {
    const { email, password, phone } = req.body;

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Insert additional user data into our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          phone: phone || null,
          subscription_status: 'free',
        }
      ])
      .select();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        subscription_status: 'free'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt started for email:', req.body.email);
    const { email, password } = req.body;

    console.log('Attempting Supabase auth sign in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.log('Supabase auth error:', authError);
      return res.status(400).json({ error: authError.message });
    }

    console.log('Supabase auth successful, user ID:', authData.user.id);

    // Get user data from our users table
    console.log('Fetching user data from users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      console.log('User data fetch error:', userError);
      console.log('Error details:', JSON.stringify(userError, null, 2));
      return res.status(400).json({ error: userError.message });
    }

    console.log('User data fetched successfully:', userData);

    res.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        subscription_status: userData.subscription_status
      },
      session: authData.session
    });
  } catch (error) {
    console.log('Login catch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user endpoint
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        subscription_status: userData.subscription_status,
        phone: userData.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

