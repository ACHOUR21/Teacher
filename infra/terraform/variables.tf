variable "aws_region" {
  description = "AWS region where all resources will be deployed"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment: staging | production"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Short project identifier used as a prefix for resource names"
  type        = string
  default     = "eduai"
}

variable "cluster_name" {
  description = "Name of the EKS cluster (also used as prefix for other resources)"
  type        = string
  default     = "eduai-production"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.29"
}

# ── VPC ──────────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones to deploy resources in"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

# ── EKS ──────────────────────────────────────────────────────────────────────
variable "instance_types" {
  description = "EC2 instance types for EKS managed node group"
  type        = list(string)
  default     = ["t3.medium"]
}

variable "desired_capacity" {
  description = "Desired number of worker nodes in the EKS node group"
  type        = number
  default     = 3
}

variable "min_size" {
  description = "Minimum number of worker nodes in the EKS node group"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum number of worker nodes in the EKS node group"
  type        = number
  default     = 10
}

# ── RDS ──────────────────────────────────────────────────────────────────────
variable "db_instance_class" {
  description = "RDS instance class for PostgreSQL"
  type        = string
  default     = "db.t3.medium"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.1"
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "eduai"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "eduai"
  sensitive   = true
}

variable "db_backup_retention_days" {
  description = "Number of days to retain automated RDS backups"
  type        = number
  default     = 7
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS (recommended for production)"
  type        = bool
  default     = true
}

# ── ElastiCache ──────────────────────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache node type for Redis"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in the ElastiCache replication group (primary + replicas)"
  type        = number
  default     = 2
}

# ── S3 / CDN ─────────────────────────────────────────────────────────────────
variable "s3_lifecycle_transition_days" {
  description = "Days before S3 objects are transitioned to STANDARD_IA"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before non-current S3 object versions are deleted"
  type        = number
  default     = 365
}

variable "cloudfront_price_class" {
  description = "CloudFront price class (PriceClass_100 | PriceClass_200 | PriceClass_All)"
  type        = string
  default     = "PriceClass_100"
}

# ── S3 Lifecycle (root-level backup rules in s3-lifecycle.tf) ─────────────────
variable "s3_bucket_name" {
  description = "Name of the S3 bucket used for backups in the root lifecycle config"
  type        = string
  default     = ""
}

variable "enable_cross_region_replication" {
  description = "Enable S3 cross-region replication for backup bucket"
  type        = bool
  default     = false
}

variable "s3_replica_bucket_arn" {
  description = "ARN of the destination S3 bucket for cross-region replication"
  type        = string
  default     = ""
}

# ── Alerting ─────────────────────────────────────────────────────────────────
variable "alert_email" {
  description = "Email address for CloudWatch alarms and operational alerts"
  type        = string
  default     = "devops@eduai.io"
}
