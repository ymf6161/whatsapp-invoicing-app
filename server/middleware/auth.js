const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const authenticateUser = async (req, res, next) => {
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

    req.user = {
      id: user.id,
      email: user.email,
      subscription_status: userData.subscription_status,
      phone: userData.phone
    };

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const requirePaidSubscription = (req, res, next) => {
  if (req.user.subscription_status !== 'paid') {
    return res.status(403).json({ 
      error: 'This feature requires a paid subscription',
      subscription_status: req.user.subscription_status
    });
  }
  next();
};

module.exports = {
  authenticateUser,
  requirePaidSubscription
};

