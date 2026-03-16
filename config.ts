// config.ts

// IMPORTANT: Replace this placeholder URL with the actual, raw URL where your 
// list of authorized emails is hosted.
//
// The file at this URL should be a simple JSON array of email strings.
// For example:
// ["user1@example.com", "user2@example.com", "editor@biblicalstories.com"]
//
// You can host this file on a personal server, a GitHub Gist (using the "raw" link),
// or any service that can serve a plain JSON file.

export const AUTHORIZED_USERS_URL = 'https://gist.githubusercontent.com/your-username/your-gist-id/raw/authorized_emails.json';
