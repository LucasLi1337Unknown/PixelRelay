# Pixel Relay beta

Source fork: Pixel Relay commit 427b8bb92b565944605ffe987472eac54c6bbd27.

This site has a separate Sites identity, source repository, D1 database, and host-only auth cookies. No original messages, profiles, posts, or reactions have been copied. Supabase authentication uses the connected Personal Data Project Subjective project; chat records remain in the beta site's D1 database.

Supabase email delivery settings are project-wide. Numeric OTP emails require an email template containing `{{ .Token }}`. A custom SMTP sender may be required for free projects and for delivery to non-team addresses. Both Magic Link and Confirm Signup templates should include the token. The beta `/auth/confirm` URL must be added to allowed redirect URLs if link fallback is used. Do not silently modify existing project-wide templates or disable email confirmation.

Do not promote until Lucas approves. Promotion copies reviewed application code to the existing main site, preserves its project identity and database, and never copies beta records. Reuse immutable applied migrations. Review identity handling before release: Supabase profiles use `sb:` user IDs, while ChatGPT profiles use their existing user IDs. They are separate accounts; do not automatically merge based on unverified names or handles.
