variable "identifier" {
  description = "Identifier for the RDS instance"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.2"
}

variable "vpc_id" {
  description = "VPC ID where the RDS instance will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to connect to the RDS instance"
  type        = list(string)
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "db_name" {
  description = "Name of the initial database"
  type        = string
  default     = "eduai"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "eduai"
  sensitive   = true
}

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
}

variable "max_allocated_storage" {
  description = "Maximum storage autoscaling threshold in GB"
  type        = number
  default     = 500
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection on the RDS instance"
  type        = bool
  default     = true
}

variable "alarm_actions" {
  description = "List of ARNs to notify when a CloudWatch alarm fires"
  type        = list(string)
  default     = []
}
