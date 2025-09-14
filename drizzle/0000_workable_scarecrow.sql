CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" varchar(100),
	"role" varchar(20) DEFAULT 'admin',
	"status" varchar(20) DEFAULT 'active',
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_username_unique" UNIQUE("username"),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authority_content_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid,
	"platform_account_id" uuid,
	"content_title" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_category" varchar(50),
	"content_url" text,
	"content_length" integer,
	"authority_score" numeric(3, 2) DEFAULT '0.00',
	"ai_citation_potential_score" numeric(3, 2) DEFAULT '0.00',
	"view_count" integer DEFAULT 0,
	"engagement_count" integer DEFAULT 0,
	"share_count" integer DEFAULT 0,
	"expert_recognition_signals" integer DEFAULT 0,
	"consultation_inquiries_attributed" integer DEFAULT 0,
	"lead_conversions_attributed" integer DEFAULT 0,
	"revenue_attributed" numeric(10, 2) DEFAULT '0.00',
	"publication_status" varchar(20) DEFAULT 'draft',
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expert_personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid,
	"expert_name" varchar(100) NOT NULL,
	"expert_status" varchar(20) DEFAULT 'developing',
	"expertise_focus" varchar(50) NOT NULL,
	"target_buyer_segments" jsonb NOT NULL,
	"authority_level" varchar(20) DEFAULT 'emerging',
	"professional_background_encrypted" text NOT NULL,
	"expertise_credentials_encrypted" text NOT NULL,
	"market_experience_encrypted" text NOT NULL,
	"primary_market_location" varchar(50) NOT NULL,
	"secondary_market_areas" jsonb DEFAULT '[]'::jsonb,
	"local_market_knowledge_depth" integer DEFAULT 1,
	"timezone" varchar(50) DEFAULT 'Asia/Manila',
	"geo_content_specializations" jsonb NOT NULL,
	"authority_building_topics" jsonb NOT NULL,
	"citation_worthy_expertise" jsonb NOT NULL,
	"platform_expertise_focus" jsonb NOT NULL,
	"content_publication_schedule" jsonb NOT NULL,
	"expert_voice_characteristics" jsonb NOT NULL,
	"persona_encryption_key_id" varchar(255) NOT NULL,
	"browser_fingerprint_config" jsonb NOT NULL,
	"current_authority_score" numeric(5, 2) DEFAULT '0.00',
	"estimated_ai_citations" integer DEFAULT 0,
	"expert_recognition_signals" integer DEFAULT 0,
	"thought_leadership_reach" integer DEFAULT 0,
	"monthly_consultation_requests" integer DEFAULT 0,
	"consultation_to_referral_rate" numeric(5, 4) DEFAULT '0.0000',
	"average_consultation_value" numeric(8, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_expert_activity" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "geo_platform_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid,
	"platform_type" varchar(50) NOT NULL,
	"platform_priority" integer NOT NULL,
	"geo_optimization_level" varchar(20) DEFAULT 'high',
	"username" varchar(100) NOT NULL,
	"display_name" varchar(100),
	"expert_bio" text,
	"expert_credentials" text,
	"profile_optimization_score" numeric(3, 2) DEFAULT '0.00',
	"credentials_encrypted" text NOT NULL,
	"auth_tokens_encrypted" text,
	"account_status" varchar(20) DEFAULT 'building',
	"platform_authority_level" varchar(20) DEFAULT 'newcomer',
	"expert_verification_status" varchar(20) DEFAULT 'unverified',
	"account_reputation_score" numeric(5, 2) DEFAULT '0.00',
	"total_authority_content" integer DEFAULT 0,
	"average_content_engagement" numeric(5, 2) DEFAULT '0.00',
	"expert_recognition_signals" integer DEFAULT 0,
	"thought_leadership_indicators" integer DEFAULT 0,
	"platform_geo_settings" jsonb NOT NULL,
	"content_authority_strategy" jsonb NOT NULL,
	"expert_engagement_approach" jsonb NOT NULL,
	"citation_optimization_config" jsonb NOT NULL,
	"monthly_expert_inquiries" integer DEFAULT 0,
	"consultation_requests" integer DEFAULT 0,
	"authority_conversion_rate" numeric(5, 4) DEFAULT '0.0000',
	"lead_quality_from_authority" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"last_activity" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proxy_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona_id" uuid,
	"proxy_provider" varchar(50) DEFAULT 'proxy-cheap',
	"proxy_type" varchar(20) DEFAULT 'residential',
	"proxy_location" varchar(50) NOT NULL,
	"proxy_host_encrypted" text NOT NULL,
	"proxy_port_encrypted" text NOT NULL,
	"proxy_username_encrypted" text NOT NULL,
	"proxy_password_encrypted" text NOT NULL,
	"proxy_status" varchar(20) DEFAULT 'active',
	"last_health_check" timestamp,
	"health_check_status" varchar(20),
	"connection_success_rate" numeric(5, 2) DEFAULT '0.00',
	"average_response_time" integer,
	"assigned_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "proxy_assignments_persona_id_unique" UNIQUE("persona_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authority_content_publications" ADD CONSTRAINT "authority_content_publications_persona_id_expert_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "expert_personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "authority_content_publications" ADD CONSTRAINT "authority_content_publications_platform_account_id_geo_platform_accounts_id_fk" FOREIGN KEY ("platform_account_id") REFERENCES "geo_platform_accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expert_personas" ADD CONSTRAINT "expert_personas_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "geo_platform_accounts" ADD CONSTRAINT "geo_platform_accounts_persona_id_expert_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "expert_personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proxy_assignments" ADD CONSTRAINT "proxy_assignments_persona_id_expert_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "expert_personas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
