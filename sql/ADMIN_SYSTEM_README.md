# House of Angels - Admin System Documentation

## Overview

The admin system provides comprehensive tools for platform administrators to manage users, content, notifications, and monitor platform activity.

## Database Setup

### 1. Run the SQL Script

Execute the `supabase_admin_tables.sql` script in your Supabase SQL Editor:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of supabase_admin_tables.sql
# Click "Run" to execute
```

This will create the following tables:
- `admin_messages` - Direct messages from admins to users
- `system_announcements` - Platform-wide announcements
- `admin_actions_log` - Audit log of all admin actions
- `content_moderation` - Flagged/reported content
- `user_suspensions` - User suspension records
- `platform_statistics` - Daily platform statistics

### 2. Verify Tables

Check that all tables were created successfully:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'admin_messages',
  'system_announcements',
  'admin_actions_log',
  'content_moderation',
  'user_suspensions',
  'platform_statistics'
);
```

## Admin Features

### 1. Overview Dashboard
- **Platform Statistics**: View total users, employers, workers, jobs, and posts
- **Quick Actions**: Fast access to common admin tasks
- **Visual Analytics**: Color-coded statistics cards

### 2. Messaging System
- **Direct Messaging**: Send messages to individual or multiple users
- **Message Types**: General, Warning, Announcement, System
- **Priority Levels**: Low, Normal, High, Urgent
- **Bulk Messaging**: Select multiple users and send messages at once
- **Message History**: All messages are logged in `admin_messages` table

### 3. System Announcements
- **Platform-Wide Announcements**: Create announcements visible to all users
- **Targeted Announcements**: Send to specific user groups (all, employers, workers)
- **Announcement Types**: Info, Warning, Maintenance, Feature
- **Active/Inactive Toggle**: Control announcement visibility
- **Scheduled Announcements**: Set start and end dates

### 4. Job Posts Management
- **View All Jobs**: See all job postings on the platform
- **Toggle Status**: Activate or deactivate job posts
- **Delete Jobs**: Remove inappropriate or spam job posts
- **Filter by Status**: View active or inactive jobs
- **Employer Information**: See which employer posted each job

### 5. Posts Management
- **View All Posts**: See all employer posts
- **Delete Posts**: Remove inappropriate content
- **Post Details**: View post content, images, and engagement
- **Employer Tracking**: See which employer created each post

### 6. User Management
- **View All Users**: List of all platform users
- **User Search**: Search by name, email, or account type
- **User Details**: View user information and activity
- **Suspend Users**: Temporarily or permanently suspend accounts
- **Account Types**: Filter by employer, worker, or admin

## Admin Actions Logging

All admin actions are automatically logged in the `admin_actions_log` table:

- Message sending
- Job deletions
- Post deletions
- Status changes
- User suspensions
- Announcement creation

Each log entry includes:
- Admin ID
- Action type
- Target type and ID
- Description
- Old and new values (for updates)
- Timestamp
- IP address and user agent

## Security Features

### Row Level Security (RLS)

All admin tables have RLS policies enabled:

1. **Admin Messages**
   - Admins can view all messages
   - Admins can send messages
   - Users can view their own messages
   - Users can mark their messages as read

2. **System Announcements**
   - Everyone can view active announcements
   - Only admins can create/edit/delete announcements

3. **Admin Actions Log**
   - Only admins can view and create log entries
   - Logs are immutable (no updates or deletes)

4. **Content Moderation**
   - Users can report content
   - Only admins can review and take action

5. **User Suspensions**
   - Only admins can create/manage suspensions
   - Users can view their own suspension status

### Admin Authentication

Admins are identified by the `is_admin` field in the `profiles` table:

```sql
-- Check if user is admin
SELECT is_admin FROM profiles WHERE id = auth.uid();
```

Middleware protects admin routes:
- `/admin/*` routes require `is_admin = true`
- Non-admin users are redirected to signin page

## API Usage Examples

### Send Message to User

```typescript
import { supabase } from '@/lib/supabase';

async function sendAdminMessage(recipientId: string, title: string, content: string) {
  const { data, error } = await supabase
    .from('admin_messages')
    .insert({
      sender_id: adminUserId,
      recipient_id: recipientId,
      title,
      content,
      message_type: 'general',
      priority: 'normal'
    });
  
  return { data, error };
}
```

### Create System Announcement

```typescript
async function createAnnouncement(title: string, content: string) {
  const { data, error } = await supabase
    .from('system_announcements')
    .insert({
      title,
      content,
      announcement_type: 'info',
      target_audience: 'all',
      created_by: adminUserId,
      is_active: true
    });
  
  return { data, error };
}
```

### Delete Job Post

```typescript
async function deleteJob(jobId: string) {
  // Delete the job
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);
  
  // Log the action
  await supabase.from('admin_actions_log').insert({
    admin_id: adminUserId,
    action_type: 'delete_job',
    target_type: 'job',
    target_id: jobId,
    description: 'Deleted job post'
  });
  
  return { error };
}
```

### Suspend User

```typescript
async function suspendUser(userId: string, reason: string, days: number) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const { error } = await supabase
    .from('user_suspensions')
    .insert({
      user_id: userId,
      suspended_by: adminUserId,
      reason,
      suspension_type: days === 0 ? 'permanent' : 'temporary',
      end_date: days === 0 ? null : endDate.toISOString(),
      is_active: true
    });
  
  return { error };
}
```

## Accessing the Admin Dashboard

1. **Login as Admin**
   - Sign in with an account that has `is_admin = true`
   - Navigate to `/admin/dashboard`

2. **Admin Navigation**
   - Overview: Platform statistics and quick actions
   - Messaging: Send messages to users
   - Announcements: Create platform announcements
   - Jobs: Manage job posts
   - Posts: Manage employer posts
   - Users: View and manage users

## Best Practices

1. **Always Log Actions**: Every significant admin action should be logged
2. **Use Appropriate Message Types**: Choose the correct message type for context
3. **Set Priority Correctly**: Use urgent priority sparingly
4. **Provide Clear Reasons**: When suspending users or deleting content, provide clear reasons
5. **Review Before Deleting**: Deletions are permanent - review content carefully
6. **Monitor Action Logs**: Regularly review admin action logs for accountability

## Troubleshooting

### Admin Dashboard Not Accessible

1. Check if user has `is_admin = true`:
```sql
SELECT id, name, is_admin FROM profiles WHERE id = 'user-id';
```

2. Update user to admin:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'user-id';
```

### Messages Not Sending

1. Check RLS policies are enabled
2. Verify sender has admin privileges
3. Check recipient ID is valid
4. Review Supabase logs for errors

### Announcements Not Showing

1. Verify `is_active = true`
2. Check `start_date` and `end_date`
3. Verify `target_audience` matches user type
4. Check RLS policies

## Future Enhancements

- [ ] Email notifications for admin messages
- [ ] Advanced analytics and reporting
- [ ] Bulk user operations
- [ ] Content moderation queue
- [ ] Automated suspension rules
- [ ] Export admin logs to CSV
- [ ] Real-time admin notifications
- [ ] Admin role permissions (super admin, moderator, etc.)

## Support

For issues or questions about the admin system, contact the development team or refer to the main project documentation.

