/* My Move — client configuration.
   The ANON key is safe to ship: row-level security in the database is the gate,
   and the anon role has been revoked from every portal table. The SERVICE ROLE
   key must never appear here — it lives only in Netlify environment variables
   for netlify/functions/mymove.js.

   Fill these in per environment (staging project for deploy previews, production
   project for the live site). Until both are set the portal shows a
   "not configured" screen instead of a sign-in form. */
window.MYMOVE_CONFIG = {
  supabaseUrl: '',      /* e.g. 'https://abcdefghijklmnop.supabase.co' */
  supabaseAnonKey: '',  /* the project's anon (public) key */
  functionsBase: '/.netlify/functions/mymove'
};
