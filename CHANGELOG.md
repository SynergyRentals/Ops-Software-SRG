# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Database schema for HostAI guest-request tasks
  - New `tasks` table to store task data with the following fields:
    - id (serial PK)
    - external_id (varchar, unique, nullable) - HostAI event ID 
    - listing_id (varchar) - HostAI listingId
    - listing_name (text)
    - action (text)
    - description (text)
    - source_type (varchar)
    - source_link (text)
    - guest_name (text)
    - guest_email (text)
    - guest_phone (text)
    - team_target (enum: 'internal', 'cleaning', 'maintenance', 'landlord', defaults to 'internal')
    - urgency (enum: 'urgent', 'high', 'medium', 'low', defaults to 'medium')
    - status (enum: 'new', 'scheduled', 'watch', 'closed', defaults to 'new')
    - scheduled_for (timestamp, nullable)
    - created_at (timestamp, default now(), not null)
    - raw_payload (jsonb, not null)
  - New `task_attachments` table with FK relationship to tasks:
    - id (serial PK)
    - task_id (FK to tasks.id with cascade delete)
    - name (text, nullable)
    - extension (varchar, nullable)
    - url (text, not null)
  - Added corresponding Zod schemas and TypeScript types
  - Added test file template to verify functionality